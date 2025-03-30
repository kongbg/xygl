import fs from 'fs';

export const getLocalJSON = (path) => {
    const data = fs.readFileSync(path, 'utf8');
    const jsonData = JSON.parse(data);
    return jsonData;
};
