import BaseModel from '../server/models/BaseModel.js';

// 创建测试模型
const testModel = new BaseModel('test');

// 基础查询示例
async function basicQueryExamples() {
    // 简单等值查询
    const simpleQuery = await testModel.find({ status: 1 });

    // 多条件查询
    const multiConditionQuery = await testModel.find({
        status: 1,
        type: 'product',
        category: 'electronics'
    });

    return { simpleQuery, multiConditionQuery };
}

// 空值查询示例
async function nullValueQueryExamples() {
    // 查询不为空的字段
    const nonEmptyFields = await testModel.find({
        description: 'nonEmpty',
        thumbnail: 'nonEmpty'
    });

    // 查询为空的字段
    const emptyFields = await testModel.find({
        description: 'isEmpty',
        tags: 'isEmpty'  // 会匹配 null、undefined、''、[]、{}
    });

    return { nonEmptyFields, emptyFields };
}

// 比较运算符示例
async function comparisonOperatorExamples() {
    const comparisons = await testModel.find({
        price: { $gt: 100 },              // 价格大于100
        stock: { $gte: 10 },              // 库存大于等于10
        discount: { $lt: 0.8 },           // 折扣小于0.8
        weight: { $lte: 50 },             // 重量小于等于50
        status: { $ne: 0 },               // 状态不等于0
        name: { $like: '测试商品' }        // 名称包含"测试商品"
    });

    // 组合比较条件
    const combinedComparisons = await testModel.find({
        price: { $gte: 100, $lte: 1000 }, // 价格区间100-1000
        createTime: { $gte: '2024-01-01', $lt: '2024-02-01' } // 日期区间
    });

    return { comparisons, combinedComparisons };
}

// IN查询示例
async function inQueryExamples() {
    // 简单IN查询
    const statusIn = await testModel.find({
        status: [1, 2, 3]                 // 状态为1、2或3
    });

    // 组合IN查询
    const combinedIn = await testModel.find({
        status: [1, 2],
        type: ['A', 'B'],
        category: ['电子', '家具']
    });

    return { statusIn, combinedIn };
}

// 排序示例
async function sortExamples() {
    // 单字段排序
    const singleSort = await testModel.find({
        sort: 'createTime:desc'           // 按创建时间降序
    });

    // 多字段排序
    const multiSort = await testModel.find({
        sort: [
            'price:desc',                 // 先按价格降序
            'sales:desc',                 // 再按销量降序
            'createTime:asc'              // 最后按创建时间升序
        ]
    });

    // 带条件的排序
    const conditionalSort = await testModel.find({
        status: 1,
        price: { $gt: 100 },
        sort: ['sales:desc', 'price:asc']
    });

    return { singleSort, multiSort, conditionalSort };
}

// 分页示例
async function paginationExamples() {
    // 基础分页
    const basicPagination = await testModel.find({
        page: 1,
        pageSize: 10
    });

    // 带条件的分页
    const conditionalPagination = await testModel.find({
        status: 1,
        price: { $gt: 100 },
        sort: 'createTime:desc',
        page: 1,
        pageSize: 20
    });

    return { basicPagination, conditionalPagination };
}

// 复杂组合查询示例
async function complexQueryExamples() {
    // 商品搜索示例
    const productSearch = await testModel.find({
        // 条件过滤
        status: 1,                        // 上架状态
        price: { $gte: 100, $lte: 1000 }, // 价格区间
        stock: { $gt: 0 },               // 有库存
        name: { $like: '手机' },          // 名称包含"手机"
        category: ['电子产品', '数码'],    // 分类
        description: 'nonEmpty',          // 描述不为空

        // 排序
        sort: [
            'sales:desc',                 // 先按销量降序
            'price:asc'                   // 再按价格升序
        ],

        // 分页
        page: 1,
        pageSize: 20
    });

    // 订单查询示例
    const orderSearch = await testModel.find({
        status: ['pending', 'processing'], // 订单状态
        amount: { $gte: 100 },            // 订单金额
        payTime: { $gte: '2024-01-01' },  // 支付时间
        refundStatus: 'isEmpty',          // 未退款

        sort: 'createTime:desc',          // 按创建时间降序
        page: 1,
        pageSize: 50
    });

    return { productSearch, orderSearch };
}

// 错误处理示例
async function errorHandlingExamples() {
    try {
        // 无效的排序字段
        await testModel.find({
            sort: 'invalidField:desc'
        });
    } catch (error) {
        console.error('排序错误:', error);
    }

    try {
        // 无效的比较值
        await testModel.find({
            price: { $gt: 'invalid' }
        });
    } catch (error) {
        console.error('比较错误:', error);
    }
}

// 导出所有示例
export {
    basicQueryExamples,
    nullValueQueryExamples,
    comparisonOperatorExamples,
    inQueryExamples,
    sortExamples,
    paginationExamples,
    complexQueryExamples,
    errorHandlingExamples
};

// 运行所有示例
async function runAllExamples() {
    console.log('基础查询示例:', await basicQueryExamples());
    console.log('空值查询示例:', await nullValueQueryExamples());
    console.log('比较运算符示例:', await comparisonOperatorExamples());
    console.log('IN查询示例:', await inQueryExamples());
    console.log('排序示例:', await sortExamples());
    console.log('分页示例:', await paginationExamples());
    console.log('复杂组合查询示例:', await complexQueryExamples());
    await errorHandlingExamples();
}

// 如果直接运行此文件，则执行所有示例
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runAllExamples().catch(console.error);
}
