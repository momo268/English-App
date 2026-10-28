# English App

一个面向英语词汇学习与 AI 陪练的全栈项目，包含 Web 前端、业务 API 和独立的 AI 服务。

项目采用 pnpm monorepo 管理，支持公开词库、自定义词库/课程导入、课程购买、SRS 间隔复习、错词本、学习计划、打卡热力图、学习周报，以及基于 RAG 的 AI 英语教练。

> 当前仓库是个人学习/作品项目，未附带开源许可证。生产环境使用前请自行完成安全、支付、邮件和对象存储配置。

## 功能特性

- **账号体系**：手机号注册/登录、JWT access/refresh token、头像上传、个人资料设置；公开页面采用渐进式登录，不强制全局登录。
- **词库**：公共词库按高考、中考、四六级、考研、GRE、托福、雅思等标签筛选；支持搜索、发音和进入课程学习。
- **自定义词库**：在词库页导入 XLSX/CSV，支持模板下载、拖拽上传、预览校验、重复词跳过、导入进度和错误明细下载。
- **课程**：精选课程、支付宝沙箱支付、我的课程；支持导入自定义课程，按单元/章节组织单词。
- **专注学习**：逐词拼写、隐藏/显示单词、自动发音、输入统计、暂停/恢复、学习总结；学习结果写入 SRS 与练习日志。
- **SRS 复习**：基于 `nextReviewAt` 的到期队列，支持按课程/单词进入复习、重置 SRS、错词本管理。
- **学习计划**：每日新词/复习/时长目标、连续打卡、月历打卡、错词本入口、最近学习单词及所属课程。
- **学习数据**：26 周学习热力图、30 天趋势、掌握度分布、薄弱词、最近课程，以及可导出 PNG/PDF 的周报。
- **AI 英语教练**：考研、四级、六级、语法、自由提问 5 种助手；会话新建/重命名/删除、SSE 流式输出、RAG 引用、单词详情工具、自由提问的深度思考与联网搜索、语音转文字。
- **响应式**：桌面、平板、手机布局适配；移动端顶部导航收纳为侧边抽屉。
- **邮件摘要**：可配置每日学习摘要邮件（需 SMTP）。

## 技术栈

### 前端

| 分类 | 技术 |
| --- | --- |
| 框架 | Vue 3.5、TypeScript、Vite 8 |
| 状态与路由 | Pinia、Vue Router |
| UI | Element Plus、Tailwind CSS v4、自定义设计系统 |
| 可视化/交互 | CSS/SVG 图表、Three.js、GSAP |
| 文档与导出 | marked、html-to-image、jsPDF |
| 实时通信 | SSE、Socket.IO Client |

### 后端

| 分类 | 技术 |
| --- | --- |
| 框架 | NestJS 11（`server` + `ai` 两个应用） |
| 数据库 | PostgreSQL、Prisma 7 |
| 缓存/队列 | Redis、BullMQ |
| 对象存储 | MinIO |
| AI | LangChain、LangGraph Postgres Checkpointer、DeepSeek、博查搜索 |
| 支付/邮件 | 支付宝 SDK（沙箱可配置）、Nodemailer |
| 其他 | JWT、Socket.IO、XLSX 解析 |

### 工程化

- pnpm workspace
- ESLint + Prettier
- Jest（服务端单元测试）
- Node.js `node:test`（前端学习音频测试）
- Prisma Migrate

## 系统架构

```text
Browser
  │
  ├── :8080  apps/web (Vite)
  │      ├── /api/*  ──proxy──▶ :3000  server  (/api/v1)
  │      └── /ai/*   ──proxy──▶ :3001  ai      (/ai/v1)
  │
  ├── Socket.IO ──────────────▶ :3000  server
  └── 静态资源/头像 ──────────▶ :9000  MinIO

server ──▶ PostgreSQL
       ──▶ Redis / BullMQ
       ──▶ MinIO
       ──▶ DeepSeek / 博查 / 支付宝 / SMTP（按功能）
ai     ──▶ PostgreSQL（LangGraph checkpoint）
       ──▶ DeepSeek / 博查
```

`packages/config` 统一维护端口：

- Web：`8080`
- 业务 API：`3000`
- AI API：`3001`

Vite 开发服务器会把 `/api` 和 `/ai` 代理到对应服务，因此本地开发不需要额外配置跨域。

## 目录结构

```text
EnglishProject/
├── apps/
│   └── web/                     # Vue 前端
│       ├── src/
│       │   ├── apis/            # 接口封装
│       │   ├── components/      # 通用组件（登录、热力图、搜索等）
│       │   ├── hooks/           # 组合式函数（登录、发音、Socket、语音等）
│       │   ├── layout/          # 页面布局与顶部导航
│       │   ├── router/          # 路由模块
│       │   ├── stores/          # Pinia
│       │   └── views/
│       │       ├── Home/        # 游客首页 / 登录后工作台
│       │       ├── Course/      # 课程与支付
│       │       ├── Learn/       # 专注学习与复习
│       │       ├── WordBook/    # 公共/自定义词库
│       │       ├── WrongBook/   # 错词本
│       │       ├── Report/      # 学习周报
│       │       ├── Chat/        # AI 教练
│       │       └── Setting/     # 设置
│       ├── tests/               # 前端学习音频测试
│       └── public/
│
├── packages/
│   ├── common/                  # 前后端共享 TypeScript 类型
│   └── config/                  # 共享端口配置
│
├── server/
│   ├── apps/
│   │   ├── server/              # 业务 API（用户、词库、课程、学习、统计、导入、周报）
│   │   └── ai/                  # AI API（会话、RAG、SSE、摘要）
│   ├── libs/shared/             # Prisma、Redis、MinIO、JWT、邮件、响应等共享能力
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   ├── seed.ts              # 初始化示例课程与课程封面
│   │   └── assets/
│   └── scripts/
│       └── seed-rag.ts          # 写入 100 条 AI 教练学习笔记
│
├── package.json
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

## 环境要求

| 依赖 | 版本/说明 |
| --- | --- |
| Node.js | 推荐 24.12+（前端 engines 支持 `^22.18.0 || >=24.12.0`） |
| pnpm | 10+ |
| PostgreSQL | 15+，本地实测 18 |
| Redis | 6.2+（BullMQ 建议） |
| MinIO | 用于头像和课程封面等对象存储 |
| 外部服务 | DeepSeek、博查搜索、支付宝沙箱、SMTP，均按需配置 |

> 如果只启动前端页面，可以暂时缺少部分外部服务；但登录、学习、AI、支付、邮件等功能需要对应基础设施可用。

## 快速开始

### 1. 安装依赖

```bash
git clone <your-repository-url>
cd EnglishProject
pnpm install
```

### 2. 准备基础设施

需要先启动 PostgreSQL、Redis 和 MinIO。可以用本机服务，也可以用 Docker：

```bash
# PostgreSQL
docker run -d --name english-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=english \
  -p 5432:5432 postgres:16

# Redis
docker run -d --name english-redis -p 6379:6379 redis:7

# MinIO（9000 为 S3 API，9001 为控制台）
docker run -d --name english-minio \
  -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio:latest server /data --console-address ":9001"
```

### 3. 配置环境变量

```bash
# macOS / Linux
cp server/.env.example server/.env

# Windows PowerShell
Copy-Item server/.env.example server/.env
```

然后编辑 `server/.env`，至少替换：

- `DATABASE_URL`
- `SECRET_KEY`
- Redis 配置
- MinIO 配置
- DeepSeek API Key（AI 功能）
- `AI_DATABASE_URL`

`.env` 已被 `.gitignore` 忽略，不会被提交。模板中的值全部是占位符，详见 [server/.env.example](server/.env.example)。

### 4. 初始化数据库

```bash
cd server
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm exec prisma db seed
pnpm exec tsx scripts/seed-rag.ts
cd ..
```

说明：

- `prisma generate` 生成 Prisma Client；新机器首次启动必须执行，否则 TypeScript/运行时会找不到数据库模型。
- `prisma migrate deploy` 会按顺序执行 `server/prisma/migrations` 下的迁移；**表结构由迁移创建，不需要手动建表**。
- `prisma db seed` 会创建 8 个示例课程，并把课程封面上传到 MinIO 的 `course` 桶，因此执行前 MinIO 必须可用。
- `seed-rag.ts` 会写入 AI 教练的 100 条 RAG 学习笔记。
- 仓库不包含完整词典数据。迁移只负责建表，`db seed` 也不导入词库；如果使用空数据库，词库列表和学习页可能为空。
- 不要把本机的 PostgreSQL `data` 目录直接复制给别人，版本或系统不一致时容易损坏；请使用 SQL dump 或迁移脚本。

### 5. 把完整词库数据带到新环境（可选）

如果你希望别人拉下项目后拥有和你一样的公共词库，需要额外分发词库数据。当前仓库没有把 77 万条词库放进 Git。

在旧机器导出公共词库（不包含用户自定义词）：

```bash
psql -U postgres -d english -c "\copy (SELECT * FROM \"WordBook\" WHERE \"ownerId\" IS NULL) TO 'wordbook.csv' WITH (FORMAT csv, HEADER true)"
```

新机器建好空库并执行完迁移后导入：

```bash
psql -U postgres -d english -c "\copy \"WordBook\" FROM 'wordbook.csv' WITH (FORMAT csv, HEADER true)"
```

注意：

- 上面的查询只导出 `ownerId IS NULL` 的公共词条，不会带走用户自定义词库。
- 这是新库导入步骤；重复导入可能产生重复词条，执行前确认目标表为空。
- 数据文件不要提交到 Git，建议压缩后放在对象存储或 GitHub Release，并在 README 中提供下载地址。
- 如果词库数据量较大，使用 `COPY`/`pg_restore` 批量导入，比逐条 Prisma `create` 快很多。

### 6. 启动开发环境

```bash
pnpm run all
```

该命令会同时启动：

- Web：<http://localhost:8080>
- 业务 API：<http://localhost:3000/api/v1>
- AI API：<http://localhost:3001/ai/v1>

`pnpm run all` 是持续运行的开发进程，不是卡住；按 `Ctrl+C` 停止。

也可以分别启动：

```bash
pnpm run web
pnpm run server
pnpm run ai
```

### 7. 访问

| 服务 | 地址 |
| --- | --- |
| Web | <http://localhost:8080> |
| 业务 API | <http://localhost:3000/api/v1> |
| AI API | <http://localhost:3001/ai/v1> |
| MinIO Console | <http://localhost:9001> |

## 环境变量

完整变量和脱敏占位值见 [server/.env.example](server/.env.example)。核心变量如下：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | 是 | PostgreSQL 连接串 |
| `SECRET_KEY` | 是 | JWT 签名密钥，生产环境请使用长随机字符串 |
| `REDIS_HOST` / `REDIS_PORT` | 是 | Redis 地址 |
| `REDIS_PASSWORD` | 否 | 本地无密码时留空 |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | 是 | MinIO 凭证 |
| `MINIO_ENDPOINT` / `MINIO_PORT` | 是 | MinIO 地址 |
| `MINIO_USE_SSL` | 否 | `1` 使用 HTTPS，`0` 使用 HTTP |
| `MINIO_BUCKET` | 是 | 头像桶名，默认 `english-app-avatar` |
| `DEEPSEEK_API_KEY` | AI 必填 | DeepSeek API Key |
| `DEEPSEEK_API_MODEL` | AI 必填 | 普通对话模型，如 `deepseek-chat` |
| `AI_DATABASE_URL` | AI 必填 | LangGraph checkpoint 使用的 PostgreSQL |
| `BOCHA_SEARCH_URL` | 联网搜索必填 | 博查搜索地址 |
| `BOCHA_API_KEY` | 联网搜索必填 | 博查 API Key |
| `ALIPAY_APP_ID` | 支付必填 | 支付宝应用 ID |
| `ALIPAY_PRIVATE_KEY` | 支付必填 | 应用私钥 |
| `ALIPAY_PUBLIC_KEY` | 支付必填 | 支付宝公钥 |
| `ALIPAY_GATEWAY` | 支付必填 | 沙箱/正式网关 |
| `ALIPAY_NOTIFY_URL` | 支付必填 | 异步通知地址，线上必须为公网 HTTPS |
| `EMAIL_HOST` / `EMAIL_PORT` | 邮件必填 | SMTP 地址与端口 |
| `EMAIL_USER` | 邮件必填 | SMTP 登录账号 |
| `EMAIL_PASSWORD` | 邮件必填 | SMTP 授权码，不是邮箱登录密码 |
| `EMAIL_FROM` | 邮件必填 | 发件人展示名与地址 |
| `EMAIL_USE_SSL` | 否 | `1` 使用 SSL |

> 支付宝异步通知需要外网可访问的 HTTPS 地址。本地联调通常需要内网穿透工具；正式环境请使用已备案域名。

## 常用脚本

### 根目录

| 命令 | 作用 |
| --- | --- |
| `pnpm run all` | 同时启动 Web、业务 API、AI API |
| `pnpm run web` | 只启动前端 |
| `pnpm run server` | 只启动业务 API |
| `pnpm run ai` | 只启动 AI API |

### 前端

```bash
pnpm --filter @en/web dev
pnpm --filter @en/web build
pnpm --filter @en/web preview
pnpm --filter @en/web type-check
pnpm --filter @en/web test:learn
```

### 服务端

```bash
pnpm --filter @en/server start:dev
pnpm --filter @en/server build
pnpm --filter @en/server test
pnpm --filter @en/server test:e2e
pnpm --filter @en/server lint
pnpm --filter @en/server format
```

### Prisma

```bash
cd server
pnpm exec prisma generate
pnpm exec prisma migrate dev
pnpm exec prisma migrate deploy
pnpm exec prisma migrate status
pnpm exec prisma studio
```

## API 概览

业务 API 前缀为 `/api/v1`，AI API 前缀为 `/ai/v1`。

### 业务 API

| 模块 | 代表接口 |
| --- | --- |
| 用户 | `POST /user/register`、`POST /user/login`、`POST /user/refresh-token` |
| 词库 | `GET /work-book`、`GET /work-book/mine`、`PATCH /work-book/mine/:id` |
| 课程 | `GET /course/list`、`GET /course/my`、`PATCH /course/my/:id` |
| 学习 | `GET /learn/word/:courseId`、`POST /learn/answer`、`POST /learn/session/finish` |
| 复习/错词本 | `GET /learn/review/due`、`GET /learn/wrong-book`、`POST /learn/review/:recordId/reset` |
| 计划/打卡 | `GET /learn/goals`、`PUT /learn/goals`、`GET /learn/check-in/today` |
| 统计 | `GET /stats/overview`、`GET /stats/heatmap`、`GET /stats/trend` |
| 首页 | `GET /home/summary` |
| 导入 | `GET /import/templates/:type`、`POST /import/preview`、`POST /import/wordbook`、`POST /import/course` |
| 周报 | `GET /report/weekly` |
| 支付 | `POST /pay/create`、`POST /pay/notify` |

需要登录的接口使用 `Authorization: Bearer <accessToken>`。业务异常响应格式：

```json
{
  "code": 0,
  "message": "错误信息",
  "success": false,
  "data": null
}
```

成功响应通常为：

```json
{
  "code": 1,
  "message": "请求成功",
  "success": true,
  "data": {}
}
```

### AI API

| 接口 | 说明 |
| --- | --- |
| `GET /ai/v1/sessions` | 当前用户会话列表 |
| `PATCH /ai/v1/sessions/:id` | 重命名会话 |
| `DELETE /ai/v1/sessions/:id` | 删除会话 |
| `GET /ai/v1/sessions/:id/messages` | 会话历史 |
| `POST /ai/v1/coach` | AI 教练，SSE 流式响应 |

`POST /ai/v1/coach` 的事件类型包括：

`meta`、`reasoning`、`content`、`tool_call`、`tool_result`、`citation`、`usage`、`done`、`error`。

AI 服务当前使用 **词法检索 + 中文 bigram 打分** 的轻量 RAG，不依赖 pgvector；后续可以在 `KnowledgeChunk` 接口不变的情况下替换为向量检索。

### WebSocket

支付成功后会通过 Socket.IO 通知对应房间：

```text
事件：paymentSuccess
房间：user_<userId>
```

## 开发说明

- 公开页面采用渐进式登录：未登录可以浏览，点击需要登录的操作时弹出登录框。
- 业务 API 与 AI API 分开部署、共享 JWT 密钥和 Prisma/PostgreSQL。
- 所有用户数据按 JWT 中的 `userId` 隔离，AI 会话的 LangGraph `thread_id` 为 `userId:sessionId`。
- 本地开发端口统一在 [packages/config/index.ts](packages/config/index.ts) 修改。
- 生产环境建议使用 Nginx 反向代理 `/api`、`/ai` 和 `/socket.io`，前后端保持同源，避免额外 CORS 配置。
- 当前前端生产环境的 `uploadUrl`、`socketUrl` 仍是占位地址，部署前请修改 [apps/web/src/apis/index.ts](apps/web/src/apis/index.ts)。

## 测试与质量检查

```bash
# 前端类型检查 + 构建
pnpm --filter @en/web type-check
pnpm --filter @en/web build
pnpm --filter @en/web test:learn

# 服务端类型检查 + 单元测试
pnpm --filter @en/server exec tsc --noEmit -p apps/server/tsconfig.app.json
pnpm --filter @en/server test

# AI 服务类型检查
pnpm --filter @en/server exec tsc --noEmit -p apps/ai/tsconfig.app.json
```

说明：仓库目前提供学习音频相关的前端单元测试，以及服务端 WorkBook 参数校验单元测试；完整的端到端业务测试尚未覆盖。

## 生产部署注意事项

1. 使用 `pnpm --filter @en/web build` 生成前端产物；使用 `pnpm --filter @en/server build` 和 `pnpm --filter @en/server exec nest build ai` 分别构建业务 API 与 AI 服务。
2. 执行 `pnpm exec prisma migrate deploy`，不要在生产环境直接使用 `migrate dev`。
3. 将 `apps/web/dist` 交给 Nginx/静态服务器托管，并把 `/api`、`/ai`、`/socket.io` 反向代理到对应端口。
4. 替换 `apps/web/src/apis/index.ts` 中的生产 `uploadUrl`、`socketUrl`。
5. 配置公网 HTTPS 的 `ALIPAY_NOTIFY_URL`，并校验支付宝异步通知签名、金额和幂等性。
6. 使用独立的强密码/密钥，不要把 `.env`、私钥、邮箱授权码提交到 Git。
7. MinIO 建议使用独立账号和私有桶；课程封面等公开资源再单独配置只读策略。
8. 为 PostgreSQL、Redis、MinIO 配置持久化、备份和访问控制。

## 常见问题

### `pnpm run all` 一直停在终端，是卡住了吗？

不是。该命令会持续运行三个开发服务，日志会不断输出；按 `Ctrl+C` 停止。

### 启动时报 `EADDRINUSE`

端口被占用。检查 `8080`、`3000`、`3001`：

```bash
# Windows
Get-NetTCPConnection -LocalPort 8080,3000,3001 -State Listen

# macOS / Linux
lsof -i :8080 -i :3000 -i :3001
```

### 服务端报 `connect ECONNREFUSED 127.0.0.1:9000`

MinIO 没有启动，或 `MINIO_ENDPOINT`/`MINIO_PORT` 配置错误。先启动 MinIO，再重启服务端。

### Redis 版本警告

BullMQ 建议 Redis 6.2+。旧版本在开发环境可能仍能运行，但生产环境应升级。

### AI 对话报错或没有回复

检查：

- `DEEPSEEK_API_KEY`、`DEEPSEEK_API_MODEL` 是否配置；
- `AI_DATABASE_URL` 是否可连接；
- 当前用户是否已登录；
- 浏览器 Network 中 `/ai/v1/coach` 的 SSE 响应和错误事件。

### 词库或学习页为空

仓库不包含完整词典数据，`prisma db seed` 只初始化课程和封面。需要使用已有数据库，或自行导入词库数据。

### 支付二维码/回调在本地不工作

支付宝异步通知需要公网可访问的地址。本地开发请使用内网穿透，并把 `ALIPAY_NOTIFY_URL` 配成对应的 HTTPS 地址。

## License

本项目为个人学习与作品项目，仓库暂未附带开源许可证。未经作者许可，请勿直接用于商业分发。
