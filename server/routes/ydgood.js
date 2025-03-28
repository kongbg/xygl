import Router from 'koa-router';
import YdGoodModel from '../models/ydgood.js';

const router = new Router({ prefix: '/api/ydgoods' });

// 获取商品列表
router.get('/', async (ctx) => {
  const { shopId } = ctx.query;
  if (!shopId) {
    ctx.throw(400, '店铺ID不能为空');
  }
  const goods = await YdGoodModel.getAll(shopId);
  // 过滤掉已删除的商品
  const activeGoods = goods.filter(good => good.delFlag === 0);
  ctx.body = ctx.pagination.paginate(activeGoods);
});

// 添加商品
router.post('/', async (ctx) => {
  const { shopId, shareUrl, urls } = ctx.request.body;
  if (!shopId || !shareUrl) {
    ctx.throw(400, '店铺ID和商品链接不能为空');
  }
  const good = await YdGoodModel.add({ shopId, shareUrl, urls });
  ctx.body = good;
});

// 更新商品
router.put('/:goodId', async (ctx) => {
  const { goodId } = ctx.params;
  const good = await YdGoodModel.update(goodId, ctx.request.body);
  if (good) {
    ctx.body = good;
  } else {
    ctx.throw(404, '商品不存在');
  }
});

// 删除商品
router.delete('/:goodId', async (ctx) => {
  const { goodId } = ctx.params;
  const good = await YdGoodModel.delete(goodId);
  if (good) {
    ctx.body = good;
  } else {
    ctx.throw(404, '商品不存在');
  }
});

export default router; 