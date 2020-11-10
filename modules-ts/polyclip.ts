// lineclip by mourner, https://github.com/mapbox/lineclip
// Cohen-Sutherland line clippign algorithm, adapted to efficiently
// handle polylines rather than just segments

type ArrNumNullArray = (number[] | null)[];

// Sutherland-Hodgeman polygon clipping algorithm
function polygonclip(
  points: TwoNumberArray[],
  bbox: number[],
  secure: number = 0
): TwoNumberArray[] {
  let result: TwoNumberArray[] = [];
  let edge: number;
  let prev: TwoNumberArray;
  let inside: boolean;
  let prevInside: boolean;
  let inter: boolean;
  let p: TwoNumberArray;

  // clip against each side of the clip rectangle
  for (edge = 1; edge <= 8; edge *= 2) {
    prev = points[points.length - 1];
    prevInside = !(bitCode(prev, bbox) & edge);

    for (let i = 0; i < points.length; i++) {
      p = points[i];
      inside = !(bitCode(p, bbox) & edge);
      inter = inside !== prevInside; // segment goes through the clip window

      const pi = intersect(prev, p, edge, bbox);

      if (pi === null) {
        console.error('Could not find intersect.');

        continue;
      }

      if (inter) {
        result.push(pi); // add an intersection point
      }
      if (secure && inter) {
        result.push(pi, pi); // add additional intersection points to secure correct d3 curve
      }
      if (inside) {
        result.push(p); // add a point if it's inside
      }

      prev = p;
      prevInside = inside;
    }

    points = result;

    if (!points.length) {
      break;
    }
  }

  //result.forEach(p => debug.append("circle").attr("cx", p[0]).attr("cy", p[1]).attr("r", .6).attr("fill", "red"));
  return result;
}

// intersect a segment against one of the 4 lines that make up the bbox
function intersect(
  a: number[] | null,
  b: number[] | null,
  edge: number,
  bbox: number[]
): TwoNumberArray | null {
  if (!a || !b) {
    return null;
  }

  return edge & 8
    ? [a[0] + ((b[0] - a[0]) * (bbox[3] - a[1])) / (b[1] - a[1]), bbox[3]] // top
    : edge & 4
    ? [a[0] + ((b[0] - a[0]) * (bbox[1] - a[1])) / (b[1] - a[1]), bbox[1]] // bottom
    : edge & 2
    ? [bbox[2], a[1] + ((b[1] - a[1]) * (bbox[2] - a[0])) / (b[0] - a[0])] // right
    : edge & 1
    ? [bbox[0], a[1] + ((b[1] - a[1]) * (bbox[0] - a[0])) / (b[0] - a[0])] // left
    : null;
}

// bit code reflects the point position relative to the bbox:
//         left  mid  right
//    top  1001  1000  1010
//    mid  0001  0000  0010
// bottom  0101  0100  0110
function bitCode(p: number[] | null, bbox: number[]): number {
  let code = 0;

  if (!p) {
    return code;
  }

  if (p[0] < bbox[0]) {
    code |= 1; // left
  } else if (p[0] > bbox[2]) {
    code |= 2; // right
  }

  if (p[1] < bbox[1]) {
    code |= 4; // bottom
  } else if (p[1] > bbox[3]) {
    code |= 8; // top
  }

  return code;
}
