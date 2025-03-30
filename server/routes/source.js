import Router from 'koa-router';
import * as sourceController from '../controllers/source.js';

const router = new Router({
    prefix: '/api/sources'
});

// 获取资源列表
router.get('/', sourceController.getSources);

// 添加资源
router.post('/', sourceController.addSource);

// 更新资源
router.put('/:id', sourceController.updateSource);

// 删除资源
router.delete('/:id', sourceController.deleteSource);

// 从商品导入资源
router.post('/import-from-goods', sourceController.importFromGoods);

export default router; 