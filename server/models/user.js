import db from '../db/index.js';
import bcrypt from 'bcryptjs';

export default class UserModel {
  static async findByUsername(username) {
    await db.read();
    return db.data.users.find(user => user.username === username);
  }

  static async create(userData) {
    await db.read();
    
    // 检查用户名是否已存在
    const existingUser = await this.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUser = {
      id: Date.now(),
      username: userData.username,
      password: hashedPassword,
      createTime: new Date().toISOString()
    };

    if (!db.data.users) {
      db.data.users = [];
    }
    db.data.users.push(newUser);
    await db.write();

    // 返回用户信息（不包含密码）
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  static async validateUser(username, password) {
    const user = await this.findByUsername(username);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
} 