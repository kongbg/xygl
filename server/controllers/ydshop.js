import YdShopModel from '../models/ydshop.js';
import { v4 as uuidv4 } from 'uuid';
import puppeteer from 'puppeteer-core';

// 解析店铺主页信息
export const parse = async (ctx) => {
  const { shopId } = ctx.params;
  const shop = await YdShopModel.getById(shopId);
  
  if (!shop) {
    ctx.throw(404, '店铺不存在');
  }

  try {
    // 启动浏览器
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: false
    });

    const page = await browser.newPage();
    await page.goto(shop.url, { waitUntil: 'networkidle0' });

    // 提取店铺信息
    const shopInfo = await page.evaluate(() => {
      const name = document.querySelector('.shop-name')?.textContent?.trim() || '';
      const introduction = document.querySelector('.shop-intro')?.textContent?.trim() || '';
      return { name, introduction };
    });

    await browser.close();

    // 更新店铺信息
    const updates = {
      name: shopInfo.name,
      introduction: shopInfo.introduction,
      isExtract: true
    };
    
    const updatedShop = await YdShopModel.update(shopId, updates);
    ctx.body = updatedShop;
  } catch (error) {
    ctx.throw(500, '解析失败：' + error.message);
  }
};

// 解析店铺商品概览信息
export const parseGood = async (ctx) => {
  const { shopId } = ctx.params;
  const shop = await YdShopModel.getById(shopId);
  
  if (!shop) {
    ctx.throw(404, '店铺不存在');
  }

  try {
    // 启动浏览器
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: false
    });

    const page = await browser.newPage();
    await page.goto(shop.url, { waitUntil: 'networkidle0' });

    // 提取商品列表信息
    const goodsList = await page.evaluate(() => {
      const items = document.querySelectorAll('.item');
      return Array.from(items).map(item => ({
        goodId: item.getAttribute('data-id'),
        name: item.querySelector('.title')?.textContent?.trim() || '',
        price: parseFloat(item.querySelector('.price')?.textContent?.replace('¥', '') || '0'),
        picUrl: item.querySelector('img')?.src || ''
      }));
    });

    await browser.close();

    // 更新店铺商品数量
    await YdShopModel.update(shopId, {
      productCount: goodsList.length
    });

    ctx.body = goodsList;
  } catch (error) {
    ctx.throw(500, '解析失败：' + error.message);
  }
};

// 添加店铺
export const addData = async (ctx) => {
  const { url } = ctx.request.body;
  if (!url) {
    ctx.throw(400, 'URL不能为空');
  }

  // 生成唯一的店铺ID
  const shopId = uuidv4();
  const shop = await YdShopModel.add({ shopId, url });
  ctx.body = shop;
}; 