import Koa from 'koa';
import { koaBody } from 'koa-body';
import cors from '@koa/cors';
import session from 'koa-session';
import registerRoutes from './routes/index.js';
import responseHandler from './middleware/response.js';
import paginationHandler from './middleware/pagination.js';

const app = new Koa();

// session配置
app.keys = ['Admin-Token']; // 在实际应用中应该使用环境变量
const SESSION_CONFIG = {
  key: 'koa:sess',
  maxAge: 86400000,
  autoCommit: true,
  overwrite: true,
  httpOnly: true,
  signed: true,
  rolling: false,
  renew: false,
};

// 注册中间件
app.use(session(SESSION_CONFIG, app));
app.use(koaBody());
app.use(cors({
  credentials: true, // 允许跨域携带cookie
  origin: 'http://localhost:5173' // 允许的前端域名
}));
app.use(responseHandler);
app.use(paginationHandler);

// 自动注册路由
registerRoutes(app);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
}); 