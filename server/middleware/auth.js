import jwt from 'jsonwebtoken';

const SECRET_KEY = 'Admin-Token'; // 在实际应用中应该使用环境变量

export default async function authMiddleware(ctx, next) {
    const token = ctx.headers.authorization?.split(' ')[1];

    if (token) {
        try {
            // 验证并解析token
            const decoded = jwt.verify(token, SECRET_KEY);

            // 将解析出的用户信息添加到ctx.state中，供后续中间件和控制器使用
            ctx.state.user = decoded;
        } catch (err) {
            // token验证失败
            ctx.status = 401;
            ctx.body = {
                code: 401,
                message: '无效的token'
            };
            return;
        }
    }

    await next();
} 