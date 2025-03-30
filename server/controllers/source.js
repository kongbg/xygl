import SourceModel from '../models/source.js';
import GoodModel from '../models/good.js';

// 获取资源列表
export const getSources = async (ctx) => {
    let params = ctx.query;
    const sources = await SourceModel.find(params);
    ctx.body = sources
};

// 添加资源
export const addSource = async (ctx) => {
    const sourceData = ctx.request.body;
    if (!sourceData.shareUrl) {
        ctx.throw(400, '资源链接不能为空');
    }

    const source = await SourceModel.add(sourceData);
    ctx.body = source;
};

// 更新资源
export const updateSource = async (ctx) => {
    const { id } = ctx.params;
    const updates = ctx.request.body;

    const source = await SourceModel.update(id, updates);
    if (source) {
        ctx.body = source;
    } else {
        ctx.throw(404, '资源不存在');
    }
};

// 删除资源
export const deleteSource = async (ctx) => {
    const { id } = ctx.params;
    const source = await SourceModel.delete(id);
    if (source) {
        ctx.body = source;
    } else {
        ctx.throw(404, '资源不存在');
    }
};

// 从商品导入资源
export const importFromGoods = async (ctx) => {
    try {
        const goods = await GoodModel.getAll();
        const validGoods = goods.filter(good => good.shareUrl && good.delFlag === 0);

        for (const good of validGoods) {
            await SourceModel.add({
                name: good.name,
                shareUrl: good.shareUrl,
                description: good.description,
                price: good.price,
                originalGoodId: good.id
            });
        }

        ctx.body = {
            message: `成功导入 ${validGoods.length} 个资源`
        };
    } catch (error) {
        ctx.throw(500, '导入失败：' + error.message);
    }
}; 