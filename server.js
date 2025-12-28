import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { fileURLToPath } from 'url';

// 导入后端核心模块 (从 backend 目录)
import { initService } from './backend/services/initService.js';
import { logger } from './backend/services/db.js';
import { UPLOADS_DIR } from './backend/config/index.js';

// 导入路由模块
import authRoutes from './backend/routes/auth.js';
import bookmarkRoutes from './backend/routes/bookmarks.js';
import systemRoutes from './backend/routes/system.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3333;

// 信任反向代理，用于正确获取客户端 IP（解决 express-rate-limit 验证问题）
app.set('trust proxy', 1);

// 1. 系统初始化
initService.init();

// 2. 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https:", "http:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS 配置 (精简版)
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3333', 'http://127.0.0.1:3333', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS 被拒绝', { origin });
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
}));

// Gzip 压缩
app.use(compression());

// 3. 基础解析中间件
app.use(express.json({ limit: '10mb' }));

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// 4. 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(UPLOADS_DIR));

// 5. API 路由集成
app.use('/api', authRoutes);
app.use('/api', bookmarkRoutes);
app.use('/api', systemRoutes);

// SPA 支持
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// 6. 全局错误处理
app.use((err, req, res, next) => {
  logger.error('服务器错误', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 StarNav Server v1.3.0`);
  console.log(`   Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
