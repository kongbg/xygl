import db from '../db/index.js';

export default class YdShopModel {
  static async getAll() {
    await db.read();
    return db.data.ydshops || [];
  }

  static async add(shop) {
    await db.read();
    const newShop = {
      ...shop,
      status: 1,  // 1: 正常, 0: 禁用
      delFlag: 0, // 0: 正常, 1: 已删除
      createTime: new Date().toISOString()
    };

    if (!db.data.ydshops) {
      db.data.ydshops = [];
    }
    db.data.ydshops.push(newShop);
    await db.write();
    return newShop;
  }

  static async update(shopId, updates) {
    await db.read();
    const shop = db.data.ydshops.find(s => s.shopId === shopId);
    if (shop) {
      Object.assign(shop, updates);
      await db.write();
      return shop;
    }
    return null;
  }

  static async delete(shopId) {
    await db.read();
    const shop = db.data.ydshops.find(s => s.shopId === shopId);
    if (shop) {
      shop.delFlag = 1;
      await db.write();
      return shop;
    }
    return null;
  }

  static async getById(shopId) {
    await db.read();
    return db.data.ydshops.find(s => s.shopId === shopId);
  }
} 