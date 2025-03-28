import ShopModel from '../models/shop.js';
import GoodModel from '../models/good.js';
import { getUrlParams, getShopInfo, getShopAllGoodInfo, getShopAllGoodDetail } from '../utils/ydgltool.js'

// 新增店铺信息
export const addData = async (ctx) => {
    const { url } = ctx.request.body;
    if (!url) {
      ctx.throw(400, 'URL不能为空');
    }

    let {userId: shopId} = getUrlParams(url)

    let findRes = await ShopModel.getById(shopId)

    if (findRes) {
        ctx.throw(400, '店铺已存在');
    } else {
        let info = {
            shopId: shopId,
            name: "",
            url: url,
            sale: 0,
            productCount: 0,
            isExtract: false,
            status: 1,
            delFlag: 0,
            createTime: ""
        }
        const shop = await ShopModel.add(info);
        ctx.body = shop;
    }
    
};

// 解析店铺主页信息
export const parse = async (ctx) => {
    const { shopId } = ctx.params;
    const shop = await ShopModel.getById(shopId);
    if (!shop) {
      ctx.throw(400, '店铺不存在');
    }

    let info = await getShopInfo({shopId})
    await ShopModel.update(shopId,info);

    ctx.body = {msg: 'ok'};
};

// 解析店铺商品概览信息
export const parseGood = async (ctx) => {
    const { shopId } = ctx.params;
    const shop = await ShopModel.getById(shopId);
    if (!shop) {
      ctx.throw(400, '店铺不存在');
    }

    let goods = await getShopAllGoodInfo({shopId})
    shop.isExtract = true
    await ShopModel.update(shopId,shop);
    await GoodModel.add(goods);

    ctx.body = {msg: 'ok'};
};

// 解析店铺商品详细信息
export const parseGoodDetail = async (ctx) => {
    const { shopId } = ctx.params;
    const shop = await ShopModel.getById(shopId);
    if (!shop) {
      ctx.throw(400, '店铺不存在');
    }

    const goods = await GoodModel.getByShopId(shopId);

    let newGoods = await getShopAllGoodDetail(goods)
    await GoodModel.add(newGoods);

    ctx.body = {msg: 'ok'};
};