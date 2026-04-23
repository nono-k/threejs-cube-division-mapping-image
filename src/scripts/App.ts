import * as THREE from 'three';
import { PerspectiveCamera, Controls } from './core/Camera';
import { Three } from './core/Three';
import { Gui } from './Gui';

import vertex from './shaders/vertex.glsl?raw';
import fragment from './shaders/fragment.glsl?raw';

import orange from '../images/orange.jpg';
import apple from '../images/apple.jpg';
import grape from '../images/grape.jpg';
import remon from '../images/remon.jpg';
import watermelon from '../images/watermelon.jpg';
import kiwi from '../images/kiwi.jpg';

export class App extends Three {
  private readonly camera: PerspectiveCamera;
  private mesh!: THREE.InstancedMesh;
  private textures!: THREE.Texture[];

  private readonly divisions = 3;
  private readonly faceCount = 6;
  private readonly totalCount = this.divisions * this.divisions * this.faceCount;
  private cubeSize: number;
  private gap: number;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    this.camera = new PerspectiveCamera();
    new Controls(this.renderer, this.camera);

    this.cubeSize = 1;
    this.gap = 0.05;

    this.loader().then(() => {
      this.createGeometry();
      this.setGui();
      this.hoverEvent();

      window.addEventListener('resize', this.resize.bind(this));
      this.renderer.setAnimationLoop(this.animate.bind(this));
    });
  }

  private async loader() {
    const loader = new THREE.TextureLoader();
    this.textures = await Promise.all([
      loader.loadAsync(orange),
      loader.loadAsync(apple),
      loader.loadAsync(grape),
      loader.loadAsync(remon),
      loader.loadAsync(watermelon),
      loader.loadAsync(kiwi),
    ]);
  }

  private createGeometry() {
    const size = this.cubeSize;
    const gap = this.gap;
    const cell = size / this.divisions;

    const geometry = new THREE.PlaneGeometry(cell - gap, cell - gap);

    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      side: THREE.DoubleSide,
      uniforms: {
        uTextures: { value: this.textures },
        uActiveTex: { value: -1 },
      }
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, this.totalCount);

    const all = new THREE.Object3D();

    let i = 0;

    const rightVec = new THREE.Vector3();
    const upVec = new THREE.Vector3();
    const normal = new THREE.Vector3();

    for (let face = 0; face < this.faceCount; face++) {
      for (let y = 0; y < this.divisions; y++) {
        for (let x = 0; x < this.divisions; x++) {

          const px = (x - 1) * cell;
          const py = (1 - y) * cell;

          // 面ごとの基底ベクトル定義
          switch (face) {
            case 0: // front
              rightVec.set(1, 0, 0);
              upVec.set(0, 1, 0);
              normal.set(0, 0, 1);
              break;

            case 1: // back
              rightVec.set(-1, 0, 0);
              upVec.set(0, 1, 0);
              normal.set(0, 0, -1);
              break;

            case 2: // right
              rightVec.set(0, 0, -1);
              upVec.set(0, 1, 0);
              normal.set(1, 0, 0);
              break;

            case 3: // left
              rightVec.set(0, 0, 1);
              upVec.set(0, 1, 0);
              normal.set(-1, 0, 0);
              break;

            case 4: // top
              rightVec.set(1, 0, 0);
              upVec.set(0, 0, -1);
              normal.set(0, 1, 0);
              break;

            case 5: // bottom
              rightVec.set(1, 0, 0);
              upVec.set(0, 0, 1);
              normal.set(0, -1, 0);
              break;
          }

          // 最終位置
          const position = new THREE.Vector3()
            .addScaledVector(rightVec, px)
            .addScaledVector(upVec, py)
            .addScaledVector(normal, size / 2);

          all.position.copy(position);

          // 回転（normalに向ける）
          all.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            normal
          );

          all.updateMatrix();
          this.mesh.setMatrixAt(i, all.matrix);

          i++;
        }
      }
    }

    const texIndices = new Float32Array(this.totalCount);

    for (let i = 0; i < this.totalCount; i++) {
      texIndices[i] = i % 6;
    }

    this.mesh.geometry.setAttribute('aTexIndex', new THREE.InstancedBufferAttribute(texIndices, 1));

    this.scene.add(this.mesh);
  }

  hoverEvent() {
    const map = {
      apple: 0,
      orange: 1,
      grape: 2,
      remon: 3,
      watermelon: 4,
      kiwi: 5,
    }

    const links = document.querySelectorAll('.links a');

    links.forEach(link => {
      const meshMaterial = this.mesh.material as THREE.ShaderMaterial;

      link.addEventListener('mouseenter', () => {
        const slug = link.getAttribute('data-slug')! as keyof typeof map;
        if (meshMaterial.uniforms.uActiveTex) {
          meshMaterial.uniforms.uActiveTex.value = map[slug!];
        }
      });

      link.addEventListener('mouseleave', () => {
        if (meshMaterial.uniforms.uActiveTex) {
          meshMaterial.uniforms.uActiveTex.value = -1;
        }
      });
    });
  }

  private setGui() {
    const PARAMS = {
      size: this.cubeSize,
      gap: this.gap,
    };

    const pane = new Gui();
    pane.addBinding(PARAMS, 'size', { min: 0, max: 2 });
    pane.addBinding(PARAMS, 'gap', { min: 0, max: 1 });

    pane.on('change', () => {
      this.cubeSize = PARAMS.size;
      this.gap = PARAMS.gap;
    });
  }

  private animate() {
    const delta = this.clock.getDelta();

    // this.mesh.rotation.x += delta * 0.5;
    // this.mesh.rotation.y += delta * 0.5;

    this.renderer.render(this.scene, this.camera);
  }

  private resize() {
    this.camera.update();
  }
}

const app = new App(document.getElementById('webgl') as HTMLCanvasElement);

window.addEventListener('beforeunload', () => {
  app.dispose();
});