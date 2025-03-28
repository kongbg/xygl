import puppeteer from "puppeteer-core"; // 注意使用 core 版本
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import axios from 'axios';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'https://home.ekeew.com';
const BROWSER_PATH = process.platform === "win32"
  ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
  : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// 存储浏览器实例
const browserInstances = new Map();

// 创建axios实例
const request = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
  }
});

export default class YdglTool {
  // 获取key
  static async getKey() {
    try {
      const response = await request.get('/adminapi/login/info');
      if (response.data.status === 200) {
        return response.data.data.key;
      }
      throw new Error(response.data.msg || '获取key失败');
    } catch (error) {
      console.error('获取key失败:', error);
      throw error;
    }
  }

  // 获取登录二维码
  static async getLoginQrCode(account, pwd) {
    let browser = null;
    try {
      browser = await puppeteer.launch({
        executablePath: BROWSER_PATH,
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });

      const page = await browser.newPage();
      let scanSuccess = false;
      
      // 设置视口大小
      await page.setViewport({
        width: 800,
        height: 600
      });
      
      // 监听网络请求
      page.on('response', async (response) => {
        const url = response.url();
        // 监听登录成功的请求
        if (url.includes('/adminapi/yudian')) {
          try {
            const data = await response.json();
            if (data.status === 200) {
              scanSuccess = true;
              // 触发回调
              if (browserInstances.has(instanceId)) {
                const instance = browserInstances.get(instanceId);
                instance.onScanSuccess?.(data.data);
              }
            }
          } catch (error) {
            console.error('解析响应失败:', error);
          }
        }
      });

      // 存储浏览器实例
      const instanceId = `${account}_${Date.now()}`;
      browserInstances.set(instanceId, {
        browser,
        scanSuccess,
        timer: setTimeout(async () => {
          // 3分钟后关闭浏览器
          if (browserInstances.has(instanceId)) {
            const instance = browserInstances.get(instanceId);
            await instance.browser.close();
            browserInstances.delete(instanceId);
          }
        }, 180000) // 3分钟 = 180000毫秒
      });

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
      );

      // 访问登录页面
      await page.goto(
        `https://home.ekeew.com/yudian/xylogin?account=${account}&pwd=${pwd}&type=1`,
        { waitUntil: 'networkidle0' }
      );

      let qrImage;
      try {
        // 先尝试获取iframe中的二维码
        const frames = await page.frames();
        const loginFrame = frames.find(frame => 
          frame.url().includes('/login') || frame.url().includes('/xylogin')
        );
        
        if (loginFrame) {
          // 等待二维码区域加载
          await loginFrame.waitForSelector('.extra-login-content', { timeout: 5000 });
          const qrElement = await loginFrame.$('.extra-login-content');
          qrImage = await qrElement.screenshot({
            encoding: 'base64'
          });
        } else {
          throw new Error('找不到登录iframe');
        }
      } catch (error) {
        console.warn('获取iframe中的二维码失败，将截取整个页面:', error);
        // 如果获取不到二维码元素，就截取整个页面
        await sleep(3000); // 等待页面完全加载
        
        // 获取页面尺寸
        const viewport = await page.viewport();
        
        // 截取右上角固定尺寸区域
        qrImage = await page.screenshot({
          encoding: 'base64',
          clip: {
            x: viewport.width - 320, // 从右边往左320px
            y: 0,
            width: 320, // 固定宽度320px
            height: 400 // 固定高度400px
          }
        });
      }

      return {
        qrCode: qrImage,
        instanceId
      };
    } catch (error) {
      if (browser) await browser.close();
      console.error('获取登录二维码失败:', error);
      throw error;
    }
  }

  // 关闭指定的浏览器实例
  static async closeBrowser(instanceId) {
    if (browserInstances.has(instanceId)) {
      const instance = browserInstances.get(instanceId);
      clearTimeout(instance.timer);
      await instance.browser.close();
      browserInstances.delete(instanceId);
    }
  }

  // 登录
  static async login(account, pwd, key) {
    try {
      const response = await request.post('/adminapi/yudian', {
        account,
        pwd,
        key,
        captchaType: 'blockPuzzle',
        captchaVerification: ''
      });

      if (response.data.status === 200) {
        return {
          token: response.data.data.token,
          expires_time: response.data.data.expires_time
        };
      } else if(response.data.status === 101) { // 需要扫码
        // 获取二维码
        const { qrCode, instanceId } = await this.getLoginQrCode(account, pwd);
        return {
          status: 101,
          qrCode,
          instanceId
        };
      }
      throw new Error(response.data.msg || '登录失败');
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  // 注册扫码成功回调
  static onScanSuccess(instanceId, callback) {
    if (browserInstances.has(instanceId)) {
      const instance = browserInstances.get(instanceId);
      instance.onScanSuccess = callback;
    }
  }
}

export const getShopInfo = async (params) => {
    return new Promise(async (resolve, reject) => {
        let { shopId } = params;

        let browser = null;
        // 配置浏览器路径（需根据实际情况修改）=
        const BROWSER_PATH =
        process.platform === "win32"
            ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
            : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

        try {
          browser = await puppeteer.launch({
              executablePath: BROWSER_PATH, // 关键配置
              headless: !true,
              args: ["--no-sandbox", "--disable-setuid-sandbox"],
          });

          const page = await browser.newPage();
          await page.setUserAgent(
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
          );
          await page.goto(
              `https://www.goofish.com/personal?spm=a21ybx.item.itemHeader.1.7db23da6ix2aGa&userId=${shopId}`
          );

          let shopInfo = {
              shopId: shopId,
              name: "",
              sale: 0,
              productCount: 0,
              isExtract: false,
              status: 1,
              delFlag: 0,
          };
          // 监听响应
          page.on("response", async (res) => {
              let resourceType = res.request().resourceType();
              let requestUrl = res.url();
              if (resourceType === "xhr") {
              // 店铺详情
              if (requestUrl.includes("mtop.idle.web.user.page.head")) {
                  let data = await res.json().catch(() => null);
                  let { displayName = "", introduction = "" } =
                  data?.data?.module?.base || {};
                  shopInfo.name = displayName;
                  shopInfo.introduction = introduction;
              }

              // 商品数量
              if (requestUrl.includes("mtop.idle.web.xyh.item.list")) {
                  let data = await res.json().catch(() => null);
                  let { itemGroupList } = data.data;
                  if (itemGroupList && itemGroupList.length) {
                  shopInfo.productCount = itemGroupList[0].itemNumber;
                  }
              }
              }
              if (shopInfo.name && shopInfo.productCount) {
                  if (browser)  await browser.close();
                  resolve(shopInfo);
              }
          });
        } catch (err) {
            if (browser)  await browser.close();
            reject(err);
        }
    });
};

export const getShopAllGoodInfo = async (params) => {
  return new Promise(async (resolve) => {
    let goodList = [];
    let totalPages = 0;
    let currentPage = 1;
    let allGoods = 0;
    let loading = false;
    let browser = null;

    let shopId = params.shopId;

    // 配置浏览器路径（需根据实际情况修改）
    const BROWSER_PATH =
      process.platform === "win32"
        ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
        : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

    try {
      browser = await puppeteer.launch({
        executablePath: BROWSER_PATH, // 关键配置
        headless: !true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
      );
      await page.goto(
        `https://www.goofish.com/personal?spm=a21ybx.item.itemHeader.1.7db23da6ix2aGa&userId=${shopId}`
      );

      // 监听响应
      page.on("response", async (res) => {
        if (
          res.request().resourceType() === "xhr" &&
          res.url().includes("/mtop.idle.web.xyh.item.list")
        ) {
          let data = await res.json().catch(() => null);
          // console.log('API响应:', {
          //     url: res.url(),
          //     status: res.status(),
          //     data: data
          // });

          currentPage++;

          let itemGroupList = data.data.itemGroupList;
          if (itemGroupList && itemGroupList.length) {
            allGoods = itemGroupList[0].itemNumber;
            totalPages = 3; //Math.ceil(allGoods / 20)
          }

          data.data.cardList.forEach((item) => {
            let cardData = item.cardData;
            let { title, id, categoryId, trackParams } = cardData;
            let want = 0;
            if (trackParams.serviceUtParams) {
              let serviceUtParams = JSON.parse(trackParams.serviceUtParams);
              if (serviceUtParams.length) {
                want = serviceUtParams[0].args.content.replace("人想要", "");
              }
            }

            let obj = {
              id: uuidv4(),
              goodId: id,
              shopId: shopId,
              categoryId,
              name: title,
              wantCot: want,
              viewCot: 0,
              picUrl: cardData.picInfo.picUrl, // 主图
              urls: [],
              isExtract: true,
              status: 1,
              delFlag: 0,
              price: cardData.priceInfo.price,
              stock: 0,
              shareUrl: "",
              no: "",
              description: "",
              autoPush: false,
              createTime: new Date().toISOString()
            }

            goodList.push(obj);
          });

          console.log(
            "总页码：",
            totalPages,
            " 当前第",
            currentPage,
            "页, 提取中..."
          );
          if (currentPage < totalPages) {
            loading = false;
          } else {
            loading = true;
            console.log("提取完成，准备写入文件");
            if (browser)  await browser.close();
            resolve(goodList);
          }
        }
      });
      autoScroll(page);
      async function autoScroll(page) {
        await page.evaluate(async () => {
          await new Promise((resolve) => {
            const distance = 100; // 每次滚动像素值
            window.scrollBy(0, distance);
            resolve();
          });
        });
        if (!loading) {
          await sleep(800); // 等待新内容加载‌
          await autoScroll(page);
        }
      }
    } catch (err) {
      if (browser)  await browser.close();
    }
  });
};

export const getShopAllGoodDetail = async (goods) => {
  return new Promise(async (resolve, reject) => {

      let browser = null;
      // 配置浏览器路径（需根据实际情况修改
      const BROWSER_PATH =
      process.platform === "win32"
          ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
          : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

      try {
        browser = await puppeteer.launch({
            executablePath: BROWSER_PATH, // 关键配置
            headless: !true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
        );
        await page.goto(
            `https://www.goofish.com/personal?spm=a21ybx.item.itemHeader.1.7db23da6ix2aGa&userId=${shopId}`
        );

        resolve()
      } catch (err) {
          if (browser)  await browser.close();
          reject(err);
      }
  });
};

// 工具
export const getUrlParams = (url = "") => {
  const params = {};

  try {
    // 处理 Node.js 和浏览器环境的 URL 解析
    const parsedUrl = new URL(url, "http://dummybase");

    // 合并 search 和 hash 参数
    const sources = [
      parsedUrl.searchParams,
      new URL("http://dummybase?" + (parsedUrl.hash.split("?") || ""))
        .searchParams,
    ];

    for (const paramSource of sources) {
      paramSource.forEach((value, key) => {
        const decoded = decodeURIComponent(value);
        params[key] = params.hasOwnProperty(key)
          ? [].concat(params[key], decoded) // 合并为数组
          : decoded;
      });
    }
  } catch (e) {
    // 处理无效 URL 或特殊格式
    console.warn("URL 解析失败:", e.message);
  }

  return params;
};

// 等待
export const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};