import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 获取当前文件的目录路径
const __dirname = dirname(fileURLToPath(import.meta.url));

// 确保使用正确的路径分隔符
const dbFile = join(__dirname, 'db.json');

// 初始数据结构
const defaultData = {
  todos: [],
  users: []  // 添加 users 数组
};

// 确保 db.json 文件存在并包含初始数据
if (!fs.existsSync(dbFile)) {
  // 确保目录存在
  fs.mkdirSync(dirname(dbFile), { recursive: true });
  // 创建文件并写入初始数据
  fs.writeFileSync(dbFile, JSON.stringify(defaultData, null, 2));
}

const adapter = new JSONFile(dbFile);
const db = new Low(adapter, defaultData);

// 初始化数据库
const initDb = async () => {
  try {
    await db.read();
    // 确保数据结构完整
    db.data = db.data || defaultData;
    db.data.todos = db.data.todos || [];
    db.data.users = db.data.users || [];
    await db.write();
  } catch (error) {
    console.error('Database initialization error:', error);
    await db.write();
  }
};

// 确保数据库初始化完成
await initDb();

export default db; 