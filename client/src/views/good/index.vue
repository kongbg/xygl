<template>
  <div class="good-container">
    <el-card class="good-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button link @click="$router.back()">
              <el-icon><Back /></el-icon>
              返回店铺列表
            </el-button>
            <span class="shop-name">{{ shopName }}</span>
          </div>
          <el-button type="primary" @click="handleAdd">
            新增商品
          </el-button>
        </div>
      </template>
      
      <!-- 商品列表 -->
      <el-table :data="goods" style="width: 100%">
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="shopId" label="店铺ID" width="120" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            ¥{{ row.price }}
          </template>
        </el-table-column>
        <el-table-column prop="wantCot" label="想要人数" width="100" sortable />
        <el-table-column prop="viewCot" label="浏览量" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'">
              {{ row.status ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.createTime).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="handleView(row)"
            >
              查看
            </el-button>
            <el-button
              type="success"
              link
              :href="row.shareUrl"
              target="_blank"
            >
              链接
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item 
          label="商品名称" 
          prop="name"
          :rules="[
            { required: true, message: '请输入商品名称', trigger: 'blur' }
          ]"
        >
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item 
          label="商品链接" 
          prop="shareUrl"
          :rules="[
            { required: true, message: '请输入商品链接', trigger: 'blur' },
            { type: 'url', message: '请输入正确的URL格式', trigger: 'blur' }
          ]"
        >
          <el-input v-model="form.shareUrl" placeholder="请输入商品链接" />
        </el-form-item>
        <el-form-item 
          label="商品编号" 
          prop="no"
        >
          <el-input v-model="form.no" placeholder="请输入商品编号" />
        </el-form-item>
        <el-form-item 
          label="价格" 
          prop="price"
          :rules="[
            { required: true, message: '请输入价格', trigger: 'blur' },
            { type: 'number', message: '价格必须为数字', trigger: 'blur' }
          ]"
        >
          <el-input-number 
            v-model="form.price" 
            :precision="2" 
            :step="0.01" 
            :min="0"
          />
        </el-form-item>
        <el-form-item 
          label="库存" 
          prop="stock"
          :rules="[
            { required: true, message: '请输入库存', trigger: 'blur' },
            { type: 'number', message: '库存必须为数字', trigger: 'blur' }
          ]"
        >
          <el-input-number 
            v-model="form.stock" 
            :min="0" 
            :precision="0"
          />
        </el-form-item>
        <el-form-item label="售罄自动上架">
          <el-switch v-model="form.autoPush" />
        </el-form-item>
        <el-form-item 
          label="商品描述" 
          prop="description"
        >
          <el-input 
            v-model="form.description" 
            type="textarea" 
            rows="3"
            placeholder="请输入商品描述"
          />
        </el-form-item>
        <el-form-item label="商品图片">
          <el-upload
            v-model:file-list="fileList"
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :on-change="handleFileChange"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            inline-prompt
            active-text="正常"
            inactive-text="禁用"
          />
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
    <el-dialog
      title="商品信息解析"
      v-model="parseDialogVisible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      width="400px"
    >
      <div class="parse-dialog-content">
        <el-progress 
          type="circle" 
          :percentage="parseProgress"
          :status="parseStatus"
        />
        <div class="parse-message">{{ parseMessage }}</div>
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
const router = useRouter()
const shopId = route.query.shopId
const shopName = ref('')

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
    { required: true, message: '请输入商品链接', trigger: 'blur' },
    { type: 'url', message: '请输入正确的URL格式', trigger: 'blur' }
  ]
}

const dialogTitle = computed(() => isEdit.value ? '编辑商品' : '新增商品')

// 解析相关的状态
const parseDialogVisible = ref(false)
const parseProgress = ref(0)
const parseStatus = ref('')
const parseMessage = ref('正在解析商品信息...')

// 获取店铺信息
const fetchShopInfo = async () => {
  try {
    const { data } = await request.get(`/shops/${shopId}`)
    shopName.value = data.name
  } catch (error) {
    console.error('获取店铺信息失败:', error)
  }
}

// 获取商品列表
const fetchGoods = async () => {
  try {
    const { data } = await request.get('/goods', {
      params: {
        page: page.value,
        pageSize: pageSize.value
      }
    })
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
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const submitData = {
          ...form.value,
          urls: fileList.value.map(file => file.url)
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

onMounted(() => {
  fetchGoods()
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
</style> 