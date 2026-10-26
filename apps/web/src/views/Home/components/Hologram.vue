<template>
  <canvas ref="hologramRef"></canvas>
</template>

<script setup lang="ts">
import * as THREE from "three";
import { useTemplateRef, onMounted, onUnmounted } from "vue";
import { disposeModel } from "@/utils/disposeModel";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"; //gltf模型加载器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"; //轨道控制器

const hologramRef = useTemplateRef<HTMLCanvasElement>("hologramRef");
let disposed = false;
let cleanup = () => {};

const initThree = () => {
  // 创建场景 - > 模型 + 相机 + 渲染器 + 灯光（可选 ）
  const scene = new THREE.Scene();
  // 动画混合器
  let mixer: THREE.AnimationMixer | null = null;
  const clock = new THREE.Clock(); // 创建时钟
  // 创建相机
  const camera = new THREE.PerspectiveCamera(75, 500 / 250, 0.1, 1000);
  camera.position.set(0, 0, 10);
  const loader = new GLTFLoader();
  loader.load("/models/hologram/scene.gltf", (gltf) => {
    if (disposed) {
      disposeModel(gltf.scene);
      return;
    }
    scene.add(gltf.scene); //添加模型到场景
    gltf.scene.scale.set(4, 4, 4);
    // 模型自带的 HoloFillDark 是一层接近黑色的半透明填充，
    // 放在深色背景上会把整体压暗；这里只降低这层填充的浓度。
    gltf.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      materials.forEach((material) => {
        if (material.name !== "HoloFillDark") return;
        material.transparent = true;
        material.opacity = 0.18;
        material.depthWrite = false;
        material.needsUpdate = true;
      });
    });
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(gltf.scene);
      gltf.animations.forEach((clip) => {
        const action = mixer!.clipAction(clip);
        action.play();
      });
    }
  });
  // 环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);
  //平行光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);
  // 创建渲染器
  const renderer = new THREE.WebGLRenderer({
    canvas: hologramRef.value!,
    antialias: true, // 开启抗锯齿
    alpha: true, // 透明背景
    precision: "highp", // 高精度
    powerPreference: "high-performance", // 高性能
  });
  renderer.setSize(500, 250); // 设置渲染尺寸
  // 创建轨道控制器
  const controls = new OrbitControls(camera, renderer.domElement);
  let animationId = 0;
  const animate = () => {
    animationId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    controls.update(); // 更新轨道控制器
    renderer.render(scene, camera); // 渲染场景
  };
  cleanup = () => {
    cancelAnimationFrame(animationId);
    mixer?.stopAllAction();
    controls.dispose();
    disposeModel(scene);
    scene.clear();
    renderer.dispose();
  };
  animate();
};

onMounted(() => {
  initThree();
});
onUnmounted(() => {
  disposed = true;
  cleanup();
});
</script>
