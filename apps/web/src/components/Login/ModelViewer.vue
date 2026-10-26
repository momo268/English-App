<template>
  <div
    class="relative h-full w-[800px] bg-[#101312]"
  >
    <canvas class="w-full h-full" ref="canvasRef"></canvas>
    <div class="absolute top-6 left-6">
      <div class="flex items-center gap-2">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700"
        >
          <span class="text-white font-bold text-xl">E</span>
        </div>
        <span class="text-xl font-semibold tracking-tight text-white">English App</span>
      </div>
    </div>
    <!-- 登录/注册切换按钮 -->
    <div class="absolute top-6 right-6">
      <div
        class="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-1"
      >
        <button @click="loadModel('login')" :class="loginClass">登录</button>
        <button @click="loadModel('register')" :class="registerClass">
          注册
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, useTemplateRef } from "vue";
import { disposeModel } from "@/utils/disposeModel";
import * as THREE from "three";
import type { LoginType } from "./type";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"; //gltf模型加载器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"; //轨道控制器
const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef"); //获取canvas元素引用 渲染容器
const type = ref<LoginType>("login"); // 登录/注册类型
const loginClass = computed(() => {
  return type.value === "login"
    ? "rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-all"
    : "rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white";
});
const registerClass = computed(() => {
  return type.value === "register"
    ? "rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-all"
    : "rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white";
});
const emits = defineEmits(["changeType"]);
const scene = new THREE.Scene(); //创建场景
const clock = new THREE.Clock(); //创建时钟
let currentModel: THREE.Group | null = null; //记录当前的模型
let mixer: THREE.AnimationMixer | null = null; //记录当前的动画混合器
let renderer: THREE.WebGLRenderer | null = null;
let controls: OrbitControls | null = null;
let animationId = 0;
let loadId = 0;

const clearModel = () => {
  if (!currentModel) return;
  mixer?.stopAllAction();
  mixer?.uncacheRoot(currentModel);
  mixer = null;
  scene.remove(currentModel);
  disposeModel(currentModel);
  currentModel = null;
};

const loadModel = (url: LoginType) => {
  clearModel();
  const id = ++loadId;
  const loader = new GLTFLoader();
  type.value = url;
  loader.load(`/models/${url}/scene.gltf`, (gltf) => {
    // 快速切换登录/注册或关闭弹窗后，丢弃已经过期的加载结果。
    if (id !== loadId) {
      disposeModel(gltf.scene);
      return;
    }
    currentModel = gltf.scene;
    scene.add(currentModel);
    scene.position.y = -0.8;
    currentModel.scale.set(0.8, 0.8, 0.8);
    if (url === "register" && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(currentModel);
      gltf.animations.forEach((animation) => mixer!.clipAction(animation).play());
    }
  });
  emits("changeType", url); // 通知父组件切换类型
};

const initThree = () => {
  const width = canvasRef.value!.clientWidth; //获取canvas宽度
  const height = canvasRef.value!.clientHeight; //获取canvas高度
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000); //创建相机
  camera.position.set(1, 0.5, 1); //设置相机位置
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value!, //渲染容器
    antialias: true, //抗锯齿
    alpha: true, //透明背景
    precision: "highp", //高精度
    powerPreference: "high-performance", //高性能
  });
  loadModel(type.value);
  renderer.setSize(width, height); //设置渲染器大小
  renderer.render(scene, camera); //渲染场景
  controls = new OrbitControls(camera, renderer.domElement); //创建轨道控制器
  const animate = () => {
    animationId = requestAnimationFrame(animate);
    if (mixer) {
      mixer.update(clock.getDelta());
    }
    scene.rotation.y += 0.002; //旋转场景
    controls?.update(); //更新轨道控制器
    renderer?.render(scene, camera); //渲染场景
  };
  animate();
};

onMounted(() => {
  initThree();
});
onUnmounted(() => {
  loadId += 1;
  cancelAnimationFrame(animationId);
  controls?.dispose();
  clearModel();
  renderer?.dispose();
  controls = null;
  renderer = null;
});
</script>
