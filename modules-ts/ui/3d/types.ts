interface Options {
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

interface ThreeDPosition {
  x: number;
  y: number;
  z: number;
}

type ViewType = 'viewMesh' | 'viewGlobe';

type Canvas = HTMLCanvasElement | OffscreenCanvas;
