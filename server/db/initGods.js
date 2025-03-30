import fs from 'fs';
import db from './index.js';

const data = fs.readFileSync('./db.json', 'utf8');
const jsonData = JSON.parse(data);

db.data.sources = [];
jsonData.goods.forEach(good => {
    if (good.shareUrl) {
        db.data.sources.push(good);
    }
});

db.write();


