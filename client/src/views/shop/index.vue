<template>
  <div class="shop-container">
    <el-card class="shop-card">
      <template #header>
        <div class="card-header">
          <span>店铺列表</span>
          <el-button type="primary" @click="handleAdd">
            新增店铺
          </el-button>
        </div>
      </template>
      
      <!-- 店铺列表 -->
      <el-table :data="shops" style="width: 100%">
        <el-table-column prop="name" label="店铺名称" />
        <el-table-column prop="url" label="店铺链接" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :href="row.url" target="_blank">
              {{ row.url }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="sale" label="销售额" width="120">
          <template #default="{ row }">
            {{ row.sale.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="isExtract" label="信息提取" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isExtract ? 'success' : 'warning'">
              {{ row.isExtract ? '已提取' : '未提取' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="productCount" label="商品总数" width="100">
          <template #default="{ row }">
            <template v-if="row.isExtract">
              <el-button 
                link 
                type="primary" 
                @click="$router.push(`/good?shopId=${row.shopId}`)"
              >
                {{ row.productCount }}
              </el-button>
            </template>
            <template v-else>
              {{ row.productCount }}
            </template>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'">
              {{ row.status ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="startParsing(row.shopId)"
            >
              拉取店铺主页信息
            </el-button>
            <el-button
              type="primary"
              link
              @click="startParseGoods(row.shopId)"
            >
              拉取商品概览信息
            </el-button>
            <el-button
              v-if="row.isExtract"
              type="primary"
              link
              @click="startParseGoodDetail(row.shopId)"
            >
              拉取商品详细信息
            </el-button>
            <el-button
              type="primary"
              link
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="success"
              link
              @click="handleToggleStatus(row)"
            >
              {{ row.status ? '禁用' : '启用' }}
            </el-button>
            <el-button
              type="danger"
              link
              @click="handleDelete(row)"
            >
              删除
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
          label="店铺链接" 
          prop="url"
          :rules="[
            { required: true, message: '请输入店铺链接', trigger: 'blur' },
            { type: 'url', message: '请输入正确的URL格式', trigger: 'blur' }
          ]"
        >
          <el-input v-model="form.url" placeholder="请输入店铺链接" />
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
      title="店铺信息解析"
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
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// 分页相关
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const shops = ref([])

// 表单相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref(null)
const formRef = ref(null)

const form = ref({
  url: ''
})

const dialogTitle = computed(() => isEdit.value ? '编辑店铺' : '新增店铺')

// 解析相关的状态
const parseDialogVisible = ref(false)
const parseProgress = ref(0)
const parseStatus = ref('')
const parseMessage = ref('正在解析店铺信息...')

// 获取列表数据
const fetchShops = async () => {
  try {
    const { data } = await request.get('/shops', {
      params: { page: page.value, pageSize: pageSize.value }
    })
    shops.value = data.list
    total.value = data.pagination.total
  } catch (error) {
    console.error('获取店铺列表失败:', error)
  }
}

// 新增按钮点击
const handleAdd = () => {
  isEdit.value = false
  form.value = { url: '' }
  dialogVisible.value = true
}

// 编辑按钮点击
const handleEdit = (row) => {
  isEdit.value = true
  currentId.value = row.shopId
  form.value = { url: row.url }
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let newShop
        if (isEdit.value) {
          const { data } = await request.put(`/shops/${currentId.value}`, form.value)
          newShop = data
        } else {
          const { data } = await request.post('/shops', form.value)
          newShop = data
        }
        
        ElMessage.success(`${isEdit.value ? '编辑' : '新增'}成功`)
        dialogVisible.value = false
        
        if (!isEdit.value) {
          // 新增店铺后开始解析
          startParsing(newShop.shopId)
        } else {
          fetchShops()
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
    await request.put(`/shops/${row.shopId}`, { status: row.status ? 0 : 1 })
    ElMessage.success('更新成功')
    fetchShops()
  } catch (error) {
    console.error('更新失败:', error)
  }
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确认删除该店铺吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await request.delete(`/shops/${row.shopId}`)
      ElMessage.success('删除成功')
      fetchShops()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

// 处理分页变化
const handleSizeChange = (val) => {
  pageSize.value = val
  page.value = 1
  fetchShops()
}

const handleCurrentChange = (val) => {
  page.value = val
  fetchShops()
}

// 拉取商品详细信息
const startParseGoodDetail = async (shopId) => {
  parseDialogVisible.value = true
  parseProgress.value = 0
  parseStatus.value = ''
  parseMessage.value = '正在拉取商品详细信息...'
  
  // 模拟进度
  const timer = setInterval(() => {
    if (parseProgress.value < 90) {
      parseProgress.value += 10
    }
  }, 200)
  
  try {
    const { data } = await request.post(`/shops/${shopId}/parseGoodDetail`)
    clearInterval(timer)
    parseProgress.value = 100
    parseStatus.value = 'success'
    parseMessage.value = '解析成功！'
    
    // 更新列表数据
    fetchShops()
    
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

// 拉取商品概览信息
const startParseGoods = async (shopId) => {
  parseDialogVisible.value = true
  parseProgress.value = 0
  parseStatus.value = ''
  parseMessage.value = '正在拉取商品概览信息...'
  
  // 模拟进度
  const timer = setInterval(() => {
    if (parseProgress.value < 90) {
      parseProgress.value += 10
    }
  }, 200)
  
  try {
    const { data } = await request.post(`/shops/${shopId}/parseGood`)
    clearInterval(timer)
    parseProgress.value = 100
    parseStatus.value = 'success'
    parseMessage.value = '解析成功！'
    
    // 更新列表数据
    fetchShops()
    
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

// 拉取店铺主页信息
const startParsing = async (shopId) => {
  parseDialogVisible.value = true
  parseProgress.value = 0
  parseStatus.value = ''
  parseMessage.value = '正在拉取店铺主页信息...'
  
  // 模拟进度
  const timer = setInterval(() => {
    if (parseProgress.value < 90) {
      parseProgress.value += 10
    }
  }, 200)
  
  try {
    const { data } = await request.post(`/shops/${shopId}/parse`)
    clearInterval(timer)
    parseProgress.value = 100
    parseStatus.value = 'success'
    parseMessage.value = '解析成功！'
    
    // 更新列表数据
    fetchShops()
    
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

// 初始化
fetchShops()
</script>

<style scoped>
.shop-container {
  min-height: 100%;
  width: 100%;
}

.shop-card {
  width: 100%;
  min-height: calc(100vh - 90px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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