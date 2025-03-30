import BaseModel from './BaseModel.js';

class SourceModel extends BaseModel {
    constructor() {
        super('sources');
    }

    // 导入商品数据到资源库
    async importFromGoods(goods) {
        if (!Array.isArray(goods)) {
            goods = [goods];
        }

        const sources = goods.map(good => ({
            name: good.name || good.title,
            shareUrl: good.shareUrl,
            description: good.description || good.desc,
            price: good.price,
            originalGoodId: good.id,
            no: good.no,
            picUrl: good.picUrl,
            urls: good.urls
        }));

        return this.addMany(sources);
    }

    // 根据商品ID查询资源
    async getByGoodId(goodId) {
        return this.find({
            originalGoodId: goodId,
            includeDeleted: false
        });
    }

    // 查询有效的资源链接
    async getValidSources() {
        return this.find({
            shareUrl: 'nonEmpty',
            delFlag: 0,
            sort: 'createTime:desc'
        });
    }

    // 按价格区间查询
    async getByPriceRange(minPrice, maxPrice) {
        return this.find({
            price: {
                $gte: minPrice,
                $lte: maxPrice
            },
            sort: 'price:asc'
        });
    }

    // 搜索资源
    async search(keyword, options = {}) {
        const { page = 1, pageSize = 10, sort = 'createTime:desc' } = options;

        return this.find({
            $or: [
                { name: { $like: keyword } },
                { description: { $like: keyword } },
                { no: { $like: keyword } }
            ],
            sort,
            page,
            pageSize
        });
    }
}

export default new SourceModel(); 