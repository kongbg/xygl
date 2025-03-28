import db from '../db/index.js';

export default class GoodModel {
  static async getAll(shopId) {
    await db.read();
    return (db.data.goods || []).filter(good => good.shopId == shopId);
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