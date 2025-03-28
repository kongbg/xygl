import puppeteer from "puppeteer-core"; // 注意使用 core 版本
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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