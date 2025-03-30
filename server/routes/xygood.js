import Router from 'koa-router';
import * as controller from '../controllers/xygood.js';

const router = new Router({ prefix: '/api/ydgl/xygoods' });

// 获取商品列表
router.get('/', controller.getGoods);

// 添加商品
router.post('/', controller.addGood);

// 更新商品
router.put('/:goodId', controller.updateGood);

// 删除商品
router.delete('/:goodId', controller.deleteGood);

// 解析商品信息
router.post('/:goodId/parse', controller.parseGood);

export default router; 