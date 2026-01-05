# 星语导航 (StarNav) v1.6.1

一个极简、美观、功能强大的个人/私有导航系统。
A minimalist, beautiful, and powerful personal/private navigation system.

**本项目基于开源项目 [CloudNav](https://github.com/sese972010/CloudNav) 进行深度开发与重构，旨在提供更完善的用户权限管理与更精致的 UI 体验。**

[![Version](https://img.shields.io/badge/version-1.6.1-blue.svg)](https://github.com/starwishes/Nav)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/vue-3.4.29-brightgreen.svg)](https://vuejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

---

## ✨ 核心特性 (Core Features)

| 维度 | 核心能力 |
| :--- | :--- |
| 🎨 **UI/UX** | **Glassmorphism** 玻璃态设计，自适应暗色模式，动态背景与流畅交互动画。 |
| 🔍 **搜索** | **毫秒级双模引擎**：本地高频书签模糊检索 + 自定义在线搜索引擎集群。 |
| 🛡️ **权限** | **RBAC 访问控制**：游客/登录用户/管理员 4 级权限隔离，精准控制分类与书签可见性。 |
| ⚡ **性能** | **微秒级响应**：内置 SQLite + 内存缓存 (L1 Cache)，Brotli 静态压缩，路由懒加载。 |
| 🔒 **安全** | **全栈防护**：BCrypt 密码哈希，JWT 动态轮换，API 限流 (Rate Limiting)，CSRF/XSS 防御。 |
| � **部署** | **开箱即用**：原生 Docker 支持，内置数据自动迁移 (Auto-Migrate)，零配置启动。 |

### 🆕 v1.6.1 架构升级 (2026-01-05)

- 🏗️ **深度重构**：前端 `Site.vue` 核心组件解耦，拆分为 `useSiteDrag` (拖拽)、`useSiteMenu` (菜单)、`useSiteFilter` (过滤) 独立逻辑，大幅降低维护成本。
- 🧹 **后端清理**：移除 `proper-lockfile` 等冗余依赖，统一日志系统至 `logger.js`，代码更纯净。
- 🛡️ **TypeScript 增强**：全栈类型定义统一，消除隐式 `any`，构建系统更加健壮。
- 🐛 **扩展修复**：修复浏览器扩展的书签同步与显示问题。

### 🆕 v1.6.0 重大更新 (2026-01-05)

- 🗄️ **SQLite 数据库迁移**：后端存储从 JSON 文件升级为 SQLite 数据库，彻底解决并发写入导致的数据丢失问题。
- 🔄 **自动迁移**：首次启动时自动将现有 JSON 数据导入 SQLite，无需手动操作。
- ⚡ **性能提升**：数据库事务保证原子性；**后端内存缓存**实现零延迟读取；**Brotli** 静态压缩大幅减少传输体积。
- 🛡️ **代码重构**：全栈 TypeScript 类型强化，前端组件结构优化，安全性升级。

### 🆕 v1.5.3 累积更新 (2026-01-05)

-  **图标上传**：支持将本地图片设为网站图标。
- 🐛 **导入修复**：修复数据导入后未正确保存的问题。
- 🛡️ **权限修复**：解决 `optionalAuth` 导致的权限识别错误。
- 🖼️ **自定义图标**：支持手动设置图标 URL。

<details>
<summary>点击查看更早的版本记录 (View Older History)</summary>

### 🆕 v1.3.5 更新摘要 (2025-12-29)

- ⚡ **性能重构**：前端后台实施组件懒加载 (Lazy Loading)；后端全面迁移至 MVC 架构。
- 🌍 **国际化增强**：系统提示与错误信息支持全量中英双语。
- 🛡️ **安全防护**：新增全局 API 超频防护 (Rate Limiting)。

### 🆕 v1.3.3 更新摘要 (2025-12-28)

- 🛡️ **数据全量迁移保护**：引入智能迁移引擎。当更新容器或修改管理员名称后，系统会自动检测并搬迁存量数据文件，彻底杜绝“版本升级导致数据丢失”的问题。
- 🔗 **持久化路径精准路由**：重构后端定位逻辑，主管理员数据始终同步至全局可见的 `data.json`。

### 🆕 v1.3.x 历史优化记录

- 💾 **数据自动同步**：后台所有写操作（增删改、导入）均已改为自动静默同步。
- 📐 **导航栏对称修正**：修复分类导航栏在居中对齐时的物理几何偏移。
- 🔍 **双模式搜索**：集成本地书签与在线搜索引擎。

### 🆕 v1.3.0 更新摘要 (2025-12-28)

- 🔍 **双模式搜索**：单搜索框集成本地书签搜索与在线搜索引擎切换。
- 🎯 **搜索引擎管理**：登录后可自定义添加、编辑、删除、排序搜索引擎。
- 💫 **搜索建议**：在线模式自动获取百度/Google 搜索建议。
- 🌐 **权限优化**：未登录用户可使用在线搜索但不能修改引擎配置。

### 🆕 v1.2.0 更新摘要 (2025-12-24)

- 🚀 **架构重构**：管理后台全面组件化，性能与可维护性飞跃。
- 💎 **视觉升级**：重构全局玻璃态样式，白天模式清晰度大幅提振。
- ☁️ **多时区同步**：首页时钟支持按后台设定的时区显示。
- 📦 **逻辑优化**：导入功能由"覆盖"升级为"智能合并（去重）"。
- 🔗 **路由净化**：全面启用 History 路由并移除首页后缀。

### 📜 v1.1.x 历史功能

- 🏷️ **标签筛选**：首页支持按标签筛选书签，支持多标签组合
- 🔥 **热门访问**：首页展示 Top 10 点击排行
- 🩺 **链接健康检查**：管理后台批量检测无效链接
- 🖼️ **背景图更换**：支持自定义 URL 或本地上传
- 🔐 **JWT Secret 自动生成**：无需手动配置，首次启动自动生成
- 🛡️ **安全增强**：CSP + CORS 配置优化

</details>

## 📚 API 文档 (API Documentation)

后端 API 基于 Express 开发，主要端点包括：

- `POST /api/login` - 用户登录
- `GET /api/data` - 获取全量导航数据 (支持用户参数)
- `POST /api/data` - 更新全量导航数据
- `POST /api/sites/:id/click` - 记录点击统计
- `GET /api/admin/stats` - 获取统计数据 (需要管理员权限)
- `GET /api/admin/users` - 用户管理 (需要管理员权限)

详细文档请参考后端代码或等待后续更新。

## 🚀 快速部署 (Quick Start)

### 1. 编辑 docker-compose.yml

```yaml
services:
  starnav:
    image: starwisher/starnav:latest
    container_name: starnav
    ports:
      - "3333:3333"
    volumes:
      - ./data:/app/data  # 挂载数据目录 (存放 starnav.db)
    environment:
      - ADMIN_USERNAME=admin # 管理员用户名
      - ADMIN_PASSWORD=admin123 # 管理员密码。注意：若设为默认值 admin123，系统将强制生成随机密码并输出到日志。
      - JWT_SECRET=your-secret-key-here # ⚠️ 必须修改为随机长字符串以保证安全
      # - CORS_ORIGINS=https://your-domain.com # 生产环境设置允许的域名
    restart: always
```

### 2. 启动

```bash
docker-compose up -d
```

访问 `http://localhost:3333` 即可开始使用。

## ⚙️ 系统管理

- **初始管理员**：用户名 `admin`。密码由 `ADMIN_PASSWORD` 指定。若未设置或使用默认值 `admin123`，请在 `docker logs` 中查看随机生成的初始密码。
- **内容可见性**：如果你设置了书签的"所需等级"大于 0，则未登录用户将无法看到该书签。
- **注册开关**：默认注册功能是关闭的，请在后台"系统设置"中开启。
- **数据库备份**：备份 `data/starnav.db` 文件即可。

## 📂 项目结构

```
.
├── backend/             # Node.js + Express 后端
│   ├── routes/          # API 路由接口
│   ├── controllers/     # 业务解析控制器
│   ├── middleware/      # 安全与权限中间件
│   ├── services/        # 数据处理核心逻辑 (含 SQLite 服务)
│   └── config/          # 系统环境变量与常量配置
├── frontend/            # Vue 3 + Vite 前端
│   ├── components/      # 玻璃态 UI 组件库
│   ├── composables/     # Vue Composition API 可复用逻辑
│   ├── store/           # Pinia 响应式状态管理
│   ├── views/           # SPA 页面路由入口
│   └── locales/         # i18n 多语言包 (中/英)
├── common/              # 前后端共享模块
│   ├── url.js           # URL 规范化与清洗
│   ├── constants.js     # 用户等级常量
│   └── sanitize.js      # 输入消毒工具
├── browser-extension/   # 浏览器扩展 (Chrome/Edge/Firefox)
│   ├── popup/           # 弹窗界面
│   ├── options/         # 设置页面
│   └── utils/           # 扩展工具函数
├── tests/               # 单元测试 (Vitest)
│   └── common/          # 共享模块测试
├── data/                # 持久化存储
│   └── starnav.db       # SQLite 数据库文件
├── server.js            # 服务端入口
├── vitest.config.ts     # 测试框架配置
├── Dockerfile           # 多架构镜像构建
└── docker-compose.yml   # 容器编排
```

## 📄 开源说明

本项目遵循 MIT 协议开源。欢迎 Star 或贡献代码！
