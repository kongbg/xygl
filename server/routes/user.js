import Router from 'koa-router';
import UserModel from '../models/user.js';
import jwt from 'jsonwebtoken';
import svgCaptcha from 'svg-captcha';

const router = new Router({ prefix: '/api/user' });
const JWT_SECRET = 'Admin-Token'; // 使用与 session 相同的密钥

// 获取验证码
router.get('/captcha', async (ctx) => {
  const captcha = svgCaptcha.create({
    size: 4,
    noise: 2,
    color: true,
    background: '#f0f2f5'
  });
  
  // 将验证码存储在session中
  ctx.session.captcha = captcha.text.toLowerCase();
  
  ctx.body = {
    image: captcha.data
  };
});

// 注册
router.post('/register', async (ctx) => {
  const { username, password, captcha } = ctx.request.body;

  // 验证验证码
  if (!captcha || captcha.toLowerCase() !== ctx.session.captcha) {
    ctx.throw(400, '验证码错误');
  }

  try {
    const user = await UserModel.create({ username, password });
    ctx.body = user;
  } catch (error) {
    ctx.throw(400, error.message);
  }
});

// 登录
router.post('/login', async (ctx) => {
  const { username, password, captcha } = ctx.request.body;

  // 验证验证码
  if (!captcha || captcha.toLowerCase() !== ctx.session.captcha) {
    ctx.throw(400, '验证码错误');
  }

  const user = await UserModel.validateUser(username, password);
  if (!user) {
    ctx.throw(401, '用户名或密码错误');
  }

  // 生成 JWT token
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '24h'
  });

  ctx.body = {
    token,
    user
  };
});

export default router; 