// Fantasy Map Generator main script
// Azgaar (azgaar.fmg@yandex.by). Minsk, 2017-2019
// https://github.com/Azgaar/Fantasy-Map-Generator
// MIT License

// I don't mind of any help with programming.
// See also https://github.com/Azgaar/Fantasy-Map-Generator/issues/153

import d3 from 'd3';
import Delaunator from 'delaunator';
import PriorityQueue from 'js-priority-queue';
import seedrandom from 'seedrandom';
import {
  BIOMES_MATRIX,
  BIOME_COLOR,
  BIOME_HABITABILITY,
  BIOME_ICONS,
  BIOME_ICONS_DENSITY,
  BIOME_MOVE_COST,
  BIOME_NAME,
} from './constants/biome';
import {
  DISEASE_ADJECTIVES,
  DISEASE_ANIMALS,
  DISEASE_COLORS,
} from './constants/disease';
import { LATITUDE_MODIFIER } from './constants/map';
import { ADJECTIVES, ANIMALS, COLORS } from './constants/tavern';
import { makeGridFixture } from './fixtures/grid/grid';
import { makeMainOptionsFixture } from './fixtures/mainOptions/mainOptions';
import { makePackFixture } from './fixtures/pack/pack';
import {
  defineSelection,
  getStringAsNumberOrNull,
  setElementDisplayValue,
} from './helpers';
import {
  applyMapSize,
  applyStoredOptions,
  randomizeOptions,
} from './modules-ts/ui/options';
import {
  biased,
  capitalize,
  clipPoly,
  convertTemperature,
  debounce,
  findCell,
  gauss,
  generateDate,
  getAdjective,
  getBoundaryPoints,
  getJitteredGrid,
  getNextId,
  getPackPolygon,
  isLand,
  link,
  normalize,
  P,
  parseError,
  ra,
  rand,
  raU,
  rn,
  round,
  rw,
} from './modules-ts/utils';
import { getVoronoi } from './modules-ts/voronoi';
import { isElement } from './types/d3/typeGuards';
import { Data } from './types/data';
import {
  Grid,
  OneOrNegativeOne,
  Pack,
  ThreeNumberArray,
  TwoNumberArray,
} from './types/globals';
import {
  Biome,
  BiomeIcon,
  BiomeType,
  Burg,
  Feature,
  FeatureType,
  GroupType,
  Resources,
  Template,
} from './types/map';
import {
  getFeatureType,
  isBurg,
  isFeature,
  isFullState,
} from './types/map/helpers';
import { Religion } from './types/peoples/religion';
import { Queue } from './types/queue';

const version = '1.4'; // generator version
document.title += ' v' + version;

// if map version is not stored, clear localStorage and show a message
if (
  rn(getStringAsNumberOrNull(localStorage.getItem('version')) ?? 0, 2) !==
  rn(+version, 2)
) {
  localStorage.clear();
  setTimeout(showWelcomeMessage, 8000);
}

// append svg layers (in default order)
let svg = d3.select('#map');
let defs = svg.select('#deftemp');
let viewbox = svg.select('#viewbox');
let scaleBar = svg.select('#scaleBar');
let legend = svg.append('g').attr('id', 'legend');
let ocean = viewbox.append('g').attr('id', 'ocean');
let oceanLayers = ocean.append('g').attr('id', 'oceanLayers');
let oceanPattern = ocean.append('g').attr('id', 'oceanPattern');
let lakes = viewbox.append('g').attr('id', 'lakes');
let landmass = viewbox.append('g').attr('id', 'landmass');
let texture = viewbox.append('g').attr('id', 'texture');
let terrs = viewbox.append('g').attr('id', 'terrs');
let biomes = viewbox.append('g').attr('id', 'biomes');
let cells = viewbox.append('g').attr('id', 'cells');
let gridOverlay = viewbox.append('g').attr('id', 'gridOverlay');
let coordinates = viewbox.append('g').attr('id', 'coordinates');
let compass = viewbox.append('g').attr('id', 'compass');
let rivers = viewbox.append('g').attr('id', 'rivers');
let terrain = viewbox.append('g').attr('id', 'terrain');
let relig = viewbox.append('g').attr('id', 'relig');
let cults = viewbox.append('g').attr('id', 'cults');
let regions = viewbox.append('g').attr('id', 'regions');
let statesBody = regions.append('g').attr('id', 'statesBody');
let statesHalo = regions.append('g').attr('id', 'statesHalo');
let provs = viewbox.append('g').attr('id', 'provs');
let zones = viewbox.append('g').attr('id', 'zones').style('display', 'none');
let borders = viewbox.append('g').attr('id', 'borders');
let stateBorders = borders.append('g').attr('id', 'stateBorders');
let provinceBorders = borders.append('g').attr('id', 'provinceBorders');
let routes = viewbox.append('g').attr('id', 'routes');
let roads = routes.append('g').attr('id', 'roads');
let trails = routes.append('g').attr('id', 'trails');
let searoutes = routes.append('g').attr('id', 'searoutes');
let temperature = viewbox.append('g').attr('id', 'temperature');
let coastline = viewbox.append('g').attr('id', 'coastline');
let ice = viewbox.append('g').attr('id', 'ice').style('display', 'none');
let prec = viewbox.append('g').attr('id', 'prec').style('display', 'none');
let population = viewbox.append('g').attr('id', 'population');
let labels = viewbox.append('g').attr('id', 'labels');
let icons = viewbox.append('g').attr('id', 'icons');
let burgIcons = icons.append('g').attr('id', 'burgIcons');
let anchors = icons.append('g').attr('id', 'anchors');
let armies = viewbox.append('g').attr('id', 'armies').style('display', 'none');
let markers = viewbox
  .append('g')
  .attr('id', 'markers')
  .style('display', 'none');
let fogging = viewbox
  .append('g')
  .attr('id', 'fogging-cont')
  .attr('mask', 'url(#fog)')
  .append('g')
  .attr('id', 'fogging')
  .style('display', 'none');
let ruler = viewbox.append('g').attr('id', 'ruler').style('display', 'none');
let debug = viewbox.append('g').attr('id', 'debug');

// lake and coast groups
lakes.append('g').attr('id', 'freshwater');
lakes.append('g').attr('id', 'salt');
lakes.append('g').attr('id', 'sinkhole');
lakes.append('g').attr('id', 'frozen');
lakes.append('g').attr('id', 'lava');
lakes.append('g').attr('id', 'dry');
coastline.append('g').attr('id', 'sea_island');
coastline.append('g').attr('id', 'lake_island');

labels.append('g').attr('id', 'states');
labels.append('g').attr('id', 'addedLabels');

let burgLabels = labels.append('g').attr('id', 'burgLabels');
burgIcons.append('g').attr('id', 'cities');
burgLabels.append('g').attr('id', 'cities');
anchors.append('g').attr('id', 'cities');

burgIcons.append('g').attr('id', 'towns');
burgLabels.append('g').attr('id', 'towns');
anchors.append('g').attr('id', 'towns');

// population groups
population.append('g').attr('id', 'rural');
population.append('g').attr('id', 'urban');

// fogging
fogging
  .append('rect')
  .attr('x', 0)
  .attr('y', 0)
  .attr('width', '100%')
  .attr('height', '100%');
fogging
  .append('rect')
  .attr('x', 0)
  .attr('y', 0)
  .attr('width', '100%')
  .attr('height', '100%')
  .attr('fill', '#e8f0f6')
  .attr('filter', 'url(#splotch)');

// assign events separately as not a viewbox child
scaleBar.on('mousemove', () => tip('Click to open Units Editor'));
legend
  .on('mousemove', () =>
    tip('Drag to change the position. Click to hide the legend')
  )
  .on('click', () => clearLegend());

// main data variables
grid = makeGridFixture(); // initial graph based on jittered square grid and data
pack = makePackFixture(); // packed graph and data
seed = '';
mapId = undefined;
mapHistory = [];
elSelected = undefined;
notes = [];
customization = 0;

// default options
options = makeMainOptionsFixture({ pinNotes: false }); // main options object
mapCoordinates = {}; // map coordinates on globe
options.winds = [225, 45, 225, 315, 135, 315]; // default wind directions

biomesData = applyDefaultBiomesSystem();
nameBases = Names().getNameBases(); // cultures-related data
fonts = [
  'Almendra+SC',
  'Georgia',
  'Arial',
  'Times+New+Roman',
  'Comic+Sans+MS',
  'Lucida+Sans+Unicode',
  'Courier+New',
]; // default web-safe fonts

let color = d3.scaleSequential(d3.interpolateSpectral); // default color scheme
const lineGen = d3.line().curve(d3.curveBasis); // d3 line generator with default curve interpolation

// d3 zoom behavior
let scale = 1,
  viewX = 0,
  viewY = 0;
const zoom = d3.zoom().scaleExtent([1, 20]).on('zoom', zoomed);

applyStoredOptions();

let graphWidth = +mapWidthInput.value,
  graphHeight = +mapHeightInput.value; // voronoi graph extention, cannot be changed arter generation
let svgWidth = graphWidth,
  svgHeight = graphHeight; // svg canvas resolution, can be changed
landmass
  .append('rect')
  .attr('x', 0)
  .attr('y', 0)
  .attr('width', graphWidth)
  .attr('height', graphHeight);
oceanPattern
  .append('rect')
  .attr('fill', 'url(#oceanic)')
  .attr('x', 0)
  .attr('y', 0)
  .attr('width', graphWidth)
  .attr('height', graphHeight);
oceanLayers
  .append('rect')
  .attr('id', 'oceanBase')
  .attr('x', 0)
  .attr('y', 0)
  .attr('width', graphWidth)
  .attr('height', graphHeight);

// global jquery elements
const alertMessage = $('#alertMessage').get(0);
const hideLabels = $('#hideLabels').get(0) as HTMLInputElement;
const overlay = $('#mapOverlay').get(0);
const optionsSeed = $('#optionsSeed').get(0) as HTMLInputElement;
const densityInput = $('#densityInput').get(0) as HTMLInputElement;
const templateInput = $('#templatetInput').get(0) as HTMLSelectElement;
const mapSizeOutput = $('#mapSizeOutput').get(0) as HTMLInputElement;
const mapSizeInput = $('#mapSizeInput').get(0) as HTMLInputElement;
const latitudeOutput = $('#latitudeOutput').get(0) as HTMLInputElement;
const latitudeInput = $('#latitudeInput').get(0) as HTMLInputElement;
const temperatureEquatorInput = $('#temperatureEquatorInput').get(
  0
) as HTMLInputElement;
const temperaturePoleInput = $('#temperaturePoleInput').get(
  0
) as HTMLInputElement;
const precipitationInput = $('#precipitationInput').get(0) as HTMLInputElement;
const heightExponentInput = $('#heightExponentInput').get(
  0
) as HTMLInputElement;
const populationRate = $('#populationRate').get(0) as HTMLInputElement;
const urbanization = $('#urbanization').get(0) as HTMLInputElement;
const culturesSet = $('#culturesSet').get(0) as HTMLSelectElement;

void (function removeLoading() {
  d3.select('#loading')
    .transition()
    .duration(4000)
    .style('opacity', 0)
    .remove();
  d3.select('#initial').transition().duration(4000).attr('opacity', 0).remove();
  d3.select('#optionsContainer')
    .transition()
    .duration(3000)
    .style('opacity', 1);
  d3.select('#tooltip').transition().duration(4000).style('opacity', 1);
})();

// decide which map should be loaded or generated on page load
void (function checkLoadParameters() {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const maplink = params.get('maplink');

  // if there is a valid maplink, try to load .map file from URL
  if (maplink) {
    console.warn('Load map from URL');
    const pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    const valid = pattern.test(maplink);

    if (valid) {
      loadMapFromURL(maplink, 1);
      return;
    } else {
      showUploadErrorMessage('Map link is not a valid URL', maplink);
    }
  }

  // if there is a seed (user of MFCG provided), generate map for it
  if (params.get('seed')) {
    console.warn('Generate map for seed');
    generateMapOnLoad();

    return;
  }

  const onloadMap = $('#onloadMap') as JQuery<HTMLSelectElement>;

  // open latest map if option is active and map is stored
  if (onloadMap.text() === 'saved') {
    ldb.get('lastMap', (blob?: Blob) => {
      if (blob) {
        console.warn('Load last saved map');

        try {
          uploadMap(blob);
        } catch (error) {
          console.error(error);
          console.warn('Cannot load stored map, random map to be generated');
          generateMapOnLoad();
        }
      } else {
        console.error('No map stored, random map to be generated');
        generateMapOnLoad();
      }
    });

    return;
  }

  console.warn('Generate random map');
  generateMapOnLoad();
})();

function loadMapFromURL(maplink: string, random?: number): void {
  const URL = decodeURIComponent(maplink);

  fetch(URL, { method: 'GET', mode: 'cors' })
    .then((response) => {
      if (response.ok) {
        return response.blob();
      }

      throw new Error('Cannot load map from URL');
    })
    .then((blob) => uploadMap(blob))
    .catch((error) => {
      showUploadErrorMessage(error.message, URL, random);

      if (random) {
        generateMapOnLoad();
      }
    });
}

function showUploadErrorMessage(
  error: string,
  URL: string,
  random?: number
): void {
  console.error(error);
  alertMessage.innerHTML = `Cannot load map from the ${link(
    URL,
    'link provided'
  )}.
    ${random ? `A new random map is generated. ` : ''}
    Please ensure the linked file is reachable and CORS is allowed on server side`;

  $('#alert').dialog({
    title: 'Loading error',
    width: '32em',
    buttons: {
      OK: function () {
        $(this).dialog('close');
      },
    },
  });
}

function generateMapOnLoad(): void {
  applyStyleOnLoad(); // apply default of previously selected style
  generate(); // generate map
  focusOn(); // based on searchParams focus on point, cell or burg from MFCG
  applyPreset(); // apply saved layers preset
}

// focus on coordinates, cell or burg provided in searchParams
function focusOn(): void {
  const url = new URL(window.location.href);
  const params = url.searchParams;

  if (params.get('from') === 'MFCG' && document.referrer) {
    const seedParam = params.get('seed');

    if (seedParam?.length === 13) {
      // show back burg from MFCG
      params.set('burg', seedParam.slice(-4));
    } else {
      // select burg for MFCG
      findBurgForMFCG(params);

      return;
    }
  }

  const scale = getStringAsNumberOrNull(params.get('scale')) || 8;
  let x = getStringAsNumberOrNull(params.get('x'));
  let y = getStringAsNumberOrNull(params.get('y'));
  const cell = getStringAsNumberOrNull(params.get('cell'));

  if (cell && Array.isArray(pack.cells.precipitation)) {
    x = pack.cells.precipitation[cell][0];
    y = pack.cells.precipitation[cell][1];
  }

  const burg = getStringAsNumberOrNull(params.get('burg'));

  if (burg && pack.burgs[burg]) {
    /**
     * 'If (burg)' will be false if burg === 0, so we know, even
     * though TypeScript does not, that pack.burgs[burg] can't be
     * the empty object that starts each burg array, so we can
     * safely caste these as type Burg using the 'as' keyword.
     */
    x = (pack.burgs[burg] as Burg).x;
    y = (pack.burgs[burg] as Burg).y;
  }

  if (x && y) {
    zoomTo(x, y, scale, 1600);
  }
}

// find burg for MFCG and focus on it
function findBurgForMFCG(params: URLSearchParams): void {
  const burgs = pack.burgs;

  if (burgs.length < 2) {
    console.error('Cannot select a burg for MFCG 432');

    return;
  }

  // used for selection
  const size = getStringAsNumberOrNull(params.get('size')) ?? 0;
  const coast = !!getStringAsNumberOrNull(params.get('coast'));
  const port = !!getStringAsNumberOrNull(params.get('port'));
  const river = !!getStringAsNumberOrNull(params.get('river'));

  let selection = defineSelection(coast, port, river);
  if (!selection.length) {
    selection = defineSelection(coast, !port, !river);
  }

  if (!selection.length) {
    selection = defineSelection(!coast, false, !river);
  }

  if (!selection.length) {
    selection = [burgs[1]]; // select first if nothing is found
  }

  // select a burg with closest population from selection
  const selected = d3.scan(
    selection,
    (a, b) => Math.abs(a.population - size) - Math.abs(b.population - size)
  );

  if (!selected) {
    console.error('Cannot select a burg for MFCG 463');

    return;
  }

  const burgId = selection[selected].i;

  if (burgId === 0) {
    console.error('Cannot select a burg for MFCG 471');

    return;
  }

  const burg = burgs[burgId] as Burg;
  const referrer = new URL(document.referrer);

  referrer.searchParams.forEach((value, key) => {
    if (key === 'name') {
      burg.name = value;
    } else if (key === 'size') {
      burg.population = +value;
    } else if (key === 'seed') {
      burg.MFCG = +value;
    } else if (key === 'shantytown') {
      burg.shanty = +value;
    } else {
      // TODO figure out a non-as-any way to do this
      (burg as any)[key] = +value; // other parameters
    }
  });

  burg.MFCGlink = document.referrer; // set direct link to MFCG
  const nameParam = params.get('name');

  if (nameParam) {
    burg.name = nameParam;
  }

  const label = burgLabels.select("[data-id='" + burgId + "']");

  if (label.size()) {
    label
      .text(burg.name)
      .classed('drag', true)
      .on('mouseover', function () {
        d3.select(this).classed('drag', false);
        label.on('mouseover', null);
      });
  }

  zoomTo(burg.x, burg.y, 8, 1600);
  invokeActiveZooming();
  tip('Here stands the glorious city of ' + burg.name, true, 'success', 15000);
}

// apply default biomes data
function applyDefaultBiomesSystem(): Biome {
  // parse icons weighted array into a simple array
  for (let i = 0; i < BIOME_ICONS.length; i++) {
    const parsed = [];

    for (const icon in BIOME_ICONS[i]) {
      if (!Object.keys(BIOME_ICONS[i]).length) {
        continue;
      }
      /**
       * For some reason, TS isn't smart enough to figure
       * out on its own that a key of an object of type
       * Record<BiomeType, number> is always going to be
       * a BiomeType, so let's help it along here.
       */
      const typedIcon: BiomeType = icon as BiomeType;
      const num = (BIOME_ICONS[i] as BiomeIcon)[typedIcon] ?? 0;

      for (let j = 0; j < num; j++) {
        parsed.push(icon);
      }
    }
    BIOME_ICONS[i] = parsed;
  }

  return {
    // TODO is this done elsewhere? if so, it needs to be removed.
    i: [0, ...d3.range(0, BIOME_NAME.length)],
    name,
    color: BIOME_COLOR,
    biomesMatrix: BIOMES_MATRIX,
    // TODO is this done elsewhere? if so, it needs to be removed.
    habitability: [0, ...BIOME_HABITABILITY],
    // TODO is this done elsewhere? if so, it needs to be removed.
    iconsDensity: [0, ...BIOME_ICONS_DENSITY],
    icons: BIOME_ICONS,
    cost: BIOME_MOVE_COST,
  };
}

function showWelcomeMessage(): void {
  const post = link(
    'https://www.reddit.com/r/FantasyMapGenerator/comments/ft5b41/update_new_version_is_published_into_the_battle_v14/',
    'Main changes:'
  ); // announcement on Reddit
  const changelog = link(
    'https://github.com/Azgaar/Fantasy-Map-Generator/wiki/Changelog',
    'previous version'
  );
  const reddit = link(
    'https://www.reddit.com/r/FantasyMapGenerator',
    'Reddit community'
  );
  const discord = link(
    'https://discordapp.com/invite/X7E84HU',
    'Discord server'
  );
  const patreon = link('https://www.patreon.com/azgaar', 'Patreon');
  const desktop = link(
    'https://github.com/Azgaar/Fantasy-Map-Generator/wiki/Q&A#is-there-a-desktop-version',
    'desktop application'
  );

  alertMessage.innerHTML = `The Fantasy Map Generator is updated up to version <b>${version}</b>.
    This version is compatible with ${changelog}, loaded <i>.map</i> files will be auto-updated.

    <ul>${post}
      <li>Military forces changes (${link(
        'https://github.com/Azgaar/Fantasy-Map-Generator/wiki/Military-Forces',
        'detailed description'
      )})</li>
      <li>Battle simulation (${link(
        'https://github.com/Azgaar/Fantasy-Map-Generator/wiki/Battle-Simulator',
        'detailed description'
      )})</li>
      <li>Ice layer and Ice editor</li>
      <li>Route and River Elevation profile (by EvolvedExperiment)</li>
      <li>Image Converter enhancement</li>
      <li>Name generator improvement</li>
      <li>Improved integration with City Generator</li>
      <li>Fogging restyle</li>
    </ul>

    <p>You can can also download a ${desktop}.</p>

    <p>Join our ${discord} and ${reddit} to ask questions, share maps, discuss the Generator and Worlbuilding, report bugs and propose new features.</p>

    <span>Thanks for all supporters on ${patreon}!</i></span>`;

  $('#alert').dialog({
    resizable: false,
    title: 'Fantasy Map Generator update',
    width: '28em',
    buttons: {
      OK: function () {
        $(this).dialog('close');
      },
    },
    position: { my: 'center', at: 'center', of: 'svg' },
    close: () => localStorage.setItem('version', version),
  });
}

function zoomed(): void {
  const transform = d3.event.transform;
  const scaleDiff = scale - transform.k;
  const positionDiff = (viewX - transform.x) | (viewY - transform.y);

  if (!positionDiff && !scaleDiff) {
    return;
  }

  scale = transform.k;
  viewX = transform.x;
  viewY = transform.y;
  viewbox.attr('transform', transform);

  // update grid only if view position
  if (positionDiff) drawCoordinates();

  // rescale only if zoom is changed
  if (scaleDiff) {
    invokeActiveZooming();
    drawScaleBar();
  }

  // zoom image converter overlay
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;

  if (canvas && +canvas.style.opacity) {
    const img = document.getElementById('image') as CanvasImageSource;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    ctx?.setTransform(scale, 0, 0, scale, viewX, viewY);
    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
}

// Zoom to a specific point
function zoomTo(x: number, y: number, z: number = 8, d: number = 2000): void {
  const transform = d3.zoomIdentity
    .translate(x * -z + graphWidth / 2, y * -z + graphHeight / 2)
    .scale(z);
  // TODO figure out why TS isn't happy about passing zoom.transform.
  svg
    .transition()
    .duration(d)
    .call(zoom.transform as any, transform);
}

// Reset zoom to initial
function resetZoom(d: number = 1000) {
  // TODO figure out why TS isn't happy about passing zoom.transform.
  svg
    .transition()
    .duration(d)
    .call(zoom.transform as any, d3.zoomIdentity);
}

// calculate x,y extreme points of viewBox
function getViewBoxExtent(): number[][] {
  // x = trX / scale * -1 + graphWidth / scale
  // y = trY / scale * -1 + graphHeight / scale
  return [
    [Math.abs(viewX / scale), Math.abs(viewY / scale)],
    [
      Math.abs(viewX / scale) + graphWidth / scale,
      Math.abs(viewY / scale) + graphHeight / scale,
    ],
  ];
}

// active zooming feature
function invokeActiveZooming(): void {
  if (
    coastline.select('#sea_island').size() &&
    +coastline.select('#sea_island').attr('auto-filter')
  ) {
    // toggle shade/blur filter for coatline on zoom
    const filter =
      scale > 1.5 && scale <= 2.6
        ? null
        : scale > 2.6
        ? 'url(#blurFilter)'
        : 'url(#dropShadow)';
    /**
     * Needed to add the empty string logic here because TS is
     * weird about overloads.
     */
    coastline.select('#sea_island').attr('filter', filter ?? '');
  }

  // rescale labels on zoom
  if (labels.style('display') !== 'none') {
    labels.selectAll('g').each(function () {
      if (!isElement(this)) {
        return;
      }

      if (this?.id && this.id === 'burgLabels') {
        return;
      }

      const desired =
        getStringAsNumberOrNull(this.getAttribute('data-size')) ?? 0;
      const relative = Math.max(rn((desired + desired / scale) / 2, 2), 1);
      // TODO i'm assuming this should have been setAttribute instead of
      // getAttribute, which is what it is in the original codebase.
      this.setAttribute('font-size', `${relative}`);
      const hidden =
        hideLabels.checked && (relative * scale < 6 || relative * scale > 50);

      if (hidden) {
        this.classList.add('hidden');
      } else {
        this.classList.remove('hidden');
      }
    });
  }

  // turn off ocean pattern if scale is big (improves performance)
  oceanPattern
    .select('rect')
    .attr('fill', scale > 10 ? '#fff' : 'url(#oceanic)')
    /**
     * Needed to add the empty string logic here because TS is
     * weird about overloads.
     */
    .attr('opacity', scale > 10 ? 0.2 : '');

  // change states halo width
  if (!customization) {
    const haloSize = rn(+statesHalo.attr('data-width') / scale, 1);
    statesHalo
      .attr('stroke-width', haloSize)
      .style('display', haloSize > 3 ? 'block' : 'none');
  }

  // rescale map markers
  if (+markers.attr('rescale') && markers.style('display') !== 'none') {
    markers.selectAll('use').each(function () {
      if (!isElement(this)) {
        return;
      }

      const x = getStringAsNumberOrNull(this.getAttribute('data-x')) ?? 0;
      const y = getStringAsNumberOrNull(this.getAttribute('data-y')) ?? 0;
      const desired =
        getStringAsNumberOrNull(this.getAttribute('data-size')) ?? 0;
      const size = Math.max(desired * 5 + 25 / scale, 1);

      d3.select(this)
        .attr('x', x - size / 2)
        .attr('y', y - size)
        .attr('width', size)
        .attr('height', size);
    });
  }

  // rescale rulers to have always the same size
  if (ruler.style('display') !== 'none') {
    const size = rn((1 / scale ** 0.3) * 2, 1);
    ruler
      .selectAll('circle')
      .attr('r', 2 * size)
      .attr('stroke-width', 0.5 * size);
    ruler.selectAll('rect').attr('stroke-width', 0.5 * size);
    ruler.selectAll('text').attr('font-size', 10 * size);
    ruler.selectAll('line, path').attr('stroke-width', size);
  }
}

// add drag to upload logic, pull request from @evyatron
void (function addDragToUpload() {
  document.addEventListener('dragover', function (e) {
    e.stopPropagation();
    e.preventDefault();
    setElementDisplayValue(document.getElementById('mapOverlay'), '');
  });

  setElementDisplayValue;
  document.addEventListener('dragleave', function () {
    setElementDisplayValue(document.getElementById('mapOverlay'), 'none');
  });

  document.addEventListener('drop', function (e) {
    e.stopPropagation();
    e.preventDefault();

    setElementDisplayValue(document.getElementById('mapOverlay'), 'none');

    if (!e.dataTransfer?.items || e.dataTransfer.items.length !== 1) {
      return; // no files or more than one
    }

    const file = e.dataTransfer.items[0].getAsFile();

    if (!file) {
      console.error('Error loading file.');

      return;
    }

    if (file.name.indexOf('.map') == -1) {
      // not a .map file
      alertMessage.innerHTML =
        'Please upload a <b>.map</b> file you have previously downloaded';

      $('#alert').dialog({
        resizable: false,
        title: 'Invalid file format',
        position: { my: 'center', at: 'center', of: 'svg' },
        buttons: {
          Close: function () {
            $(this).dialog('close');
          },
        },
      });

      return;
    }

    // all good - show uploading text and load the map
    overlay.style.display = '';
    overlay.innerHTML = 'Uploading<span>.</span><span>.</span><span>.</span>';

    if (closeDialogs) {
      closeDialogs();
    }

    uploadMap(file, () => {
      overlay.style.display = 'none';
      overlay.innerHTML = 'Drop a .map file to open';
    });
  });
})();

function generate(): void {
  try {
    const timeStart = performance.now();
    invokeActiveZooming();
    generateSeed();
    console.group('Generated Map ' + seed);
    applyMapSize();
    randomizeOptions();
    placePoints();
    calculateVoronoi(grid, grid.points);
    drawScaleBar();
    HeightmapGenerator().generate();
    markFeatures();
    openNearSeaLakes();
    OceanLayers()();
    defineMapSize();
    calculateMapCoordinates();
    calculateTemperatures();
    generatePrecipitation();
    reGraph();
    drawCoastline();

    elevateLakes();
    Rivers().generate();
    defineBiomes();

    rankCells();
    Cultures().generate();
    Cultures().expand();
    BurgsAndStates().generate();
    Religions().generate();
    BurgsAndStates().defineStateForms();
    BurgsAndStates().generateProvinces();
    BurgsAndStates().defineBurgFeatures();

    drawStates();
    drawBorders();
    BurgsAndStates().drawStateLabels();

    Rivers().specify();

    Military().generate();
    addMarkers();
    addZones();
    Names().getMapName();

    console.warn(`TOTAL: ${rn((performance.now() - timeStart) / 1000, 2)}s`);
    showStatistics();

    console.log('Generated Map ' + seed);
    console.groupEnd();
  } catch (error) {
    console.error(error);
    clearMainTip();

    alertMessage.innerHTML = `An error is occured on map generation. Please retry.
      <br>If error is critical, clear the stored data and try again.
      <p id="errorBox">${parseError(error)}</p>`;
    $('#alert').dialog({
      resizable: false,
      title: 'Generation error',
      width: '32em',
      buttons: {
        'Clear data': function () {
          localStorage.clear();
          localStorage.setItem('version', version);
        },
        Regenerate: function () {
          regenerateMap();
          $(this).dialog('close');
        },
        Ignore: function () {
          $(this).dialog('close');
        },
      },
      position: { my: 'center', at: 'center', of: 'svg' },
    });
  }
}

// generate map seed (string!) or get it from URL searchParams
function generateSeed(): void {
  const first = !mapHistory[0];
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const urlSeed = url.searchParams.get('seed');

  if (first && params.get('from') === 'MFCG' && urlSeed?.length === 13) {
    seed = urlSeed.slice(0, -4);
  } else if (first && urlSeed) {
    seed = urlSeed;
  } else if (optionsSeed.value && optionsSeed.value != seed) {
    seed = optionsSeed.value;
  } else {
    seed = Math.floor(Math.random() * 1e9).toString();
  }

  optionsSeed.value = seed;
  seedrandom(seed);
}

// Place points to calculate Voronoi diagram
function placePoints(): void {
  console.time('placePoints');
  const cellsDesired = 10000 * +densityInput.value; // generate 10k points for each densityInput point
  const spacing = (grid.spacing = rn(
    Math.sqrt((graphWidth * graphHeight) / cellsDesired),
    2
  )); // spacing between points before jirrering
  grid.boundary = getBoundaryPoints(graphWidth, graphHeight, spacing);
  grid.points = getJitteredGrid(graphWidth, graphHeight, spacing); // jittered square grid
  grid.cellsX = Math.floor((graphWidth + 0.5 * spacing) / spacing);
  grid.cellsY = Math.floor((graphHeight + 0.5 * spacing) / spacing);
  console.timeEnd('placePoints');
}

// calculate Delaunay and then Voronoi diagram
function calculateVoronoi(graph: Grid | Pack, points: number[][]): void {
  console.time('calculateDelaunay');
  const pointsLength = points.length;
  const allPoints = points.concat(graph.boundary);
  const delaunay = Delaunator.from(allPoints);
  console.timeEnd('calculateDelaunay');

  console.time('calculateVoronoi');
  const voronoi = getVoronoi(delaunay, allPoints, pointsLength);
  graph.cells = {
    ...graph.cells,
    ...voronoi.cells,
  };
  graph.cells.i =
    pointsLength < 65535
      ? Uint16Array.from(d3.range(pointsLength))
      : Uint32Array.from(d3.range(pointsLength)); // array of indexes
  graph.vertices = voronoi.vertices;
  console.timeEnd('calculateVoronoi');
}

// Mark features (ocean, lakes, islands)
function markFeatures(): void {
  console.time('markFeatures');
  seedrandom(seed); // restart Math.random() to get the same result on heightmap edit in Erase mode
  const cells = grid.cells;
  const heights = grid.cells.heights;
  cells.features = new Uint16Array(cells.i.length); // cell feature number
  cells.types = new Int8Array(cells.i.length); // cell type: 1 = land coast; -1 = water near coast;
  grid.features = [0];

  for (let i = 1, queue = [0]; queue[0] !== -1; i++) {
    cells.features[queue[0]] = i; // feature number
    const land = heights[queue[0]] >= 20;
    let border = false; // true if feature touches map border

    while (queue.length) {
      const q = queue.pop();

      if (!q) {
        continue;
      }

      if (cells.borders[q]) {
        border = true;
      }

      cells.adjacentCells[q].forEach(function (e) {
        const eLand = heights[e] >= 20;
        //if (eLand) cells.t[e] = 2;

        if (land === eLand && cells.features[e] === 0) {
          cells.features[e] = i;
          queue.push(e);
        }

        if (land && !eLand) {
          cells.types[q] = 1;
          cells.types[e] = -1;
        }
      });
    }

    const type: FeatureType = land ? 'island' : border ? 'ocean' : 'lake';

    grid.features.push({ i, land, border, type });

    queue[0] = cells.features.findIndex((feature) => !feature); // find unmarked cell
  }

  console.timeEnd('markFeatures');
}

// How to handle lakes generated near seas? They can be both open or closed.
// As these lakes are usually get a lot of water inflow, most of them should have brake the treshold and flow to sea via river or strait (see Ancylus Lake).
// So I will help this process and open these kind of lakes setting a treshold cell heigh below the sea level (=19).
function openNearSeaLakes(): void {
  if (templateInput.value === 'Atoll') {
    return; // no need for Atolls
  }

  const cells = grid.cells;
  const features = grid.features;

  if (!features.find((feature) => feature && feature.type === 'lake')) {
    return; // no lakes
  }

  console.time('openLakes');
  const limit = 50; // max height that can be breached by water

  for (let t = 0, removed = true; t < 5 && removed; t++) {
    removed = false;

    for (const i of cells.i) {
      const lake = cells.features[i];
      const cell = features[lake];

      if (cell && cell.type !== 'lake') {
        continue; // not a lake cell
      }

      check_neighbours: for (const adjacentCell of cells.adjacentCells[i]) {
        if (
          cells.types[adjacentCell] !== 1 ||
          cells.heights[adjacentCell] > limit
        ) {
          continue; // water cannot brake this
        }

        for (const n of cells.adjacentCells[adjacentCell]) {
          const ocean = cells.features[n];
          const oceanFeature = features[ocean];
          const type = oceanFeature && oceanFeature.type;

          if (type !== 'ocean') {
            continue; // not an ocean
          }

          removed = removeLake(adjacentCell, lake, ocean);

          break check_neighbours;
        }
      }
    }
  }

  function removeLake(treshold: number, lake: number, ocean: number): boolean {
    cells.heights[treshold] = 19;
    cells.types[treshold] = -1;
    cells.features[treshold] = ocean;

    cells.adjacentCells[treshold].forEach(function (adjacentCell) {
      if (cells.heights[adjacentCell] >= 20) {
        cells.types[adjacentCell] = 1; // mark as coastline
      }
    });

    const lakeFeature = features[lake];

    if (lakeFeature) {
      lakeFeature.type = 'ocean'; // mark former lake as ocean
    }

    return true;
  }

  console.timeEnd('openLakes');
}

// define map size and position based on template and random factor
function defineMapSize(): void {
  const [size, latitude] = getSizeAndLatitude();
  const randomize =
    new URL(window.location.href).searchParams.get('options') === 'default'; // ignore stored options

  if (randomize || !locked('mapSize')) {
    mapSizeOutput.value = mapSizeInput.value = `${size}`;
  }

  if (randomize || !locked('latitude')) {
    latitudeOutput.value = latitudeInput.value = `${latitude}`;
  }

  function getSizeAndLatitude(): TwoNumberArray {
    const template = (document.getElementById(
      'templateInput'
    ) as HTMLSelectElement | null)?.value as Template; // heightmap template
    const part = grid.features.some((feature) => {
      return feature && feature.land && feature.border;
    }); // if land goes over map borders
    const max = part ? 85 : 100; // max size
    const lat = part
      ? gauss(P(0.5) ? 30 : 70, 15, 20, 80)
      : gauss(50, 20, 15, 85); // latitude shift

    if (!part) {
      if (template === 'Pangea') {
        return [100, 50];
      }

      if (template === 'Shattered' && P(0.7)) {
        return [100, 50];
      }

      if (template === 'Continents' && P(0.5)) {
        return [100, 50];
      }

      if (template === 'Archipelago' && P(0.35)) {
        return [100, 50];
      }

      if (template === 'High Island' && P(0.25)) {
        return [100, 50];
      }

      if (template === 'Low Island' && P(0.1)) {
        return [100, 50];
      }
    }

    if (template === 'Pangea') {
      return [gauss(75, 20, 30, max), lat];
    }

    if (template === 'Volcano') {
      return [gauss(30, 20, 10, max), lat];
    }

    if (template === 'Mediterranean') {
      return [gauss(30, 30, 15, 80), lat];
    }

    if (template === 'Peninsula') {
      return [gauss(15, 15, 5, 80), lat];
    }

    if (template === 'Isthmus') {
      return [gauss(20, 20, 3, 80), lat];
    }

    if (template === 'Atoll') {
      return [gauss(10, 10, 2, max), lat];
    }

    return [gauss(40, 20, 15, max), lat]; // Continents, Archipelago, High Island, Low Island
  }
}

// calculate map position on globe
function calculateMapCoordinates(): void {
  const size = +(document.getElementById('mapSizeOutput') as HTMLInputElement)
    ?.value;
  const latShift = +(document.getElementById(
    'latitudeOutput'
  ) as HTMLInputElement)?.value;

  const latT = (size / 100) * 180;
  const latN = 90 - ((180 - latT) * latShift) / 100;
  const latS = latN - latT;

  const lon = Math.min(((graphWidth / graphHeight) * latT) / 2, 180);
  mapCoordinates = { latT, latN, latS, lonT: lon * 2, lonW: -lon, lonE: lon };
}

// temperature model
function calculateTemperatures(): void {
  console.time('calculateTemperatures');
  const cells = grid.cells;
  cells.temps = new Int8Array(cells.i.length); // temperature array

  const tempAtEquator = +temperatureEquatorInput.value;
  const tempAtPole = +temperaturePoleInput.value;
  const tempDelta = tempAtEquator - tempAtPole;
  const interpolation = d3.easePolyInOut.exponent(0.5); // interpolation function

  d3.range(0, cells.i.length, grid.cellsX).forEach(function (r) {
    const y = grid.points[r][1];

    if (mapCoordinates.latN && mapCoordinates.latT) {
      const lat = Math.abs(
        mapCoordinates.latN - (y / graphHeight) * mapCoordinates.latT
      ); // [0; 90]
      const initTemp = tempAtEquator - interpolation(lat / 90) * tempDelta;
      for (let i = r; i < r + grid.cellsX; i++) {
        cells.temps[i] = Math.max(
          Math.min(initTemp - convertToFriendly(cells.heights[i]), 127),
          -128
        );
      }
    }
  });

  // temperature decreases by 6.5 degree C per 1km
  function convertToFriendly(height: number): number {
    if (height < 20) {
      return 0;
    }

    const exponent = +heightExponentInput.value;
    const convertedHeight = Math.pow(height - 18, exponent);

    return rn((convertedHeight / 1000) * 6.5);
  }

  console.timeEnd('calculateTemperatures');
}

// simplest precipitation model
function generatePrecipitation(): void {
  console.time('generatePrecipitation');
  prec.selectAll('*').remove();
  const cells = grid.cells;
  cells.precipitation = new Uint8Array(cells.i.length); // precipitation array
  const modifier = +precipitationInput.value / 100; // user's input
  const cellsX = grid.cellsX;
  const cellsY = grid.cellsY;
  let westerly: ThreeNumberArray[] = [];
  let easterly: ThreeNumberArray[] = [];
  let southerly = 0;
  let northerly = 0;

  // define wind directions based on cells latitude and prevailing winds there
  d3.range(0, cells.i.length, cellsX).forEach(function (c, i) {
    if (!mapCoordinates.latN || !mapCoordinates.latT) {
      return;
    }

    const lat = mapCoordinates.latN - (i / cellsY) * mapCoordinates.latT;
    const band = (Math.abs(lat) - 1) / 5 ?? 0;
    const latMod = LATITUDE_MODIFIER[band];
    const tier = Math.abs(lat - 89) / 30 ?? 0; // 30d tiers from 0 to 5 from N to S

    if (options.winds[tier] > 40 && options.winds[tier] < 140) {
      westerly.push([c, latMod, tier]);
    } else if (options.winds[tier] > 220 && options.winds[tier] < 320) {
      easterly.push([c + cellsX - 1, latMod, tier]);
    }
    if (options.winds[tier] > 100 && options.winds[tier] < 260) {
      northerly++;
    } else if (options.winds[tier] > 280 || options.winds[tier] < 80) {
      southerly++;
    }
  });

  // distribute winds by direction
  if (westerly.length) {
    passWind(westerly, 120 * modifier, 1, cellsX);
  }

  if (easterly.length) {
    passWind(easterly, 120 * modifier, -1, cellsX);
  }

  const vertT = southerly + northerly;

  if (northerly && mapCoordinates.latN && mapCoordinates.latT) {
    const bandN = ((Math.abs(mapCoordinates.latN) - 1) / 5) | 0;
    const latModN =
      mapCoordinates.latT > 60
        ? d3.mean(LATITUDE_MODIFIER) ?? 0
        : LATITUDE_MODIFIER[bandN];
    const maxPrecN = (northerly / vertT) * 60 * modifier * latModN;
    passWind(d3.range(0, cellsX, 1), maxPrecN, cellsX, cellsY);
  }

  if (southerly && mapCoordinates.latS && mapCoordinates.latT) {
    const bandS = ((Math.abs(mapCoordinates.latS) - 1) / 5) | 0;
    const latModS =
      mapCoordinates.latT > 60
        ? d3.mean(LATITUDE_MODIFIER) ?? 0
        : LATITUDE_MODIFIER[bandS];
    const maxPrecS = (southerly / vertT) * 60 * modifier * latModS;
    passWind(
      d3.range(cells.i.length - cellsX, cells.i.length, 1),
      maxPrecS,
      -cellsX,
      cellsY
    );
  }

  function passWind(
    source: ThreeNumberArray[] | number[],
    maxPrec: number,
    next: number,
    steps: number
  ): void {
    const maxPrecInit = maxPrec;

    for (let first of source) {
      if (typeof first !== 'number') {
        maxPrec = Math.min(maxPrecInit * first[1], 255);
        first = first[0];
      }

      let humidity = maxPrec - cells.heights[first]; // initial water amount

      if (humidity <= 0) {
        continue; // if first cell in row is too elevated cosdired wind dry
      }

      for (let s = 0, current = first; s < steps; s++, current += next) {
        // no flux on permafrost
        if (cells.temps[current] < -5) {
          continue;
        }

        // water cell
        if (cells.heights[current] < 20) {
          if (
            cells.heights[current + next] >= 20 &&
            !Array.isArray(cells.precipitation)
          ) {
            cells.precipitation[current + next] += Math.max(
              humidity / rand(10, 20),
              1
            ); // coastal precipitation
          } else {
            humidity = Math.min(humidity + 5 * modifier, maxPrec); // wind gets more humidity passing water cell

            if (!Array.isArray(cells.precipitation)) {
              cells.precipitation[current] += 5 * modifier; // water cells precipitation (need to correctly pour water through lakes)
            }
          }

          continue;
        }

        // land cell
        const precipitation = getPrecipitation(humidity, current, next);

        if (!Array.isArray(cells.precipitation)) {
          cells.precipitation[current] += precipitation;
        }

        const evaporation = precipitation > 1.5 ? 1 : 0; // some humidity evaporates back to the atmosphere
        humidity = Math.min(
          Math.max(humidity - precipitation + evaporation, 0),
          maxPrec
        );
      }
    }
  }

  function getPrecipitation(humidity: number, i: number, n: number): number {
    if (cells.heights[i + n] > 85) {
      return humidity; // 85 is max passable height
    }

    const normalLoss = Math.max(humidity / (10 * modifier), 1); // precipitation in normal conditions
    const diff = Math.max(cells.heights[i + n] - cells.heights[i], 0); // difference in height
    const mod = (cells.heights[i + n] / 70) ** 2; // 50 stands for hills, 70 for mountains

    return Math.min(Math.max(normalLoss + diff * mod, 1), humidity);
  }

  void (function drawWindDirection() {
    const wind = prec.append('g').attr('id', 'wind');

    d3.range(0, 6).forEach(function (t) {
      if (westerly.length > 1) {
        const west = westerly.filter((w) => w[2] === t);
        if (west && west.length > 3) {
          const from = west[0][0],
            to = west[west.length - 1][0];
          const y = (grid.points[from][1] + grid.points[to][1]) / 2;
          wind.append('text').attr('x', 20).attr('y', y).text('\u21C9');
        }
      }

      if (easterly.length > 1) {
        const east = easterly.filter((w) => w[2] === t);
        if (east && east.length > 3) {
          const from = east[0][0],
            to = east[east.length - 1][0];
          const y = (grid.points[from][1] + grid.points[to][1]) / 2;
          wind
            .append('text')
            .attr('x', graphWidth - 52)
            .attr('y', y)
            .text('\u21C7');
        }
      }
    });

    if (northerly) {
      wind
        .append('text')
        .attr('x', graphWidth / 2)
        .attr('y', 42)
        .text('\u21CA');
    }

    if (southerly) {
      wind
        .append('text')
        .attr('x', graphWidth / 2)
        .attr('y', graphHeight - 20)
        .text('\u21C8');
    }
  })();

  console.timeEnd('generatePrecipitation');
}

interface NewCells {
  precipitation: number[][];
  gridCellInitial: number[];
  heights: number[];
  temps: number[];
  features: number[];
  rivers: number[];
  biomes: number[];
}

// recalculate Voronoi Graph to pack cells
function reGraph(): void {
  console.time('reGraph');

  let cells = grid.cells;
  let points = grid.points;
  let features = grid.features;
  const newCells: NewCells = {
    precipitation: [],
    gridCellInitial: [],
    heights: [],
    temps: [],
    features: [],
    rivers: [],
    biomes: [],
  }; // to store new data
  const spacing2 = grid.spacing ** 2;

  function addNewPoint(x: number, y: number, i: number, height: number) {
    newCells.precipitation.push([x, y]);
    newCells.gridCellInitial.push(i);
    newCells.heights.push(height);
  }

  for (const i of cells.i) {
    const height = cells.heights[i];
    const type = cells.temps[i];

    if (height < 20 && type !== -1 && type !== -2) {
      continue; // exclude all deep ocean points
    }

    if (
      type === -2 &&
      // check if this is the first index so that we don't try to
      // access 0.type when doing the 'lake' type check.

      (i % 4 === 0 || getFeatureType(features[cells.features[i]]) === 'lake')
    ) {
      continue; // exclude non-coastal lake points
    }

    const x = points[i][0];
    const y = points[i][1];

    addNewPoint(x, y, i, height); // add point to array

    // add additional points for cells along coast
    if (type === 1 || type === -1) {
      if (cells.biomes[i]) {
        continue; // not for near-border cells
      }

      cells.adjacentCells[i].forEach(function (e) {
        if (i > e) {
          return;
        }

        if (cells.temps[e] === type) {
          const dist2 = (y - points[e][1]) ** 2 + (x - points[e][0]) ** 2;

          if (dist2 < spacing2) {
            return; // too close to each other
          }

          const x1 = rn((x + points[e][0]) / 2, 1);
          const y1 = rn((y + points[e][1]) / 2, 1);

          addNewPoint(x1, y1, i, height);
        }
      });
    }
  }

  calculateVoronoi(pack, newCells.precipitation);
  cells = pack.cells;
  cells.precipitation = newCells.precipitation; // points coordinates [x, y]
  cells.gridCellInitial =
    grid.cells.i.length < 65535
      ? Uint16Array.from(newCells.gridCellInitial)
      : Uint32Array.from(newCells.gridCellInitial); // reference to initial grid cell
  cells.quadtree = d3.quadtree(
    cells.precipitation.map((p, d) => [p[0], p[1], d])
  ); // points quadtree for fast search
  cells.heights = new Uint8Array(newCells.heights); // heights
  cells.area = new Uint16Array(cells.i.length); // cell area
  cells.i.forEach(
    (i: number) => (cells.area[i] = Math.abs(d3.polygonArea(getPackPolygon(i))))
  );

  console.timeEnd('reGraph');
}

// Detect and draw the coasline
function drawCoastline(): void {
  console.time('drawCoastline');
  reMarkFeatures();
  const { cells, vertices, features } = pack;
  const cellsLength = cells.i.length;
  const used = new Uint8Array(features.length); // store conneted features
  const largestLand = d3.scan(
    features.map((f) => (isFeature(f) && f.land ? f.cells : 0)),
    (a, b) => (a && b ? b - a : 0)
  );
  const landMask = defs.select('#land');
  const waterMask = defs.select('#water');
  lineGen.curve(d3.curveBasisClosed);

  for (const i of cells.i) {
    const startFromEdge = !i && cells.heights[i] >= 20;

    if (!startFromEdge && cells.types[i] !== -1 && cells.types[i] !== 1) {
      continue; // non-edge cell
    }

    const feature = cells.features[i];

    if (used[feature]) {
      continue; // already connected
    }

    if (getFeatureType(features[feature]) === 'ocean') {
      continue; // ocean cell
    }

    const type = getFeatureType(features[feature]) === 'lake' ? 1 : -1; // type value to search for
    const start = findStart(i, type);

    if (start === -1 || start === undefined) {
      continue; // cannot start here
    }

    let vChain = connectVertices(start, type);
    const featureOrZero = features[feature];

    if (isFeature(featureOrZero) && featureOrZero.type === 'lake') {
      relax(vChain, 1.2);
    }

    used[feature] = 1;
    let points: TwoNumberArray[] = clipPoly(
      vChain.map((v) => vertices.coordinates[v]),
      1
    );
    const area = d3.polygonArea(points); // area with lakes/islands

    if (area > 0 && isFeature(featureOrZero) && featureOrZero.type === 'lake') {
      points = points.reverse();
      vChain = vChain.reverse();
    }

    if (isFeature(featureOrZero)) {
      featureOrZero.area = Math.abs(area);
      featureOrZero.vertices = vChain;
    }

    const path: string = round(lineGen(points));
    if (isFeature(featureOrZero) && featureOrZero.type === 'lake') {
      landMask
        .append('path')
        .attr('d', path)
        .attr('fill', 'black')
        .attr('id', 'land_' + feature);
      // waterMask.append("path").attr("d", path).attr("fill", "white").attr("id", "water_"+id); // uncomment to show over lakes
      lakes
        .select('#' + featureOrZero.group)
        .append('path')
        .attr('d', path)
        .attr('id', 'lake_' + feature)
        .attr('data-f', feature); // draw the lake
    } else {
      landMask
        .append('path')
        .attr('d', path)
        .attr('fill', 'white')
        .attr('id', 'land_' + feature);
      waterMask
        .append('path')
        .attr('d', path)
        .attr('fill', 'black')
        .attr('id', 'water_' + feature);
      const g =
        isFeature(featureOrZero) && featureOrZero.group === 'lake_island'
          ? 'lake_island'
          : 'sea_island';
      coastline
        .select('#' + g)
        .append('path')
        .attr('d', path)
        .attr('id', 'island_' + feature)
        .attr('data-f', feature); // draw the coastline
    }

    // draw ruler to cover the biggest land piece
    if (feature === largestLand) {
      const fromPoint = d3.scan(points, (a, b) => a[0] - b[0]);
      const toPoint = d3.scan(points, (a, b) => b[0] - a[0]);

      if (!fromPoint || !toPoint) {
        console.error('Could not find from or to point.');

        continue;
      }

      const from = points[fromPoint];
      const to = points[toPoint];

      addRuler(from[0], from[1], to[0], to[1]);
    }
  }

  // find cell vertex to start path detection
  function findStart(i: number, type: OneOrNegativeOne): number | undefined {
    if (type === -1 && cells.borders[i]) {
      return cells.cellVertices[i].find((vertex) =>
        vertices.adjacentCells[vertex].some((cell) => cell >= cellsLength)
      ); // map border cell
    }

    const filtered = cells.adjacentCells[i].filter(
      (cell) => cells.types[cell] === type
    );
    const minimum = d3.min(filtered);

    if (minimum === undefined) {
      return -1;
    }

    const index = cells.adjacentCells[i].indexOf(minimum);

    return index === -1 ? index : cells.cellVertices[i][index];
  }

  // connect vertices to chain
  function connectVertices(start: number, type: OneOrNegativeOne): number[] {
    const chain: number[] = []; // vertices chain to form a path

    for (
      let i = 0, current = start;
      i === 0 || (current !== start && i < 50000);
      i++
    ) {
      const prev = chain[chain.length - 1]; // previous vertex in chain
      //d3.select("#labels").append("text").attr("x", vertices.p[current][0]).attr("y", vertices.p[current][1]).text(i).attr("font-size", "1px");
      chain.push(current); // add current vertex to sequence
      const adjacentCell = vertices.adjacentCells[current]; // cells adjacent to vertex
      const neighboringVertex = vertices.neighboringVertices[current]; // neighboring vertices
      const c0 =
        adjacentCell[0] >= cellsLength || cells.types[adjacentCell[0]] === type;
      const c1 =
        adjacentCell[1] >= cellsLength || cells.types[adjacentCell[1]] === type;
      const c2 =
        adjacentCell[2] >= cellsLength || cells.types[adjacentCell[2]] === type;

      if (neighboringVertex[0] !== prev && c0 !== c1) {
        current = neighboringVertex[0];
      } else if (neighboringVertex[1] !== prev && c1 !== c2) {
        current = neighboringVertex[1];
      } else if (neighboringVertex[2] !== prev && c0 !== c2) {
        current = neighboringVertex[2];
      }

      if (current === chain[chain.length - 1]) {
        console.error('Next vertex is not found');

        break;
      }
    }

    //chain.push(chain[0]); // push first vertex as the last one
    return chain;
  }

  // move vertices that are too close to already added ones
  function relax(vChain: number[], r: number): void {
    const p = vertices.coordinates;
    const tree = d3.quadtree();

    for (let i = 0; i < vChain.length; i++) {
      const v = vChain[i];
      let [x, y] = [p[v][0], p[v][1]];

      if (i && vChain[i + 1] && tree.find(x, y, r) !== undefined) {
        const v1 = vChain[i - 1];
        const v2 = vChain[i + 1];
        const [x1, y1] = [p[v1][0], p[v1][1]];
        const [x2, y2] = [p[v2][0], p[v2][1]];
        [x, y] = [(x1 + x2) / 2, (y1 + y2) / 2];
        p[v] = [x, y];
      }

      tree.add([x, y]);
    }
  }

  console.timeEnd('drawCoastline');
}

// Re-mark features (ocean, lakes, islands)
function reMarkFeatures(): void {
  console.time('reMarkFeatures');
  const cells = pack.cells;
  const features: [0, ...Feature[]] = (pack.features = [0]);
  const temps = grid.cells.temps;
  cells.features = new Uint16Array(cells.i.length); // cell feature number
  cells.types = new Int8Array(cells.i.length); // cell type: 1 = land along coast; -1 = water along coast;
  cells.havens =
    cells.i.length < 65535
      ? new Uint16Array(cells.i.length)
      : new Uint32Array(cells.i.length); // cell havens (opposite water cell);
  cells.harbors = new Uint8Array(cells.i.length); // cell harbor (number of adjacent water cells);

  for (let i = 1, queue = [0]; queue[0] !== -1; i++) {
    const start = queue[0]; // first cell
    cells.features[start] = i; // assign feature number
    const land = cells.heights[start] >= 20;
    let border = false; // true if feature touches map border
    let cellNumber = 1; // to count cells number in a feature

    while (queue.length) {
      const q = queue.pop();

      if (!q) {
        return;
      }

      if (cells.borders[q]) {
        border = true;
      }

      cells.adjacentCells[q].forEach(function (e) {
        const eLand = cells.heights[e] >= 20;

        if (land && !eLand) {
          cells.types[q] = 1;
          cells.types[e] = -1;
          cells.harbors[q]++;

          if (!cells.havens[q]) {
            cells.havens[q] = e;
          }
        } else if (land && eLand) {
          if (!cells.types[e] && cells.types[q] === 1) {
            cells.types[e] = 2;
          } else if (!cells.types[q] && cells.types[e] === 1) {
            cells.types[q] = 2;
          }
        }

        if (!cells.features[e] && land === eLand) {
          queue.push(e);
          cells.features[e] = i;
          cellNumber++;
        }
      });
    }

    const type: FeatureType = land ? 'island' : border ? 'ocean' : 'lake';
    let group: GroupType;

    switch (type) {
      case 'lake':
        group = defineLakeGroup(
          start,
          cellNumber,
          temps[cells.gridCellInitial[start]]
        );

        break;
      case 'ocean':
        group = defineOceanGroup(cellNumber);

        break;
      case 'island':
        group = defineIslandGroup(start, cellNumber);

        break;
    }

    features.push({
      i,
      land,
      border,
      type,
      cells: cellNumber,
      firstCell: start,
      group,
    });

    queue[0] = cells.features.findIndex((f) => !f); // find unmarked cell
  }

  function defineLakeGroup(cell: number, num: number, temp: number): GroupType {
    if (temp > 31) {
      return 'dry';
    }

    if (temp > 24) {
      return 'salt';
    }

    if (temp < -3) {
      return 'frozen';
    }

    const height = d3.max(
      cells.adjacentCells[cell].map((c) => cells.heights[c])
    );

    if (height && height > 69 && num < 3 && cell % 5 === 0) {
      return 'sinkhole';
    }

    if (height && height > 69 && num < 10 && cell % 5 === 0) {
      return 'lava';
    }

    return 'freshwater';
  }

  function defineOceanGroup(num: number): GroupType {
    if (num > grid.cells.i.length / 25) {
      return 'ocean';
    }

    if (num > grid.cells.i.length / 100) {
      return 'sea';
    }

    return 'gulf';
  }

  function defineIslandGroup(cell: number, num: number): GroupType {
    if (cell && getFeatureType(features[cells.features[cell - 1]]) === 'lake') {
      return 'lake_island';
    }

    if (num > grid.cells.i.length / 10) {
      return 'continent';
    }

    if (num > grid.cells.i.length / 1000) {
      return 'island';
    }

    return 'isle';
  }

  console.timeEnd('reMarkFeatures');
}

// temporarily elevate some lakes to resolve depressions and flux the water to form an open (exorheic) lake
function elevateLakes(): void {
  if (templateInput.value === 'Atoll') {
    return; // no need for Atolls
  }

  console.time('elevateLakes');
  const cells = pack.cells;
  const features = pack.features;
  const maxCells = cells.i.length / 100; // size limit; let big lakes be closed (endorheic)

  cells.i.forEach((i: number) => {
    if (cells.heights[i] >= 20) {
      return;
    }

    const feature = features[cells.features[i]];

    if (!isFeature(feature)) {
      return;
    }

    if (
      feature.group !== 'freshwater' ||
      (feature.cells && feature.cells > maxCells)
    ) {
      return;
    }

    cells.heights[i] = 20;
    //debug.append("circle").attr("cx", cells.p[i][0]).attr("cy", cells.p[i][1]).attr("r", .5).attr("fill", "blue");
  });

  console.timeEnd('elevateLakes');
}

// assign biome id for each cell
function defineBiomes(): void {
  console.time('defineBiomes');
  const cells = pack.cells;
  const features = pack.features;
  const temps = grid.cells.temps;
  const precipitation = grid.cells.precipitation;
  cells.biomes = new Uint8Array(cells.i.length); // biomes array

  for (const i of cells.i) {
    const feature = features[cells.features[i]];

    if (isFeature(feature) && feature.group === 'freshwater') {
      cells.heights[i] = 19; // de-elevate lakes; here to save some resources
    }

    const temp = temps[cells.gridCellInitial[i]]; // cell temperature
    const height = cells.heights[i]; // cell height
    const moisture = height < 20 ? 0 : calculateMoisture(i); // cell moisture
    cells.biomes[i] = getBiomeId(moisture, temp, height);
  }

  function calculateMoisture(index: number): number {
    let moist = precipitation[cells.gridCellInitial[index]];

    if (Array.isArray(moist)) {
      console.error('Precipitation is an array when it should not be. 1980');

      return 0;
    }

    if (cells.rivers[index]) {
      moist += Math.max(cells.flux[index] / 20, 2);
    }

    const n = cells.adjacentCells[index]
      .filter(isLand)
      // We've already checked if this is an array array in the Array.isArray
      // if statement above, so we can safely use 'as'.
      .map((cell) => precipitation[cells.gridCellInitial[cell]] as number)
      .concat([moist]);

    return rn(4 + (d3.mean(n) ?? 0));
  }

  console.timeEnd('defineBiomes');
}

// assign biome id to a cell
function getBiomeId(
  moisture: number,
  temperature: number,
  height: number
): number {
  if (temperature < -5) {
    return 11; // permafrost biome, including sea ice
  }

  if (height < 20) {
    return 0; // marine biome: liquid water cells
  }

  if (
    moisture > 40 &&
    temperature > -2 &&
    (height < 25 || (moisture > 24 && height > 24))
  ) {
    return 12; // wetland biome
  }

  const moistureBand = Math.min((moisture / 5) | 0, 4); // moisture band from 0 to 4
  const tempBand = Math.min(Math.max(20 - temperature, 0), 25); // temparature band from 0 to 25

  return biomesData.biomesMatrix[moistureBand][tempBand];
}

// assess cells suitability to calculate population and rand cells for culture center and burgs placement
function rankCells(): void {
  console.time('rankCells');
  const cells = pack.cells;
  const features = pack.features;
  cells.suitability = new Int16Array(cells.i.length); // cell suitability array
  cells.population = new Float32Array(cells.i.length); // cell population array

  const flMean = d3.median(cells.flux.filter((f) => f)) || 0;
  const flMax = (d3.max(cells.flux) ?? 0) + (d3.max(cells.confluences) ?? 0); // to normalize flux
  const areaMean = d3.mean(cells.area); // to adjust population by cell area

  for (const i of cells.i) {
    if (cells.heights[i] < 20) {
      continue; // no population in water
    }

    // base suitability derived from biome habitability
    let suitability = +biomesData.habitability[cells.biomes[i]];

    if (!suitability) {
      continue; // uninhabitable biomes has 0 suitability
    }

    if (flMean) {
      suitability +=
        normalize(cells.flux[i] + cells.confluences[i], flMean, flMax) * 250; // big rivers and confluences are valued
    }

    suitability -= (cells.heights[i] - 50) / 5; // low elevation is valued, high is not;

    if (cells.types[i] === 1) {
      if (cells.rivers[i]) {
        suitability += 15; // estuary is valued
      }

      const feature = features[cells.features[cells.havens[i]]];

      if (!isFeature(feature)) {
        console.error(
          'features[0] is always 0, thus does not have a type or a group.'
        );

        continue;
      }

      const type = feature.type;
      const group = feature.group;

      if (type === 'lake') {
        // lake coast is valued
        if (group === 'freshwater') {
          suitability += 30;
        } else if (group !== 'lava' && group !== 'dry') {
          suitability += 10;
        }
      } else {
        suitability += 5; // ocean coast is valued

        if (cells.harbors[i] === 1) {
          suitability += 20; // safe sea harbor is valued
        }
      }
    }

    cells.suitability[i] = suitability / 5; // general population rate
    // cell rural population is suitability adjusted by cell area
    cells.population[i] =
      cells.suitability[i] > 0 && areaMean
        ? (cells.suitability[i] * cells.area[i]) / areaMean
        : 0;
  }

  console.timeEnd('rankCells');
}

// generate some markers
function addMarkers(num: number = 1): void {
  if (!num) {
    return;
  }

  console.time('addMarkers');
  const cells = pack.cells;
  const states = pack.states;

  void (function addVolcanoes() {
    let mountains = Array.from(cells.i)
      .filter((i) => cells.heights[i] > 70)
      .sort((a, b) => cells.heights[b] - cells.heights[a]);
    let count =
      mountains.length < 10 ? 0 : Math.ceil((mountains.length / 300) * num);

    if (count) {
      addMarker('volcano', '🌋', 52, 50, 13);
    }

    while (count && mountains.length) {
      const cell = mountains.splice(biased(0, mountains.length - 1, 5), 1)[0];

      if (!Array.isArray(cells.precipitation)) {
        console.error('cells.precipitation is not an array. 2131');

        continue;
      }

      const x = cells.precipitation[cell][0];
      const y = cells.precipitation[cell][1];
      const id = appendMarker(cell, 'volcano');
      const proper = Names().getCulture(cells.cultures[cell]);
      const name: string = P(0.3)
        ? 'Mount ' + proper
        : Math.random() > 0.3
        ? proper + ' Volcano'
        : proper;
      notes.push({
        id,
        name,
        legend: `Active volcano. Height: ${getFriendlyHeight([x, y])}`,
      });
      count--;
    }
  })();

  void (function addHotSprings() {
    let springs = Array.from(cells.i)
      .filter((i) => cells.heights[i] > 50)
      .sort((a, b) => cells.heights[b] - cells.heights[a]);
    let count =
      springs.length < 30 ? 0 : Math.ceil((springs.length / 1000) * num);
    if (count) {
      addMarker('hot_springs', '♨️', 50, 52, 12.5);
    }

    while (count && springs.length) {
      const cell = springs.splice(biased(1, springs.length - 1, 3), 1)[0];
      const id = appendMarker(cell, 'hot_springs');
      const proper = Names().getCulture(cells.cultures[cell]);
      const temp: string = convertTemperature(gauss(30, 15, 20, 100));

      notes.push({
        id,
        name: proper + ' Hot Springs',
        legend: `A hot springs area. Temperature: ${temp}`,
      });

      count--;
    }
  })();

  void (function addMines() {
    let hills = Array.from(cells.i).filter(
      (i) => cells.heights[i] > 47 && cells.burgs[i]
    );
    let count = !hills.length ? 0 : Math.ceil((hills.length / 7) * num);

    if (!count) {
      return;
    }

    addMarker('mine', '⛏️', 48, 50, 13.5);

    const resources: Resources = {
      salt: 5,
      gold: 2,
      silver: 4,
      copper: 2,
      iron: 3,
      lead: 1,
      tin: 1,
    };

    while (count && hills.length) {
      const cell = hills.splice(Math.floor(Math.random() * hills.length), 1)[0];
      const id = appendMarker(cell, 'mine');
      const resource = rw(resources);
      const burg = pack.burgs[cells.burgs[cell]];

      if (isBurg(burg)) {
        const name = `${burg.name} — ${resource} mining town`;
        const population = rn(
          burg.population * +populationRate.value * +urbanization.value
        );
        const legend = `${burg.name} is a mining town of ${population} people just nearby the ${resource} mine`;
        notes.push({ id, name, legend });
      }

      count--;
    }
  })();

  void (function addBridges() {
    const meanRoad = d3.mean(cells.roads.filter((r) => r)) ?? 0;
    const meanFlux = d3.mean(cells.flux.filter((fl) => fl)) ?? 0;

    let bridges = Array.from(cells.i)
      .filter(
        (i) =>
          cells.burgs[i] &&
          cells.heights[i] >= 20 &&
          cells.rivers[i] &&
          cells.flux[i] > meanFlux &&
          cells.roads[i] > meanRoad
      )
      .sort(
        (a, b) =>
          cells.roads[b] +
          cells.flux[b] / 10 -
          (cells.roads[a] + cells.flux[a] / 10)
      );
    let count = !bridges.length ? 0 : Math.ceil((bridges.length / 12) * num);

    if (count) {
      addMarker('bridge', '🌉', 50, 50, 14);
    }

    while (count && bridges.length) {
      const cell = bridges.splice(0, 1)[0];
      const id = appendMarker(cell, 'bridge');
      const burg = pack.burgs[cells.burgs[cell]];
      const river = pack.rivers.find((r) => r.i === pack.cells.rivers[cell]);
      const riverName = river ? `${river.name} ${river.type}` : 'river';

      if (isBurg(burg)) {
        const name = river && P(0.2) ? river.name : burg.name;

        notes.push({
          id,
          name: `${name} Bridge`,
          legend: `A stone bridge over the ${riverName} near ${burg.name}`,
        });
      }

      count--;
    }
  })();

  void (function addInns() {
    const maxRoad = (d3.max(cells.roads) ?? 0) * 0.9;
    let taverns = Array.from(cells.i).filter(
      (i) =>
        cells.crossroads[i] &&
        cells.heights[i] >= 20 &&
        cells.roads[i] > maxRoad
    );

    if (!taverns.length) {
      return;
    }

    const count = Math.ceil(4 * num);
    addMarker('inn', '🍻', 50, 50, 14.5);

    for (let i = 0; i < taverns.length && i < count; i++) {
      const cell = taverns.splice(
        Math.floor(Math.random() * taverns.length),
        1
      )[0];
      const id = appendMarker(cell, 'inn');
      const type = P(0.3) ? 'inn' : 'tavern';
      const name = P(0.5)
        ? ra(COLORS) + ' ' + ra(ANIMALS)
        : P(0.6)
        ? ra(ADJECTIVES) + ' ' + ra(ANIMALS)
        : ra(ADJECTIVES) + ' ' + capitalize(type);

      notes.push({
        id,
        name: 'The ' + name,
        legend: `A big and famous roadside ${type}`,
      });
    }
  })();

  void (function addLighthouses() {
    const lands = cells.i.filter(
      (i: number) =>
        cells.harbors[i] > 6 &&
        cells.adjacentCells[i].some(
          (c) => cells.heights[c] < 20 && cells.roads[c]
        )
    );
    const lighthouses = Array.from(lands).map((i: number) => [
      i,
      cells.cellVertices[i][
        cells.adjacentCells[i].findIndex(
          (c) => cells.heights[c] < 20 && cells.roads[c]
        )
      ],
    ]);

    if (lighthouses.length) {
      addMarker('lighthouse', '🚨', 50, 50, 16);
    }

    const count = Math.ceil(4 * num);

    for (let i = 0; i < lighthouses.length && i < count; i++) {
      const cell = lighthouses[i][0];
      const id = appendMarker(cell, 'lighthouse');
      const proper = cells.burgs[cell]
        ? isBurg(pack.burgs[cells.burgs[cell]]) &&
          (pack.burgs[cells.burgs[cell]] as Burg).name
        : Names().getCulture(cells.cultures[cell]);

      notes.push({
        id,
        name: getAdjective(proper) + ' Lighthouse' + name,
        legend: `A lighthouse to keep the navigation safe`,
      });
    }
  })();

  void (function addWaterfalls() {
    const waterfalls = cells.i.filter(
      (i: number) => cells.rivers[i] && cells.heights[i] > 70
    );

    if (waterfalls.length) {
      addMarker('waterfall', '⟱', 50, 54, 16.5);
    }

    const count = Math.ceil(3 * num);

    for (let i = 0; i < waterfalls.length && i < count; i++) {
      const cell = waterfalls[i];
      const id = appendMarker(cell, 'waterfall');
      const proper = cells.burgs[cell]
        ? isBurg(pack.burgs[cells.burgs[cell]]) &&
          (pack.burgs[cells.burgs[cell]] as Burg).name
        : Names().getCulture(cells.cultures[cell]);

      notes.push({
        id,
        name: getAdjective(proper) + ' Waterfall' + name,
        legend: `An extremely beautiful waterfall`,
      });
    }
  })();

  void (function addBattlefields() {
    let battlefields = Array.from(cells.i).filter(
      (i) =>
        cells.states[i] &&
        cells.population[i] > 2 &&
        cells.heights[i] < 50 &&
        cells.heights[i] > 25
    );
    let count =
      battlefields.length < 100
        ? 0
        : Math.ceil((battlefields.length / 500) * num);

    if (count) {
      addMarker('battlefield', '⚔️', 50, 52, 12);
    }

    while (count && battlefields.length) {
      const cell = battlefields.splice(
        Math.floor(Math.random() * battlefields.length),
        1
      )[0];
      const id = appendMarker(cell, 'battlefield');
      const state = states[cells.states[cell]];

      if (isFullState(state)) {
        const campaign = ra(state.campaigns);
        const date: string = generateDate(campaign?.start, campaign?.end);
        const name = Names().getCulture(cells.cultures[cell]) + ' Battlefield';
        const legend = `A historical battle of the ${campaign?.name}. \r\nDate: ${date} ${options.era}`;

        notes.push({ id, name, legend });
      }

      count--;
    }
  })();

  function addMarker(
    id: string,
    icon: string,
    x: number,
    y: number,
    size: number
  ): void {
    const markers = svg.select('#defs-markers');

    if (markers.select('#marker_' + id).size()) {
      return;
    }

    const symbol = markers
      .append('symbol')
      .attr('id', 'marker_' + id)
      .attr('viewBox', '0 0 30 30');
    symbol
      .append('path')
      .attr('d', 'M6,19 l9,10 L24,19')
      .attr('fill', '#000000')
      .attr('stroke', 'none');
    symbol
      .append('circle')
      .attr('cx', 15)
      .attr('cy', 15)
      .attr('r', 10)
      .attr('fill', '#ffffff')
      .attr('stroke', '#000000')
      .attr('stroke-width', 1);
    symbol
      .append('text')
      .attr('x', x + '%')
      .attr('y', y + '%')
      .attr('fill', '#000000')
      .attr('stroke', '#3200ff')
      .attr('stroke-width', 0)
      .attr('font-size', size + 'px')
      .attr('dominant-baseline', 'central')
      .text(icon);
  }

  function appendMarker(cell: number, type: string): string {
    if (!Array.isArray(cells.precipitation)) {
      console.error('cells.precipitation is not an array. 2494');

      return '';
    }

    const x = cells.precipitation[cell][0];
    const y = cells.precipitation[cell][1];
    const id = getNextId('markerElement');
    const name = '#marker_' + type;

    markers
      .append('use')
      .attr('id', id)
      .attr('xlink:href', name)
      .attr('data-id', name)
      .attr('data-x', x)
      .attr('data-y', y)
      .attr('x', x - 15)
      .attr('y', y - 30)
      .attr('data-size', 1)
      .attr('width', 30)
      .attr('height', 30);

    return id;
  }

  console.timeEnd('addMarkers');
}

// regenerate some zones
function addZones(number = 1) {
  console.time('addZones');
  const data: Data[] = [];
  const { cells, states, burgs } = pack;
  const used = new Uint8Array(cells.i.length); // to store used cells

  for (let i = 0; i < rn(Math.random() * 1.8 * number); i++) {
    addInvasion(); // invasion of enemy lands
  }

  for (let i = 0; i < rn(Math.random() * 1.6 * number); i++) {
    addRebels(); // rebels along a state border
  }

  for (let i = 0; i < rn(Math.random() * 1.6 * number); i++) {
    addProselytism(); // proselitism of organized religion
  }

  for (let i = 0; i < rn(Math.random() * 1.6 * number); i++) {
    addCrusade(); // crusade on heresy lands
  }

  for (let i = 0; i < rn(Math.random() * 1.8 * number); i++) {
    addDisease(); // disease starting in a random city
  }

  for (let i = 0; i < rn(Math.random() * 1.4 * number); i++) {
    addDisaster(); // disaster starting in a random city
  }

  for (let i = 0; i < rn(Math.random() * 1.4 * number); i++) {
    addEruption(); // volcanic eruption aroung volcano
  }

  for (let i = 0; i < rn(Math.random() * 1.0 * number); i++) {
    addAvalanche(); // avalanche impacting highland road
  }

  for (let i = 0; i < rn(Math.random() * 1.4 * number); i++) {
    addFault(); // fault line in elevated areas
  }

  for (let i = 0; i < rn(Math.random() * 1.4 * number); i++) {
    addFlood(); // flood on river banks
  }

  for (let i = 0; i < rn(Math.random() * 1.2 * number); i++) {
    addTsunami(); // tsunami starting near coast
  }

  function addInvasion(): void {
    const atWar = states.filter(
      (state) =>
        state.diplomacy &&
        state.diplomacy.some((d: string | string[]) => d === 'Enemy')
    );

    if (!atWar.length) {
      return;
    }

    const invader = ra(atWar);
    const target = invader?.diplomacy.findIndex(
      (d: string | string[]) => d === 'Enemy'
    );

    const cell = raU(
      cells.i.filter(
        (i: number) =>
          cells.states[i] === target &&
          cells.adjacentCells[i].some(
            (adjacentCell) => cells.states[adjacentCell] === invader?.i
          )
      )
    );

    if (!cell) {
      return;
    }

    const cellsArray: Array<number | undefined> = [];
    const queue = [cell];
    const power: number = rand(5, 30);

    while (queue.length) {
      const q = P(0.4) ? queue.shift() : queue.pop();
      cellsArray.push(q);

      if (cellsArray.length > power || !q) {
        break;
      }

      cells.adjacentCells[q].forEach((e) => {
        if (used[e]) {
          return;
        }

        if (cells.states[e] !== target) {
          return;
        }

        used[e] = 1;
        queue.push(e);
      });
    }

    const invasion: string = rw({
      Invasion: 4,
      Occupation: 3,
      Raid: 2,
      Conquest: 2,
      Subjugation: 1,
      Foray: 1,
      Skirmishes: 1,
      Incursion: 2,
      Pillaging: 1,
      Intervention: 1,
    });
    const name = getAdjective(invader?.name ?? '') + ' ' + invasion;

    data.push({
      name,
      type: 'Invasion',
      cells: cellsArray,
      fill: 'url(#hatch1)',
    });
  }

  function addRebels(): void {
    const state = ra(
      states.filter((state) => state.i && state.neighbors.some((n) => n))
    );

    if (!state) {
      return;
    }

    const neighbor = ra(state.neighbors.filter((n) => n));
    const cell = cells.i.find(
      (i: number) =>
        cells.states[i] === state.i &&
        cells.adjacentCells[i].some((cell) => cells.states[cell] === neighbor)
    );
    const cellsArray: Array<number | undefined> = [];
    const queue = [cell];
    const power: number = rand(10, 30);

    while (queue.length) {
      const q = queue.shift();
      cellsArray.push(q);

      if (cellsArray.length > power) {
        break;
      }

      if (!q) {
        continue;
      }

      cells.adjacentCells[q].forEach((e) => {
        if (used[e]) {
          return;
        }

        if (cells.states[e] !== state.i) {
          return;
        }

        used[e] = 1;

        if (
          e % 4 !== 0 &&
          !cells.adjacentCells[e].some(
            (cell) => cells.states[cell] === neighbor
          )
        ) {
          return;
        }

        queue.push(e);
      });
    }

    const rebels = rw({
      Rebels: 5,
      Insurgents: 2,
      Mutineers: 1,
      Rioters: 1,
      Separatists: 1,
      Secessionists: 1,
      Insurrection: 2,
      Rebellion: 1,
      Conspiracy: 2,
    });
    let name: string;

    if (neighbor) {
      name = getAdjective(states[neighbor].name) + ' ' + rebels;
    } else {
      name = ' ' + rebels;
    }

    data.push({
      name,
      type: 'Rebels',
      cells: cellsArray,
      fill: 'url(#hatch3)',
    });
  }

  function addProselytism(): void {
    const organized = ra(pack.religions.filter((r) => r.type === 'Organized'));

    if (!organized) {
      return;
    }

    const cell = raU(
      cells.i.filter(
        (i: number) =>
          cells.religions[i] &&
          cells.religions[i] !== organized.i &&
          cells.adjacentCells[i].some(
            (cell) => cells.religions[cell] === organized.i
          )
      )
    );

    if (!cell) {
      return;
    }

    const target = cells.religions[cell];
    const cellsArray: Array<number | undefined> = [];
    const queue = [cell];
    const power = rand(10, 30);

    while (queue.length) {
      const q = queue.shift();
      cellsArray.push(q);

      if (cellsArray.length > power) {
        break;
      }

      if (!q) {
        continue;
      }

      cells.adjacentCells[q].forEach((e) => {
        if (used[e]) {
          return;
        }

        if (cells.religions[e] !== target) {
          return;
        }

        if (cells.heights[e] < 20) {
          return;
        }

        used[e] = 1;
        //if (e%2 !== 0 && !cells.c[e].some(c => cells.state[c] === neib)) return;
        queue.push(e);
      });
    }
    const name = getAdjective(organized.name.split(' ')[0]) + ' Proselytism';

    data.push({
      name,
      type: 'Proselytism',
      cells: cellsArray,
      fill: 'url(#hatch6)',
    });
  }

  function addCrusade(): void {
    const heresy: Religion | undefined = ra(
      pack.religions.filter((r) => r.type === 'Heresy')
    );

    if (!heresy) {
      return;
    }

    const cellsArray = cells.i.filter(
      (i: number) => !used[i] && cells.religions[i] === heresy.i
    );

    if (!cellsArray.length) {
      return;
    }

    cellsArray.forEach((i: number) => (used[i] = 1));

    const name = getAdjective(heresy.name.split(' ')[0]) + ' Crusade';

    data.push({
      name,
      type: 'Crusade',
      cells: Array.from(cellsArray),
      fill: 'url(#hatch6)',
    });
  }

  function addDisease(): void {
    const burg = ra(
      burgs.filter((b) => isBurg(b) && !used[b.cell] && b.i && !b.removed)
    ); // random burg

    if (!burg || !isBurg(burg)) {
      return;
    }

    const cellsArray: Array<number | undefined> = [];
    const cost: number[] = [];
    const power: number = rand(20, 37);
    const queue = new PriorityQueue<Queue>({
      comparator: (a, b) => a.p - b.p,
    });
    queue.queue({ e: burg.cell, p: 0 });

    while (queue.length) {
      const next = queue.dequeue();

      if (cells.burgs[next.e] || cells.population[next.e]) {
        cellsArray.push(next.e);
      }

      used[next.e] = 1;

      cells.adjacentCells[next.e].forEach(function (e) {
        const road = cells.roads[next.e];
        const c = road ? Math.max(10 - road, 1) : 100;
        const p = next.p + c;

        if (p > power) {
          return;
        }

        if (!cost[e] || p < cost[e]) {
          cost[e] = p;
          queue.queue({ e, p });
        }
      });
    }

    // These are constants, so we can safely cast them.
    const adjective = () => ra(DISEASE_ADJECTIVES) as string;
    const animal = () => ra(DISEASE_ANIMALS) as string;
    const color = () => ra(DISEASE_COLORS) as string;

    const type = rw({
      Fever: 5,
      Pestilence: 2,
      Flu: 2,
      Pox: 2,
      Smallpox: 2,
      Plague: 4,
      Cholera: 2,
      Dropsy: 1,
      Leprosy: 2,
    });
    const name =
      rw({ [color()]: 4, [animal()]: 2, [adjective()]: 1 }) + ' ' + type;

    data.push({
      name,
      type: 'Disease',
      cells: cellsArray,
      fill: 'url(#hatch12)',
    });
  }

  function addDisaster(): void {
    const burg = ra(
      burgs.filter(
        (burg) => isBurg(burg) && !used[burg.cell] && burg.i && !burg.removed
      )
    ); // random burg

    if (!burg || !isBurg(burg)) {
      return;
    }

    const cellsArray: number[] = [];
    const cost: number[] = [];
    const power: number = rand(5, 25);
    const queue = new PriorityQueue<Queue>({ comparator: (a, b) => a.p - b.p });
    queue.queue({ e: burg.cell, p: 0 });

    while (queue.length) {
      const next = queue.dequeue();

      if (cells.burgs[next.e] || cells.population[next.e]) {
        cellsArray.push(next.e);
      }

      used[next.e] = 1;

      cells.adjacentCells[next.e].forEach(function (e) {
        const c: number = rand(1, 10);
        const p = next.p + c;

        if (p > power) {
          return;
        }

        if (!cost[e] || p < cost[e]) {
          cost[e] = p;
          queue.queue({ e, p });
        }
      });
    }

    const type = rw({
      Famine: 5,
      Dearth: 1,
      Drought: 3,
      Earthquake: 3,
      Tornadoes: 1,
      Wildfires: 1,
    });
    const name = getAdjective(burg.name) + ' ' + type;

    data.push({
      name,
      type: 'Disaster',
      cells: cellsArray,
      fill: 'url(#hatch5)',
    });
  }

  function addEruption(): void {
    const volcano = document
      .getElementById('markers')
      ?.querySelector("use[data-id='#marker_volcano']");

    if (!volcano) {
      return;
    }

    const x = getStringAsNumberOrNull(volcano.getAttribute('data-x'));
    const y = getStringAsNumberOrNull(volcano.getAttribute('data-y'));

    if (!x || !y) {
      console.error('Volcano data-x or data-y attribute is not a number.');

      return;
    }

    const cell: number | undefined = findCell(x, y);
    const id = volcano.id;
    const note = notes.filter((n) => n.id === id);

    if (note[0])
      note[0].legend = note[0].legend.replace(
        'Active volcano',
        'Erupting volcano'
      );
    const name = note[0]
      ? note[0].name.replace(' Volcano', '') + ' Eruption'
      : 'Volcano Eruption';

    const cellsArray: Array<number | undefined> = [];
    const queue: Array<number | undefined> = [cell];
    const power: number = rand(10, 30);

    while (queue.length) {
      const q = P(0.5) ? queue.shift() : queue.pop();
      cellsArray.push(q);

      if (cellsArray.length > power) {
        break;
      }

      if (!q) {
        continue;
      }

      cells.adjacentCells[q].forEach((e) => {
        if (used[e] || cells.heights[e] < 20) {
          return;
        }

        used[e] = 1;
        queue.push(e);
      });
    }

    data.push({
      name,
      type: 'Disaster',
      cells: cellsArray,
      fill: 'url(#hatch7)',
    });
  }

  function addAvalanche(): void {
    const roads = cells.i.filter(
      (i: number) => !used[i] && cells.roads[i] && cells.heights[i] >= 70
    );

    if (!roads.length) {
      return;
    }

    const cell = raU(roads);
    const cellsArray: Array<number | undefined> = [];
    const queue: Array<number | undefined> = [cell];
    const power: number = rand(3, 15);

    while (queue.length) {
      const q = P(0.3) ? queue.shift() : queue.pop();
      cellsArray.push(q);

      if (cellsArray.length > power) {
        break;
      }

      if (!q) {
        continue;
      }

      cells.adjacentCells[q].forEach((e) => {
        if (used[e] || cells.heights[e] < 65) {
          return;
        }

        used[e] = 1;
        queue.push(e);
      });
    }

    let proper: string;

    if (!cell) {
      proper = '';
    } else {
      proper = getAdjective(Names().getCultureShort(cells.cultures[cell]));
    }

    const name = proper + ' Avalanche';

    data.push({
      name,
      type: 'Disaster',
      cells: cellsArray,
      fill: 'url(#hatch5)',
    });
  }

  function addFault(): void {
    const elevated = cells.i.filter(
      (i: number) => !used[i] && cells.heights[i] > 50 && cells.heights[i] < 70
    );

    if (!elevated.length) {
      return;
    }

    const cell = raU(elevated);
    const cellsArray: Array<number | undefined> = [];
    const queue: Array<number | undefined> = [cell];
    const power: number = rand(3, 15);

    while (queue.length) {
      const q = queue.pop();

      if (!q) {
        continue;
      }

      if (cells.heights[q] >= 20) {
        cellsArray.push(q);
      }

      if (cellsArray.length > power) {
        break;
      }

      cells.adjacentCells[q].forEach((e) => {
        if (used[e] || cells.rivers[e]) {
          return;
        }

        used[e] = 1;
        queue.push(e);
      });
    }

    let proper: string;

    if (!cell) {
      proper = '';
    } else {
      proper = getAdjective(Names().getCultureShort(cells.cultures[cell]));
    }

    const name = proper + ' Fault';

    data.push({
      name,
      type: 'Disaster',
      cells: cellsArray,
      fill: 'url(#hatch2)',
    });
  }

  function addFlood(): void {
    const fl = cells.flux.filter((fl) => fl);
    const meanFlux = d3.mean(fl);
    const maxFlux = d3.max(fl);
    const flux =
      maxFlux && meanFlux ? (maxFlux - meanFlux) / 2 + meanFlux : NaN;
    const rivers = cells.i.filter(
      (i: number) =>
        !used[i] &&
        cells.heights[i] < 50 &&
        cells.rivers[i] &&
        cells.flux[i] > flux &&
        cells.burgs[i]
    );

    if (!rivers.length) {
      return;
    }

    const cell = raU(rivers);
    let river: number;
    const cellsArray: Array<number | undefined> = [];
    const queue: Array<number | undefined> = [cell];
    const power: number = rand(5, 30);

    if (!cell) {
      console.error('River not found');

      return;
    } else {
      river = cells.rivers[cell] ?? undefined;
    }

    while (queue.length) {
      const q = queue.pop();
      cellsArray.push(q);

      if (cellsArray.length > power) {
        break;
      }

      if (!q) {
        continue;
      }

      cells.adjacentCells[q].forEach((e) => {
        if (
          used[e] ||
          cells.heights[e] < 20 ||
          cells.rivers[e] !== river ||
          cells.heights[e] > 50 ||
          cells.flux[e] < (meanFlux ?? NaN)
        ) {
          return;
        }

        used[e] = 1;
        queue.push(e);
      });
    }

    const burgName = isBurg(burgs[cells.burgs[cell]])
      ? (burgs[cells.burgs[cell]] as Burg).name
      : '';
    const name = getAdjective(burgName + ' Flood');

    data.push({
      name,
      type: 'Disaster',
      cells: cellsArray,
      fill: 'url(#hatch13)',
    });
  }

  function addTsunami(): void {
    const coastal = cells.i.filter(
      (i: number) =>
        !used[i] &&
        cells.types[i] === -1 &&
        getFeatureType(pack.features[cells.features[i]]) !== 'lake'
    );

    if (!coastal.length) {
      return;
    }

    const cell = raU(coastal);
    const cellsArray: number[] = [];
    const queue: number[] = cell ? [cell] : [];
    const power = rand(10, 30);

    while (queue.length) {
      const q = queue.shift();

      if (!q) {
        continue;
      }

      if (cells.types[q] === 1) {
        cellsArray.push(q);
      }

      if (cellsArray.length > power) {
        break;
      }

      cells.adjacentCells[q].forEach((e) => {
        if (used[e]) {
          return;
        }

        if (cells.types[e] > 2) {
          return;
        }

        if (getFeatureType(pack.features[cells.features[e]]) === 'lake') {
          return;
        }

        used[e] = 1;
        queue.push(e);
      });
    }

    const proper = getAdjective(Names().getCultureShort(cells.cultures[cell]));
    const name = proper + ' Tsunami';

    data.push({
      name,
      type: 'Disaster',
      cells: cellsArray,
      fill: 'url(#hatch13)',
    });
  }

  void (function drawZones() {
    zones
      .selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .attr('id', (d, i) => 'zone' + i)
      .attr('data-description', (d) => d.name)
      .attr('data-type', (d) => d.type)
      .attr('data-cells', (d) => d.cells.join(','))
      .attr('fill', (d) => d.fill)
      .selectAll('polygon')
      .data((d) => d.cells)
      .enter()
      .append('polygon')
      // TODO figure out this typing
      .attr('points', (d) => getPackPolygon(d) as any)
      .attr('id', function (d) {
        return (this?.parentNode as HTMLElement)?.id + '_' + d;
      });
  })();

  console.timeEnd('addZones');
}

// show map stats on generation complete
function showStatistics(): void {
  const template = templateInput.value as Template;
  const templateRandom = locked('template') ? '' : '(random)';
  const stats = `  Seed: ${seed}
    Canvas size: ${graphWidth}x${graphHeight}
    Template: ${template} ${templateRandom}
    Points: ${grid.points.length}
    Cells: ${pack.cells.i.length}
    Map size: ${mapSizeOutput.value}%
    States: ${pack.states.length - 1}
    Provinces: ${pack.provinces.length - 1}
    Burgs: ${pack.burgs.length - 1}
    Religions: ${pack.religions.length - 1}
    Culture set: ${culturesSet.selectedOptions[0].innerText}
    Cultures: ${pack.cultures.length - 1}`;

  mapId = Date.now(); // unique map id is it's creation date number
  mapHistory.push({
    seed,
    width: graphWidth,
    height: graphHeight,
    template,
    created: mapId,
  });
  console.log(stats);
}

const regenerateMap = debounce(function () {
  console.warn('Generate new random map');
  closeDialogs('#worldConfigurator, #options3d');
  customization = 0;
  undraw();
  resetZoom(1000);
  generate();
  restoreLayers();

  if (ThreeD().options.isOn) {
    ThreeD().redraw();
  }

  if ($('#worldConfigurator').is(':visible')) {
    editWorld();
  }
}, 500);

// clear the map
function undraw() {
  viewbox
    .selectAll(
      'path, circle, polygon, line, text, use, #zones > g, #armies > g, #ruler > g'
    )
    .remove();
  defs.selectAll('path, clipPath').remove();
  notes = [];
  unfog();
}
