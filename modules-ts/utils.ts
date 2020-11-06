import { TwoNumberArray } from '../types/globals';
import { polygonclip } from './polyclip';

// FMG helper functions

// add boundary points to pseudo-clip voronoi cells
export function getBoundaryPoints(
  width: number,
  height: number,
  spacing: number
) {
  const offset = rn(-1 * spacing);
  const bSpacing = spacing * 2;
  const w = width - offset * 2;
  const h = height - offset * 2;
  const numberX = Math.ceil(w / bSpacing) - 1;
  const numberY = Math.ceil(h / bSpacing) - 1;
  let points = [];
  for (let i = 0.5; i < numberX; i++) {
    let x = Math.ceil((w * i) / numberX + offset);
    points.push([x, offset], [x, h + offset]);
  }
  for (let i = 0.5; i < numberY; i++) {
    let y = Math.ceil((h * i) / numberY + offset);
    points.push([offset, y], [w + offset, y]);
  }
  return points;
}

// get points on a regular square grid and jitter them a bit
export function getJitteredGrid(
  width: number,
  height: number,
  spacing: number
) {
  const radius = spacing / 2; // square radius
  const jittering = radius * 0.9; // max deviation
  const jitter = () => Math.random() * 2 * jittering - jittering;

  let points = [];
  for (let y = radius; y < height; y += spacing) {
    for (let x = radius; x < width; x += spacing) {
      const xj = Math.min(rn(x + jitter(), 2), width);
      const yj = Math.min(rn(y + jitter(), 2), height);
      points.push([xj, yj]);
    }
  }
  return points;
}

// return cell index on a regular square grid
export function findGridCell(x, y) {
  return (
    Math.floor(Math.min(y / grid.spacing, grid.cellsY - 1)) * grid.cellsX +
    Math.floor(Math.min(x / grid.spacing, grid.cellsX - 1))
  );
}

// return array of cell indexes in radius on a regular square grid
export function findGridAll(x, y, radius) {
  const c = grid.cells.c;
  let r = Math.floor(radius / grid.spacing);
  let found = [findGridCell(x, y)];
  if (!r || radius === 1) return found;
  if (r > 0) found = found.concat(c[found[0]]);
  if (r > 1) {
    let frontier = c[found[0]];
    while (r > 1) {
      let cycle = frontier.slice();
      frontier = [];
      cycle.forEach(function (s) {
        c[s].forEach(function (e) {
          if (found.indexOf(e) !== -1) return;
          found.push(e);
          frontier.push(e);
        });
      });
      r--;
    }
  }

  return found;
}

// return closest pack points quadtree datum
export function find(x, y, radius = Infinity) {
  return pack.cells.q.find(x, y, radius);
}

// return closest cell index
export function findCell(
  x: number,
  y: number,
  radius: number = Infinity
): number | undefined {
  const found = pack.cells.quadtree.find(x, y, radius);

  return found ? found[2] : undefined;
}

// return array of cell indexes in radius
export function findAll(x, y, radius) {
  const found = pack.cells.q.findAll(x, y, radius);
  return found.map((r) => r[2]);
}

// get polygon points for packed cells knowing cell id
export function getPackPolygon(i: number | undefined): TwoNumberArray[] {
  if (!i) {
    return [];
  }

  return pack.cells.cellVertices[i].map((v) => pack.vertices.coordinates[v]);
}

// get polygon points for initial cells knowing cell id
export function getGridPolygon(i) {
  return grid.cells.v[i].map((v) => grid.vertices.p[v]);
}

// mbostock's poissonDiscSampler
export function* poissonDiscSampler(x0, y0, x1, y1, r, k = 3) {
  if (!(x1 >= x0) || !(y1 >= y0) || !(r > 0)) throw new Error();

  const width = x1 - x0;
  const height = y1 - y0;
  const r2 = r * r;
  const r2_3 = 3 * r2;
  const cellSize = r * Math.SQRT1_2;
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const grid = new Array(gridWidth * gridHeight);
  const queue = [];

  function far(x, y) {
    const i = (x / cellSize) | 0;
    const j = (y / cellSize) | 0;
    const i0 = Math.max(i - 2, 0);
    const j0 = Math.max(j - 2, 0);
    const i1 = Math.min(i + 3, gridWidth);
    const j1 = Math.min(j + 3, gridHeight);
    for (let j = j0; j < j1; ++j) {
      const o = j * gridWidth;
      for (let i = i0; i < i1; ++i) {
        const s = grid[o + i];
        if (s) {
          const dx = s[0] - x;
          const dy = s[1] - y;
          if (dx * dx + dy * dy < r2) return false;
        }
      }
    }
    return true;
  }

  function sample(x, y) {
    queue.push(
      (grid[gridWidth * ((y / cellSize) | 0) + ((x / cellSize) | 0)] = [x, y])
    );
    return [x + x0, y + y0];
  }

  yield sample(width / 2, height / 2);

  pick: while (queue.length) {
    const i = (Math.random() * queue.length) | 0;
    const parent = queue[i];

    for (let j = 0; j < k; ++j) {
      const a = 2 * Math.PI * Math.random();
      const r = Math.sqrt(Math.random() * r2_3 + r2);
      const x = parent[0] + r * Math.cos(a);
      const y = parent[1] + r * Math.sin(a);
      if (0 <= x && x < width && 0 <= y && y < height && far(x, y)) {
        yield sample(x, y);
        continue pick;
      }
    }

    const r = queue.pop();
    if (i < queue.length) queue[i] = r;
  }
}

// filter land cells
export function isLand(index: number): boolean {
  return pack.cells.heights[index] >= 20;
}

// filter water cells
export function isWater(i) {
  return pack.cells.h[i] < 20;
}

// convert RGB color string to HEX without #
export function toHEX(rgb) {
  if (rgb.charAt(0) === '#') {
    return rgb;
  }
  rgb = rgb.match(
    /^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i
  );
  return rgb && rgb.length === 4
    ? '#' +
        ('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) +
        ('0' + parseInt(rgb[2], 10).toString(16)).slice(-2) +
        ('0' + parseInt(rgb[3], 10).toString(16)).slice(-2)
    : '';
}

// return array of standard shuffled colors
export function getColors(number) {
  // const c12 = d3.scaleOrdinal(d3.schemeSet3);
  const c12 = [
    '#dababf',
    '#fb8072',
    '#80b1d3',
    '#fdb462',
    '#b3de69',
    '#fccde5',
    '#c6b9c1',
    '#bc80bd',
    '#ccebc5',
    '#ffed6f',
    '#8dd3c7',
    '#eb8de7',
  ];
  const cRB = d3.scaleSequential(d3.interpolateRainbow);
  const colors = d3.shuffle(
    d3
      .range(number)
      .map((i) =>
        i < 12 ? c12[i] : d3.color(cRB((i - 12) / (number - 12))).hex()
      )
  );
  //debug.selectAll("circle").data(colors).enter().append("circle").attr("r", 15).attr("cx", (d,i) => 60 + i * 40).attr("cy", 20).attr("fill", d => d);
  return colors;
}

export function getRandomColor() {
  return d3
    .color(d3.scaleSequential(d3.interpolateRainbow)(Math.random()))
    .hex();
}

// mix a color with a random color
export function getMixedColor(color, mix = 0.2, bright = 0.3) {
  const c = color && color[0] === '#' ? color : getRandomColor(); // if provided color is not hex (e.g. harching), generate random one
  return d3
    .color(d3.interpolate(c, getRandomColor())(mix))
    .brighter(bright)
    .hex();
}

// conver temperature from °C to other scales
export function convertTemperature(c: number): string {
  switch (temperatureScale.value) {
    case '°C':
      return c + '°C';
    case '°F':
      return rn((c * 9) / 5 + 32) + '°F';
    case 'K':
      return rn(c + 273.15) + 'K';
    case '°R':
      return rn(((c + 273.15) * 9) / 5) + '°R';
    case '°De':
      return rn(((100 - c) * 3) / 2) + '°De';
    case '°N':
      return rn((c * 33) / 100) + '°N';
    case '°Ré':
      return rn((c * 4) / 5) + '°Ré';
    case '°Rø':
      return rn((c * 21) / 40 + 7.5) + '°Rø';
    default:
      return c + '°C';
  }
}

// random number in a range
export function rand(min: number, max?: number): number {
  if (min === undefined && max === undefined) {
    return Math.random();
  }

  if (max === undefined) {
    max = min;
    min = 0;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// probability shorthand
export function P(probability: number) {
  return Math.random() < probability;
}

// random number (normal or gaussian distribution)
export function gauss(
  expected: number = 100,
  deviation: number = 30,
  min: number = 0,
  max: number = 300,
  round: number = 0
): number {
  return rn(
    Math.max(Math.min(d3.randomNormal(expected, deviation)(), max), min),
    round
  );
}

/** This is a description of the foo function. */
export function Pint(float) {
  return ~~float + +P(float % 1);
}

// round value to d decimals
export function rn(value: number, decimalPlaces: number = 0): number {
  const m = Math.pow(10, decimalPlaces);

  return Math.round(value * m) / m;
}

// round string to d decimals
export function round(s: string | null, d = 1): string {
  return s?.replace(/[\d\.-][\d\.e-]*/g, (n) => `${rn(n, d)}`) ?? '';
}

// corvent number to short string with SI postfix
export function si(n) {
  if (n >= 1e9) return rn(n / 1e9, 1) + 'B';
  if (n >= 1e8) return rn(n / 1e6) + 'M';
  if (n >= 1e6) return rn(n / 1e6, 1) + 'M';
  if (n >= 1e4) return rn(n / 1e3) + 'K';
  if (n >= 1e3) return rn(n / 1e3, 1) + 'K';
  return rn(n);
}

// getInteger number from user input data
export function getInteger(value) {
  const metric = value.slice(-1);
  if (metric === 'K') return parseInt(value.slice(0, -1) * 1e3);
  if (metric === 'M') return parseInt(value.slice(0, -1) * 1e6);
  if (metric === 'B') return parseInt(value.slice(0, -1) * 1e9);
  return parseInt(value);
}

// remove parent element (usually if child is clicked)
export function removeParent() {
  this.parentNode.parentNode.removeChild(this.parentNode);
}

// return string with 1st char capitalized
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// transform string to array [translateX,translateY,rotateDeg,rotateX,rotateY,scale]
export function parseTransform(string) {
  if (!string) {
    return [0, 0, 0, 0, 0, 1];
  }
  const a = string
    .replace(/[a-z()]/g, '')
    .replace(/[ ]/g, ',')
    .split(',');
  return [a[0] || 0, a[1] || 0, a[2] || 0, a[3] || 0, a[4] || 0, a[5] || 1];
}

// findAll d3.quandtree search from https://bl.ocks.org/lwthatcher/b41479725e0ff2277c7ac90df2de2b5e
void (function addFindAll() {
  const Quad = function (node, x0, y0, x1, y1) {
    this.node = node;
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
  };

  const tree_filter = function (x, y, radius) {
    var t = {
      x,
      y,
      x0: this._x0,
      y0: this._y0,
      x3: this._x1,
      y3: this._y1,
      quads: [],
      node: this._root,
    };
    if (t.node) {
      t.quads.push(new Quad(t.node, t.x0, t.y0, t.x3, t.y3));
    }
    radiusSearchInit(t, radius);

    var i = 0;
    while ((t.q = t.quads.pop())) {
      i++;

      // Stop searching if this quadrant can’t contain a closer node.
      if (
        !(t.node = t.q.node) ||
        (t.x1 = t.q.x0) > t.x3 ||
        (t.y1 = t.q.y0) > t.y3 ||
        (t.x2 = t.q.x1) < t.x0 ||
        (t.y2 = t.q.y1) < t.y0
      )
        continue;

      // Bisect the current quadrant.
      if (t.node.length) {
        t.node.explored = true;
        var xm = (t.x1 + t.x2) / 2,
          ym = (t.y1 + t.y2) / 2;

        t.quads.push(
          new Quad(t.node[3], xm, ym, t.x2, t.y2),
          new Quad(t.node[2], t.x1, ym, xm, t.y2),
          new Quad(t.node[1], xm, t.y1, t.x2, ym),
          new Quad(t.node[0], t.x1, t.y1, xm, ym)
        );

        // Visit the closest quadrant first.
        if ((t.i = ((y >= ym) << 1) | (x >= xm))) {
          t.q = t.quads[t.quads.length - 1];
          t.quads[t.quads.length - 1] = t.quads[t.quads.length - 1 - t.i];
          t.quads[t.quads.length - 1 - t.i] = t.q;
        }
      }

      // Visit this point. (Visiting coincident points isn’t necessary!)
      else {
        var dx = x - +this._x.call(null, t.node.data),
          dy = y - +this._y.call(null, t.node.data),
          d2 = dx * dx + dy * dy;
        radiusSearchVisit(t, d2);
      }
    }
    return t.result;
  };
  d3.quadtree.prototype.findAll = tree_filter;

  var radiusSearchInit = function (t, radius) {
    t.result = [];
    (t.x0 = t.x - radius), (t.y0 = t.y - radius);
    (t.x3 = t.x + radius), (t.y3 = t.y + radius);
    t.radius = radius * radius;
  };

  var radiusSearchVisit = function (t, d2) {
    t.node.data.scanned = true;
    if (d2 < t.radius) {
      do {
        t.result.push(t.node.data);
        t.node.data.selected = true;
      } while ((t.node = t.node.next));
    }
  };
})();

// normalization function
export function normalize(val, min, max) {
  return Math.min(Math.max((val - min) / (max - min), 0), 1);
}

// return a random integer from min to max biased towards one end based on exponent distribution (the bigger ex the higher bias towards min)
// from https://gamedev.stackexchange.com/a/116875
export function biased(min: number, max: number, ex: number): number {
  return Math.round(min + (max - min) * Math.pow(Math.random(), ex));
}

// return array of values common for both array a and array b
export function common(a, b) {
  const setB = new Set(b);
  return [...new Set(a)].filter((a) => setB.has(a));
}

// clip polygon by graph bbox
export function clipPoly(
  points: TwoNumberArray[],
  secure: number = 0
): TwoNumberArray[] {
  return polygonclip(points, [0, 0, graphWidth, graphHeight], secure);
}

// check if char is vowel or can serve as vowel
export function vowel(c) {
  return `aeiouyɑ'əøɛœæɶɒɨɪɔɐʊɤɯаоиеёэыуюяàèìòùỳẁȁȅȉȍȕáéíóúýẃőűâêîôûŷŵäëïöüÿẅãẽĩõũỹąęįǫųāēīōūȳăĕĭŏŭǎěǐǒǔȧėȯẏẇạẹịọụỵẉḛḭṵṳ`.includes(
    c
  );
}

// remove vowels from the end of the string
export function trimVowels(string) {
  while (string.length > 3 && vowel(last(string))) {
    string = string.slice(0, -1);
  }
  return string;
}

// get adjective form from noun
export function getAdjective(str: string): string {
  // special cases for some suffixes
  if (str.length > 8 && str.slice(-6) === 'orszag') return str.slice(0, -6);
  if (str.length > 6 && str.slice(-4) === 'stan') return str.slice(0, -4);
  if (P(0.5) && str.slice(-4) === 'land') return str + 'ic';
  if (str.slice(-4) === ' Guo') str = str.slice(0, -4);

  // don't change is name ends on suffix
  if (str.slice(-2) === 'an') return str;
  if (str.slice(-3) === 'ese') return str;
  if (str.slice(-1) === 'i') return str;

  const end = str.slice(-1); // last letter of string
  if (end === 'a') return (str += 'n');
  if (end === 'o') return (str = trimVowels(str) + 'an');
  if (vowel(end) || end === 'c') return (str += 'an'); // ceiuy
  if (end === 'm' || end === 'n') return (str += 'ese');
  if (end === 'q') return (str += 'i');
  return trimVowels(str) + 'ian';
}

// get ordinal out of integer: 1 => 1st
const nth = (n) =>
  n + (['st', 'nd', 'rd'][((((n + 90) % 100) - 10) % 10) - 1] || 'th');

// conjunct array: [A,B,C] => "A, B and C"
export function list(array) {
  if (!Intl.ListFormat) return array.join(', ');
  const conjunction = new Intl.ListFormat(window.lang || 'en', {
    style: 'long',
    type: 'conjunction',
  });
  return conjunction.format(array);
}

// split string into 2 almost equal parts not breaking words
export function splitInTwo(str) {
  const half = str.length / 2;
  const ar = str.split(' ');
  if (ar.length < 2) return ar; // only one word
  let first = '',
    last = '',
    middle = '',
    rest = '';

  ar.forEach((w, d) => {
    if (d + 1 !== ar.length) w += ' ';
    rest += w;
    if (!first || rest.length < half) first += w;
    else if (!middle) middle = w;
    else last += w;
  });

  if (!last) return [first, middle];
  if (first.length < last.length) return [first + middle, last];
  return [first, middle + last];
}

// return the last element of array
export function last(array) {
  return array[array.length - 1];
}

// return random value from the array
export function ra<T>(array: T[]): T | undefined {
  if (!array.length) {
    return undefined;
  }

  return array[Math.floor(Math.random() * array.length)];
}

// return random value from a Uint array, which is slightly
// different than arrays that are of type Array.
export function raU(array: Uint16Array | Uint32Array): number | undefined {
  if (!array.length) {
    return undefined;
  }

  return array[Math.floor(Math.random() * array.length)];
}

// return random value from weighted array {"key1":weight1, "key2":weight2}
export function rw(obj: Record<string, number>): string {
  const array = [];

  for (const key in obj) {
    for (let i = 0; i < obj[key]; i++) {
      array.push(key);
    }
  }

  return array[Math.floor(Math.random() * array.length)];
}

// return value in range [0, 100] (height range)
export function lim(v) {
  return Math.max(Math.min(v, 100), 0);
}

// get number from string in format "1-3" or "2" or "0.5"
export function getNumberInRange(r) {
  if (typeof r !== 'string') {
    console.error('The value should be a string', r);
    return 0;
  }
  if (!isNaN(+r)) return ~~r + +P(r - ~~r);
  const sign = r[0] === '-' ? -1 : 1;
  if (isNaN(+r[0])) r = r.slice(1);
  const range = r.includes('-') ? r.split('-') : null;
  if (!range) {
    console.error('Cannot parse the number. Check the format', r);
    return 0;
  }
  const count = rand(range[0] * sign, +range[1]);
  if (isNaN(count) || count < 0) {
    console.error('Cannot parse number. Check the format', r);
    return 0;
  }
  return count;
}

// helper function non-used for the generation
export function drawCellsValue(data) {
  debug.selectAll('text').remove();
  debug
    .selectAll('text')
    .data(data)
    .enter()
    .append('text')
    .attr('x', (d, i) => pack.cells.p[i][0])
    .attr('y', (d, i) => pack.cells.p[i][1])
    .text((d) => d);
}

// helper function non-used for the generation
export function drawPolygons(data) {
  const max = d3.max(data),
    min = d3.min(data),
    scheme = getColorScheme();
  data = data.map((d) => 1 - normalize(d, min, max));

  debug.selectAll('polygon').remove();
  debug
    .selectAll('polygon')
    .data(data)
    .enter()
    .append('polygon')
    .attr('points', (d, i) => getPackPolygon(i))
    .attr('fill', (d) => scheme(d))
    .attr('stroke', (d) => scheme(d));
}

// polyfill for composedPath
export function getComposedPath(node) {
  let parent;
  if (node.parentNode) parent = node.parentNode;
  else if (node.host) parent = node.host;
  else if (node.defaultView) parent = node.defaultView;
  if (parent !== undefined) return [node].concat(getComposedPath(parent));
  return [node];
}

// get next unused id
export function getNextId(core: string, i: number = 1): string {
  while (document.getElementById(core + i)) {
    i++;
  }

  return core + i;
}

// from https://davidwalsh.name/javascript-debounce-function
export function debounce(func: () => any, wait: number, immediate?: boolean) {
  let timeout;

  return function () {
    var context = this,
      args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

// pause/block JS execution for a while
export function sleep(delay) {
  const start = new Date().getTime();
  while (new Date().getTime() < start + delay);
}

// parse error to get the readable string in Chrome and Firefox
export function parseError(error: Error) {
  const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  const errorString = isFirefox
    ? error.toString() + ' ' + error.stack
    : error.stack;
  const regex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
  const errorNoURL = (errorString ?? '').replace(
    regex,
    (url) => '<i>' + last(url.split('/')) + '</i>'
  );
  const errorParsed = errorNoURL.replace(/at /gi, '<br>&nbsp;&nbsp;at ');
  return errorParsed;
}

// polyfills
if (Array.prototype.flat === undefined) {
  Array.prototype.flat = function () {
    return this.reduce(
      (acc, val) =>
        Array.isArray(val) ? acc.concat(val.flat()) : acc.concat(val),
      []
    );
  };
}

// check if string is a valid for JSON parse
JSON.isValid = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

export function getDefaultTexture() {
  return 'data:image/jpeg;base64,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gkkkoosmbdWhIFoIESRaLaFus5yAJJaEzFSTWtFICyS1ItFIUJFCQRAUEAhZJbYgqxKsEkSqtFooFtEkkgTOcxakULbVa1RJC2ySSAASQatkkJJbbVurRQUzIpCSW0hRbSAW0okhEKQqSFoM5zJne+kKBSJISLaAAtqJIq226FottkmcYULdSZRbVotskkzbqrEBC21JAAhaQ1rcmZIpBJASLbaQoBAERKsKKRAUiABCkSS6skqgKkBIFBAW20W0FJJJIJMohaQttttEkkmtaARmZAFoIEBRaLRRJAABakC2yQW0W0ZzkCkCAItuM4LrWqRLbItSRIiVbq0gLRSILaVIt1bJMyBIpES3SS60LbJAAABSBCgCl1oSZEgSQiLqlIhRSCQQpC0UiAIUEklUAQIWkQFpJAIlVaQttW0KCSQmcwiFIW222kkkk1rYEkkltkgAtpJJbQC2pBBbqSW2SAAEka1SgW3OcgUEAKDGcyTp02iSKBQkFtFtki2iipBEtqIC2yS2kEkkEtqFt1bKqSAAUgAABS6sVnIEBJm3RAUgKAEkQtqSFAkloCZlpaUEAEkSFWggkUAiVVtttpVJJIkzMoWktpbaJIC2gBJBJFUBRJLRQBSIi2rRJKQtSEiraEKt1nORQBRZIkVImc73tUggLakgq22BABbSyZFFpZICAokyLaJJbS61qkJIALRURAABQsS2iSAAAJIEKLUgUCpBLbIIgi0oIAJJVAEJISrJBbYWipFtttoEkkzMwXVkUWi2ySkLbnOda0WTJJFtBBItoAICpFFtIiVQqSICii0WTIFWABAJGc53vdoBCki1JFtAAFotkgIW2yQSZkltmcyBvpsqZka1pbbRJAAS2lkgBCgatVJJBAgLQCFIUASSipCRVVbJCAtISS0hWc5tskt0CTMVbZMlotQIltt0W0JJM5kyttskq3VkAACSa1osmZILaAQoAIAESRVurQQFIgALRRJlCpJbohQCDOc71sKEkqxLbItCRbSAFtokyhbaQIiMzMkFt1rQAqqAAKQW6EkJIAoturSRJCIgLRRSIUAiFSAKKKBJktqQCBChnObaUJJItBALdELM5F1q2haiTIIiJbS23Oc0KoACSAAWgUAEKARGZnWt20JIUUiIUWiyQhSICpJbolUZmdWxbSFIhaQqSW0AAtoskSXVSxABJKRLdCSU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';
}

export function getAbsolutePath(href) {
  if (!href) return '';
  const link = document.createElement('a');
  link.href = href;
  return link.href;
}

// open URL in a new tab or window
export function openURL(url) {
  window.open(url, '_blank');
}

// open project wiki-page
export function wiki(page) {
  window.open(
    'https://github.com/Azgaar/Fantasy-Map-Generator/wiki/' + page,
    '_blank'
  );
}

// wrap URL into html a element
export function link(URL: string, description: string): string {
  return `<a href="${URL}" rel="noopener" target="_blank">${description}</a>`;
}

export function isCtrlClick(event) {
  // meta key is cmd key on MacOs
  return event.ctrlKey || event.metaKey;
}

export function generateDate(from: number = 100, to: number = 1000): string {
  return new Date(rand(from, to), rand(12), rand(31)).toLocaleDateString('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// prompt replacer (prompt does not work in Electron)
void (function () {
  const prompt = document.getElementById('prompt');
  const form = prompt.querySelector('#promptForm');

  window.prompt = function (
    promptText = 'Please provide an input',
    options = { default: 1, step: 0.01, min: 0, max: 100 },
    callback
  ) {
    if (options.default === undefined) {
      console.error(
        'Prompt: options object does not have default value defined'
      );
      return;
    }
    const input = prompt.querySelector('#promptInput');
    prompt.querySelector('#promptText').innerHTML = promptText;
    const type = typeof options.default === 'number' ? 'number' : 'text';
    input.type = type;
    if (options.step !== undefined) input.step = options.step;
    if (options.min !== undefined) input.min = options.min;
    if (options.max !== undefined) input.max = options.max;
    input.placeholder = 'type a ' + type;
    input.value = options.default;
    prompt.style.display = 'block';

    form.addEventListener(
      'submit',
      (event) => {
        prompt.style.display = 'none';
        const v = type === 'number' ? +input.value : input.value;
        event.preventDefault();
        if (callback) callback(v);
      },
      { once: true }
    );
  };

  const cancel = prompt.querySelector('#promptCancel');
  cancel.addEventListener('click', () => (prompt.style.display = 'none'));
})();

// indexedDB; ldb object
!(function () {
  function e(t: 'lastMap', o: (blob: Blob) => void) {
    return n
      ? void (n.transaction('s').objectStore('s').get(t).onsuccess = function (
          e
        ) {
          var t = (e.target.result && e.target.result.v) || null;
          o(t);
        })
      : void setTimeout(function () {
          e(t, o);
        }, 100);
  }
  var t =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB;
  if (!t) return void console.error('indexedDB not supported');
  var n,
    o = { k: '', v: '' },
    r = t.open('d2', 1);
  (r.onsuccess = function (e) {
    n = this.result;
  }),
    (r.onerror = function (e) {
      console.error('indexedDB request error'), console.log(e);
    }),
    (r.onupgradeneeded = function (e) {
      n = null;
      var t = e.target.result.createObjectStore('s', { keyPath: 'k' });
      t.transaction.oncomplete = function (e) {
        n = e.target.db;
      };
    }),
    (window.ldb = {
      get: e,
      set: function (e, t) {
        (o.k = e),
          (o.v = t),
          n.transaction('s', 'readwrite').objectStore('s').put(o);
      },
    });
})();
