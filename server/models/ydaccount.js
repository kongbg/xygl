import db from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export default class YdAccountModel {
  static async getAll() {
    await db.read();
    return db.data.ydaccounts || [];
  }

  static async add(account) {
    await db.read();
    const newAccount = {
      id: uuidv4(),
      username: account.username,
      password: account.password, // 直接保存明文密码
      token: account.token || '',
      expires_time: account.expires_time || 0,
      isBind: account.isBind || false,
      status: 1,  // 1: 正常, 0: 禁用
      delFlag: 0, // 0: 正常, 1: 已删除
      publishedGoods: [],
      createTime: new Date().toISOString()
    };

    if (!db.data.ydaccounts) {
      db.data.ydaccounts = [];
    }
    db.data.ydaccounts.push(newAccount);
    await db.write();
    return newAccount;
  }

  static async update(id, updates) {
    await db.read();
    const account = db.data.ydaccounts.find(a => a.id === id);
    if (account) {
      // 直接更新密码，不做加密
      Object.assign(account, updates);
      await db.write();
      return account;
    }
    return null;
  }

  static async delete(id) {
    await db.read();
    const account = db.data.ydaccounts.find(a => a.id === id);
    if (account) {
      account.delFlag = 1;
      await db.write();
      return account;
    }
    return null;
  }

  static async getById(id) {
    await db.read();
    return db.data.ydaccounts.find(a => a.id === id);
  }

  static async getByIds(ids) {
    await db.read();
    return db.data.ydaccounts.filter(a => ids.includes(a.id));
  }
} 