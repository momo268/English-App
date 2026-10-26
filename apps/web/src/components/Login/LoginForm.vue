<template>
  <div class="mb-8">
    <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-700">
      Welcome Back
    </p>
    <h1 class="text-3xl font-semibold tracking-tight text-zinc-950">欢迎回来</h1>
    <p class="mt-2 text-sm text-zinc-500">请登录您的账户以继续</p>
  </div>

  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    class="space-y-6"
    @keyup.enter="handleLogin"
  >
    <el-form-item prop="phone">
      <el-input
        :maxlength="11"
        v-model="form.phone"
        placeholder="请输入手机号"
        size="large"
        class="h-12"
        :prefix-icon="User"
      />
    </el-form-item>

    <el-form-item prop="password">
      <el-input
        v-model="form.password"
        type="password"
        placeholder="请输入密码"
        size="large"
        class="h-12"
        :prefix-icon="Lock"
        show-password
      />
    </el-form-item>

    <el-form-item class="pt-4">
      <el-button
        type="primary"
        size="large"
        :loading="loading"
        class="btn-ink h-12 w-full text-base font-semibold"
        @click="handleLogin"
      >
        登录
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, toRaw } from "vue";
import { User, Lock } from "@element-plus/icons-vue";
import { login } from "@/apis/user"; //登录的接口
import type { UserLogin } from "@en/common/user"; //登录类型
import md5 from "md5"; //md5加密
import type { FormInstance } from "element-plus";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/user";
import { useLogin } from "@/hooks/useLogin";
const { onLoginSuccess } = useLogin();
const formRef = useTemplateRef<FormInstance>("formRef");
const userStore = useUserStore();
const loading = ref<boolean>(false);
const form = ref<UserLogin>({
  phone: "",
  password: "",
});

const rules = {
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号",
      trigger: "blur",
    },
  ],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

const handleLogin = async () => {
  if (loading.value) return;
  loading.value = true;
  try {
    await formRef.value?.validate();
    const res = await login({
      ...toRaw(form.value),
      password: toRaw(md5(form.value.password)),
    });
    if (res.code === 1) {
      userStore.setUser(res.data);
      ElMessage.success("登录成功");
      onLoginSuccess();
    } else {
      ElMessage.error(res.message);
    }
  } finally {
    loading.value = false;
  }
};
</script>
