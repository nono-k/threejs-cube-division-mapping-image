import * as THREE from 'three';
import { PerspectiveCamera, Controls } from './core/Camera';
import { Three } from './core/Three';
import gsap from 'gsap';

import vertex from './shaders/vertex.glsl?raw';
import fragment from './shaders/fragment.glsl?raw';

import orange from '../images/orange.jpg';
import apple from '../images/apple.jpg';
import grape from '../images/grape.jpg';
import remon from '../images/remon.jpg';
import watermelon from '../images/watermelon.jpg';
import kiwi from '../images/kiwi.jpg';

type FruitKey =
  | 'apple'
  | 'orange'
  | 'grape'
  | 'remon'
  | 'watermelon'
  | 'kiwi';

type FaceConfig = {
  right: [number, number, number];
  up: [number, number, number];
  normal: [number, number, number];
};

export class App extends Three {
  private readonly camera: PerspectiveCamera;
  private mesh!: THREE.InstancedMesh;
  private textures!: THREE.Texture[];

  private readonly divisions = 3;
  private readonly cubeSize = 1.2;
  private readonly gap = 0.05;
  private readonly faceCount = 6;
  private readonly totalCount = this.divisions * this.divisions * this.faceCount;

  private progressTween: gsap.core.Tween | null = null;
  private activeTex = -1;

  private readonly intro = {
    rotationSpeed: 0,
    done: false,
  };

  private readonly textureMap: Record<FruitKey, number> = {
    apple: 0,
    orange: 1,
    grape: 2,
    remon: 3,
    watermelon: 4,
    kiwi: 5,
  };

  private readonly faceConfigs: FaceConfig[] = [
    // front
    {
      right: [1, 0, 0],
      up: [0, 1, 0],
      normal: [0, 0, 1],
    },
    // back
    {
      right: [-1, 0, 0],
      up: [0, 1, 0],
      normal: [0, 0, -1],
    },
    // right
    {
      right: [0, 0, -1],
      up: [0, 1, 0],
      normal: [1, 0, 0],
    },
    // left
    {
      right: [0, 0, 1],
      up: [0, 1, 0],
      normal: [-1, 0, 0],
    },
    // top
    {
      right: [1, 0, 0],
      up: [0, 0, -1],
      normal: [0, 1, 0],
    },
    // bottom
    {
      right: [1, 0, 0],
      up: [0, 0, 1],
      normal: [0, -1, 0],
    },
  ];

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    this.camera = new PerspectiveCamera();
    new Controls(this.renderer, this.camera);

    this.init();
  }

  private async init() {
    await this.loadTextures();

    this.createGeometry();
    this.introAnimation();
    this.setupHoverEvent();

    this.renderer.setAnimationLoop(this.animate.bind(this));
    window.addEventListener('resize', this.resize.bind(this));
  }

  private async loadTextures() {
    const loader = new THREE.TextureLoader();
    this.textures = await Promise.all([
      loader.loadAsync(apple),
      loader.loadAsync(orange),
      loader.loadAsync(grape),
      loader.loadAsync(remon),
      loader.loadAsync(watermelon),
      loader.loadAsync(kiwi),
    ]);
  }

  private createGeometry() {
    const cell = this.cubeSize / this.divisions;

    const geometry = new THREE.PlaneGeometry(
      cell - this.gap,
      cell - this.gap,
    );

    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      side: THREE.DoubleSide,
      uniforms: {
        uTextures: { value: this.textures },
        uActiveTex: { value: -1 },
        uProgress: { value: 0 },
      }
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, this.totalCount);

    this.setInstanceMatrices(cell);
    this.setTextureIndices();

    this.scene.add(this.mesh);
  }

  private setInstanceMatrices(cell: number) {
    const dummy = new THREE.Object3D();
    const baseNormal = new THREE.Vector3(0, 0, 1);

    let index = 0;

    this.faceConfigs.forEach((face) => {
      const right = new THREE.Vector3(...face.right);
      const up = new THREE.Vector3(...face.up);
      const normal = new THREE.Vector3(...face.normal);

      for (let y = 0; y < this.divisions; y++) {
        for (let x = 0; x < this.divisions; x++) {
          const px = (x - 1) * cell;
          const py = (1 - y) * cell;

          const position = new THREE.Vector3()
            .addScaledVector(right, px)
            .addScaledVector(up, py)
            .addScaledVector(normal, this.cubeSize / 2);

          dummy.position.copy(position);
          dummy.quaternion.setFromUnitVectors(baseNormal, normal);
          dummy.updateMatrix();

          this.mesh.setMatrixAt(index, dummy.matrix);
          index++;
        }
      }
    })
  }

  private setTextureIndices() {
    const texIndices = new Float32Array(this.totalCount);

    for (let i = 0; i < this.totalCount; i++) {
      texIndices[i] = i % this.faceCount;
    }

    this.mesh.geometry.setAttribute(
      'aTexIndex',
      new THREE.InstancedBufferAttribute(texIndices, 1)
    );
  }

  introAnimation() {
    this.mesh.scale.set(0, 0, 0);
    this.mesh.rotation.y = -Math.PI / 4;
    this.mesh.rotation.z = -Math.PI / 6;

    gsap.to(this.mesh.scale, {
      x: 1, y: 1, z: 1,
      duration: 1.2,
      ease: 'back.out(1.7)',
    });

    gsap.timeline()
      .to(this.intro, {
        rotationSpeed: 4.0, // 加速
        duration: 0.6,
        ease: 'power3.in'
      })
      .to(this.intro, {
        rotationSpeed: 0.8, // 減速して通常へ
        duration: 1.0,
        ease: 'power3.out',
        onComplete: () => {
          this.intro.done = true;
        }
      });
  }

  private setupHoverEvent() {
    const links = document.querySelectorAll('.links a');
    const material = this.mesh.material as THREE.ShaderMaterial;

    links.forEach(link => {

      link.addEventListener('mouseenter', () => {
        const slug = link.getAttribute('data-slug') as FruitKey;
        const next = this.textureMap[slug];

        this.handleHoverEvent(material, next);
      });

      link.addEventListener('mouseleave', () => {
        this.handleHoverLeave(material);
      });
    });
  }

  private handleHoverEvent(
    material: THREE.ShaderMaterial,
    next: number
  ) {
    this.activeTex = next;
    this.progressTween?.kill();

    material.uniforms.uActiveTex!.value = this.activeTex;

    this.progressTween = gsap.to(material.uniforms.uProgress!, {
      value: 1,
      duration: 0.45,
      ease: 'power2.out',
    });

    gsap.to(this.mesh.scale, {
      x: 1.25, y: 1.25, z: 1.25,
      duration: 0.45,
      ease: 'power2.out',
    });
  }

  private handleHoverLeave(material: THREE.ShaderMaterial) {
    this.progressTween?.kill();

    gsap.to(material.uniforms.uProgress!, {
      value: 0,
      duration: 0.45,
      ease: 'power2.out',
    });

    gsap.to(this.mesh.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.45,
      ease: 'power2.out',
    });
  }

  private animate() {
    const delta = this.clock.getDelta();

    // イントロ中：加速回転
    if (!this.intro.done) {
      this.mesh.rotation.x += delta * this.intro.rotationSpeed * 0.8;
      this.mesh.rotation.y += delta * this.intro.rotationSpeed * 1.2;
    } else {
      // 通常状態
      this.mesh.rotation.x += delta * 0.5;
      this.mesh.rotation.y += delta * 0.5;
    }

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