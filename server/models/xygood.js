import db from '../db/index.js';

export default class GoodModel {
  static async getAll(params = {}) {
    await db.read();
    let goods = db.data.yxgoods || [];

    // 过滤已删除的商品
    goods = goods.filter(good => good.delFlag === 0);

    // 如果没有指定shopId，获取所有商品并按想要人数排序
    if (!params.shopId) {
      let temp = goods.sort((a, b) => {
        const wantA = parseInt(a.wantCot) || 0;
        const wantB = parseInt(b.wantCot) || 0;
        return wantB - wantA; // 从大到小排序
      })

      if (params.shareUrl) {
        temp = temp.filter(good => good.shareUrl);
      }

      let userMap = {};
      db.data.ydaccounts.forEach(account => {
        userMap[account.id] = account.username;
      })


      temp.forEach(good => {
        good.publishedShopName = []
        let publishedShops = good.publishedShops || [];
        publishedShops.forEach(id => {
          // console.log(id, userMap, userMap[id]);
          good.publishedShopName.push(userMap[id])
        })
      })

      return temp;
    }

    // 按店铺ID筛选
    return goods.filter(good => good.shopId === params.shopId);
  }

  static async add(good) {
    await db.read();
    if (!db.data.yxgoods) {
      db.data.yxgoods = [];
    }

    if (Array.isArray(good)) {
      db.data.yxgoods = db.data.yxgoods.concat(good);
    } else {
      db.data.yxgoods.push(good);
    }
    await db.write();
    return good;
  }

  static async update(goodId, updates) {
    await db.read();
    const good = db.data.yxgoods.find(g => g.goodId == goodId);
    if (good) {
      Object.assign(good, updates);
      await db.write();
      return good;
    }
    return null;
  }

  static async delete(goodId) {
    await db.read();
    const good = db.data.yxgoods.find(g => g.goodId === parseInt(goodId));
    if (good) {
      good.delFlag = 1;
      await db.write();
      return good;
    }
    return null;
  }

  static async getById(goodId) {
    await db.read();
    return db.data.yxgoods.find(g => g.goodId === parseInt(goodId));
  }

  static async getByShopId(shopId) {
    await db.read();
    return db.data.yxgoods.find(g => g.shopId == shopId);
  }

  static async getByIds(ids) {
    await db.read();
    return db.data.yxgoods.filter(g => ids.includes(g.id));
  }

  // 通用查询
  static async queryData(params = {}) {
    let data = db.data.yxgoods;
    let queryParams = JSON.parse(JSON.stringify(params));
    delete queryParams.page;
    delete queryParams.pageSize;

    console.log(queryParams);
    // 动态添加查询条件（过滤无效参数）
    const validParams = Object.entries(queryParams).filter(([_, v]) => v !== undefined);
    console.log(validParams);
    validParams.forEach(([key, value]) => {
      if (value === 'nonEmpty') { // 约定 'nonEmpty' 表示字段非空
        data = data.filter(item =>
          item[key] !== null && item[key] !== undefined && item[key] !== ''
        );
      } else if (value !== undefined) { // 普通字段匹配
        data = data.filter({ [key]: value });
      }
    });

    console.log(data.length);

    data = data.sort((a, b) => {
      const wantA = parseInt(a.wantCot) || 0;
      const wantB = parseInt(b.wantCot) || 0;
      return wantB - wantA; // 从大到小排序
    })

    return data;
  }
} 