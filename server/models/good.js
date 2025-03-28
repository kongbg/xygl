import db from '../db/index.js';

export default class GoodModel {
  static async getAll(params = {}) {
    await db.read();
    let goods = db.data.goods || [];
    
    // 过滤已删除的商品
    goods = goods.filter(good => good.delFlag === 0);
    
    // 如果没有指定shopId，获取所有商品并按想要人数排序
    if (!params.shopId) {
      return goods.sort((a, b) => {
        const wantA = parseInt(a.wantCot) || 0;
        const wantB = parseInt(b.wantCot) || 0;
        return wantB - wantA; // 从大到小排序
      });
    }
    
    // 按店铺ID筛选
    return goods.filter(good => good.shopId === params.shopId);
  }

  static async add(good) {
    await db.read();
    if (!db.data.goods) {
      db.data.goods = [];
    }

    if (Array.isArray(good)) {
      db.data.goods = db.data.goods.concat(good);
    } else {
      db.data.goods.push(good);
    }
    await db.write();
    return good;
  }

  static async update(goodId, updates) {
    await db.read();
    const good = db.data.goods.find(g => g.goodId === parseInt(goodId));
    if (good) {
      Object.assign(good, updates);
      await db.write();
      return good;
    }
    return null;
  }

  static async delete(goodId) {
    await db.read();
    const good = db.data.goods.find(g => g.goodId === parseInt(goodId));
    if (good) {
      good.delFlag = 1;
      await db.write();
      return good;
    }
    return null;
  }

  static async getById(goodId) {
    await db.read();
    return db.data.goods.find(g => g.goodId === parseInt(goodId));
  }

  static async getByShopId(shopId) {
    await db.read();
    return db.data.goods.find(g => g.shopId == shopId);
  }
} 