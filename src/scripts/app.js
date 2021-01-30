import 'styles/index.css';
import Stats from 'stats.js';
import chroma from 'chroma-js';

import {
  radians,
  hexToRgbTreeJs,
  rgbToHex,
} from './helpers';

export default class App {
  init() {
    this.setup();
    this.createScene();
    this.createCamera();
    this.addGrid();
    this.addFloor();
    this.addCameraControls();
    this.addAmbientLight();
    this.addDirectionalLight();

    this.addBoxes();
    this.centerBoxes();
    this.startAnimations();
    this.animate();
  }

  setup() {
    this.container = new THREE.Object3D();
    this.dividers = [];
    this.meshes = [];
    this.animatedMeshes = [];
    this.totalMeshes = 30;
    this.easing = Elastic.easeOut.config(2, 0.5);
    this.colorsGradient = {
      firstColor: '#e80b75',
      secondColor: '#15dd00',
      steps: 30,
    };

    this.stats = new Stats();
    this.stats.showPanel(0);

    document.body.appendChild(this.stats.dom);

    this.backgroundColor = rgbToHex(window.getComputedStyle(document.body).backgroundColor);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.gui = new dat.GUI();
    this.gui.closed = false;
    this.gui.open();
    this.gui.show();

    this.colors = chroma.scale([this.colorsGradient.firstColor, this.colorsGradient.secondColor])
      .mode('lch')
      .colors(this.colorsGradient.steps);


    const gui = this.gui.addFolder('Background');
    gui.open();
    gui.addColor(this, 'backgroundColor').onChange((color) => {
      document.body.style.backgroundColor = color;
    });

    const guiTotalElements = this.gui.addFolder('Items');
    guiTotalElements.open();
    const guiGradient = this.gui.addFolder('Gradient');
    guiGradient.open();

    guiGradient.addColor(this.colorsGradient, 'firstColor').onChange((color) => {
      this.colorsGradient.firstColor = color;

      this.updateColors();
    });

    guiGradient.addColor(this.colorsGradient, 'secondColor').onChange((color) => {
      this.colorsGradient.secondColor = color;

      this.updateColors();
    });

    this.updateGradientsSteps();

    this.stepsController = guiGradient.add(this.colorsGradient, 'steps', this.dividers);
    this.stepsController.onChange((steps) => {
      this.colorsGradient.steps = Math.floor(steps);

      this.updateColors();
    });

    guiTotalElements.add(this, 'totalMeshes', 20, 48, 2)
    .onFinishChange(() => {
      this.startAnimations();
    })
    .onChange((total) => {
      this.totalMeshes = total;

      this.removeBoxes();
      this.addBoxes();
      this.centerBoxes();

      this.updateGradientsSteps();

      this.stepsController.remove();
      this.stepsController = guiGradient.add(this.colorsGradient, 'steps', this.dividers);
      this.stepsController.setValue(this.dividers[2]);
      this.stepsController.onChange((steps) => {
        this.colorsGradient.steps = Math.floor(steps);

        this.updateColors();
      });

      this.updateColors();
    });

    window.addEventListener('resize', this.onResize.bind(this), { passive: true });
  }

  updateGradientsSteps() {
    const total = this.totalMeshes;
    this.dividers = [];

    for (let index = 0; index <= total; index++) {
      if (total % index === 0) {
        this.dividers.push(index);
      }
    }
  }

  updateColors() {
    this.colors = chroma.scale([this.colorsGradient.firstColor, this.colorsGradient.secondColor])
      .mode('lch')
      .colors(this.colorsGradient.steps);

    let colorIndex = -1;

    for (let index = 0; index < this.totalMeshes; index++) {
      const boxMesh = this.meshes[index];
      index % (Math.round(this.totalMeshes / this.colorsGradient.steps)) === 0 ? colorIndex++ : colorIndex;

      boxMesh.material.color = hexToRgbTreeJs(this.colors[colorIndex]);
    }
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(this.renderer.domElement);
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.set(-12, 12, 12);

    this.scene.add(this.camera);
  }

  addAmbientLight() {
    const obj = { color: '#ffffff' };
    const light = new THREE.AmbientLight(obj.color, 1);

    this.scene.add(light);
  }

  addDirectionalLight() {
    this.directionalLight = new THREE.DirectionalLight(0xffffff);
    this.directionalLight.castShadow = true;
    this.directionalLight.position.set(0, 35, 0);

    this.directionalLight.shadow.camera.far = 50;

    this.directionalLight.shadow.camera.left = -5;
    this.directionalLight.shadow.camera.right = 5;
    this.directionalLight.shadow.camera.top = 5;
    this.directionalLight.shadow.camera.bottom = -5;
    this.directionalLight.shadow.camera.zoom = 1;
    this.directionalLight.shadow.camera.needsUpdate = true;

    const targetObject = new THREE.Object3D();
    targetObject.position.set(0, 0, 0);
    this.directionalLight.target = targetObject;

    this.scene.add(this.directionalLight);
    this.scene.add(this.directionalLight.target);
  }

  addGrid() {
    const size = 50;
    const divisions = 75;
    const gridHelper = new THREE.GridHelper(size, divisions);

    gridHelper.position.set(0, 0, 0);
    gridHelper.material.opacity = 0;
    gridHelper.material.transparent = false;

    this.scene.add(gridHelper);
  }

  addCameraControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = radians(70);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = .04;

    document.body.style.cursor = '-moz-grabg';
    document.body.style.cursor = '-webkit-grab';

    this.controls.addEventListener('start', () => {
      requestAnimationFrame(() => {
        document.body.style.cursor = '-moz-grabbing';
        document.body.style.cursor = '-webkit-grabbing';
      });
    });

    this.controls.addEventListener('end', () => {
      requestAnimationFrame(() => {
        document.body.style.cursor = '-moz-grab';
        document.body.style.cursor = '-webkit-grab';
      });
    });
  }

  addFloor() {
    const planeGeometry = new THREE.PlaneBufferGeometry(500, 500);

    const shadowMaterial = new THREE.ShadowMaterial({ opacity: .3 });
    this.shadowFloor = new THREE.Mesh(planeGeometry, shadowMaterial);
    this.shadowFloor.rotateX(- Math.PI / 2);
    this.shadowFloor.position.y = .1;
    this.shadowFloor.receiveShadow = true;

    this.scene.add(this.shadowFloor);
  }

  getBoxMesh() {
    const geoParams = {
      width: 1,
      height: 1,
      depth: .1,
    };

    const geometry = new THREE.BoxGeometry(geoParams.width, geoParams.height, geoParams.depth);

    const matParams = {
      specular: 0x111111,
      shininess: 100,
      emissive: 0x0,
    };

    const material = new THREE.MeshPhongMaterial(matParams);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 1, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  removeBoxes() {
    while (this.container.children.length) {
      gsap.killTweensOf(this.container.children[0].rotation);
      this.container.remove(this.container.children[0]);
    }
  }

  addBoxes() {
    this.meshes = [];
    this.animatedMeshes = [];

    for (let index = 0; index < this.totalMeshes; index++) {
      const boxMesh = this.getBoxMesh();
      boxMesh.position.z = -(index * .1);
      this.meshes[index] = boxMesh;
      this.animatedMeshes[index] = boxMesh;

      this.container.add(boxMesh);
    }

    this.scene.add(this.container);

    this.updateColors();
  }

  addMirror() {
    const geometry = new THREE.PlaneBufferGeometry(5, 2);
    const mirror = new THREE.Reflector(geometry, {
      clipBias: 0,
      textureWidth: window.innerWidth * window.devicePixelRatio,
      textureHeight: window.innerHeight * window.devicePixelRatio,
    });

    mirror.position.set(2, 1, 0);
    mirror.rotateY( - Math.PI / 2 );

    this.scene.add(mirror);
  }

  centerBoxes() {
    this.container.position.z = this.container.children.length * .05;
  }

  startAnimations() {
    this.animatedMeshes.forEach((mesh, index) => {
      gsap.to(mesh.rotation, 2, {
        onComplete: (index) => {
          if (index === this.animatedMeshes.length - 1) {
            this.reverseAnimations();
          }

        },
        onCompleteParams: [index],
        z: radians(-90),
        delay: (index * .05),
        ease: this.easing,
      });
    });
  }

  reverseAnimations() {
    this.animatedMeshes.reverse();
    this.animatedMeshes.forEach((mesh, index) => {
      gsap.to(mesh.rotation, 2, {
        onComplete: (index) => {
          if (index === this.animatedMeshes.length - 1) {
            this.animatedMeshes.reverse();
            this.startAnimations();
          }
        },
        onCompleteParams: [index],
        z: radians(0),
        delay: (index * .05),
        ease: this.easing,
      });
    });
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  animate() {
    this.stats.begin();

    this.controls.update();

    this.renderer.render(this.scene, this.camera);

    this.stats.end();

    requestAnimationFrame(this.animate.bind(this));
  }
}
