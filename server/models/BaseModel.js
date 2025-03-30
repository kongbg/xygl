import db from '../db/index.js';

class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
    }

    // 获取所有记录
    async getAll() {
        return db.data[this.tableName] || [];
    }

    // 根据ID获取单条记录
    async getById(id) {
        return (db.data[this.tableName] || []).find(item => item.id === id);
    }

    // 根据多个ID获取多条记录
    async getByIds(ids) {
        if (!Array.isArray(ids)) {
            ids = [ids];
        }
        return (db.data[this.tableName] || []).filter(item => ids.includes(item.id));
    }

    // 添加记录
    async add(data) {
        if (!db.data[this.tableName]) {
            db.data[this.tableName] = [];
        }

        const newItem = {
            id: data.id || Date.now().toString(),
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString(),
            delFlag: 0,
            ...data
        };

        db.data[this.tableName].push(newItem);
        await db.write();
        return newItem;
    }

    // 更新记录
    async update(id, updates) {
        const index = (db.data[this.tableName] || []).findIndex(item => item.id === id);

        if (index === -1) return null;

        db.data[this.tableName][index] = {
            ...db.data[this.tableName][index],
            ...updates,
            updateTime: new Date().toISOString()
        };

        await db.write();
        return db.data[this.tableName][index];
    }

    // 删除记录（软删除）
    async delete(id) {
        const index = (db.data[this.tableName] || []).findIndex(item => item.id === id);

        if (index === -1) return null;

        db.data[this.tableName][index].delFlag = 1;
        db.data[this.tableName][index].updateTime = new Date().toISOString();

        await db.write();
        return db.data[this.tableName][index];
    }

    // 批量添加
    async addMany(items) {
        if (!Array.isArray(items)) {
            throw new Error('Items must be an array');
        }

        if (!db.data[this.tableName]) {
            db.data[this.tableName] = [];
        }

        const now = new Date().toISOString();
        const newItems = items.map(item => ({
            id: item.id || Date.now().toString(),
            createTime: now,
            updateTime: now,
            delFlag: 0,
            ...item
        }));

        db.data[this.tableName].push(...newItems);
        await db.write();
        return newItems;
    }

    // 根据条件查询
    async find(query = {}) {
        let results = db.data[this.tableName] || [];
        const { page, pageSize, includeDeleted, sort, ...conditions } = query;

        // 过滤已删除的记录
        if (!includeDeleted) {
            results = results.filter(item => item.delFlag !== 1);
        }

        // 处理排序
        if (sort) {
            const sortFields = Array.isArray(sort) ? sort : [sort];

            results.sort((a, b) => {
                for (const field of sortFields) {
                    let [fieldName, order] = field.split(':');
                    const isDesc = order === 'desc';

                    const valueA = a[fieldName];
                    const valueB = b[fieldName];

                    // 处理数字字符串的比较
                    if (typeof valueA === 'string' && !isNaN(valueA) &&
                        typeof valueB === 'string' && !isNaN(valueB)) {
                        const numA = Number(valueA);
                        const numB = Number(valueB);
                        if (numA !== numB) {
                            return isDesc ? numB - numA : numA - numB;
                        }
                    }
                    // 处理普通值的比较
                    else if (valueA !== valueB) {
                        if (valueA === null || valueA === undefined) return isDesc ? -1 : 1;
                        if (valueB === null || valueB === undefined) return isDesc ? 1 : -1;
                        return isDesc ?
                            (valueA < valueB ? 1 : -1) :
                            (valueA < valueB ? -1 : 1);
                    }
                }
                return 0; // 所有字段都相等
            });
        }

        // 根据查询条件过滤
        Object.entries(conditions).forEach(([key, value]) => {
            if (value === 'nonEmpty') {
                // 查询不为空的条件
                results = results.filter(item => {
                    const itemValue = item[key];
                    return itemValue !== null &&
                        itemValue !== undefined &&
                        itemValue !== '' &&
                        !(Array.isArray(itemValue) && itemValue.length === 0) &&
                        !(typeof itemValue === 'object' && Object.keys(itemValue).length === 0);
                });
            } else if (value === 'isEmpty') {
                // 查询为空的条件
                results = results.filter(item => {
                    const itemValue = item[key];
                    return itemValue === null ||
                        itemValue === undefined ||
                        itemValue === '' ||
                        (Array.isArray(itemValue) && itemValue.length === 0) ||
                        (typeof itemValue === 'object' && Object.keys(itemValue).length === 0);
                });
            } else if (Array.isArray(value)) {
                // 数组条件，表示 IN 查询
                results = results.filter(item => value.includes(item[key]));
            } else if (typeof value === 'object' && value !== null) {
                // 对象条件，支持比较运算符
                results = results.filter(item => {
                    const itemValue = item[key];
                    return Object.entries(value).every(([operator, compareValue]) => {
                        switch (operator) {
                            case '$gt': return itemValue > compareValue;
                            case '$gte': return itemValue >= compareValue;
                            case '$lt': return itemValue < compareValue;
                            case '$lte': return itemValue <= compareValue;
                            case '$ne': return itemValue !== compareValue;
                            case '$like': return String(itemValue).includes(compareValue);
                            default: return true;
                        }
                    });
                });
            } else {
                // 普通等值查询
                results = results.filter(item => item[key] === value);
            }

            // 如果设置了分页，并且已经找到足够的记录，就停止继续过滤
            if (page && pageSize && results.length >= page * pageSize) {
                return;
            }
        });

        // 处理分页
        if (page && pageSize) {
            const start = (page - 1) * pageSize;
            const end = page * pageSize;
            return {
                list: results.slice(start, end),
                total: results.length,
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            };
        }

        return results;
    }
}

export default BaseModel; 