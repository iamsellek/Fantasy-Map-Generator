export interface Options {
  isOn: boolean;
  isGlobe: boolean;
  scale: number;
  lightness: number;
  shadow: number;
  sun: ThreeDPosition;
  rotateMesh: number;
  rotateGlobe: number;
  skyColor: string;
  waterColor: string;
  extendedWater: boolean;
  resolution: number;
}

export interface ThreeDPosition {
  x: number;
  y: number;
  z: number;
}

export type ViewType = 'viewMesh' | 'viewGlobe';

export type Canvas = HTMLCanvasElement | OffscreenCanvas;
