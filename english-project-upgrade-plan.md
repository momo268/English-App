# 英语 AI 学习平台 · 升级方案（简历/面试版）

> 目标：把现在这个“能跑的课程项目”升级成 **能演示、有数据、能讲深** 的个人项目。
> 原则：**不新开项目、不重写、先修硬伤再加亮点、每阶段可交付、所有改动能量化。**
> 配套文件：`frontend-interview-qa.md`；功能细节（SRS/AI 教练/看板/打卡/导入）见 `english-project-feature-prd.md`

---

## 0. 最终产出（做完是什么样）

1. **线上 demo**：一个链接，能登录、能 AI 对话、能看学习报告；提供测试账号。
2. **GitHub 仓库**：README、架构图、截图/GIF、启动步骤、`.env.example`、CI 绿标。
3. **3 分钟录屏**：登录 → AI 对话（工具调用/RAG 引用）→ 学习 → 定时报告。
4. **可量化数据**：首字延迟、Lighthouse、包体积、测试覆盖率、RAG 命中率、队列成功率。
5. **简历 3-5 条 bullet** + **3 个面试故事**（见第 8、9 节）。

---

## 1. 当前项目盘点

### 1.1 已有能力

- **前端** `apps/web`：Vue3 + TS + Vite + Pinia + Element Plus + Tailwind；Three.js/GLTF + GSAP 3D 登录页；SSE 流式对话（reasoning/content）；语音输入；Axios 401 单飞刷新 + 请求队列；Socket.io。
- **业务后端** `server/apps/server`：NestJS + Prisma + PostgreSQL；登录/用户/设置/词库/课程/支付/学习记录；JWT access/refresh；MinIO 上传；支付宝沙箱。
- **AI 后端** `server/apps/ai`：LangChain + DeepSeek；SSE 聊天；Prompt 模块；每日报告（BullMQ Job Scheduler，按用户时间、昨天记录）。
- **共享层** `server/libs/shared`：Prisma、Redis/BullMQ、Email、MinIO、Pay、统一响应；`packages/common` 共享类型。
- **基础设施**：Redis、PostgreSQL、MinIO；pnpm monorepo。

### 1.2 问题清单（按优先级）

**P0 安全/硬伤（必须先修）**

- 密码明文比较/存储（`user.password !== dto.password`），没有哈希。
- accessToken 过期时间 10 秒（`signOptions: { expiresIn: 10 }`），生产不可用。
- 前端没有路由守卫/404，未登录可进 `/setting`，`user.value!` 会崩。
- `.env` 里有真实 DeepSeek/Alipay/Redis 密钥；仓库虽 ignore，但要轮换 + `.env.example`。
- 刷新 token 没有轮换/撤销机制；JWT 存 localStorage 有 XSS 风险。

**P1 工程化（面试很看重）**

- 没有 Docker/CI/测试/监控；没有一键启动。
- 没有 README 架构图/截图/指标；没有 demo 链接。
- 日志/错误处理/健康检查/优雅关闭缺失。

**P2 AI 深度（决定能不能打 AI 岗）**

- 只有一个查询工具，单轮 Agent；没有 RAG、没有引用、没有工具调用可视化。
- SSE 没有取消/重试/心跳；没有 token/成本统计；没有评测。
- 定时任务已可用，但缺幂等/失败重试的可观测。

**P3 前端深度（决定能不能讲性能）**

- 聊天每条 token 直接改数组，长对话可能卡；没有虚拟列表/增量 Markdown 清洗。
- Three.js 没有动态加载/dispose；没有 Lighthouse/包体积数据。
- 没有组件测试/E2E。

---

## 2. 目标架构

```text
Browser (Vue3 + TS + Vite)
   │  HTTPS
   ▼
Nginx (静态资源 + /api 反代 + /ai 反代，SSE 关闭 buffering)
   │
   ├── server (NestJS API, 端口 3000)
   │      ├── PostgreSQL (Prisma)
   │      ├── Redis (缓存/队列)
   │      └── MinIO (头像/课程资源)
   │
   └── ai (NestJS, 端口 3001)
          ├── SSE Chat / Agent
          ├── RAG (pgvector)
          ├── BullMQ Worker (日报/异步任务)
          └── PostgreSQL / Redis

可观测：Sentry（前后端）+ Web Vitals + 结构化日志
部署：docker compose（postgres/redis/minio/server/ai/web）
CI：GitHub Actions（lint → test → build）
```

**聊天数据流：**

```text
前端 POST /ai/v1/chat (SSE)
  → ai 控制器
  → Agent（最多 5 步）
      → tool: queryUserRecords / searchKnowledge / generateQuiz
      → LLM（DeepSeek）
  → SSE 事件：meta → reasoning/content → tool_call → tool_result → usage → done
  → 前端增量渲染 + 工具卡片 + 引用
  → 写入 AiUsage（token/成本/延迟）
```

**日报数据流：**

```text
BullMQ Job Scheduler（每用户一个 cron）
  → Worker: EMAIL_DIGEST_TASK
  → 查昨天记录（没有则跳过）
  → LLM 生成报告
  → EmailService 发送（失败重试 3 次）
```

---

## 3. 升级路线总览（2-3 周）

| 阶段 | 时间 | 目标 | 交付 |
|---|---|---|---|
| Phase 0 | 1-2 天 | 修硬伤 + 能上线 | demo 链接、README、安全修复 |
| Phase 1 | 3-4 天 | 工程化 + 可观测 | Docker、CI、测试、Sentry |
| Phase 2 | 5-7 天 | AI/Agent 深化 | RAG、多工具、流式工具、成本/评测 |
| Phase 3 | 3-4 天 | 前端深度/性能 | 虚拟列表、增量 Markdown、Lighthouse 数据 |
| Phase 4 | 2-3 天 | 后端/运维加固 | 限流、幂等、健康检查、压测 |
| Phase 5 | 1-2 天 | 包装 | 视频、简历、面试故事 |

> 时间不够：Phase 0 + 1 + 2 必做；Phase 3 只做“虚拟列表 + Three.js 动态加载 + Lighthouse”；Phase 4 只做健康检查/限流。

---

## 4. Phase 0：修硬伤 + 上线（1-2 天）

### 4.1 安全修复

1. **密码哈希**（`server/apps/server/src/user/user.service.ts`、`auth`）：
   - `pnpm --filter @en/server add bcrypt`（或 `argon2`）。
   - 注册：`bcrypt.hash(password, 10)`；登录：`bcrypt.compare`。
   - 兼容老数据：登录成功且发现明文时，顺手重哈希。
2. **Token 时长**（`server/libs/shared/src/shared.module.ts`）：
   - accessToken `15m`，refreshToken `7d`。
   - refresh 接口校验 `tokenType === 'refresh'`；刷新时轮换 refreshToken。
   - 前端 401 单飞刷新保留；刷新接口本身 401 不再重试。
3. **按需登录 + 404**（`apps/web/src/hooks/useLogin.ts`）：
   - 保留现在的“公共页面可直接看、关键操作弹登录框”模式，**不要加全局 `beforeEach` 强制登录**。
   - 修复 `login()` 现在 `reject(false)` 导致 `await login()` 后面的代码不执行的问题；改成 `login(): Promise<boolean>` + `requireLogin(action)`。
   - 受保护页面（设置/复习/统计/导入）用 `AuthGate` 组件：未登录显示登录 CTA，登录成功后加载数据；不要重定向。
   - 增加 `/:pathMatch(.*)*` 404 页面。
   - 后端仍然要对个人接口加 JWT Guard：前端弹窗是体验，不是安全边界。
4. **密钥**：
   - 轮换 DeepSeek/Alipay/Redis/MinIO 密钥（如果曾经推过公开仓库）。
   - `.env` 保留本地；提交 `.env.example`（占位符）。
   - `.gitignore` 确认包含 `.env`、`dist`、`node_modules`、`*.log`。
5. **JWT 存储**：短期方案继续 localStorage + 严格 CSP/转义；进阶改 HttpOnly Cookie + CSRF Token（时间不够可写“已知限制”）。

### 4.2 上线

- 前端：Vercel/Netlify（`pnpm --filter @en/web build`，产物 `dist`）。
- 后端：一台轻量云服务器 + Docker compose（Phase 1 做）；或 Railway/Render（注意 SSE 支持）。
- Nginx：
  - `try_files $uri $uri/ /index.html` 支持 history 路由。
  - `/api` → server；`/ai` → ai；SSE 关 buffering：
    ```nginx
    location /ai/ {
      proxy_pass http://ai:3001;
      proxy_http_version 1.1;
      proxy_set_header Connection '';
      proxy_buffering off;
      proxy_cache off;
      chunked_transfer_encoding off;
    }
    ```
- 准备演示数据：1 个测试账号、1 个课程、10-20 条单词记录、1 个定时任务。
- README：项目简介、架构图、功能截图、启动步骤、测试账号、已知限制。

**验收**：公开链接能登录 → 聊天 → 学习；仓库无密钥；README 可照着跑。

---

## 5. Phase 1：工程化 + 可观测（3-4 天）

### 5.1 Docker

新增：

```text
docker-compose.yml
server/Dockerfile
apps/web/Dockerfile
deploy/nginx.conf
```

- `postgres:16`、`redis:7`、`minio`、`server`、`ai`、`web`。
- `depends_on` + `healthcheck`；数据用 named volume。
- `server/ai` 用多阶段构建：`node:20-alpine` → `pnpm build` → 运行 `dist`。
- `web` 用 `nginx:alpine` 托管 `dist`，反代 `/api`、`/ai`。

验收：`docker compose up -d` 一条命令起来；浏览器能访问；日志正常。

### 5.2 CI

`.github/workflows/ci.yml`：

```yaml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

- 先保证 `lint/build` 绿，再补测试。
- 缓存 pnpm store；后续可加 Docker build/push。

### 5.3 测试

- 前端：`vitest` + `@vue/test-utils`；测 SSE 解析、token 刷新队列、工具函数。
- 后端：`supertest` + Nest TestingModule；测登录、聊天接口、RAG 检索。
- E2E：`playwright`；登录 → 聊天 → 学习主流程。
- 目标：核心工具函数覆盖率 ≥ 60%；不追求 100%。

### 5.4 可观测

- 前端：`@sentry/vue` + `web-vitals`（LCP/INP/CLS 上报）。
- 后端：`@sentry/node` + 结构化日志（pino）；请求 id；慢接口日志。
- 健康检查：`GET /health`（DB/Redis 连通性）。
- README 写清楚“监控截图/指标”。

验收：CI 绿；Sentry 能收到一条测试错误；`/health` 返回 ok。

---

## 6. Phase 2：AI/Agent 深化（5-7 天，核心）

> 目标：从“会调 LLM”升级到“会做 RAG + 多工具 Agent + 可评测”。

### 6.1 RAG：单词/语法知识库

**数据模型**（`server/prisma/schema.prisma`）：

```prisma
model KnowledgeChunk {
  id        String   @id @default(cuid())
  source    String   // 来源：word/grammar/faq
  title     String?
  content   String
  embedding Unsupported("vector(1536)")? // 按 embedding 维度改：768/1024/1536/384
  createdAt DateTime @default(now())

  @@index([source])
}
```

- 启用扩展：`CREATE EXTENSION IF NOT EXISTS vector;`
- 迁移：`pnpm --filter @en/server exec prisma migrate dev --name add_knowledge_chunk`
- 用 raw SQL 做余弦相似度检索（Prisma 对 vector 支持有限）：
  ```sql
  SELECT id, content, 1 - (embedding <=> $1::vector) AS score
  FROM "KnowledgeChunk"
  ORDER BY embedding <=> $1::vector
  LIMIT 5;
  ```

**Embedding 选型（三选一，先定维度再建表）：**

1. **Ollama 本地**（推荐，零成本）：`ollama pull nomic-embed-text`（768 维），调 `http://localhost:11434/api/embeddings`；schema 用 `vector(768)`。
2. **OpenAI**：`text-embedding-3-small`（1536 维，便宜，需要 key）；schema 用 `vector(1536)`。
3. **本地 transformers**：`@xenova/transformers`（all-MiniLM-L6-v2，384 维，离线）；schema 用 `vector(384)`。

> 维度必须和 `KnowledgeChunk.embedding` 的 `vector(N)` 一致；换 embedding 模型要重建表和重新入库。

**入库脚本**（`server/apps/ai/src/rag/ingest.ts`）：

- 读取词库/语法 Markdown/JSON；
- 清洗 → 按标题/段落切分（300-800 token，重叠 10-20%）；
- 批量 embedding（并发 3-5，失败重试）；
- 写入 `KnowledgeChunk`；
- 记录条数/耗时/失败数。

**检索工具**（`server/apps/ai/src/rag/retriever.ts`）：

- `searchKnowledge(query, topK=5)`：embedding → SQL → 过滤低分（<0.6）→ 返回 `{ content, source, score }`。
- Agent 工具 schema：`{ query: string, topK?: number }`。

**生成要求**：

- Prompt 明确“只根据资料回答；没有资料就说不知道；引用来源编号”。
- 前端展示引用（`[1]` 可点开原文）。

**验收**：问“abandon 的词根/搭配”能返回知识库内容并带引用；无资料时明确说不知道。

### 6.2 多工具 Agent

**工具清单**（`server/apps/ai/src/agent/tools/`）：

| 工具 | 作用 | 参数 |
|---|---|---|
| `queryUserRecords` | 查用户某天/某段学习记录 | `userId, start, end` |
| `searchKnowledge` | RAG 检索单词/语法 | `query, topK` |
| `generateQuiz` | 根据单词生成选择题/填空题 | `words[], count` |
| `planReview` | 根据记录生成复习计划 | `userId, days` |

**Agent 编排：**

- 用现有 `createAgent` 或 LangGraph（推荐 LangGraph：状态图 + 条件边 + checkpoint）。
- 限制：`maxSteps=5`、单工具超时 8s、工具失败把错误回传给模型、最终必须有答案。
- 防死循环：相同工具+相同参数连续调用 2 次则停止；超过步数返回兜底话术。
- 记录每一步：`toolName/args/result/latency`，用于前端展示和评测。

**SSE 协议**（`server/apps/ai` + `apps/web/src/apis/sse`）：

```text
event: meta
data: {"requestId":"...","model":"deepseek-chat"}

event: reasoning
data: {"delta":"..."}

event: content
data: {"delta":"..."}

event: tool_call
data: {"id":"call_1","name":"searchKnowledge","args":{"query":"abandon 词根"}}

event: tool_result
data: {"id":"call_1","ok":true,"preview":"..."}

event: usage
data: {"promptTokens":123,"completionTokens":456,"cost":0.0012,"latencyMs":1800}

event: done
data: {"finishReason":"stop"}

event: error
data: {"message":"..."}
```

- 心跳：每 15s 发 `: ping\n\n`，防 Nginx/浏览器超时。
- 取消：前端 `AbortController` → 后端监听 `req.on('close')` 中止 LLM 请求。
- 重试：只对“未产生 token”的失败重试；已产生内容不重试，避免重复。

**前端渲染：**

- `useChatStream` composable：解析事件、维护 `content/reasoning/toolCalls/citations/status`。
- 工具卡片：`正在查询学习记录...` → 成功/失败；可展开参数/结果。
- 引用：`[1]` 点击滚动到来源。
- 取消/重新生成按钮。

**验收**：问“帮我总结昨天学的词，并出 3 道题”能连续调用 `queryUserRecords` + `generateQuiz`，前端显示两个工具卡片，最终有答案。

### 6.3 成本/延迟/评测

**数据模型**：

```prisma
model AiUsage {
  id               String   @id @default(cuid())
  requestId        String   @unique
  userId           String?
  model            String
  promptTokens     Int
  completionTokens Int
  cost             Decimal  @db.Decimal(10, 6)
  latencyMs        Int
  createdAt        DateTime @default(now())

  @@index([userId, createdAt])
}
```

- 每次请求结束写 `AiUsage`；成本按模型单价计算（配置化）。
- 前端“用量”页：今日/近 7 天 token、成本、P50/P95 延迟、工具调用次数。

**评测集**：

- 20 条问题（单词解释/学习记录/复习计划/无答案问题）。
- 脚本 `server/apps/ai/src/eval/run.ts`：跑 Agent，记录准确率、引用命中、平均延迟、平均 token。
- 结果写 README：例如“20 题准确 17/20，平均延迟 2.1s，平均成本 ¥0.003/次”。

**验收**：能展示用量页；有评测报告；README 有数字。

---

## 7. Phase 3：前端深度 + 性能（3-4 天）

### 7.1 聊天渲染优化

- **增量 Markdown**：`marked` 解析 + `DOMPurify` 清洗；代码块 `highlight.js` 懒加载。
- **批量更新**：SSE 每个 token 不直接 `push`，先进 buffer，`requestAnimationFrame` 每帧合并一次，减少重渲染。
- **虚拟列表**：长对话用 `vue-virtual-scroller` 的 `DynamicScroller`（不定高）；或自己实现“可视区 + 缓冲区”。
- **滚动策略**：用户上滚时暂停自动滚动，显示“回到底部”。
- **状态**：`idle/streaming/tool/done/error`；错误可重试。
- **验收**：100 轮对话不卡；流式输出 60fps；Lighthouse Performance ≥ 90。

### 7.2 Three.js/首屏

- 3D 登录页 dynamic import：`const { initScene } = await import('./three')`。
- `dispose()` geometry/material/texture/renderer；取消 `requestAnimationFrame`；`prefers-reduced-motion` 降级为静态图。
- 记录包体积：`vite build` 前后对比；Three.js 单独 chunk。
- 图片/字体：WebP、`font-display: swap`、预加载关键资源。

### 7.3 路由/错误/体验

- 路由守卫 + 404 + 403；页面级 `ErrorBoundary`（Vue `onErrorCaptured`）。
- 骨架屏/空状态/加载态；接口失败 toast + 重试。
- 表单校验（Element Plus rules + 后端 DTO 校验）。

### 7.4 测试

- Vitest：`sseParser`、`tokenRefreshQueue`、`format` 工具。
- Playwright：登录 → 聊天（mock SSE 或测试环境）→ 学习。
- 验收：`pnpm test` 绿；E2E 在 CI 跑。

---

## 8. Phase 4：后端/运维加固（2-3 天）

- **鉴权/权限**：JWT Guard + RBAC（普通用户/管理员）；资源归属校验。
- **限流**：`@nestjs/throttler` 或 Redis 令牌桶；聊天接口按用户限流。
- **校验**：`class-validator` DTO；全局 `ValidationPipe`。
- **幂等**：支付回调/日报任务用唯一键；重复请求返回同一结果。
- **队列**：`attempts/backoff`；失败进死信；Job Scheduler 幂等；监控队列长度。
- **健康检查/优雅关闭**：`/health`；`app.enableShutdownHooks()`；SIGTERM 处理。
- **日志**：pino + requestId；慢查询/慢请求；Sentry。
- **压测**：`autocannon -c 100 -d 20 http://localhost:3000/health`；聊天接口用 mock。
- **验收**：100 并发健康检查无错误；队列失败可重试；日志能定位一次请求。

---

## 9. Phase 5：包装（1-2 天）

### 9.1 演示

- 测试账号 + 演示数据（课程、单词记录、定时任务）。
- 3 分钟视频脚本：
  1. 登录/3D 首页（10s）
  2. AI 对话：流式 + 工具调用 + RAG 引用（60s）
  3. 学习/报告/定时任务（40s）
  4. 架构/部署/CI（30s）
  5. 数据：延迟/成本/测试（20s）
- README：架构图、功能、截图、启动、环境变量、测试账号、指标、已知限制。

### 9.2 简历 bullet（用你测出来的数字替换 X）

- 基于 LangGraph 实现多工具 Agent（学习记录/词典 RAG/出题/复习计划），工具调用可视化 + 最大步数/超时/降级；20 题评测准确率 X/20，平均延迟 X s。
- 设计 SSE 双通道流式协议（reasoning/content/tool_call/usage），支持取消/重试/心跳；rAF 批量渲染 + 虚拟列表，首字延迟从 X ms 降到 Y ms，100 轮对话保持 60fps。
- 工程化：pnpm monorepo + Docker Compose + GitHub Actions + Vitest/Playwright，CI 全绿，测试覆盖率 X%，一键部署。
- 安全加固：bcrypt + 15m/7d Token + 单飞刷新 + 路由守卫，修复明文密码/10s Token/未授权访问等硬伤。
- RAG：pgvector + 切分/embedding/检索/引用，知识库 X 条，引用命中率 X%。

### 9.3 面试故事（3 个）

1. **SSE 流式**：为什么用 SSE 不用 WebSocket？怎么取消/重连/防抖渲染？Nginx 怎么配？
2. **RAG/Agent**：怎么切分/召回/重排/评估？工具调用怎么防死循环？失败怎么降级？
3. **工程化/安全**：怎么从“能跑”到“能上线”？Docker/CI/监控/密钥/权限怎么做的？

---

## 10. 两周排期（全职版）

| Day | 任务 | 产出 |
|---|---|---|
| 1 | Phase 0 安全修复 | bcrypt/15m token/路由守卫/404 |
| 2 | 密钥/README/前端部署 | demo 链接、README |
| 3 | Dockerfile/compose | 一键启动 |
| 4 | CI + 测试脚手架 | Actions 绿 |
| 5 | Sentry/健康检查/日志 | 可观测 |
| 6 | pgvector/知识库入库 | RAG 数据 |
| 7 | 检索工具/引用 | RAG 可用 |
| 8 | 多工具 Agent/LangGraph | 工具编排 |
| 9 | SSE 协议/工具卡片/取消 | 前端联调 |
| 10 | 成本/评测/用量页 | 数据 |
| 11 | 虚拟列表/增量 Markdown | 性能 |
| 12 | Three.js 动态加载/Lighthouse | 指标 |
| 13 | E2E/压测/限流 | 稳定性 |
| 14 | 视频/README/简历 | 交付 |

> 每天 6-8 小时；如果只有 4 小时，拉长到 3 周，优先 Phase 0/1/2。

---

## 11. 风险与取舍

- **RAG 的 embedding 成本/时间**：优先本地 Ollama；不行就先用 20-50 条数据跑通，再扩。
- **Agent 不稳定**：限制工具/步数/超时；失败返回兜底；不要把 demo 做成“必须联网才能演示”。
- **范围蔓延**：Phase 3/4 可砍；Phase 0/1/2 是核心。
- **不要破坏现有 demo**：新功能用开关/分支；先保证主流程可用。
- **安全**：密钥轮换；demo 账号只读/限权；不要暴露管理接口。
- **数据**：演示数据脱敏；不要用真实用户邮箱/手机号。

---

## 12. 验收清单

- [ ] 线上 demo 可访问，测试账号能登录
- [ ] 聊天流式 + 工具调用 + RAG 引用可演示
- [ ] 取消/重试/错误提示可用
- [ ] 日报按用户时间发送；昨天无记录不发
- [ ] Docker compose 一键启动
- [ ] CI 绿；单测/E2E 有
- [ ] Sentry/健康检查/日志可用
- [ ] Lighthouse ≥ 90；首字延迟有数据
- [ ] README 有架构图/截图/指标/限制
- [ ] 简历 3-5 条 bullet + 3 个面试故事

---

## 13. 最小可行版（时间不够做这个）

如果只有 1 周：

1. Phase 0 安全 + 部署（2 天）
2. Docker compose + CI（1 天）
3. RAG 最小版：20 条知识 + 检索 + 引用（2 天）
4. 聊天取消/重试 + 工具卡片（1 天）
5. README/视频/简历（1 天）

**不要**在这个版本里做多工具 Agent、LangGraph、成本页、虚拟列表；先保证“能演示 + 有 RAG + 有部署”，面试时讲清楚取舍。
