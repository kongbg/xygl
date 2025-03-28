import db from '../db/index.js';

export default class YdGoodModel {
  static async getAll(shopId) {
    await db.read();
    return (db.data.ydgoods || []).filter(good => good.shopId == shopId);
  }

  static async add(good) {
    await db.read();
    if (!db.data.ydgoods) {
      db.data.ydgoods = [];
    }

    if (Array.isArray(good)) {
      db.data.ydgoods = db.data.ydgoods.concat(good);
    } else {
      db.data.ydgoods.push(good);
    }
    await db.write();
    return good;
  }

  static async update(goodId, updates) {
    await db.read();
    const good = db.data.ydgoods.find(g => g.goodId === goodId);
    if (good) {
      Object.assign(good, updates);
      await db.write();
      return good;
    }
    return null;
  }

  static async delete(goodId) {
    await db.read();
    const good = db.data.ydgoods.find(g => g.goodId === goodId);
    if (good) {
      good.delFlag = 1;
      await db.write();
      return good;
    }
    return null;
  }

  static async getById(goodId) {
    await db.read();
    return db.data.ydgoods.find(g => g.goodId === goodId);
  }

  static async getByShopId(shopId) {
    await db.read();
    return db.data.ydgoods.find(g => g.shopId == shopId);
  }
} 