# English App

一个基于 pnpm monorepo 的前后端项目，包含 Web 前端与服务端。

## 目录结构

```text
English-App/
├── apps/
│   └── web/              # 前端应用（Vue + Vite）
├── packages/
│   ├── common/           # 公共代码
│   └── config/           # 共享配置
├── server/               # 服务端
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

## 环境要求

- Node.js >= 24
- pnpm >= 8

建议：

- Node.js： v24.11.1
- pnpm：10.26.1
- nest：11.0.14

## 项目启动

1. 安装依赖：

   ```bash
   pnpm install
   ```

2. 配置环境变量（重要）：

   ```bash
   cd server/.env.example server/.env
   ```

   然后打开 server/.env，把里面的配置项改为你自己的真实值（数据库地址、端口、密钥等）。

   <p style="color: red; font-weight: bold;"> ⚠️ 注意：请将 server 文件夹下的 .env.example 重命名为 .env，并把里面的配置改为你自己的。真实的 .env 文件不要提交到 Git 仓库。 </p>

3. 启动服务：

   ```bash
   pnpm run all
   ```

   该命令会同时启动**前端和后端**所有服务。各服务使用的端口统一在 `packages/config/index.ts` 中定义，如需修改端口或新增服务，请在该文件中调整。
