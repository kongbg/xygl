import YdglTool from '../utils/ydgltool.js';
import YdAccountModel from '../models/ydaccount.js';
import { getAccountById, updateAccountInfo } from '../controllers/ydaccount.js';

// 用于存储和管理YdglTool token的对象
const tokenManager = {
    tokens: new Map(), // 使用Map存储多个账号的token
    isLoggingIn: new Set() // 记录正在登录的账号
};

async function refreshYdglToken(accountId) {
    if (tokenManager.isLoggingIn.has(accountId)) {
        // 如果该账号正在登录，等待登录完成
        return new Promise((resolve) => {
            const checkToken = setInterval(() => {
                if (!tokenManager.isLoggingIn.has(accountId)) {
                    clearInterval(checkToken);
                    resolve(tokenManager.tokens.get(accountId));
                }
            }, 100);
        });
    }

    try {
        tokenManager.isLoggingIn.add(accountId);

        // 获取账号信息
        const account = await getAccountById(accountId);
        if (!account) {
            throw new Error(`No YdglTool account found for id: ${accountId}`);
        }

        // 获取key
        const key = await YdglTool.getKey();
        console.log('获取key:', key, account.username, account.password);

        // 使用账号登录
        const loginResult = await YdglTool.login(account.username, account.password, key);

        if (loginResult.success) {
            const tokenInfo = {
                token: loginResult.token,
                lastLoginTime: Date.now(),
                expires_time: loginResult.expires_time
            };

            // 更新内存中的token
            tokenManager.tokens.set(accountId, tokenInfo);

            // 更新数据库中的token
            await updateAccountInfo(accountId, { token: loginResult.token, expires_time: loginResult.expires_time });

            return tokenInfo;
        } else {
            throw new Error('YdglTool login failed');
        }
    } finally {
        tokenManager.isLoggingIn.delete(accountId);
    }
}

export default async function ydglAuthMiddleware(ctx, next) {
    // 检查是否是YdglTool相关的接口
    if (ctx.path.includes('/api/ydgl/')) {
        try {
            // 从请求参数或URL中获取accountId
            const accountId = ctx.query.accountId || ctx.params.accountId;

            if (!accountId) {
                ctx.throw(400, 'YdglTool account ID is required');
                return;
            }

            delete ctx.query.accountId;

            let tokenInfo = await YdAccountModel.getById(accountId);
            // console.log('tokenInfo:', tokenInfo);

            // 使用expires_time判断token是否过期
            const now = Date.now();
            const isExpired = !tokenInfo ||
                !tokenInfo.expires_time ||
                now >= tokenInfo.expires_time * 1000;

            console.log('now:', now, 'expires_time:', tokenInfo.expires_time * 1000, 'isExpired:', isExpired);
            if (isExpired) {
                console.log('鱼店token过期，刷新token');
                tokenInfo = await refreshYdglToken(accountId);
            }

            // 将token添加到请求上下文中
            ctx.state.ydglToken = tokenInfo.token;
            ctx.state.ydglAccountId = accountId;
            ctx.state.ydglTokenExpiresTime = tokenInfo.expires_time;

        } catch (error) {
            console.error('YdglTool auth error:', error);
            ctx.status = 500;
            ctx.body = {
                code: 500,
                message: 'YdglTool authentication failed: ' + error.message
            };
            return;
        }
    }

    await next();
} 