import Router from 'koa-router';
import * as controller from '../controllers/ydaccount.js';

const router = new Router({ prefix: '/api/ydaccounts' });

// 获取账号列表
router.get('/', controller.getAccounts);

// 添加账号
router.post('/', controller.addAccount);

// 更新账号
router.put('/:id', controller.updateAccount);

// 删除账号
router.delete('/:id', controller.deleteAccount);

// 获取单个账号
router.get('/:id', controller.getAccount);

// 更新账号状态
router.put('/:id/status', controller.updateStatus);

// 更新账号绑定状态
router.put('/:id/bind', controller.updateBindStatus);

// 刷新token
router.post('/:id/refresh', controller.refreshToken);

// 检查扫码状态
router.get('/scan/:instanceId', controller.checkScanStatus);

export default router; 