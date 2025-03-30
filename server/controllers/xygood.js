import GoodModel from '../models/xygood.js';
import YdglTool from '../utils/ydgltool.js';

// 获取商品列表
export const getGoods = async (ctx) => {
  const ydglToken = ctx.state.ydglToken;
  const accountId = ctx.state.ydglAccountId;
  const params = JSON.parse(JSON.stringify(ctx.query));

  try {
    const goods = await YdglTool.getXYGoods(params, ydglToken);

    if (ctx.query.pagination) {
      ctx.body = ctx.pagination.paginate(goods);
    } else {
      ctx.body = goods;
    }
  } catch (error) {
    console.error(`Error getting goods for account ${accountId}:`, error);
    ctx.throw(500, 'Failed to get goods: ' + error.message);
  }
};

// 添加商品
export const addGood = async (ctx) => {
  const { shopId, shareUrl, urls } = ctx.request.body;
  if (!shopId || !shareUrl) {
    ctx.throw(400, '店铺ID和商品链接不能为空');
  }
  const good = await GoodModel.add({ shopId, shareUrl, urls });
  ctx.body = good;
};

// 更新商品
export const updateGood = async (ctx) => {
  const { goodId } = ctx.params;
  const good = await GoodModel.update(goodId, ctx.request.body);
  if (good) {
    ctx.body = good;
  } else {
    ctx.throw(404, '商品不存在');
  }
};

// 删除商品
export const deleteGood = async (ctx) => {
  const { goodId } = ctx.params;
  const good = await GoodModel.delete(goodId);
  if (good) {
    ctx.body = good;
  } else {
    ctx.throw(404, '商品不存在');
  }
};

// 解析商品信息
export const parseGood = async (ctx) => {
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
};

export async function someYdglController(ctx) {
  const ydglToken = ctx.state.ydglToken; // 获取中间件中设置的token

  // 使用token调用YdglTool的方法
  const result = await YdglTool.someMethod(ydglToken, ...otherParams);

  // ... 其他逻辑
} 