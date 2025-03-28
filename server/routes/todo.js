import Router from 'koa-router';
import TodoModel from '../models/todo.js';

const router = new Router({ prefix: '/api/todos' });

// 获取待办事项列表（带分页）
router.get('/', async (ctx) => {
  const todos = await TodoModel.getAll();
  // 使用分页中间件处理数据
  ctx.body = ctx.pagination.paginate(todos);
});

// 添加待办事项
router.post('/', async (ctx) => {
  const todo = await TodoModel.add(ctx.request.body);
  ctx.body = todo;
});

// 更新待办事项
router.put('/:id', async (ctx) => {
  const { id } = ctx.params;
  const todo = await TodoModel.update(id, ctx.request.body);
  if (todo) {
    ctx.body = todo;
  } else {
    ctx.status = 404;
    ctx.body = null;
  }
});

// 删除待办事项
router.delete('/:id', async (ctx) => {
  const { id } = ctx.params;
  const todo = await TodoModel.delete(id);
  if (todo) {
    ctx.body = todo;
  } else {
    ctx.status = 404;
    ctx.body = null;
  }
});

export default router; 