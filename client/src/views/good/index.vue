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
        <el-tab-pane label="所有商品" name="all" />
        <el-tab-pane label="可上架商品" name="available" />
      </el-tabs>

      <!-- 商品列表 -->
      <el-table :data="goods" style="width: 100%">
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="description" label="商品描述">
          <template #default="{ row }">
            <el-input type="textarea" rows="4" v-model="row.description" />
          </template>
        </el-table-column>
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
        <el-table-column prop="wantCot" label="想要人数" width="100" sortable />
        <el-table-column prop="viewCot" label="浏览量" width="100" />
        <el-table-column prop="shareUrl" label="资源" width="100">
          <template #default="{ row }">
            {{ row.shareUrl ? '已获取' : '未获取' }}
          </template>
        </el-table-column>
        <el-table-column prop="publishedShops" label="已上架店铺" width="120">
          <template #default="{ row }">
            {{ (row.publishedShops || []).join(',') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button v-if="activeTab === 'available' && row.description.length <= 500 && row.shareUrl && row.sendTxt"
              type="success" link @click="handlePublish(row)">
              上架
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          :total="total" layout="total, sizes, prev, pager, next" @size-change="handleSizeChange"
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
const pageSize = ref(10)
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
const activeTab = ref('all')

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
      pageSize: pageSize.value
    }
    if (activeTab.value === 'available') {
      params.shareUrl = 'nonEmpty'
    }
    const { data } = await request.get('/goods', { params })
    // 从分页数据中获取列表和总数
    goods.value = data.list || []
    total.value = data.pagination?.total || 0
    page.value = data.pagination?.page || 1
    pageSize.value = data.pagination?.pageSize || 10
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
          const { data } = await request.put(`/goods/${currentId.value}`, submitData)
          newGood = data
          ElMessage.success('编辑成功')
        } else {
          const { data } = await request.post('/goods', {
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
    await request.put(`/goods/${row.goodId}`, { status: row.status ? 0 : 1 })
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
      await request.delete(`/goods/${row.goodId}`)
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
    const { data } = await request.post(`/goods/${goodId}/parse`)
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