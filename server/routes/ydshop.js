import Router from 'koa-router';
import YdShopModel from '../models/ydshop.js';
import * as controller from '../controllers/ydshop.js';

const router = new Router({ prefix: '/api/ydshops' });

// 获取店铺列表
router.get('/', async (ctx) => {
  const shops = await YdShopModel.getAll();
  // 过滤掉已删除的店铺
  const activeShops = shops.filter(shop => shop.delFlag === 0);
  ctx.body = ctx.pagination.paginate(activeShops);
});

// 添加店铺
router.post('/', controller.addData);

// 解析店铺主页信息
router.post('/:shopId/parse', controller.parse);

// 解析店铺商品概览信息
router.post('/:shopId/parseGood', controller.parseGood);

// 更新店铺
router.put('/:shopId', async (ctx) => {
  const { shopId } = ctx.params;
  const shop = await YdShopModel.update(shopId, ctx.request.body);
  if (shop) {
    ctx.body = shop;
  } else {
    ctx.throw(404, '店铺不存在');
  }
});

// 删除店铺
router.delete('/:shopId', async (ctx) => {
  const { shopId } = ctx.params;
  const shop = await YdShopModel.delete(shopId);
  if (shop) {
    ctx.body = shop;
  } else {
    ctx.throw(404, '店铺不存在');
  }
});

export default router; 