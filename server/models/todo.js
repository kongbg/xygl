import db from '../db/index.js';

export default class TodoModel {
  static async getAll() {
    await db.read();
    return db.data.todos;
  }

  static async add(todo) {
    await db.read();
    const newTodo = {
      id: Date.now(),
      name: todo.name,
      completed: false,
      createTime: new Date().toISOString()
    };
    db.data.todos.push(newTodo);
    await db.write();
    return newTodo;
  }

  static async update(id, updates) {
    await db.read();
    const todo = db.data.todos.find(t => t.id === parseInt(id));
    if (todo) {
      Object.assign(todo, updates);
      await db.write();
      return todo;
    }
    return null;
  }

  static async delete(id) {
    await db.read();
    const index = db.data.todos.findIndex(t => t.id === parseInt(id));
    if (index !== -1) {
      const [removed] = db.data.todos.splice(index, 1);
      await db.write();
      return removed;
    }
    return null;
  }
} 