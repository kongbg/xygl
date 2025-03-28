// 统一响应处理中间件
export default async function responseHandler(ctx, next) {
  try {
    // 等待下游中间件执行完成
    await next();
    
    // 处理响应数据
    if (ctx.body !== undefined) {
      ctx.body = {
        code: 0,
        data: ctx.body,
        message: 'success'
      };
    }
  } catch (err) {
    // 错误处理
    ctx.status = err.status || 500;
    ctx.body = {
      code: err.status || 500,
      message: err.message || 'Internal Server Error',
      data: null
    };
    
    // 输出错误日志
    console.error('Error:', err);
  }
} 