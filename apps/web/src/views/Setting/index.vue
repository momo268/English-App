<template>
  <div class="mx-auto w-[1200px] max-w-full px-4 pb-20 pt-10">
    <header class="flex flex-wrap items-end justify-between gap-6 border-b border-zinc-200 pb-8">
      <div>
        <p
          class="text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-700"
        >
          Account Settings
        </p>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
          设置
        </h1>
        <p class="mt-2 text-sm leading-6 text-zinc-500">
          在这里修改你的个人信息、头像与每日学习提醒。
        </p>
      </div>

      <div class="flex gap-2">
        <el-button class="h-10 rounded-xl px-5" @click="init">重置</el-button>
        <el-button class="btn-ink h-10 px-5" @click="onSave">保存</el-button>
      </div>
    </header>

    <div class="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div class="space-y-4">
        <section class="rounded-2xl border border-zinc-200/80 bg-white p-6">
          <h2 class="text-sm font-semibold tracking-wide text-zinc-900">头像</h2>
          <p class="mt-1 text-xs leading-5 text-zinc-400">
            用于个人资料和评论展示。
          </p>

          <div class="mt-5 flex items-center gap-4">
            <img
              class="h-20 w-20 rounded-full border border-zinc-200 object-cover"
              :src="preViewUrl || avatar"
              loading="lazy"
              referrerpolicy="no-referrer"
            />

            <div class="flex flex-col items-start gap-2">
              <el-upload
                :show-file-list="false"
                :auto-upload="false"
                accept="image/*"
                :on-change="onAvatarSelect"
              >
                <el-button class="btn-ink h-9 px-4">选择头像</el-button>
              </el-upload>

              <div class="text-xs leading-5 text-zinc-400">
                支持 png / jpg / webp，建议小于 2MB
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-zinc-200/80 bg-white p-6">
          <h2 class="text-sm font-semibold tracking-wide text-zinc-900">账号</h2>
          <p class="mt-1 text-xs leading-5 text-zinc-400">
            当前账号的登录状态。
          </p>

          <div class="mt-5 flex items-center justify-between text-sm">
            <span class="text-zinc-500">登录状态</span>
            <span
              class="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-teal-600"></span>
              已登录
            </span>
          </div>
        </section>
      </div>

      <div class="space-y-4">
        <section class="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8">
          <h2 class="text-sm font-semibold tracking-wide text-zinc-900">
            个人信息
          </h2>
          <p class="mt-1 text-xs leading-5 text-zinc-400">
            这些信息会同步到你的学习记录和每日报告。
          </p>

          <el-form
            class="mt-6"
            label-width="140px"
            :model="form"
            :rules="rules"
            ref="formRef"
            status-icon
          >
            <el-form-item label="用户名：" prop="name">
              <el-input
                v-model="form.name"
                placeholder="请输入用户名"
                clearable
              />
            </el-form-item>

            <el-form-item label="邮箱：" prop="email">
              <el-input
                v-model="form.email"
                placeholder="请输入邮箱"
                clearable
              />
            </el-form-item>

            <el-form-item label="定时任务：" prop="isTimingTask">
              <el-switch v-model="form.isTimingTask" />
            </el-form-item>
            <el-form-item label="定时任务时间：" prop="timingTaskTime">
              <div>
                <el-time-picker
                  class="w-full sm:w-[220px]"
                  format="HH:mm:ss"
                  value-format="HH:mm:ss"
                  v-model="form.timingTaskTime"
                  placeholder="请选择定时任务时间"
                />
                <div class="mt-3 text-xs leading-5 text-zinc-400">
                  只有填写邮箱并且开启定时任务，才能收到每日打卡提醒。
                </div>
              </div>
            </el-form-item>

            <el-form-item label="地址：" prop="address">
              <el-input
                v-model="form.address"
                placeholder="请输入地址"
                clearable
              />
            </el-form-item>

            <el-form-item label="签名：" prop="bio">
              <el-input
                v-model="form.bio"
                placeholder="写点什么介绍一下自己"
                type="textarea"
                :rows="4"
                maxlength="120"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </section>

        <section class="rounded-2xl border border-red-200/70 bg-white p-6 sm:p-8">
          <h2 class="text-sm font-semibold tracking-wide text-red-700">
            危险操作
          </h2>
          <div class="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div class="text-sm font-semibold text-zinc-900">退出登录</div>
              <div class="mt-1 text-sm text-zinc-500">清除本地登录状态</div>
            </div>
            <el-button @click="logoutHandle" type="danger" plain>
              退出
            </el-button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, useTemplateRef } from "vue";
import type { UserUpdate } from "@en/common/user";
import { useUserStore } from "@/stores/user";
import { uploadAvatar } from "@/apis/user"; //上传头像接口
import type { UploadFile, FormInstance } from "element-plus"; //上传文件类型
import { ElMessage, ElMessageBox } from "element-plus";
import { updateUser } from "@/apis/user"; //更新用户信息接口
import { useAvatar } from "@/hooks/useAvatar";
import { useLogin } from "@/hooks/useLogin";

const { avatar } = useAvatar();
const userStore = useUserStore();
const { logout } = useLogin();
const preViewUrl = ref<string>("");
const form = ref<UserUpdate>({
  name: "",
  email: "",
  address: "",
  bio: "",
  isTimingTask: false,
  timingTaskTime: "",
  avatar: "",
});
const formRef = useTemplateRef<FormInstance>("formRef"); //表单ref

const rules = reactive({
  name: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  email: [
    { required: false, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" },
  ],
  isTimingTask: [
    {
      required: true,
      message: "请选择定时任务",
      trigger: "blur",
      type: "boolean",
    },
  ],
  timingTaskTime: [
    {
      required: true,
      message: "请选择定时任务时间",
      trigger: "blur",
    },
  ],
});

// 提交保存接口
const onSave = async () => {
  await formRef.value?.validate();
  const res = await updateUser(form.value);
  if (res.success && res.data) {
    userStore.updateUser(res.data); //更新用户信息
    ElMessage.success("更新成功");
  } else {
    ElMessage.error(res.message);
  }
};

// 退出
const logoutHandle = () => {
  ElMessageBox.confirm("确定退出登录吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    logout();
  });
};

// 上传头像方法
const onAvatarSelect = async (file: UploadFile) => {
  const formData = new FormData();
  formData.append("file", file.raw as File);
  const res = await uploadAvatar(formData);
  if (res.success && res.data) {
    console.log(res.data);
    form.value.avatar = res.data.preViewUrl;
    preViewUrl.value = res.data.preViewUrl;
  } else {
    ElMessage.error(res.message);
  }
};

const init = () => {
  //如果用户登录了，则获取用户信息
  if (userStore.getUser) {
    form.value = { ...userStore.getUpdateUserInfo! };
    preViewUrl.value = userStore.getUpdateUserInfo?.avatar!;
  }
};
onMounted(() => {
  init();
});
</script>

<style scoped>
@media (max-width: 639px) {
  :deep(.el-form-item) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  :deep(.el-form-item__label) {
    width: 100% !important;
    height: auto;
    justify-content: flex-start;
    padding: 0 0 6px;
    text-align: left;
    line-height: 1.4;
  }
  :deep(.el-form-item__content) {
    width: 100%;
    margin-left: 0 !important;
  }
}
</style>
