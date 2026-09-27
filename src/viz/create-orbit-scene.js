// src/viz/create-orbit-scene.js
//
// three.js 场景初始化工具：封装相机/灯光/OrbitControls/resize 监听/渲染
// 循环等每个 3D 专题页面都要重复写的样板代码。页面里只需要：
//
//   import * as THREE from 'three';
//   import { createOrbitScene } from '../../src/viz/create-orbit-scene.js';
//   const { scene, camera, renderer, start } = createOrbitScene(container, {
//     cameraPosition: [7, 8, 11],
//     controlsTarget: [4, 0, 4],
//   });
//   scene.add(...);  // 页面自己的几何体/数据，属于"内容"，不封装在这里
//   start();

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * @param {HTMLElement} container 承载 canvas 的容器元素（建议使用
 *   `.viz3d-container` class 以获得统一的边框/圆角/尺寸样式）。
 * @param {object} [options]
 * @param {[number, number, number]} [options.cameraPosition] 相机初始位置。
 * @param {[number, number, number]} [options.controlsTarget] OrbitControls 的
 *   注视目标点。
 * @param {number} [options.backgroundColor] 场景背景色（十六进制）。
 * @param {boolean} [options.addDefaultLights] 是否自动添加一组默认光源
 *   （环境光 + 方向光），默认 true。
 * @returns {{scene: THREE.Scene, camera: THREE.PerspectiveCamera,
 *   renderer: THREE.WebGLRenderer, controls: OrbitControls, start: () => void,
 *   stop: () => void}}
 */
export function createOrbitScene(container, options = {}) {
  const {
    cameraPosition = [6, 6, 10],
    controlsTarget = [0, 0, 0],
    backgroundColor = 0x05070a,
    addDefaultLights = true,
  } = options;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(...cameraPosition);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(...controlsTarget);
  controls.update();

  if (addDefaultLights) {
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(6, 10, 4);
    scene.add(dir);
  }

  const handleResize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', handleResize);

  let rafId = null;
  const tick = () => {
    rafId = requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, camera);
  };

  return {
    scene,
    camera,
    renderer,
    controls,
    start() {
      if (rafId === null) tick();
    },
    stop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      window.removeEventListener('resize', handleResize);
    },
  };
}
