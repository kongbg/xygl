<template>
  <div class="good-container">
    <el-card class="good-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button link @click="$router.back()">
              <el-icon>
                <Back />
              </el-icon>
              返回店铺列表
            </el-button>
          </div>
          <!-- <el-button type="primary" @click="handleAdd">
            新增商品
          </el-button> -->
        </div>
      </template>

      <!-- 添加分类标签页 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="出售中的商品" name="1" />
        <!-- <el-tab-pane label="可上架商品" name="available" /> -->
      </el-tabs>

      <!-- 商品列表 -->
      <el-table :data="goods" style="width: 100%">
        <el-table-column prop="title" label="商品名称" />
        <el-table-column prop="picUrl" label="图片" width="100">
          <template #default="{ row }">
            <img :src="row.picUrl" alt="商品图片" style="width: 100%; height: 100%;" />
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            ¥{{ row.price }}
          </template>
        </el-table-column>
        <el-table-column prop="exposureNum" label="曝光量" width="100" />
        <el-table-column prop="wantNum" label="想要人数" width="100" sortable />
        <el-table-column prop="browseCount" label="浏览量" width="100" />
        <el-table-column prop="is_show" label="自动发货状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.is_show" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-dropdown>
              <el-button type="primary" link>
                更多
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleEdit(row)">配置发货</el-dropdown-item>
                  <el-dropdown-item @click="handleEdit(row)">编辑商品</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[15]" :total="total"
          layout="total, sizes, prev, pager, next" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="50%">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="商品编号" prop="no">
          <el-input v-model="form.no" placeholder="请输入商品编号" />
        </el-form-item>
        <el-form-item v-if="activeTab === 'available'" label="商品描述" prop="description">
          <el-input v-model="form.description" show-word-limit type="textarea" rows="5" placeholder="请输入商品描述" />
        </el-form-item>
        <el-form-item label="网盘地址" prop="shareUrl">
          <el-input v-model="form.shareUrl" type="textarea" rows="5" placeholder="请输入网盘地址"
            @change="handleShareUrlChange" />
        </el-form-item>
        <el-form-item v-if="activeTab === 'available'" label="自动发货文案" prop="sendTxt">
          <el-input v-model="form.sendTxt" type="textarea" rows="5" placeholder="请输入自动发货文案" />
        </el-form-item>

      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 解析进度对话框 -->
    <el-dialog title="商品信息解析" v-model="parseDialogVisible" :close-on-click-modal="false" :close-on-press-escape="false"
      :show-close="false" width="400px">
      <div class="parse-dialog-content">
        <el-progress type="circle" :percentage="parseProgress" :status="parseStatus" />
        <div class="parse-message">{{ parseMessage }}</div>
      </div>
    </el-dialog>

    <!-- 添加选择闲鱼账号的对话框 -->
    <el-dialog title="选择上架账号" v-model="publishDialogVisible" width="30%">
      <el-form>
        <el-form-item label="选择账号">
          <el-checkbox-group v-model="selectedAccounts">
            <el-checkbox v-for="account in xianYuAccounts" :key="account.id" :label="account.id">
              {{ account.username }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="publishDialogVisible = false">取消</el-button>
          <el-button type="primary" :disabled="!selectedAccounts.length" @click="confirmPublish">
            确认上架
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加上架进度对话框 -->
    <el-dialog title="商品上架中" v-model="publishProgressDialogVisible" :close-on-click-modal="false"
      :close-on-press-escape="false" :show-close="false" width="400px">
      <div class="parse-dialog-content">
        <el-progress type="circle" :percentage="publishProgress" :status="publishStatus" />
        <div class="parse-message">{{ publishMessage }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

const route = useRoute()

// 分页相关
const page = ref(1)
const pageSize = ref(15)
const total = ref(0)
const goods = ref([])

// 表单相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref(null)
const formRef = ref(null)
const fileList = ref([])

const form = ref({
  shareUrl: '',
  sendTxt: '',
  name: '',
  no: '',
  price: 0,
  stock: 0,
  description: '',
  autoPush: false,
  status: 1,
  urls: []
})

const rules = {
  shareUrl: [
    { required: true, message: '请输入网盘地址', trigger: 'blur' },
  ]
}

const dialogTitle = computed(() => isEdit.value ? '编辑商品' : '新增商品')

// 解析相关的状态
const parseDialogVisible = ref(false)
const parseProgress = ref(0)
const parseStatus = ref('')
const parseMessage = ref('正在解析商品信息...')

// 添加标签页相关状态
const activeTab = ref('1')

const handleShareUrlChange = (value) => {
  const panLinks = extractPanLinks(value)
  form.value.shareUrl = ''
  panLinks.forEach(link => {
    form.value.shareUrl += link.type + ': ' + link.link[0] + '\n'
  })

  form.value.sendTxt = `亲爱的 {用户名称} 会员您好
  您购买的商品已为您发货
  【发货内容】
  订单号：{订单编号}
  ${form.value.shareUrl}
  请您及时查收，记得好评哦！
  祝您购物愉快！`
}
const extractPanLinks = (text) => {
  // 匹配百度网盘链接和提取码（格式：链接: xxx 提取码: xxx）
  const baiduRegex = /(https?:\/\/pan\.baidu\.com\/\S+?)\s+提取码:\s*(\w+)/g;

  // 匹配夸克网盘链接（格式：https://pan.quark.cn/s/xxx）
  const quarkRegex = /https:\/\/pan\.quark\.cn\/s\/\S+/g;

  // 提取百度网盘信息
  const baiduMatches = Array.from(text.matchAll(baiduRegex)).map(match => ({
    type: "百度网盘",
    link: match,
    extractCode: match
  }));

  // 提取夸克网盘信息
  const quarkMatches = Array.from(text.matchAll(quarkRegex)).map(match => ({
    type: "夸克网盘",
    link: match
  }));

  // 合并结果
  return [...baiduMatches, ...quarkMatches];
}

// 获取商品列表
const fetchGoods = async () => {
  try {
    let params = {
      page: page.value,
      pageSize: pageSize.value,
      accountId: route.query.accountId,
      type: activeTab.value
    }
    if (activeTab.value === 'available') {
      params.shareUrl = 'nonEmpty'
    }
    // const { data } = await request.get('/ydgl/xygoods', { params })
    let res = {
      "code": 0,
      "data": {
        "list": [
          {
            "actions": [
              {
                "actionName": "设粉丝价",
                "actionType": "2",
                "actionUrl": "DLtAY/xbLK+Msncm/zcnaw0jk6b+dfxmJxb/ZW1wp5O/zQSOM5wtRB0eifOURUzj+Ehwq7a2PKafGtO/0gqXlsDkgi6n4p9OOLG8eJMdbfkQNubPieLA+8eOxHBQenNIFWlj9nuCtDLVxPQJLiQUzA==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "编辑",
                "actionType": "4",
                "actionUrl": "Qx+pCiFYTFP3e4rIywNmOg==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "分享",
                "actionType": "7",
                "actionUrl": "4Zn2tPtKtuF5nH1XJ2SucZf+YqjCYqv0nBJhDYgn3MygEun6rpVv9Qi2vYrUkRuKPiMwhmY/xk90m1ADOdmJbA==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "下架",
                "actionType": "11",
                "actionUrl": "biy8SbmOYb5zbVolnzAdXQSGqU/EGAqRDno3igR8AZA=",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              }
            ],
            "appraise": false,
            "area": "440305:南山区",
            "attributesMap": [],
            "auctionType": "b",
            "bargain": true,
            "bidStatus": 0,
            "bottomData": {
              "priority": 1
            },
            "browseCount": 1,
            "canPolish": false,
            "cardTypeSpecialDefinition": 0,
            "categoryId": 50023914,
            "city": "深圳",
            "collectNum": 0,
            "commentNum": 0,
            "commonDO": {
              "redirectUrl": "fleamarket://item?id=903881762432"
            },
            "commonShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#科技感ppt模板炫酷未来科幻高端设计素材，科技感工作总结汇报#",
            "deleteByXiaoer": false,
            "detailUrl": "fleamarket://awesome_detail?itemId=903881762432&hitNativeDetail=true&flutter=true",
            "divisionId": "440305",
            "editRedirectUrl": "fleamarket://unite_post?itemId=903881762432",
            "exposureNum": "18",
            "favorNum": 0,
            "favored": false,
            "filterUser": false,
            "firstModified": "2025-03-30 13:28:43",
            "firstModifiedDiff": "8小时前",
            "freeShip": false,
            "from": "wechat",
            "gmtCreated": "2025-03-30 13:28:43",
            "hasVideo": false,
            "id": "903881762432",
            "idleCoinBidItem": false,
            "idleCoinBuynowItem": false,
            "idleCoinItem": false,
            "imageInfos": [
              {
                "major": true,
                "type": 0,
                "url": "http://img.alicdn.com/bao/uploaded/i4/O1CN01dQlPmY1UGT79Q8gZN_!!0-fleamarket.jpg"
              }
            ],
            "imageUrls": [
              "http://img.alicdn.com/bao/uploaded/i4/O1CN01dQlPmY1UGT79Q8gZN_!!0-fleamarket.jpg"
            ],
            "instockByXiaoer": false,
            "isBizHelpSaleItem": false,
            "isDefaultPrice": false,
            "isFreeItem": false,
            "isSeaMarketItem": false,
            "itemCC": false,
            "itemDeleted": false,
            "itemStatus": 0,
            "leftSecond": 0,
            "locationAware": false,
            "longItemId": 903881762432,
            "miniParams": {
              "firstPage": true,
              "onlineSubTab": "1",
              "isSearch": false
            },
            "needExtendHeight": false,
            "offline": 0,
            "online": true,
            "originalPrice": "1",
            "outStockTime": "2025-06-28 13:28:46",
            "picUrl": "http://img.alicdn.com/bao/uploaded/i4/O1CN01dQlPmY1UGT79Q8gZN_!!0-fleamarket.jpg",
            "price": "1",
            "priceTags": {
              "reduceToTheBottom": false
            },
            "province": "广东",
            "rentItem": false,
            "resell": false,
            "selfPickUp": false,
            "serviceStatus": 0,
            "shortUrl": "http://2.taobao.com/item.htm?id=903881762432",
            "simpleItem": false,
            "structuredHouse": false,
            "stuffStatus": 9,
            "subscribed": false,
            "superFavorNum": 0,
            "templateId": 0,
            "title": "科技感ppt模板炫酷未来科幻高端设计素材，科技感工作总结汇报",
            "tradeType": 0,
            "userModified": "2025-03-30 13:28:43",
            "userTagUrlFromServer": false,
            "videoid": 0,
            "wantNum": 0,
            "weiboShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#科技感ppt模板炫酷未来科幻高端设计素材，科技感工作总结汇报#",
            "wxurl": "https://h5.m.taobao.com/2shou/appRedirect.html?page=item&id=903881762432",
            "zhimaLevel": 0,
            "zhimaScore": 0,
            "is_show": 1
          },
          {
            "actions": [
              {
                "actionName": "设粉丝价",
                "actionType": "2",
                "actionUrl": "DLtAY/xbLK+Msncm/zcnaw0jk6b+dfxmJxb/ZW1wp5O/zQSOM5wtRB0eifOURUzj+Ehwq7a2PKafGtO/0gqXlsDkgi6n4p9OOLG8eJMdbflwL5fPN5o0GqALsx4PuhZjaZcEXdJCEim0+M+RDlX+ag==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "编辑",
                "actionType": "4",
                "actionUrl": "Qx+pCiFYTFP3e4rIywNmOg==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "分享",
                "actionType": "7",
                "actionUrl": "4Zn2tPtKtuF5nH1XJ2SucZf+YqjCYqv0nBJhDYgn3MygEun6rpVv9Qi2vYrUkRuKOaeVvFm1jGtOxGDeTPRdCA==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "下架",
                "actionType": "11",
                "actionUrl": "biy8SbmOYb5zbVolnzAdXQSGqU/EGAqRDno3igR8AZA=",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              }
            ],
            "appraise": false,
            "area": "440305:南山区",
            "attributesMap": [],
            "auctionType": "b",
            "bargain": true,
            "bidStatus": 0,
            "bottomData": {
              "priority": 1
            },
            "browseCount": 0,
            "canPolish": false,
            "cardTypeSpecialDefinition": 0,
            "categoryId": 50023914,
            "city": "深圳",
            "collectNum": 0,
            "commentNum": 0,
            "commonDO": {
              "redirectUrl": "fleamarket://item?id=903881550464"
            },
            "commonShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#每日工作计划表格月进度表周计划表清单完成汇报表excel素材#",
            "deleteByXiaoer": false,
            "detailUrl": "fleamarket://awesome_detail?itemId=903881550464&hitNativeDetail=true&flutter=true",
            "divisionId": "440305",
            "editRedirectUrl": "fleamarket://unite_post?itemId=903881550464",
            "exposureNum": "0",
            "favorNum": 0,
            "favored": false,
            "filterUser": false,
            "firstModified": "2025-03-30 13:28:08",
            "firstModifiedDiff": "8小时前",
            "freeShip": false,
            "from": "wechat",
            "gmtCreated": "2025-03-30 13:28:08",
            "hasVideo": false,
            "id": "903881550464",
            "idleCoinBidItem": false,
            "idleCoinBuynowItem": false,
            "idleCoinItem": false,
            "imageInfos": [
              {
                "major": true,
                "type": 0,
                "url": "http://img.alicdn.com/bao/uploaded/i4/O1CN01rxVJfA1UGT5z6mo9E_!!0-fleamarket.jpg"
              }
            ],
            "imageUrls": [
              "http://img.alicdn.com/bao/uploaded/i4/O1CN01rxVJfA1UGT5z6mo9E_!!0-fleamarket.jpg"
            ],
            "instockByXiaoer": false,
            "isBizHelpSaleItem": false,
            "isDefaultPrice": false,
            "isFreeItem": false,
            "isSeaMarketItem": false,
            "itemCC": false,
            "itemDeleted": false,
            "itemStatus": 0,
            "leftSecond": 0,
            "locationAware": false,
            "longItemId": 903881550464,
            "miniParams": {
              "firstPage": true,
              "onlineSubTab": "1",
              "isSearch": false
            },
            "needExtendHeight": false,
            "offline": 0,
            "online": true,
            "originalPrice": "1",
            "outStockTime": "2025-06-28 13:28:10",
            "picUrl": "http://img.alicdn.com/bao/uploaded/i4/O1CN01rxVJfA1UGT5z6mo9E_!!0-fleamarket.jpg",
            "price": "1",
            "priceTags": {
              "reduceToTheBottom": false
            },
            "province": "广东",
            "rentItem": false,
            "resell": false,
            "selfPickUp": false,
            "serviceStatus": 0,
            "shortUrl": "http://2.taobao.com/item.htm?id=903881550464",
            "simpleItem": false,
            "structuredHouse": false,
            "stuffStatus": 9,
            "subscribed": false,
            "superFavorNum": 0,
            "templateId": 0,
            "title": "每日工作计划表格月进度表周计划表清单完成汇报表excel素材",
            "tradeType": 0,
            "userModified": "2025-03-30 13:28:08",
            "userTagUrlFromServer": false,
            "videoid": 0,
            "wantNum": 0,
            "weiboShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#每日工作计划表格月进度表周计划表清单完成汇报表excel素材#",
            "wxurl": "https://h5.m.taobao.com/2shou/appRedirect.html?page=item&id=903881550464",
            "zhimaLevel": 0,
            "zhimaScore": 0,
            "is_show": 1
          },
          {
            "actions": [
              {
                "actionName": "设粉丝价",
                "actionType": "2",
                "actionUrl": "DLtAY/xbLK+Msncm/zcnaw0jk6b+dfxmJxb/ZW1wp5O/zQSOM5wtRB0eifOURUzj+Ehwq7a2PKafGtO/0gqXlsDkgi6n4p9OOLG8eJMdbfmzUk2KdNJj1Qn/F6H2S4qKJkHRwaBL7Ef18SRleeFjlg==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "编辑",
                "actionType": "4",
                "actionUrl": "Qx+pCiFYTFP3e4rIywNmOg==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "分享",
                "actionType": "7",
                "actionUrl": "4Zn2tPtKtuF5nH1XJ2SucZf+YqjCYqv0nBJhDYgn3MygEun6rpVv9Qi2vYrUkRuK+0qfeP6JjUgM1OhoG8HDfg==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "下架",
                "actionType": "11",
                "actionUrl": "biy8SbmOYb5zbVolnzAdXQSGqU/EGAqRDno3igR8AZA=",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              }
            ],
            "appraise": false,
            "area": "440305:南山区",
            "attributesMap": [],
            "auctionType": "b",
            "bargain": true,
            "bidStatus": 0,
            "browseCount": 0,
            "canPolish": false,
            "cardTypeSpecialDefinition": 0,
            "categoryId": 50023914,
            "city": "深圳",
            "collectNum": 0,
            "commentNum": 0,
            "commonDO": {
              "redirectUrl": "fleamarket://item?id=903880186333"
            },
            "commonShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#iPad笔刷花草植物环境笔刷100款#",
            "deleteByXiaoer": false,
            "detailUrl": "fleamarket://awesome_detail?itemId=903880186333&hitNativeDetail=true&flutter=true",
            "divisionId": "440305",
            "editRedirectUrl": "fleamarket://unite_post?itemId=903880186333",
            "exposureNum": "27",
            "favorNum": 0,
            "favored": false,
            "filterUser": false,
            "firstModified": "2025-03-30 13:21:04",
            "firstModifiedDiff": "8小时前",
            "freeShip": false,
            "from": "wechat",
            "gmtCreated": "2025-03-30 13:21:04",
            "hasVideo": false,
            "id": "903880186333",
            "idleCoinBidItem": false,
            "idleCoinBuynowItem": false,
            "idleCoinItem": false,
            "imageInfos": [
              {
                "major": true,
                "type": 0,
                "url": "http://img.alicdn.com/bao/uploaded/i1/O1CN01Mzby221UGT7Dd1Xka_!!0-fleamarket.jpg"
              }
            ],
            "imageUrls": [
              "http://img.alicdn.com/bao/uploaded/i1/O1CN01Mzby221UGT7Dd1Xka_!!0-fleamarket.jpg"
            ],
            "instockByXiaoer": false,
            "isBizHelpSaleItem": false,
            "isDefaultPrice": false,
            "isFreeItem": false,
            "isSeaMarketItem": false,
            "itemCC": false,
            "itemDeleted": false,
            "itemStatus": 0,
            "leftSecond": 0,
            "locationAware": false,
            "longItemId": 903880186333,
            "miniParams": {
              "firstPage": true,
              "onlineSubTab": "1",
              "isSearch": false
            },
            "needExtendHeight": false,
            "offline": 0,
            "online": true,
            "originalPrice": "1",
            "outStockTime": "2025-06-28 13:21:06",
            "picUrl": "http://img.alicdn.com/bao/uploaded/i1/O1CN01Mzby221UGT7Dd1Xka_!!0-fleamarket.jpg",
            "price": "1",
            "priceTags": {
              "reduceToTheBottom": false
            },
            "province": "广东",
            "rentItem": false,
            "resell": false,
            "selfPickUp": false,
            "serviceStatus": 0,
            "shortUrl": "http://2.taobao.com/item.htm?id=903880186333",
            "simpleItem": false,
            "structuredHouse": false,
            "stuffStatus": 9,
            "subscribed": false,
            "superFavorNum": 0,
            "templateId": 0,
            "title": "iPad笔刷花草植物环境笔刷100款",
            "tradeType": 0,
            "userModified": "2025-03-30 13:21:04",
            "userTagUrlFromServer": false,
            "videoid": 0,
            "wantNum": 0,
            "weiboShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#iPad笔刷花草植物环境笔刷100款#",
            "wxurl": "https://h5.m.taobao.com/2shou/appRedirect.html?page=item&id=903880186333",
            "zhimaLevel": 0,
            "zhimaScore": 0,
            "is_show": 0
          },
          {
            "actions": [
              {
                "actionName": "设粉丝价",
                "actionType": "2",
                "actionUrl": "DLtAY/xbLK+Msncm/zcnaw0jk6b+dfxmJxb/ZW1wp5O/zQSOM5wtRB0eifOURUzj+Ehwq7a2PKafGtO/0gqXlsDkgi6n4p9OOLG8eJMdbfkQczAipNHVh7sGAo5n+VZrQaYTPEraYlP0qA8A/l7XLg==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "编辑",
                "actionType": "4",
                "actionUrl": "Qx+pCiFYTFP3e4rIywNmOg==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "分享",
                "actionType": "7",
                "actionUrl": "4Zn2tPtKtuF5nH1XJ2SucZf+YqjCYqv0nBJhDYgn3MzfBBkhIMRuayXm1KYSujE7qMLDef0jpxsOC+XNW+zQuA==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "下架",
                "actionType": "11",
                "actionUrl": "biy8SbmOYb5zbVolnzAdXQSGqU/EGAqRDno3igR8AZA=",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              }
            ],
            "appraise": false,
            "area": "440305:南山区",
            "attributesMap": [],
            "auctionType": "b",
            "bargain": true,
            "bidStatus": 0,
            "browseCount": 0,
            "canPolish": false,
            "cardTypeSpecialDefinition": 0,
            "categoryId": 50023914,
            "city": "深圳",
            "collectNum": 0,
            "commentNum": 0,
            "commonDO": {
              "redirectUrl": "fleamarket://item?id=904182213255"
            },
            "commonShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#【秒发】36款Procreate樱花笔刷 花素材#",
            "deleteByXiaoer": false,
            "detailUrl": "fleamarket://awesome_detail?itemId=904182213255&hitNativeDetail=true&flutter=true",
            "divisionId": "440305",
            "editRedirectUrl": "fleamarket://unite_post?itemId=904182213255",
            "exposureNum": "12",
            "favorNum": 0,
            "favored": false,
            "filterUser": false,
            "firstModified": "2025-03-30 00:55:40",
            "firstModifiedDiff": "20小时前",
            "freeShip": false,
            "from": "wechat",
            "gmtCreated": "2025-03-30 00:55:40",
            "hasVideo": false,
            "id": "904182213255",
            "idleCoinBidItem": false,
            "idleCoinBuynowItem": false,
            "idleCoinItem": false,
            "imageInfos": [
              {
                "major": true,
                "type": 0,
                "url": "http://img.alicdn.com/bao/uploaded/i4/O1CN01zd3Fna1UGT7Z9On1S_!!0-fleamarket.jpg"
              }
            ],
            "imageUrls": [
              "http://img.alicdn.com/bao/uploaded/i4/O1CN01zd3Fna1UGT7Z9On1S_!!0-fleamarket.jpg"
            ],
            "instockByXiaoer": false,
            "isBizHelpSaleItem": false,
            "isDefaultPrice": false,
            "isFreeItem": false,
            "isSeaMarketItem": false,
            "itemCC": false,
            "itemDeleted": false,
            "itemStatus": 0,
            "leftSecond": 0,
            "locationAware": false,
            "longItemId": 904182213255,
            "miniParams": {
              "firstPage": true,
              "onlineSubTab": "1",
              "isSearch": false
            },
            "needExtendHeight": false,
            "offline": 0,
            "online": true,
            "originalPrice": "1",
            "outStockTime": "2025-06-28 00:55:42",
            "picUrl": "http://img.alicdn.com/bao/uploaded/i4/O1CN01zd3Fna1UGT7Z9On1S_!!0-fleamarket.jpg",
            "price": "1",
            "priceTags": {
              "reduceToTheBottom": false
            },
            "province": "广东",
            "rentItem": false,
            "resell": false,
            "selfPickUp": false,
            "serviceStatus": 0,
            "shortUrl": "http://2.taobao.com/item.htm?id=904182213255",
            "simpleItem": false,
            "structuredHouse": false,
            "stuffStatus": 9,
            "subscribed": false,
            "superFavorNum": 0,
            "templateId": 0,
            "title": "【秒发】36款Procreate樱花笔刷 花素材",
            "tradeType": 0,
            "userModified": "2025-03-30 00:55:40",
            "userTagUrlFromServer": false,
            "videoid": 0,
            "wantNum": 0,
            "weiboShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#【秒发】36款Procreate樱花笔刷 花素材#",
            "wxurl": "https://h5.m.taobao.com/2shou/appRedirect.html?page=item&id=904182213255",
            "zhimaLevel": 0,
            "zhimaScore": 0,
            "is_show": 1
          },
          {
            "actions": [
              {
                "actionName": "设粉丝价",
                "actionType": "2",
                "actionUrl": "DLtAY/xbLK+Msncm/zcnaw0jk6b+dfxmJxb/ZW1wp5O/zQSOM5wtRB0eifOURUzj+Ehwq7a2PKafGtO/0gqXlsDkgi6n4p9OOLG8eJMdbfkKHvbO6wLqGZr5k+y7lOvzhcUzBDB61ofz4hEwEoYlGQ==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "编辑",
                "actionType": "4",
                "actionUrl": "Qx+pCiFYTFP3e4rIywNmOg==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "分享",
                "actionType": "7",
                "actionUrl": "4Zn2tPtKtuF5nH1XJ2SucZf+YqjCYqv0nBJhDYgn3MzgG5gfT9CV8udyog8AZGLrex6Y+cq+jkYAlbI2e/oNcg==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "下架",
                "actionType": "11",
                "actionUrl": "biy8SbmOYb5zbVolnzAdXQSGqU/EGAqRDno3igR8AZA=",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              }
            ],
            "appraise": false,
            "area": "440305:南山区",
            "attributesMap": [],
            "auctionType": "b",
            "bargain": true,
            "bidStatus": 0,
            "browseCount": 3,
            "canPolish": false,
            "cardTypeSpecialDefinition": 0,
            "categoryId": 50023914,
            "city": "深圳",
            "collectNum": 0,
            "commentNum": 0,
            "commonDO": {
              "redirectUrl": "fleamarket://item?id=904590520201"
            },
            "commonShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#国潮中国风山水仙鹤古建筑风景装饰插画海报背景设计psd素材模#",
            "deleteByXiaoer": false,
            "detailUrl": "fleamarket://awesome_detail?itemId=904590520201&hitNativeDetail=true&flutter=true",
            "divisionId": "440305",
            "editRedirectUrl": "fleamarket://unite_post?itemId=904590520201",
            "exposureNum": "65",
            "favorNum": 0,
            "favored": false,
            "filterUser": false,
            "firstModified": "2025-03-30 00:52:19",
            "firstModifiedDiff": "21小时前",
            "freeShip": false,
            "from": "wechat",
            "gmtCreated": "2025-03-30 00:52:19",
            "hasVideo": false,
            "id": "904590520201",
            "idleCoinBidItem": false,
            "idleCoinBuynowItem": false,
            "idleCoinItem": false,
            "imageInfos": [
              {
                "major": true,
                "type": 0,
                "url": "http://img.alicdn.com/bao/uploaded/i4/O1CN01WO1NPz1UGT5WQxQuZ_!!0-fleamarket.jpg"
              }
            ],
            "imageUrls": [
              "http://img.alicdn.com/bao/uploaded/i4/O1CN01WO1NPz1UGT5WQxQuZ_!!0-fleamarket.jpg"
            ],
            "instockByXiaoer": false,
            "isBizHelpSaleItem": false,
            "isDefaultPrice": false,
            "isFreeItem": false,
            "isSeaMarketItem": false,
            "itemCC": false,
            "itemDeleted": false,
            "itemStatus": 0,
            "leftSecond": 0,
            "locationAware": false,
            "longItemId": 904590520201,
            "miniParams": {
              "firstPage": true,
              "onlineSubTab": "1",
              "isSearch": false
            },
            "needExtendHeight": false,
            "offline": 0,
            "online": true,
            "originalPrice": "1",
            "outStockTime": "2025-06-28 08:19:20",
            "picUrl": "http://img.alicdn.com/bao/uploaded/i4/O1CN01WO1NPz1UGT5WQxQuZ_!!0-fleamarket.jpg",
            "price": "1",
            "priceTags": {
              "reduceToTheBottom": false
            },
            "province": "广东",
            "rentItem": false,
            "resell": false,
            "selfPickUp": false,
            "serviceStatus": 0,
            "shortUrl": "http://2.taobao.com/item.htm?id=904590520201",
            "simpleItem": false,
            "structuredHouse": false,
            "stuffStatus": 9,
            "subscribed": false,
            "superFavorNum": 0,
            "templateId": 0,
            "title": "国潮中国风山水仙鹤古建筑风景装饰插画海报背景设计psd素材模",
            "tradeType": 0,
            "userModified": "2025-03-30 00:52:19",
            "userTagUrlFromServer": false,
            "videoid": 0,
            "wantNum": 0,
            "weiboShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#国潮中国风山水仙鹤古建筑风景装饰插画海报背景设计psd素材模#",
            "wxurl": "https://h5.m.taobao.com/2shou/appRedirect.html?page=item&id=904590520201",
            "zhimaLevel": 0,
            "zhimaScore": 0,
            "is_show": 1
          },
          {
            "actions": [
              {
                "actionName": "2人小刀",
                "actionType": "17",
                "actionUrl": "fcLaoezGIhjKqdnWmq8CCTYpgL6VPcYRGylbAJPbibljVULudY8Oql5kjEcP/B+Ha0yfKVgcRNWyn+2CD7x6tVEN9rcEd7qdZEwjXPWAk4Gx24MDjTGT/KIhAm19TOvpPh6DwJ+ripEUEA6NXLZV1m0bctgXrH0mD3JVD1LSXVQ=",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "设粉丝价",
                "actionType": "2",
                "actionUrl": "DLtAY/xbLK+Msncm/zcnaw0jk6b+dfxmJxb/ZW1wp5O/zQSOM5wtRB0eifOURUzj+Ehwq7a2PKafGtO/0gqXlsDkgi6n4p9OOLG8eJMdbfnD0xOxE8idOwyYMBl1TA3OUMu5OpS8CKQJ8ZN6PpevaA==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "降价",
                "actionType": "3",
                "actionUrl": "0ZXfT6zGf55+AauYBpvwFA==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "编辑",
                "actionType": "4",
                "actionUrl": "Qx+pCiFYTFP3e4rIywNmOg==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "分享",
                "actionType": "7",
                "actionUrl": "4Zn2tPtKtuF5nH1XJ2SucZf+YqjCYqv0nBJhDYgn3MyH3InlezdkI5ZhqrDTQttjsWSLLF9gFbwCYTfoUZjsUw==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "下架",
                "actionType": "11",
                "actionUrl": "biy8SbmOYb5zbVolnzAdXQSGqU/EGAqRDno3igR8AZA=",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              }
            ],
            "appraise": false,
            "area": "440305:南山区",
            "attributesMap": [],
            "auctionType": "b",
            "bargain": true,
            "bidStatus": 0,
            "browseCount": 202,
            "canPolish": false,
            "cardTypeSpecialDefinition": 0,
            "categoryId": 50025461,
            "city": "深圳",
            "collectNum": 0,
            "commentNum": 0,
            "commonDO": {
              "redirectUrl": "fleamarket://item?id=895444338390"
            },
            "commonShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#向日葵远程VIP，永久有效，win专用#",
            "deleteByXiaoer": false,
            "detailUrl": "fleamarket://awesome_detail?itemId=895444338390&flutter=true",
            "divisionId": "440305",
            "editRedirectUrl": "fleamarket://unite_post?itemId=895444338390",
            "exposureNum": "4207",
            "fansPriceMinString": "1.10",
            "favorNum": 0,
            "favored": false,
            "filterUser": false,
            "firstModified": "2025-03-30 14:15:41",
            "firstModifiedDiff": "7小时前",
            "freeShip": false,
            "from": "iphone",
            "gmtCreated": "2025-03-06 18:00:06",
            "hasVideo": false,
            "id": "895444338390",
            "idleCoinBidItem": false,
            "idleCoinBuynowItem": false,
            "idleCoinItem": false,
            "imageInfos": [
              {
                "heightSize": 1456,
                "major": true,
                "type": 0,
                "url": "http://img.alicdn.com/bao/uploaded/i4/O1CN01FbRSur1J1OQkxvigT_!!4611686018427381688-0-fleamarket.jpg",
                "widthSize": 1179
              }
            ],
            "imageUrls": [
              "http://img.alicdn.com/bao/uploaded/i4/O1CN01FbRSur1J1OQkxvigT_!!4611686018427381688-0-fleamarket.jpg"
            ],
            "instockByXiaoer": false,
            "isBizHelpSaleItem": false,
            "isDefaultPrice": false,
            "isFreeItem": false,
            "isSeaMarketItem": false,
            "itemCC": false,
            "itemDeleted": false,
            "itemStatus": 0,
            "leftSecond": 0,
            "locationAware": false,
            "longItemId": 895444338390,
            "miniParams": {
              "firstPage": true,
              "onlineSubTab": "1",
              "isSearch": false
            },
            "needExtendHeight": false,
            "offline": 0,
            "online": true,
            "originalPrice": "99",
            "outStockTime": "2025-06-28 14:15:40",
            "picUrl": "http://img.alicdn.com/bao/uploaded/i4/O1CN01FbRSur1J1OQkxvigT_!!4611686018427381688-0-fleamarket.jpg",
            "price": "1.20",
            "priceTags": {
              "priceSuffixLabelInfoDO": {
                "actionType": 0,
                "bgColor": "rgba(255,112,0,0.08)",
                "text": "2人小刀价¥1",
                "textColor": "#FF7900"
              },
              "reduceToTheBottom": false
            },
            "province": "广东",
            "rentItem": false,
            "resell": false,
            "selfPickUp": false,
            "sellerPromotionVO": {
              "activityPriceOrDiscount": "1",
              "itemId": 895444338390,
              "merchantItemScheduleId": 54910451,
              "promotionEndTime": "2125-02-10 18:29:14",
              "promotionStartTime": "2025-03-06 18:29:14",
              "promotionStatus": 2,
              "sellerId": 1115350968,
              "umpDetailId": "2021152743377"
            },
            "serviceStatus": 0,
            "shortUrl": "http://2.taobao.com/item.htm?id=895444338390",
            "simpleItem": false,
            "structuredHouse": false,
            "stuffStatus": 9,
            "subscribed": false,
            "superFavorNum": 0,
            "templateId": 0,
            "title": "向日葵远程VIP，永久有效，win专用",
            "tradeType": 0,
            "userModified": "2025-03-29 21:53:33",
            "userTagUrlFromServer": false,
            "videoid": 0,
            "wantNum": 13,
            "weiboShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#向日葵远程VIP，永久有效，win专用#",
            "wxurl": "https://h5.m.taobao.com/2shou/appRedirect.html?page=item&id=895444338390",
            "zhimaLevel": 0,
            "zhimaScore": 0,
            "is_show": 1
          },
          {
            "actions": [
              {
                "actionName": "设粉丝价",
                "actionType": "2",
                "actionUrl": "DLtAY/xbLK+Msncm/zcnaw0jk6b+dfxmJxb/ZW1wp5O/zQSOM5wtRB0eifOURUzj+Ehwq7a2PKafGtO/0gqXlsDkgi6n4p9OOLG8eJMdbfk/SOrOxXgJeQQoqy/rKs3nhcGY5XC2BB25QfSoVCdJYg==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "编辑",
                "actionType": "4",
                "actionUrl": "Qx+pCiFYTFP3e4rIywNmOg==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "分享",
                "actionType": "7",
                "actionUrl": "4Zn2tPtKtuF5nH1XJ2SucZf+YqjCYqv0nBJhDYgn3MyJvGW23aP5ibngIu7biXj3Y37YUDN04L0dFt40mV2wmQ==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "下架",
                "actionType": "11",
                "actionUrl": "biy8SbmOYb5zbVolnzAdXQSGqU/EGAqRDno3igR8AZA=",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              }
            ],
            "appraise": false,
            "area": "440305:南山区",
            "attributesMap": [],
            "auctionType": "b",
            "bargain": true,
            "bidStatus": 0,
            "browseCount": 1,
            "canPolish": false,
            "cardTypeSpecialDefinition": 0,
            "categoryId": 50023914,
            "city": "深圳",
            "collectNum": 0,
            "commentNum": 0,
            "commonDO": {
              "redirectUrl": "fleamarket://item?id=904090205042"
            },
            "commonShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#网红字库 363款古风书法字体#",
            "deleteByXiaoer": false,
            "detailUrl": "fleamarket://awesome_detail?itemId=904090205042&hitNativeDetail=true&flutter=true",
            "divisionId": "440305",
            "editRedirectUrl": "fleamarket://unite_post?itemId=904090205042",
            "exposureNum": "2",
            "favorNum": 0,
            "favored": false,
            "filterUser": false,
            "firstModified": "2025-03-30 14:15:40",
            "firstModifiedDiff": "7小时前",
            "freeShip": false,
            "from": "wechat",
            "gmtCreated": "2025-03-29 18:38:38",
            "hasVideo": false,
            "id": "904090205042",
            "idleCoinBidItem": false,
            "idleCoinBuynowItem": false,
            "idleCoinItem": false,
            "imageInfos": [
              {
                "major": true,
                "type": 0,
                "url": "http://img.alicdn.com/bao/uploaded/i4/O1CN01H81xCm1UGT7WJP3Mr_!!0-fleamarket.jpg"
              }
            ],
            "imageUrls": [
              "http://img.alicdn.com/bao/uploaded/i4/O1CN01H81xCm1UGT7WJP3Mr_!!0-fleamarket.jpg"
            ],
            "instockByXiaoer": false,
            "isBizHelpSaleItem": false,
            "isDefaultPrice": false,
            "isFreeItem": false,
            "isSeaMarketItem": false,
            "itemCC": false,
            "itemDeleted": false,
            "itemStatus": 0,
            "leftSecond": 0,
            "locationAware": false,
            "longItemId": 904090205042,
            "miniParams": {
              "firstPage": true,
              "onlineSubTab": "1",
              "isSearch": false
            },
            "needExtendHeight": false,
            "offline": 0,
            "online": true,
            "originalPrice": "1",
            "outStockTime": "2025-06-28 14:15:40",
            "picUrl": "http://img.alicdn.com/bao/uploaded/i4/O1CN01H81xCm1UGT7WJP3Mr_!!0-fleamarket.jpg",
            "price": "1",
            "priceTags": {
              "reduceToTheBottom": false
            },
            "province": "广东",
            "rentItem": false,
            "resell": false,
            "selfPickUp": false,
            "serviceStatus": 0,
            "shortUrl": "http://2.taobao.com/item.htm?id=904090205042",
            "simpleItem": false,
            "structuredHouse": false,
            "stuffStatus": 9,
            "subscribed": false,
            "superFavorNum": 0,
            "templateId": 0,
            "title": "网红字库 363款古风书法字体",
            "tradeType": 0,
            "userModified": "2025-03-29 18:38:38",
            "userTagUrlFromServer": false,
            "videoid": 0,
            "wantNum": 0,
            "weiboShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#网红字库 363款古风书法字体#",
            "wxurl": "https://h5.m.taobao.com/2shou/appRedirect.html?page=item&id=904090205042",
            "zhimaLevel": 0,
            "zhimaScore": 0,
            "is_show": 1
          },
          {
            "actions": [
              {
                "actionName": "设粉丝价",
                "actionType": "2",
                "actionUrl": "DLtAY/xbLK+Msncm/zcnaw0jk6b+dfxmJxb/ZW1wp5O/zQSOM5wtRB0eifOURUzj+Ehwq7a2PKafGtO/0gqXlsDkgi6n4p9OOLG8eJMdbfmb8dbjcYxQIkfHv39vr93cSze+/0GbYz/DI2Tt0K3S1Q==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "编辑",
                "actionType": "4",
                "actionUrl": "Qx+pCiFYTFP3e4rIywNmOg==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "分享",
                "actionType": "7",
                "actionUrl": "4Zn2tPtKtuF5nH1XJ2SucZf+YqjCYqv0nBJhDYgn3MyiKiBDb964KGSY08NQMWB5F6lInMYbaCk+iewH+CTqdw==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "下架",
                "actionType": "11",
                "actionUrl": "biy8SbmOYb5zbVolnzAdXQSGqU/EGAqRDno3igR8AZA=",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              }
            ],
            "appraise": false,
            "area": "440305:南山区",
            "attributesMap": [],
            "auctionType": "b",
            "bargain": true,
            "bidStatus": 0,
            "browseCount": 0,
            "canPolish": false,
            "cardTypeSpecialDefinition": 0,
            "categoryId": 50023914,
            "city": "深圳",
            "collectNum": 0,
            "commentNum": 0,
            "commonDO": {
              "redirectUrl": "fleamarket://item?id=903333027059"
            },
            "commonShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#大学生创新创业项目计划书ppt+word模板，成品文件！ p#",
            "deleteByXiaoer": false,
            "detailUrl": "fleamarket://awesome_detail?itemId=903333027059&hitNativeDetail=true&flutter=true",
            "divisionId": "440305",
            "editRedirectUrl": "fleamarket://unite_post?itemId=903333027059",
            "exposureNum": "8",
            "favorNum": 0,
            "favored": false,
            "filterUser": false,
            "firstModified": "2025-03-30 14:15:41",
            "firstModifiedDiff": "7小时前",
            "freeShip": false,
            "from": "wechat",
            "gmtCreated": "2025-03-29 18:38:12",
            "hasVideo": false,
            "id": "903333027059",
            "idleCoinBidItem": false,
            "idleCoinBuynowItem": false,
            "idleCoinItem": false,
            "imageInfos": [
              {
                "major": true,
                "type": 0,
                "url": "http://img.alicdn.com/bao/uploaded/i4/O1CN01EKHora1UGT6v5Jcl4_!!0-fleamarket.jpg"
              }
            ],
            "imageUrls": [
              "http://img.alicdn.com/bao/uploaded/i4/O1CN01EKHora1UGT6v5Jcl4_!!0-fleamarket.jpg"
            ],
            "instockByXiaoer": false,
            "isBizHelpSaleItem": false,
            "isDefaultPrice": false,
            "isFreeItem": false,
            "isSeaMarketItem": false,
            "itemCC": false,
            "itemDeleted": false,
            "itemStatus": 0,
            "leftSecond": 0,
            "locationAware": false,
            "longItemId": 903333027059,
            "miniParams": {
              "firstPage": true,
              "onlineSubTab": "1",
              "isSearch": false
            },
            "needExtendHeight": false,
            "offline": 0,
            "online": true,
            "originalPrice": "1",
            "outStockTime": "2025-06-28 14:15:40",
            "picUrl": "http://img.alicdn.com/bao/uploaded/i4/O1CN01EKHora1UGT6v5Jcl4_!!0-fleamarket.jpg",
            "price": "1",
            "priceTags": {
              "reduceToTheBottom": false
            },
            "province": "广东",
            "rentItem": false,
            "resell": false,
            "selfPickUp": false,
            "serviceStatus": 0,
            "shortUrl": "http://2.taobao.com/item.htm?id=903333027059",
            "simpleItem": false,
            "structuredHouse": false,
            "stuffStatus": 9,
            "subscribed": false,
            "superFavorNum": 0,
            "templateId": 0,
            "title": "大学生创新创业项目计划书ppt+word模板，成品文件！ p",
            "tradeType": 0,
            "userModified": "2025-03-29 18:38:12",
            "userTagUrlFromServer": false,
            "videoid": 0,
            "wantNum": 0,
            "weiboShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#大学生创新创业项目计划书ppt+word模板，成品文件！ p#",
            "wxurl": "https://h5.m.taobao.com/2shou/appRedirect.html?page=item&id=903333027059",
            "zhimaLevel": 0,
            "zhimaScore": 0,
            "is_show": 1
          },
          {
            "actions": [
              {
                "actionName": "设粉丝价",
                "actionType": "2",
                "actionUrl": "DLtAY/xbLK+Msncm/zcnaw0jk6b+dfxmJxb/ZW1wp5O/zQSOM5wtRB0eifOURUzj+Ehwq7a2PKafGtO/0gqXlsDkgi6n4p9OOLG8eJMdbfm91ln9JQybf/rApTutjHNNArSyYQ0eEQ0yFEgM7exHWg==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "编辑",
                "actionType": "4",
                "actionUrl": "Qx+pCiFYTFP3e4rIywNmOg==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "分享",
                "actionType": "7",
                "actionUrl": "4Zn2tPtKtuF5nH1XJ2SucZf+YqjCYqv0nBJhDYgn3MyF4T6mIHyeNWQkvMgjdjPOZcB29MfENPOg0lj9ABx9EQ==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "下架",
                "actionType": "11",
                "actionUrl": "biy8SbmOYb5zbVolnzAdXQSGqU/EGAqRDno3igR8AZA=",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              }
            ],
            "appraise": false,
            "area": "440305:南山区",
            "attributesMap": [],
            "auctionType": "b",
            "bargain": true,
            "bidStatus": 0,
            "browseCount": 0,
            "canPolish": false,
            "cardTypeSpecialDefinition": 0,
            "categoryId": 50023914,
            "city": "深圳",
            "collectNum": 0,
            "commentNum": 0,
            "commonDO": {
              "redirectUrl": "fleamarket://item?id=904498188602"
            },
            "commonShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#电商主图详情页直通车首图活动促销边框装修模板psd素材[红旗#",
            "deleteByXiaoer": false,
            "detailUrl": "fleamarket://awesome_detail?itemId=904498188602&hitNativeDetail=true&flutter=true",
            "divisionId": "440305",
            "editRedirectUrl": "fleamarket://unite_post?itemId=904498188602",
            "exposureNum": "6",
            "favorNum": 0,
            "favored": false,
            "filterUser": false,
            "firstModified": "2025-03-30 14:15:40",
            "firstModifiedDiff": "7小时前",
            "freeShip": false,
            "from": "wechat",
            "gmtCreated": "2025-03-29 18:37:08",
            "hasVideo": false,
            "id": "904498188602",
            "idleCoinBidItem": false,
            "idleCoinBuynowItem": false,
            "idleCoinItem": false,
            "imageInfos": [
              {
                "major": true,
                "type": 0,
                "url": "http://img.alicdn.com/bao/uploaded/i4/O1CN01xKlujf1UGT7kXQPuT_!!0-fleamarket.jpg"
              }
            ],
            "imageUrls": [
              "http://img.alicdn.com/bao/uploaded/i4/O1CN01xKlujf1UGT7kXQPuT_!!0-fleamarket.jpg"
            ],
            "instockByXiaoer": false,
            "isBizHelpSaleItem": false,
            "isDefaultPrice": false,
            "isFreeItem": false,
            "isSeaMarketItem": false,
            "itemCC": false,
            "itemDeleted": false,
            "itemStatus": 0,
            "leftSecond": 0,
            "locationAware": false,
            "longItemId": 904498188602,
            "miniParams": {
              "firstPage": true,
              "onlineSubTab": "1",
              "isSearch": false
            },
            "needExtendHeight": false,
            "offline": 0,
            "online": true,
            "originalPrice": "1",
            "outStockTime": "2025-06-28 14:15:40",
            "picUrl": "http://img.alicdn.com/bao/uploaded/i4/O1CN01xKlujf1UGT7kXQPuT_!!0-fleamarket.jpg",
            "price": "1",
            "priceTags": {
              "reduceToTheBottom": false
            },
            "province": "广东",
            "rentItem": false,
            "resell": false,
            "selfPickUp": false,
            "serviceStatus": 0,
            "shortUrl": "http://2.taobao.com/item.htm?id=904498188602",
            "simpleItem": false,
            "structuredHouse": false,
            "stuffStatus": 9,
            "subscribed": false,
            "superFavorNum": 0,
            "templateId": 0,
            "title": "电商主图详情页直通车首图活动促销边框装修模板psd素材[红旗",
            "tradeType": 0,
            "userModified": "2025-03-29 18:37:08",
            "userTagUrlFromServer": false,
            "videoid": 0,
            "wantNum": 0,
            "weiboShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#电商主图详情页直通车首图活动促销边框装修模板psd素材[红旗#",
            "wxurl": "https://h5.m.taobao.com/2shou/appRedirect.html?page=item&id=904498188602",
            "zhimaLevel": 0,
            "zhimaScore": 0,
            "is_show": 1
          },
          {
            "actions": [
              {
                "actionName": "设粉丝价",
                "actionType": "2",
                "actionUrl": "DLtAY/xbLK+Msncm/zcnaw0jk6b+dfxmJxb/ZW1wp5O/zQSOM5wtRB0eifOURUzj+Ehwq7a2PKafGtO/0gqXlsDkgi6n4p9OOLG8eJMdbflClF1vH9X7Ab309s35S8z3Ep74KBoBJkB/D+R0QsPDQw==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "编辑",
                "actionType": "4",
                "actionUrl": "Qx+pCiFYTFP3e4rIywNmOg==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "分享",
                "actionType": "7",
                "actionUrl": "4Zn2tPtKtuF5nH1XJ2SucZf+YqjCYqv0nBJhDYgn3MyF4T6mIHyeNWQkvMgjdjPOb1ylXUFL57Lknrn1hhQ3nQ==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "下架",
                "actionType": "11",
                "actionUrl": "biy8SbmOYb5zbVolnzAdXQSGqU/EGAqRDno3igR8AZA=",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              }
            ],
            "appraise": false,
            "area": "440305:南山区",
            "attributesMap": [],
            "auctionType": "b",
            "bargain": true,
            "bidStatus": 0,
            "browseCount": 2,
            "canPolish": false,
            "cardTypeSpecialDefinition": 0,
            "categoryId": 50023914,
            "city": "深圳",
            "collectNum": 0,
            "commentNum": 0,
            "commonDO": {
              "redirectUrl": "fleamarket://item?id=904496956234"
            },
            "commonShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#stata代码 ，保姆级适合小白，每个步骤后都有解答，可独立#",
            "deleteByXiaoer": false,
            "detailUrl": "fleamarket://awesome_detail?itemId=904496956234&hitNativeDetail=true&flutter=true",
            "divisionId": "440305",
            "editRedirectUrl": "fleamarket://unite_post?itemId=904496956234",
            "exposureNum": "265",
            "favorNum": 0,
            "favored": false,
            "filterUser": false,
            "firstModified": "2025-03-30 14:15:40",
            "firstModifiedDiff": "7小时前",
            "freeShip": false,
            "from": "wechat",
            "gmtCreated": "2025-03-29 18:32:12",
            "hasVideo": false,
            "id": "904496956234",
            "idleCoinBidItem": false,
            "idleCoinBuynowItem": false,
            "idleCoinItem": false,
            "imageInfos": [
              {
                "major": true,
                "type": 0,
                "url": "http://img.alicdn.com/bao/uploaded/i4/O1CN01LnZgeb1UGT7BPxl5J_!!0-fleamarket.jpg"
              }
            ],
            "imageUrls": [
              "http://img.alicdn.com/bao/uploaded/i4/O1CN01LnZgeb1UGT7BPxl5J_!!0-fleamarket.jpg"
            ],
            "instockByXiaoer": false,
            "isBizHelpSaleItem": false,
            "isDefaultPrice": false,
            "isFreeItem": false,
            "isSeaMarketItem": false,
            "itemCC": false,
            "itemDeleted": false,
            "itemStatus": 0,
            "leftSecond": 0,
            "locationAware": false,
            "longItemId": 904496956234,
            "miniParams": {
              "firstPage": true,
              "onlineSubTab": "1",
              "isSearch": false
            },
            "needExtendHeight": false,
            "offline": 0,
            "online": true,
            "originalPrice": "1",
            "outStockTime": "2025-06-28 14:15:40",
            "picUrl": "http://img.alicdn.com/bao/uploaded/i4/O1CN01LnZgeb1UGT7BPxl5J_!!0-fleamarket.jpg",
            "price": "1",
            "priceTags": {
              "reduceToTheBottom": false
            },
            "province": "广东",
            "rentItem": false,
            "resell": false,
            "selfPickUp": false,
            "serviceStatus": 0,
            "shortUrl": "http://2.taobao.com/item.htm?id=904496956234",
            "simpleItem": false,
            "structuredHouse": false,
            "stuffStatus": 9,
            "subscribed": false,
            "superFavorNum": 0,
            "templateId": 0,
            "title": "stata代码 ，保姆级适合小白，每个步骤后都有解答，可独立",
            "tradeType": 0,
            "userModified": "2025-03-29 18:32:12",
            "userTagUrlFromServer": false,
            "videoid": 0,
            "wantNum": 0,
            "weiboShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#stata代码 ，保姆级适合小白，每个步骤后都有解答，可独立#",
            "wxurl": "https://h5.m.taobao.com/2shou/appRedirect.html?page=item&id=904496956234",
            "zhimaLevel": 0,
            "zhimaScore": 0,
            "is_show": 1
          },
          {
            "actions": [
              {
                "actionName": "设粉丝价",
                "actionType": "2",
                "actionUrl": "DLtAY/xbLK+Msncm/zcnaw0jk6b+dfxmJxb/ZW1wp5O/zQSOM5wtRB0eifOURUzj+Ehwq7a2PKafGtO/0gqXlsDkgi6n4p9OOLG8eJMdbfkTDJwbdL42kxtFiBy+1hPpIru1eBPBXSaHQiw7T4h2FA==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "编辑",
                "actionType": "4",
                "actionUrl": "Qx+pCiFYTFP3e4rIywNmOg==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "分享",
                "actionType": "7",
                "actionUrl": "4Zn2tPtKtuF5nH1XJ2SucZf+YqjCYqv0nBJhDYgn3MyiKiBDb964KGSY08NQMWB5aTwvVlKdgSPoRoQa2/54vw==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "下架",
                "actionType": "11",
                "actionUrl": "biy8SbmOYb5zbVolnzAdXQSGqU/EGAqRDno3igR8AZA=",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              }
            ],
            "appraise": false,
            "area": "440305:南山区",
            "attributesMap": [],
            "auctionType": "b",
            "bargain": true,
            "bidStatus": 0,
            "browseCount": 2,
            "canPolish": false,
            "cardTypeSpecialDefinition": 0,
            "categoryId": 50023914,
            "city": "深圳",
            "collectNum": 0,
            "commentNum": 0,
            "commonDO": {
              "redirectUrl": "fleamarket://item?id=903321943226"
            },
            "commonShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#研究生导师评价，最新最全的研究生导师#",
            "deleteByXiaoer": false,
            "detailUrl": "fleamarket://awesome_detail?itemId=903321943226&hitNativeDetail=true&flutter=true",
            "divisionId": "440305",
            "editRedirectUrl": "fleamarket://unite_post?itemId=903321943226",
            "exposureNum": "2",
            "favorNum": 0,
            "favored": false,
            "filterUser": false,
            "firstModified": "2025-03-30 14:17:44",
            "firstModifiedDiff": "7小时前",
            "freeShip": false,
            "from": "wechat",
            "gmtCreated": "2025-03-29 18:01:13",
            "hasVideo": false,
            "id": "903321943226",
            "idleCoinBidItem": false,
            "idleCoinBuynowItem": false,
            "idleCoinItem": false,
            "imageInfos": [
              {
                "major": true,
                "type": 0,
                "url": "http://img.alicdn.com/bao/uploaded/i3/O1CN01cfar391UGT7Yy7xbS_!!0-fleamarket.jpg"
              }
            ],
            "imageUrls": [
              "http://img.alicdn.com/bao/uploaded/i3/O1CN01cfar391UGT7Yy7xbS_!!0-fleamarket.jpg"
            ],
            "instockByXiaoer": false,
            "isBizHelpSaleItem": false,
            "isDefaultPrice": false,
            "isFreeItem": false,
            "isSeaMarketItem": false,
            "itemCC": false,
            "itemDeleted": false,
            "itemStatus": 0,
            "leftSecond": 0,
            "locationAware": false,
            "longItemId": 903321943226,
            "miniParams": {
              "firstPage": true,
              "onlineSubTab": "1",
              "isSearch": false
            },
            "needExtendHeight": false,
            "offline": 0,
            "online": true,
            "originalPrice": "1",
            "outStockTime": "2025-06-28 14:17:44",
            "picUrl": "http://img.alicdn.com/bao/uploaded/i3/O1CN01cfar391UGT7Yy7xbS_!!0-fleamarket.jpg",
            "price": "1",
            "priceTags": {
              "reduceToTheBottom": false
            },
            "province": "广东",
            "rentItem": false,
            "resell": false,
            "selfPickUp": false,
            "serviceStatus": 0,
            "shortUrl": "http://2.taobao.com/item.htm?id=903321943226",
            "simpleItem": false,
            "structuredHouse": false,
            "stuffStatus": 9,
            "subscribed": false,
            "superFavorNum": 0,
            "templateId": 0,
            "title": "研究生导师评价，最新最全的研究生导师",
            "tradeType": 0,
            "userModified": "2025-03-29 18:01:13",
            "userTagUrlFromServer": false,
            "videoid": 0,
            "wantNum": 0,
            "weiboShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#研究生导师评价，最新最全的研究生导师#",
            "wxurl": "https://h5.m.taobao.com/2shou/appRedirect.html?page=item&id=903321943226",
            "zhimaLevel": 0,
            "zhimaScore": 0,
            "is_show": 1
          },
          {
            "actions": [
              {
                "actionName": "2人小刀",
                "actionType": "17",
                "actionUrl": "fcLaoezGIhjKqdnWmq8CCTYpgL6VPcYRGylbAJPbibljVULudY8Oql5kjEcP/B+Ha0yfKVgcRNWyn+2CD7x6tVEN9rcEd7qdZEwjXPWAk4GLA+F7Lr1ve3IcKXcPbyyx5SJUfQAm/z4wFGecLL0zznfdiTtQ8SmZ+BSeGyVYLII=",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "设粉丝价",
                "actionType": "2",
                "actionUrl": "DLtAY/xbLK+Msncm/zcnaw0jk6b+dfxmJxb/ZW1wp5O/zQSOM5wtRB0eifOURUzj+Ehwq7a2PKafGtO/0gqXlsDkgi6n4p9OOLG8eJMdbfnLhKN7ohTT6PHBCtTkARYIIHtlG/gOAWH7Td0VYIsqyg==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "降价",
                "actionType": "3",
                "actionUrl": "0ZXfT6zGf55+AauYBpvwFA==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "编辑",
                "actionType": "4",
                "actionUrl": "Qx+pCiFYTFP3e4rIywNmOg==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "分享",
                "actionType": "7",
                "actionUrl": "4Zn2tPtKtuF5nH1XJ2SucZf+YqjCYqv0nBJhDYgn3MxMoRd2QT6EqRXVLgprNZxlHooO9FotEVyyL1A1vQ6IlQ==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "下架",
                "actionType": "11",
                "actionUrl": "biy8SbmOYb5zbVolnzAdXQSGqU/EGAqRDno3igR8AZA=",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              }
            ],
            "appraise": false,
            "area": "440305:南山区",
            "attributesMap": [],
            "auctionType": "b",
            "bargain": true,
            "bidStatus": 0,
            "browseCount": 9,
            "canPolish": false,
            "cardTypeSpecialDefinition": 0,
            "categoryId": 50023914,
            "city": "深圳",
            "collectNum": 0,
            "commentNum": 0,
            "commonDO": {
              "redirectUrl": "fleamarket://item?id=902312127066"
            },
            "commonShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#win10/11专业版激活windows10正版密钥产品#",
            "deleteByXiaoer": false,
            "detailUrl": "fleamarket://awesome_detail?itemId=902312127066&flutter=true",
            "divisionId": "440305",
            "editRedirectUrl": "fleamarket://unite_post?itemId=902312127066",
            "exposureNum": "32",
            "favorNum": 0,
            "favored": false,
            "filterUser": false,
            "firstModified": "2025-03-30 14:15:40",
            "firstModifiedDiff": "7小时前",
            "freeShip": false,
            "from": "wechat",
            "gmtCreated": "2025-03-27 01:05:01",
            "hasVideo": false,
            "id": "902312127066",
            "idleCoinBidItem": false,
            "idleCoinBuynowItem": false,
            "idleCoinItem": false,
            "imageInfos": [
              {
                "major": true,
                "type": 0,
                "url": "http://img.alicdn.com/bao/uploaded/i1/O1CN01bxVqtX1J1OR408ikY_!!1115350968-0-fleamarket.jpg"
              }
            ],
            "imageUrls": [
              "http://img.alicdn.com/bao/uploaded/i1/O1CN01bxVqtX1J1OR408ikY_!!1115350968-0-fleamarket.jpg"
            ],
            "instockByXiaoer": false,
            "isBizHelpSaleItem": false,
            "isDefaultPrice": false,
            "isFreeItem": false,
            "isSeaMarketItem": false,
            "itemCC": false,
            "itemDeleted": false,
            "itemStatus": 0,
            "leftSecond": 0,
            "locationAware": false,
            "longItemId": 902312127066,
            "miniParams": {
              "firstPage": true,
              "onlineSubTab": "1",
              "isSearch": false
            },
            "needExtendHeight": false,
            "offline": 0,
            "online": true,
            "originalPrice": "1",
            "outStockTime": "2025-06-28 14:15:40",
            "picUrl": "http://img.alicdn.com/bao/uploaded/i1/O1CN01bxVqtX1J1OR408ikY_!!1115350968-0-fleamarket.jpg",
            "price": "2",
            "priceTags": {
              "priceSuffixLabelInfoDO": {
                "actionType": 0,
                "bgColor": "rgba(255,112,0,0.08)",
                "text": "2人小刀价¥1.8",
                "textColor": "#FF7900"
              },
              "reduceToTheBottom": false
            },
            "province": "广东",
            "rentItem": false,
            "resell": false,
            "selfPickUp": false,
            "sellerPromotionVO": {
              "activityPriceOrDiscount": "1.8",
              "itemId": 902312127066,
              "merchantItemScheduleId": 61978921,
              "promotionEndTime": "2125-03-03 02:31:52",
              "promotionStartTime": "2025-03-27 02:31:52",
              "promotionStatus": 2,
              "sellerId": 1115350968,
              "umpDetailId": "2049912288729"
            },
            "serviceStatus": 0,
            "shortUrl": "http://2.taobao.com/item.htm?id=902312127066",
            "simpleItem": false,
            "structuredHouse": false,
            "stuffStatus": 9,
            "subscribed": false,
            "superFavorNum": 0,
            "templateId": 0,
            "title": "win10/11专业版激活windows10正版密钥产品",
            "tradeType": 0,
            "userModified": "2025-03-27 02:31:26",
            "userTagUrlFromServer": false,
            "videoid": 0,
            "wantNum": 0,
            "weiboShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#win10/11专业版激活windows10正版密钥产品#",
            "wxurl": "https://h5.m.taobao.com/2shou/appRedirect.html?page=item&id=902312127066",
            "zhimaLevel": 0,
            "zhimaScore": 0,
            "is_show": 1
          },
          {
            "actions": [
              {
                "actionName": "2人小刀",
                "actionType": "17",
                "actionUrl": "fcLaoezGIhjKqdnWmq8CCTYpgL6VPcYRGylbAJPbibljVULudY8Oql5kjEcP/B+Ha0yfKVgcRNWyn+2CD7x6tVEN9rcEd7qdZEwjXPWAk4HR2pR0j6JaTt039DjfQD4tXT012NhXXa4W5FIy+7qiergbKT//HEthhLIRZe5T0F4=",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "设粉丝价",
                "actionType": "2",
                "actionUrl": "DLtAY/xbLK+Msncm/zcnaw0jk6b+dfxmJxb/ZW1wp5O/zQSOM5wtRB0eifOURUzj+Ehwq7a2PKafGtO/0gqXlsDkgi6n4p9OOLG8eJMdbfmtgv7/ixE3fVJGehDl87Mwd0l4xrknxiXtlXBtpifogw==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "降价",
                "actionType": "3",
                "actionUrl": "0ZXfT6zGf55+AauYBpvwFA==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "编辑",
                "actionType": "4",
                "actionUrl": "Qx+pCiFYTFP3e4rIywNmOg==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "分享",
                "actionType": "7",
                "actionUrl": "4Zn2tPtKtuF5nH1XJ2SucZf+YqjCYqv0nBJhDYgn3MxGfuJ1046nb8xUenThkrCgiAFniBXXX7x48RKdXqgS+Q==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "下架",
                "actionType": "11",
                "actionUrl": "biy8SbmOYb5zbVolnzAdXQSGqU/EGAqRDno3igR8AZA=",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              }
            ],
            "appraise": false,
            "area": "440305:南山区",
            "attributesMap": [],
            "auctionType": "b",
            "bargain": true,
            "bidStatus": 0,
            "browseCount": 204,
            "canPolish": false,
            "cardTypeSpecialDefinition": 0,
            "categoryId": 50025461,
            "city": "深圳",
            "collectNum": 0,
            "commentNum": 0,
            "commonDO": {
              "redirectUrl": "fleamarket://item?id=843875788813"
            },
            "commonShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#Brookstone遥控车。#",
            "deleteByXiaoer": false,
            "detailUrl": "fleamarket://awesome_detail?itemId=843875788813&flutter=true",
            "divisionId": "440305",
            "editRedirectUrl": "fleamarket://unite_post?itemId=843875788813",
            "exposureNum": "4904",
            "favorNum": 0,
            "favored": false,
            "filterUser": false,
            "firstModified": "2025-03-30 14:15:40",
            "firstModifiedDiff": "7小时前",
            "freeShip": false,
            "from": "iphone",
            "gmtCreated": "2024-10-14 07:57:19",
            "hasVideo": false,
            "id": "843875788813",
            "idleCoinBidItem": false,
            "idleCoinBuynowItem": false,
            "idleCoinItem": false,
            "imageInfos": [
              {
                "heightSize": 1087,
                "major": true,
                "type": 0,
                "url": "http://img.alicdn.com/bao/uploaded/i3/O1CN01eYNlRf1J1OOAsfcKM_!!0-fleamarket.jpg",
                "widthSize": 1138
              }
            ],
            "imageUrls": [
              "http://img.alicdn.com/bao/uploaded/i3/O1CN01eYNlRf1J1OOAsfcKM_!!0-fleamarket.jpg"
            ],
            "instockByXiaoer": false,
            "isBizHelpSaleItem": false,
            "isDefaultPrice": false,
            "isFreeItem": false,
            "isSeaMarketItem": false,
            "itemCC": false,
            "itemDeleted": false,
            "itemStatus": 0,
            "leafId": 1831,
            "leftSecond": 0,
            "locationAware": false,
            "longItemId": 843875788813,
            "miniParams": {
              "firstPage": true,
              "onlineSubTab": "1",
              "isSearch": false
            },
            "needExtendHeight": false,
            "offline": 0,
            "online": true,
            "originalPrice": "10",
            "outStockTime": "2025-06-28 14:15:39",
            "picUrl": "http://img.alicdn.com/bao/uploaded/i3/O1CN01eYNlRf1J1OOAsfcKM_!!0-fleamarket.jpg",
            "price": "2",
            "priceTags": {
              "priceSuffixLabelInfoDO": {
                "actionType": 0,
                "bgColor": "rgba(255,112,0,0.08)",
                "text": "2人小刀价¥1.8",
                "textColor": "#FF7900"
              },
              "reduceToTheBottom": false
            },
            "province": "广东",
            "rentItem": false,
            "resell": false,
            "selfPickUp": false,
            "sellerPromotionVO": {
              "activityPriceOrDiscount": "1.8",
              "itemId": 843875788813,
              "merchantItemScheduleId": 27248146,
              "promotionEndTime": "2124-10-28 21:02:30",
              "promotionStartTime": "2024-11-21 21:02:30",
              "promotionStatus": 2,
              "sellerId": 1115350968,
              "umpDetailId": "1786242573377"
            },
            "serviceStatus": 0,
            "shortUrl": "http://2.taobao.com/item.htm?id=843875788813",
            "simpleItem": false,
            "structuredHouse": false,
            "stuffStatus": 9,
            "subscribed": false,
            "superFavorNum": 0,
            "templateId": 0,
            "title": "Brookstone遥控车。",
            "tradeType": 0,
            "userModified": "2025-03-25 21:55:04",
            "userTagUrlFromServer": false,
            "videoid": 0,
            "wantNum": 12,
            "weiboShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#Brookstone遥控车。#",
            "wxurl": "https://h5.m.taobao.com/2shou/appRedirect.html?page=item&id=843875788813",
            "zhimaLevel": 0,
            "zhimaScore": 0,
            "is_show": 1
          },
          {
            "actions": [
              {
                "actionName": "2人小刀",
                "actionType": "17",
                "actionUrl": "fcLaoezGIhjKqdnWmq8CCTYpgL6VPcYRGylbAJPbibljVULudY8Oql5kjEcP/B+Ha0yfKVgcRNWyn+2CD7x6tVEN9rcEd7qdZEwjXPWAk4FhqDCSIXWq6jfZfGJ/QJaiA68z3SlVlprAT4ipxYwT5FmY1yDnpTsFGPaBuLzqHUY=",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "设粉丝价",
                "actionType": "2",
                "actionUrl": "DLtAY/xbLK+Msncm/zcnaw0jk6b+dfxmJxb/ZW1wp5O/zQSOM5wtRB0eifOURUzj+Ehwq7a2PKafGtO/0gqXlsDkgi6n4p9OOLG8eJMdbflMbHU0QUpIfsvlZ8IHOmCDK3aKNXn+98jx5xANS+6igw==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "编辑",
                "actionType": "4",
                "actionUrl": "Qx+pCiFYTFP3e4rIywNmOg==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "分享",
                "actionType": "7",
                "actionUrl": "4Zn2tPtKtuF5nH1XJ2SucZf+YqjCYqv0nBJhDYgn3MzMwz1mTN56q9VAxPZ+guch9F+RaT+F362aqTsFHu6b1g==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "下架",
                "actionType": "11",
                "actionUrl": "biy8SbmOYb5zbVolnzAdXQSGqU/EGAqRDno3igR8AZA=",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              }
            ],
            "appraise": false,
            "area": "440305:南山区",
            "attributesMap": [],
            "auctionType": "b",
            "bargain": true,
            "bidStatus": 0,
            "browseCount": 3,
            "canPolish": false,
            "cardTypeSpecialDefinition": 0,
            "categoryId": 50023914,
            "city": "深圳",
            "collectNum": 0,
            "commentNum": 0,
            "commonDO": {
              "redirectUrl": "fleamarket://item?id=903067352917"
            },
            "commonShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#【24h自动发货】（免费版 免费版 免费版）#",
            "deleteByXiaoer": false,
            "detailUrl": "fleamarket://awesome_detail?itemId=903067352917&flutter=true",
            "divisionId": "440305",
            "editRedirectUrl": "fleamarket://unite_post?itemId=903067352917",
            "exposureNum": "24",
            "favorNum": 0,
            "favored": false,
            "filterUser": false,
            "firstModified": "2025-03-30 14:15:40",
            "firstModifiedDiff": "7小时前",
            "freeShip": false,
            "from": "wechat",
            "gmtCreated": "2025-03-25 18:39:38",
            "hasVideo": false,
            "id": "903067352917",
            "idleCoinBidItem": false,
            "idleCoinBuynowItem": false,
            "idleCoinItem": false,
            "imageInfos": [
              {
                "major": true,
                "type": 0,
                "url": "http://img.alicdn.com/bao/uploaded/i4/O1CN01JoQUF21J1OR2hrFGF_!!1115350968-0-fleamarket.jpg"
              }
            ],
            "imageUrls": [
              "http://img.alicdn.com/bao/uploaded/i4/O1CN01JoQUF21J1OR2hrFGF_!!1115350968-0-fleamarket.jpg"
            ],
            "instockByXiaoer": false,
            "isBizHelpSaleItem": false,
            "isDefaultPrice": false,
            "isFreeItem": false,
            "isSeaMarketItem": false,
            "itemCC": false,
            "itemDeleted": false,
            "itemStatus": 0,
            "leftSecond": 0,
            "locationAware": false,
            "longItemId": 903067352917,
            "miniParams": {
              "firstPage": true,
              "onlineSubTab": "1",
              "isSearch": false
            },
            "needExtendHeight": false,
            "offline": 0,
            "online": true,
            "originalPrice": "1",
            "outStockTime": "2025-06-28 14:15:40",
            "picUrl": "http://img.alicdn.com/bao/uploaded/i4/O1CN01JoQUF21J1OR2hrFGF_!!1115350968-0-fleamarket.jpg",
            "price": "1",
            "priceTags": {
              "priceSuffixLabelInfoDO": {
                "actionType": 0,
                "bgColor": "rgba(255,112,0,0.08)",
                "text": "2人小刀价¥0.9",
                "textColor": "#FF7900"
              },
              "reduceToTheBottom": false
            },
            "province": "广东",
            "rentItem": false,
            "resell": false,
            "selfPickUp": false,
            "sellerPromotionVO": {
              "activityPriceOrDiscount": "0.9",
              "itemId": 903067352917,
              "merchantItemScheduleId": 60039787,
              "promotionEndTime": "2125-03-01 18:57:44",
              "promotionStartTime": "2025-03-25 18:57:44",
              "promotionStatus": 2,
              "sellerId": 1115350968,
              "umpDetailId": "2047758147539"
            },
            "serviceStatus": 0,
            "shortUrl": "http://2.taobao.com/item.htm?id=903067352917",
            "simpleItem": false,
            "structuredHouse": false,
            "stuffStatus": 9,
            "subscribed": false,
            "superFavorNum": 0,
            "templateId": 0,
            "title": "【24h自动发货】（免费版 免费版 免费版）",
            "tradeType": 0,
            "userModified": "2025-03-25 18:57:44",
            "userTagUrlFromServer": false,
            "videoid": 0,
            "wantNum": 0,
            "weiboShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#【24h自动发货】（免费版 免费版 免费版）#",
            "wxurl": "https://h5.m.taobao.com/2shou/appRedirect.html?page=item&id=903067352917",
            "zhimaLevel": 0,
            "zhimaScore": 0,
            "is_show": 1
          },
          {
            "actions": [
              {
                "actionName": "2人小刀",
                "actionType": "17",
                "actionUrl": "fcLaoezGIhjKqdnWmq8CCTYpgL6VPcYRGylbAJPbibljVULudY8Oql5kjEcP/B+Ha0yfKVgcRNWyn+2CD7x6tVEN9rcEd7qdZEwjXPWAk4FKRyiaFFeDVF0jhiL2AsKXnKWOWwBeicPilfOnAGeCSKqJu+nBJ/jJFiUS0rtZIcQ=",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "设粉丝价",
                "actionType": "2",
                "actionUrl": "DLtAY/xbLK+Msncm/zcnaw0jk6b+dfxmJxb/ZW1wp5O/zQSOM5wtRB0eifOURUzj+Ehwq7a2PKafGtO/0gqXlsDkgi6n4p9OOLG8eJMdbfnaJodWwuGz8tmvLeIzOJesePWQ9OcEfXpr/2pnxewT/g==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "降价",
                "actionType": "3",
                "actionUrl": "0ZXfT6zGf55+AauYBpvwFA==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "编辑",
                "actionType": "4",
                "actionUrl": "Qx+pCiFYTFP3e4rIywNmOg==",
                "enable": "1",
                "upBrightShow": false
              },
              {
                "actionName": "分享",
                "actionType": "7",
                "actionUrl": "4Zn2tPtKtuF5nH1XJ2SucZf+YqjCYqv0nBJhDYgn3Mx+5HfIk3+Jg0hWdGIfBL4w8l49gbiJgYaG+xmz9lB84w==",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              },
              {
                "actionName": "下架",
                "actionType": "11",
                "actionUrl": "biy8SbmOYb5zbVolnzAdXQSGqU/EGAqRDno3igR8AZA=",
                "enable": "1",
                "more": "1",
                "upBrightShow": false
              }
            ],
            "appraise": false,
            "area": "440305:南山区",
            "attributesMap": [],
            "auctionType": "b",
            "bargain": true,
            "bidStatus": 0,
            "browseCount": 39,
            "canPolish": false,
            "cardTypeSpecialDefinition": 0,
            "categoryId": 50025461,
            "city": "深圳",
            "collectNum": 0,
            "commentNum": 0,
            "commonDO": {
              "redirectUrl": "fleamarket://item?id=895627348761"
            },
            "commonShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#上班摸鱼小游戏，内置上百小游戏，快捷键唤出，鼠标离开自动隐藏#",
            "deleteByXiaoer": false,
            "detailUrl": "fleamarket://awesome_detail?itemId=895627348761&flutter=true",
            "divisionId": "440305",
            "editRedirectUrl": "fleamarket://unite_post?itemId=895627348761",
            "exposureNum": "1542",
            "fansPriceMinString": "1.10",
            "favorNum": 0,
            "favored": false,
            "filterUser": false,
            "firstModified": "2025-03-30 14:15:40",
            "firstModifiedDiff": "7小时前",
            "freeShip": false,
            "from": "iphone",
            "gmtCreated": "2025-03-04 17:10:56",
            "hasVideo": false,
            "id": "895627348761",
            "idleCoinBidItem": false,
            "idleCoinBuynowItem": false,
            "idleCoinItem": false,
            "imageInfos": [
              {
                "heightSize": 698,
                "major": true,
                "type": 0,
                "url": "http://img.alicdn.com/bao/uploaded/i3/O1CN01lIzoRk1J1OQfLUyLn_!!4611686018427381688-0-fleamarket.jpg",
                "widthSize": 982
              }
            ],
            "imageUrls": [
              "http://img.alicdn.com/bao/uploaded/i3/O1CN01lIzoRk1J1OQfLUyLn_!!4611686018427381688-0-fleamarket.jpg"
            ],
            "instockByXiaoer": false,
            "isBizHelpSaleItem": false,
            "isDefaultPrice": false,
            "isFreeItem": false,
            "isSeaMarketItem": false,
            "itemCC": false,
            "itemDeleted": false,
            "itemStatus": 0,
            "leftSecond": 0,
            "locationAware": false,
            "longItemId": 895627348761,
            "miniParams": {
              "firstPage": true,
              "onlineSubTab": "1",
              "isSearch": false
            },
            "needExtendHeight": false,
            "offline": 0,
            "online": true,
            "originalPrice": "99",
            "outStockTime": "2025-06-28 14:15:40",
            "picUrl": "http://img.alicdn.com/bao/uploaded/i3/O1CN01lIzoRk1J1OQfLUyLn_!!4611686018427381688-0-fleamarket.jpg",
            "price": "1.20",
            "priceTags": {
              "priceSuffixLabelInfoDO": {
                "actionType": 0,
                "bgColor": "rgba(255,112,0,0.08)",
                "text": "2人小刀价¥1",
                "textColor": "#FF7900"
              },
              "reduceToTheBottom": false
            },
            "province": "广东",
            "rentItem": false,
            "resell": false,
            "selfPickUp": false,
            "sellerPromotionVO": {
              "activityPriceOrDiscount": "1",
              "itemId": 895627348761,
              "merchantItemScheduleId": 53187936,
              "promotionEndTime": "2125-02-08 18:29:39",
              "promotionStartTime": "2025-03-04 18:29:39",
              "promotionStatus": 2,
              "sellerId": 1115350968,
              "umpDetailId": "2015421498232"
            },
            "serviceStatus": 0,
            "shortUrl": "http://2.taobao.com/item.htm?id=895627348761",
            "simpleItem": false,
            "structuredHouse": false,
            "stuffStatus": 9,
            "subscribed": false,
            "superFavorNum": 0,
            "templateId": 0,
            "title": "上班摸鱼小游戏，内置上百小游戏，快捷键唤出，鼠标离开自动隐藏",
            "tradeType": 0,
            "userModified": "2025-03-25 18:30:22",
            "userTagUrlFromServer": false,
            "videoid": 0,
            "wantNum": 2,
            "weiboShareContent": "跟市场价比起来简直八哥价啊！戳进捡漏！#上班摸鱼小游戏，内置上百小游戏，快捷键唤出，鼠标离开自动隐藏#",
            "wxurl": "https://h5.m.taobao.com/2shou/appRedirect.html?page=item&id=895627348761",
            "zhimaLevel": 0,
            "zhimaScore": 0,
            "is_show": 1
          }
        ],
        "count": 47
      },
      "message": "success"
    }

    const { data } = res

    data.pagination = {
      total: data.count,
      page: page.value,
      pageSize: pageSize.value
    }

    // 从分页数据中获取列表和总数
    goods.value = data.list || []
    goods.value.map(item => {
      item.is_show = item.is_show === 1
    })
    total.value = data.pagination?.total || 0
    page.value = data.pagination?.page || 1
    pageSize.value = data.pagination?.pageSize || 15
  } catch (error) {
    console.error('获取商品列表失败:', error)
    ElMessage.error('获取商品列表失败')
  }
}

// 监听分页变化
watch([page, pageSize], () => {
  fetchGoods()
})

// 处理文件变化
const handleFileChange = (uploadFile) => {
  // 将文件转换为base64
  const reader = new FileReader()
  reader.readAsDataURL(uploadFile.raw)
  reader.onload = () => {
    form.value.urls = [...(form.value.urls || []), reader.result]
  }
}

// 新增按钮点击
const handleAdd = () => {
  isEdit.value = false
  form.value = {
    shareUrl: '',
    sendTxt: '',
    name: '',
    no: '',
    price: 0,
    stock: 0,
    description: '',
    autoPush: false,
    status: 1,
    urls: []
  }
  fileList.value = []
  dialogVisible.value = true
}

// 编辑按钮点击
const handleEdit = (row) => {
  isEdit.value = true
  currentId.value = row.goodId
  form.value = {
    shareUrl: row.shareUrl,
    sendTxt: row.sendTxt,
    name: row.name,
    no: row.no,
    price: row.price,
    stock: row.stock,
    description: row.description,
    autoPush: row.autoPush,
    status: row.status,
    urls: row.urls || []
  }
  // 设置文件列表
  fileList.value = (row.urls || []).map((url, index) => ({
    name: `图片${index + 1}`,
    url
  }))
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  if (activeTab.value === 'available' && form.value.description.length > 500) {
    ElMessage.error(`商品描述不能超过500字，当前字数：${form.value.description.length}`)
    return
  }

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const submitData = {
          no: form.value.no,
          shareUrl: form.value.shareUrl,
          sendTxt: form.value.sendTxt,
          description: form.value.description
        }

        let newGood
        if (isEdit.value) {
          const { data } = await request.put(`/ydgl/xygoods/${currentId.value}`, submitData)
          newGood = data
          ElMessage.success('编辑成功')
        } else {
          const { data } = await request.post('/ydgl/xygoods', {
            ...submitData,
            shopId: route.query.shopId
          })
          newGood = data
          ElMessage.success('新增成功')
        }

        dialogVisible.value = false

        if (!isEdit.value) {
          // 新增商品后开始解析
          startParsing(newGood.goodId)
        } else {
          fetchGoods()
        }
      } catch (error) {
        console.error(error)
      }
    }
  })
}

// 切换状态
const handleToggleStatus = async (row) => {
  try {
    await request.put(`/ydgl/xygoods/${row.goodId}`, { status: row.status ? 0 : 1 })
    ElMessage.success('更新成功')
    fetchGoods()
  } catch (error) {
    console.error('更新失败:', error)
  }
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确认删除该商品吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await request.delete(`/ydgl/xygoods/${row.goodId}`)
      ElMessage.success('删除成功')
      fetchGoods()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

// 开始解析商品信息
const startParsing = async (goodId) => {
  parseDialogVisible.value = true
  parseProgress.value = 0
  parseStatus.value = ''
  parseMessage.value = '正在解析商品信息...'

  // 模拟进度
  const timer = setInterval(() => {
    if (parseProgress.value < 90) {
      parseProgress.value += 10
    }
  }, 200)

  try {
    const { data } = await request.post(`/ydgl/xygoods/${goodId}/parse`)
    clearInterval(timer)
    parseProgress.value = 100
    parseStatus.value = 'success'
    parseMessage.value = '解析成功！'

    // 更新列表数据
    fetchGoods()

    // 3秒后关闭对话框
    setTimeout(() => {
      parseDialogVisible.value = false
    }, 3000)
  } catch (error) {
    clearInterval(timer)
    parseProgress.value = 100
    parseStatus.value = 'exception'
    parseMessage.value = '解析失败：' + (error.message || '未知错误')

    // 5秒后关闭对话框
    setTimeout(() => {
      parseDialogVisible.value = false
    }, 5000)
  }
}

// 查看商品详情
const handleView = (row) => {
  window.open(row.url, '_blank')
}

// 处理分页变化
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchGoods()
}

const handleCurrentChange = (val) => {
  page.value = val
  fetchGoods()
}

// 添加标签页切换处理函数
const handleTabChange = (tab) => {
  page.value = 1 // 切换标签时重置页码
  fetchGoods()
}

// 上架相关状态
const publishDialogVisible = ref(false)
const publishProgressDialogVisible = ref(false)
const publishProgress = ref(0)
const publishStatus = ref('')
const publishMessage = ref('正在上架商品...')
const selectedAccounts = ref([])
const currentPublishGood = ref(null)

// 模拟闲鱼账号数据
const xianYuAccounts = ref([])

// 处理上架按钮点击
const handlePublish = (row) => {
  currentPublishGood.value = row
  selectedAccounts.value = []
  publishDialogVisible.value = true
}

// 确认上架
const confirmPublish = async () => {
  publishProgressDialogVisible.value = true
  publishProgress.value = 0
  publishStatus.value = ''
  publishMessage.value = '正在上架商品...'

  // 模拟进度
  const timer = setInterval(() => {
    if (publishProgress.value < 90) {
      publishProgress.value += 10
    }
  }, 200)
  try {
    await request.post(`/ydaccounts/pushGood`, { goodId: [currentPublishGood.value.id], accountId: selectedAccounts.value })
    clearInterval(timer)
    publishProgress.value = 100
    publishStatus.value = 'success'
    publishMessage.value = '上架成功！'
    // 更新列表数据
    fetchGoods()

    // 3秒后关闭对话框
    setTimeout(() => {
      publishProgressDialogVisible.value = false
      publishDialogVisible.value = false
    }, 3000)
  } catch (error) {
    console.error('更新失败:', error)
  }

}

// 获取列表数据
const fetchShops = async () => {
  try {
    const { data } = await request.get('/ydaccounts', {
      params: {
        page: page.value,
        pageSize: pageSize.value
      }
    })
    xianYuAccounts.value = data.list
  } catch (error) {
    console.error('获取店铺列表失败:', error)
  }
}

onMounted(() => {
  fetchGoods()
  fetchShops()
})
</script>

<style scoped>
.good-container {
  min-height: 100%;
  width: 100%;
}

.good-card {
  width: 100%;
  min-height: calc(100vh - 90px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.shop-name {
  font-size: 16px;
  font-weight: bold;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.parse-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px 0;
}

.parse-message {
  text-align: center;
  color: #606266;
}

/* 添加新样式 */
.el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>