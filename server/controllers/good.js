import GoodModel from '../models/good.js';

// 获取商品列表
export const getGoods = async (ctx) => {
  const { shopId } = ctx.query;
  const goods = await GoodModel.getAll({ shopId });
  
  // 分页处理
  ctx.body = ctx.pagination.paginate(goods);
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