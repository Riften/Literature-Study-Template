# 3D 可视化使用说明

本 Workspace 用 [three.js](https://threejs.org/) 作为 3D 可视化库，作为
普通 npm 依赖被管理（见 `package.json`），页面里直接用原生 ES Module
`import` 引入即可，不需要任何 importmap 配置。

## 何时使用

3D 可视化通常放在专题页面（`pages/topics/`）里，用来直观展示：注意力
权重矩阵、embedding 空间点云、模型结构示意、优化过程轨迹等适合空间化
展示的内容。详情页/总结页也可以嵌入 3D 可视化，用法完全一样。

## 用法：`createOrbitScene` 工具

`src/viz/create-orbit-scene.js` 封装了每个 3D 场景都要重复写的样板代码
（相机、灯光、`OrbitControls`、resize 监听、渲染循环），页面里只需要
关心"具体要画什么"：

```html
<div class="viz3d-container" id="my-viz3d">
  <span class="viz3d-hint">拖拽旋转 · 滚轮缩放</span>
</div>
<p class="viz3d-caption">图：对某个结果的说明文字。</p>

<script type="module">
  import * as THREE from "three";
  import { createOrbitScene } from "../../src/viz/create-orbit-scene.js";

  function initScene() {
    var container = document.getElementById("my-viz3d");
    if (!container) return;

    var { scene, start } = createOrbitScene(container, {
      cameraPosition: [6, 6, 10],   // 相机初始位置
      controlsTarget: [0, 0, 0],    // OrbitControls 注视点
    });

    // 页面自己的几何体/数据，属于"内容"，直接写在这里：
    var geometry = new THREE.IcosahedronGeometry(1.6, 1);
    var material = new THREE.MeshStandardMaterial({ color: 0x6fa2ff });
    scene.add(new THREE.Mesh(geometry, material));

    start(); // 启动渲染循环
  }

  initScene();
</script>
```

`createOrbitScene(container, options)` 返回
`{ scene, camera, renderer, controls, start, stop }`：

- `scene`：直接 `scene.add(mesh)` 把内容加进去；
- `camera` / `renderer` / `controls`：需要精细控制时可以直接访问；
- `start()`：启动 `requestAnimationFrame` 渲染循环（内部包含
  `controls.update()`）；
- `stop()`：停止渲染循环并移除 resize 监听（单页应用里切换/卸载场景时
  用得到，纯静态多页站点通常不需要调用）。

容器元素建议用 `.viz3d-container` class（在 `src/styles/main.css` 里
定义了固定高度/边框/深色背景），配合 `.viz3d-hint`（右上角操作提示）与
`.viz3d-caption`（图片说明文字）。

## 参考实现

`pages/topics/example-attention-3d.html` 是一个完整可跑的示例：把一个
合成的 8×8 自注意力权重矩阵渲染成彩色 3D 柱状图，可以直接参考它的结构
（数据生成 → 着色函数 → `createOrbitScene` → 往 scene 里加 Mesh）。

## 性能提示

- 单个场景里的 Mesh 数量控制在几百到一千左右比较流畅（示例的 8×8=64
  个柱子完全没有压力）；数据量更大时考虑用
  `THREE.InstancedMesh` 或把数据抽样/聚合后再展示；
- 页面里如果同时有多个 3D 场景，注意每个场景都会启动自己的渲染循环，
  数量多了会影响页面性能。
