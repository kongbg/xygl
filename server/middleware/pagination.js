// 分页中间件
export default async function paginationHandler(ctx, next) {
  // 获取分页参数
  const page = parseInt(ctx.query.page) || 1;
  const pageSize = parseInt(ctx.query.pageSize) || 10;
  
  // 添加分页方法到上下文
  ctx.pagination = {
    page,
    pageSize,
    // 分页处理方法
    paginate(data) {
      const total = data.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      
      return {
        list: data.slice(start, end),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    }
  };
  
  await next();
} 