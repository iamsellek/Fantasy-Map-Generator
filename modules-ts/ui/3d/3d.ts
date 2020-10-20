import { Options, ViewType, Canvas } from './types';
import THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { IMG_SOURCE } from './constants';
import { Graph, Grid, MapCoordinates } from '../../../types';

export class ThreeD {
  // set default options
  options: Options = {
    isOn: false,
    isGlobe: false,
    scale: 50,
    lightness: 0.7,
    shadow: 0.5,
    sun: { x: 100, y: 600, z: 1000 },
    rotateMesh: 0,
    rotateGlobe: 0.5,
    skyColor: '#9ecef5',
    waterColor: '#466eab',
    extendedWater: false,
    resolution: 2,
  };

  // set variables
  Renderer?: THREE.WebGLRenderer;
  scene?: THREE.Scene;
  camera?: THREE.PerspectiveCamera;
  controls?: OrbitControls;
  animationFrame?: any;
  material?: THREE.MeshLambertMaterial | THREE.MeshBasicMaterial;
  texture?: THREE.Texture;
  geometry?: THREE.PlaneGeometry | THREE.SphereBufferGeometry;
  mesh?: THREE.Mesh;
  ambientLight?: THREE.AmbientLight;
  spotLight?: THREE.SpotLight;
  waterPlane?: THREE.PlaneGeometry;
  waterMaterial?: THREE.MeshBasicMaterial;
  waterMesh?: THREE.Mesh;
  graph: Graph;
  grid: Grid;
  mapCoordinates: MapCoordinates;

  // initiate 3d scene
  constructor(
    canvas: Canvas,
    svgWidth: number,
    graph: Graph,
    grid: Grid,
    mapCoordinates: MapCoordinates,
    type: ViewType = 'viewMesh'
  ) {
    this.options.isOn = true;
    this.options.isGlobe = type === 'viewGlobe';
    this.options.isGlobe
      ? this.newGlobe(canvas)
      : this.newMesh(canvas, svgWidth);

    // Globals
    this.graph = graph;
    this.grid = grid;
    this.mapCoordinates = mapCoordinates;
  }

  // redraw 3d scene
  redraw() {
    if (this.scene && this.mesh) {
      this.scene?.remove(this.mesh);
    }

    this.Renderer?.setSize(
      this.Renderer.domElement.width,
      this.Renderer.domElement.height
    );

    if (this.options.isGlobe) {
      this.updateGlobeTexure();
    } else {
      this.createMesh(this.grid.cellsX, this.grid.cellsY);
    }

    this.render();
  }

  // update 3d texture
  update() {
    if (this.options.isGlobe) {
      this.updateGlobeTexure();
    } else {
      this.update3dTexture();
    }
  }

  // try to clean the memory as much as possible
  stop() {
    cancelAnimationFrame(this.animationFrame);
    this.geometry?.dispose();
    this.material?.dispose();
    this.waterPlane?.dispose();
    this.waterMaterial?.dispose();

    this.Renderer?.renderLists.dispose(); // is it required?
    this.Renderer?.dispose();

    if (this.mesh) {
      this.scene?.remove(this.mesh);
    }

    if (this.spotLight) {
      this.scene?.remove(this.spotLight);
    }

    if (this.ambientLight) {
      this.scene?.remove(this.ambientLight);
    }

    if (this.waterMesh) {
      this.scene?.remove(this.waterMesh);
    }

    // not sure it's required
    this.Renderer = undefined;
    this.scene = undefined;
    this.controls = undefined;
    this.camera = undefined;
    this.material = undefined;
    this.texture = undefined;
    this.geometry = undefined;
    this.mesh = undefined;

    this.options.isOn = false;
  }

  setScale(scale: number) {
    this.options.scale = scale;

    // Some of these only exist on the PlaneGeometry type.
    if (this.geometry && this.geometry instanceof THREE.PlaneGeometry) {
      this.geometry.vertices.forEach((v, i) => (v.z = this.getMeshHeight(i)));
      this.geometry.verticesNeedUpdate = true;
      this.geometry.computeVertexNormals();
      this.render();
      this.geometry.verticesNeedUpdate = false;
    } else if (this.geometry) {
      /**
       * If it's not an instance of PlaneGeometry, it's an instance of
       * SphereBufferGeometry, which means we still need to do the
       * following.
       */
      this.geometry.computeVertexNormals();
      this.render();
    }
  }

  setLightness(intensity: number) {
    this.options.lightness = intensity;

    if (this.ambientLight) {
      this.ambientLight.intensity = intensity;
    }

    this.render();
  }

  setSun(x: number, y: number, z: number) {
    this.options.sun = { x, y, z };
    this.spotLight?.position.set(x, y, z);
    this.render();
  }

  setRotation(speed: number) {
    cancelAnimationFrame(this.animationFrame);

    if (this.options.isGlobe) {
      this.options.rotateGlobe = speed;
    } else {
      this.options.rotateMesh = speed;
    }

    if (this.controls) {
      this.controls.autoRotateSpeed = speed;
      this.controls.autoRotate = Boolean(this.controls.autoRotateSpeed);

      if (this.controls.autoRotate) {
        this.animate();
      }
    }
  }

  toggleSky() {
    if (this.options.extendedWater && this.scene) {
      this.scene.background = null;
      this.scene.fog = null;

      if (this.waterMesh) {
        this.scene.remove(this.waterMesh);
      }
    } else {
      this.extendWater();
    }

    this.options.extendedWater = !this.options.extendedWater;
    this.redraw();
  }

  setColors(sky: string, water: string) {
    this.options.skyColor = sky;

    if (this.scene) {
      this.scene.background = new THREE.Color(sky);

      if (this.scene.fog) {
        this.scene.fog.color = new THREE.Color(sky);
      }
    }

    this.options.waterColor = water;

    if (this.waterMaterial) {
      this.waterMaterial.color = new THREE.Color(water);
    }

    this.render();
  }

  setResolution(resolution: number) {
    this.options.resolution = resolution;
    this.update();
  }

  // download screenshot
  async saveScreenshot() {
    const URL = this.Renderer?.domElement.toDataURL('image/jpeg');
    const link = document.createElement('a');
    link.download = getFileName() + '.jpeg';
    link.href = URL ?? '';
    document.body.appendChild(link);
    link.click();
    tip(
      `Screenshot is saved. Open "Downloads" screen (CTRL + J) to check`,
      true,
      'success',
      7000
    );
    window.setTimeout(() => window.URL.revokeObjectURL(URL ?? ''), 5000);
  }

  // start 3d view and heightmap edit preview
  async newMesh(canvas: Canvas, svgWidth: number) {
    this.scene = new THREE.Scene();

    // light
    this.ambientLight = new THREE.AmbientLight(
      0xcccccc,
      this.options.lightness
    );
    this.scene.add(this.ambientLight);
    this.spotLight = new THREE.SpotLight(0xcccccc, 0.8, 2000, 0.8, 0, 0);
    this.spotLight.position.set(
      this.options.sun.x,
      this.options.sun.y,
      this.options.sun.z
    );
    this.spotLight.castShadow = true;
    this.scene.add(this.spotLight);
    // scene.add(new THREE.SpotLightHelper(spotLight));

    // Rendered
    this.Renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    });

    this.Renderer.setSize(canvas.width, canvas.height);
    this.Renderer.shadowMap.enabled = true;
    if (this.options.extendedWater) this.extendWater();
    this.createMesh(this.grid.cellsX, this.grid.cellsY);

    // camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      canvas.width / canvas.height,
      0.1,
      2000
    );
    this.camera.position.set(0, rn(svgWidth / 3.5), 500);

    // controls
    this.controls = await new OrbitControls(this.camera, canvas as HTMLElement);
    this.controls.enableKeys = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 1000;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.autoRotate = Boolean(this.options.rotateMesh);
    this.controls.autoRotateSpeed = this.options.rotateMesh;
    if (this.controls.autoRotate) this.animate();
    this.controls.addEventListener('change', this.render);

    return true;
  }

  // create a mesh from pixel data
  async createMesh(segmentsX: number, segmentsY: number) {
    const url = await getMapURL(
      'mesh',
      this.options.extendedWater ? 'noWater' : null
    );
    window.setTimeout(() => window.URL.revokeObjectURL(url), 3000);

    // set up texture
    if (this.texture) {
      this.texture.dispose();
    }

    this.texture = new THREE.TextureLoader().load(url, this.render);
    this.texture.needsUpdate = true;

    // set up material
    if (this.material) {
      this.material.dispose();
    }

    this.material = new THREE.MeshLambertMaterial();
    this.material.map = this.texture;
    this.material.transparent = true;

    // set up geometry
    if (this.geometry) {
      this.geometry.dispose();
    }

    this.geometry = new THREE.PlaneGeometry(
      this.graph.width,
      this.graph.height,
      segmentsX - 1,
      segmentsY - 1
    );
    this.geometry.vertices.forEach((v, i) => (v.z = this.getMeshHeight(i)));
    this.geometry.computeVertexNormals();

    // set up mesh and add to scene
    if (this.mesh) {
      this.scene?.remove(this.mesh);
    }

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene?.add(this.mesh);
  }

  getMeshHeight(i: number) {
    const h = this.grid.cells.h[i];

    return h < 20 ? 0 : ((h - 18) / 82) * this.options.scale;
  }

  extendWater() {
    this.waterPlane = new THREE.PlaneGeometry(
      this.graph.width * 10,
      this.graph.height * 10,
      1
    );
    this.waterMaterial = new THREE.MeshBasicMaterial({
      color: this.options.waterColor,
    });

    this.waterMesh = new THREE.Mesh(this.waterPlane, this.waterMaterial);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y -= 3;

    if (this.scene) {
      this.scene.background = new THREE.Color(this.options.skyColor);
      this.scene.fog = new THREE.Fog(this.scene.background, 500, 3000);
      this.scene.add(this.waterMesh);
    }
  }

  async update3dTexture() {
    if (this.texture) {
      this.texture.dispose();
    }

    const url = await getMapURL('mesh');
    window.setTimeout(() => window.URL.revokeObjectURL(url), 3000);
    this.texture = new THREE.TextureLoader().load(url, this.render);

    if (this.material) {
      this.material.map = this.texture;
    }
  }

  async newGlobe(canvas: Canvas) {
    // scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.TextureLoader().load(
      'https://i0.wp.com/azgaar.files.wordpress.com/2019/10/stars-1.png',
      this.render
    );

    // Renderer
    this.Renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.Renderer.setSize(canvas.width, canvas.height);

    // material
    if (this.material) this.material.dispose();
    this.material = new THREE.MeshBasicMaterial();
    this.updateGlobeTexure(true);

    // camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      canvas.width / canvas.height,
      0.1,
      1000
    ).translateZ(5);

    // controls
    this.controls = await new OrbitControls(
      this.camera,
      this.Renderer.domElement
    );
    this.controls.enableKeys = false;
    this.controls.minDistance = 1.8;
    this.controls.maxDistance = 10;
    this.controls.autoRotate = Boolean(this.options.rotateGlobe);
    this.controls.autoRotateSpeed = this.options.rotateGlobe;
    this.controls.addEventListener('change', this.render);

    return true;
  }

  async updateGlobeTexure(addMesh?: boolean) {
    const world = this.mapCoordinates.latT > 179; // define if map covers whole world

    // texture size
    const scale = this.options.resolution;
    const height = 512 * scale;
    const width = 1024 * scale;

    // calculate map size and offset position
    const mapHeight = rn((this.mapCoordinates.latT / 180) * height);
    const mapWidth = world
      ? mapHeight * 2
      : rn((this.graph.width / this.graph.height) * mapHeight);
    const dy = world ? 0 : ((90 - this.mapCoordinates.latN) / 180) * height;
    const dx = world ? 0 : mapWidth / 4;

    // draw map on canvas
    const ctx = document.createElement('canvas').getContext('2d');

    if (!ctx) {
      return;
    }

    ctx.canvas.width = width;
    ctx.canvas.height = height;

    // add cloud texture if map does not cover all the globe
    if (!world) {
      const img = new Image();
      img.onload = function () {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = IMG_SOURCE;
    }

    // fill canvas segment with map texture
    const img2 = new Image();

    img2.onload = () => {
      ctx.drawImage(img2, dx, dy, mapWidth, mapHeight);

      if (this.texture) {
        this.texture.dispose();
      }

      this.texture = new THREE.CanvasTexture(ctx.canvas);

      if (this.material) {
        this.material.map = this.texture;
      }

      if (addMesh) {
        this.addGlobe3dMesh();
      }
    };

    img2.src = await getMapURL('mesh', 'globe');
  }

  addGlobe3dMesh() {
    this.geometry = new THREE.SphereBufferGeometry(1, 64, 64);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene?.add(this.mesh);

    if (this.controls?.autoRotate) {
      this.animate();
    } else {
      this.render();
    }
  }

  // render 3d scene and camera, do only on controls change
  render() {
    if (this.scene && this.camera) {
      this.Renderer?.render(this.scene, this.camera);
    }
  }

  // animate 3d scene and camera
  animate() {
    this.animationFrame = requestAnimationFrame(this.animate);
    this.controls?.update();

    if (this.scene && this.camera) {
      this.Renderer?.render(this.scene, this.camera);
    }
  }

  getOrbitControls(domElement: HTMLElement) {
    if (this.camera) {
      this.controls = new OrbitControls(this.camera, domElement);

      return this.controls;
    }
  }
}
