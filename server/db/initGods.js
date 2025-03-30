// import fs from 'fs';
// import db from './index.js';

// const data = fs.readFileSync('./goods.json', 'utf8');
// const jsonData = JSON.parse(data);

// db.data.goods = [];
// jsonData.goods.forEach(good => {
//     let obj = {
//         "id": good.id,
//         "goodId": good.goodId,
//         "shopId": good.shopId,
//         "categoryId": good.categoryId,
//         "name": good.title,
//         "wantCot": good.want,
//         "viewCot": 0,
//         "picUrl": good.picUrl,
//         "urls": good.urls,
//         "isExtract": true,
//         "status": 1,
//         "delFlag": 0,
//         "price": good.price,
//         "stock": 0,
//         "shareUrl": good.shareUrl,
//         "no": good.no,
//         "description": good.desc,
//         "autoPush": false,
//         "createTime": new Date().toISOString()
//     }
//     db.data.goods.push(obj);
// });

// db.write();


