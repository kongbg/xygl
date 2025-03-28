import Router from 'koa-router';
import GoodModel from '../models/good.js';

const router = new Router({ prefix: '/api/goods' });

// 获取商品列表
router.get('/', async (ctx) => {
  const { shopId } = ctx.query;
  if (!shopId) {
    ctx.throw(400, '店铺ID不能为空');
  }
  const goods = await GoodModel.getAll(shopId);
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
  const good = await GoodModel.add({ shopId, shareUrl, urls });
  ctx.body = good;
});

// 更新商品
router.put('/:goodId', async (ctx) => {
  const { goodId } = ctx.params;
  const good = await GoodModel.update(goodId, ctx.request.body);
  if (good) {
    ctx.body = good;
  } else {
    ctx.throw(404, '商品不存在');
  }
});

// 删除商品
router.delete('/:goodId', async (ctx) => {
  const { goodId } = ctx.params;
  const good = await GoodModel.delete(goodId);
  if (good) {
    ctx.body = good;
  } else {
    ctx.throw(404, '商品不存在');
  }
});

// 解析商品信息
router.post('/:goodId/parse', async (ctx) => {
  const { goodId } = ctx.params;
  const good = await GoodModel.getById(goodId);
  
  if (!good) {
    ctx.throw(404, '商品不存在');
  }

  try {
    // 模拟解析过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 更新商品信息
    const updates = {
      name: `商品${goodId}`,
      wantCot: Math.floor(Math.random() * 1000),
      viewCot: Math.floor(Math.random() * 5000),
      price: Math.floor(Math.random() * 10000) / 100,
      stock: Math.floor(Math.random() * 1000),
      no: `NO${Math.floor(Math.random() * 1000000)}`,
      description: `这是商品${goodId}的详细描述`,
      autoPush: false,
      isExtract: true
    };
    
    const updatedGood = await GoodModel.update(goodId, updates);
    ctx.body = updatedGood;
  } catch (error) {
    ctx.throw(500, '解析失败：' + error.message);
  }
});

export default router; 