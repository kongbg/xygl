<template>
  <div class="ydgood-container">
    <el-card class="ydgood-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button link @click="$router.back()">
              <el-icon>
                <Back />
              </el-icon>
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
        <el-table-column prop="no" label="商品编号" width="120" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            ¥{{ row.price }}
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column prop="wantCot" label="想要人数" width="100" />
        <el-table-column prop="viewCot" label="浏览人数" width="100" />
        <el-table-column label="商品图片" width="100">
          <template #default="{ row }">
            <el-image style="width: 50px; height: 50px" :src="row.picUrl" :preview-src-list="[row.picUrl]" />
          </template>
        </el-table-column>
        <el-table-column prop="description" label="商品描述" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="autoPush" label="售罄自动上架" width="80">
          <template #default="{ row }">
            <el-tag :type="row.autoPush ? 'success' : 'info'">
              {{ row.autoPush ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isExtract" label="信息提取" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isExtract ? 'success' : 'warning'">
              {{ row.isExtract ? '已提取' : '未提取' }}
            </el-tag>
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
            <el-button type="primary" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="success" link @click="handleToggleStatus(row)">
              {{ row.status ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              删除
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
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="商品名称" prop="name" :rules="[
          { required: true, message: '请输入商品名称', trigger: 'blur' }
        ]">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>

        <el-form-item label="商品链接" prop="shareUrl" :rules="[
          { required: true, message: '请输入商品链接', trigger: 'blur' },
          { type: 'url', message: '请输入正确的URL格式', trigger: 'blur' }
        ]">
          <el-input v-model="form.shareUrl" placeholder="请输入商品链接" />
        </el-form-item>

        <el-form-item label="商品编号" prop="no">
          <el-input v-model="form.no" placeholder="请输入商品编号" />
        </el-form-item>

        <el-form-item label="价格" prop="price" :rules="[
          { required: true, message: '请输入价格', trigger: 'blur' },
          { type: 'number', message: '价格必须为数字', trigger: 'blur' }
        ]">
          <el-input-number v-model="form.price" :precision="2" :step="0.01" :min="0" />
        </el-form-item>

        <el-form-item label="库存" prop="stock" :rules="[
          { required: true, message: '请输入库存', trigger: 'blur' },
          { type: 'number', message: '库存必须为数字', trigger: 'blur' }
        ]">
          <el-input-number v-model="form.stock" :min="0" :precision="0" />
        </el-form-item>

        <el-form-item label="商品描述" prop="description">
          <el-input v-model="form.description" type="textarea" rows="3" placeholder="请输入商品描述" />
        </el-form-item>

        <el-form-item label="商品图片">
          <el-upload action="/api/upload" list-type="picture-card" :file-list="fileList" :on-success="handleSuccess"
            :on-remove="handleRemove" :before-upload="beforeUpload" :limit="5" :on-exceed="handleExceed">
            <el-icon>
              <Plus />
            </el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="售罄自动上架">
          <el-switch v-model="form.autoPush" />
        </el-form-item>

        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" inline-prompt active-text="正常"
            inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const shopId = route.query.shopId
const shopName = ref('')

// 数据列表
const goods = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

// 表单相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref(null)
const formRef = ref(null)
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

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑商品' : '新增商品')

// 获取店铺信息
const fetchShopInfo = async () => {
  try {
    const { data } = await request.get(`/ydshops/${shopId}`)
    shopName.value = data.name
  } catch (error) {
    console.error(error)
  }
}

// 获取商品列表
const fetchGoods = async () => {
  try {
    const { data } = await request.get('/ydgoods', {
      params: {
        shopId,
        page: page.value,
        pageSize: pageSize.value
      }
    })
    goods.value = data.list
    total.value = data.total
  } catch (error) {
    console.error(error)
  }
}

// 图片上传相关
const fileList = ref([])
const handleExceed = () => {
  ElMessage.warning('最多只能上传5张图片')
}

const handleSuccess = (response, file) => {
  file.url = response.data.url
}

const handleRemove = (file) => {
  const index = fileList.value.indexOf(file)
  if (index !== -1) {
    fileList.value.splice(index, 1)
  }
}

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
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
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let newGood
        if (isEdit.value) {
          const { data } = await request.put(`/ydgoods/${currentId.value}`, form.value)
          newGood = data
          ElMessage.success('编辑成功')
        } else {
          const { data } = await request.post('/ydgoods', {
            ...form.value,
            shopId: route.query.shopId
          })
          newGood = data
          ElMessage.success('新增成功')
        }

        dialogVisible.value = false
        fetchGoods()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

// 删除商品
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该商品吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await request.delete(`/ydgoods/${row.goodId}`)
      ElMessage.success('删除成功')
      fetchGoods()
    } catch (error) {
      console.error(error)
    }
  })
}

// 切换状态
const handleToggleStatus = async (row) => {
  try {
    await request.put(`/ydgoods/${row.goodId}`, {
      status: row.status ? 0 : 1
    })
    row.status = row.status ? 0 : 1
    ElMessage.success(`${row.status ? '启用' : '禁用'}成功`)
  } catch (error) {
    console.error(error)
  }
}

// 处理分页变化
const handleSizeChange = (val) => {
  pageSize.value = val
  page.value = 1
  fetchGoods()
}

const handleCurrentChange = (val) => {
  page.value = val
  fetchGoods()
}

onMounted(() => {
  if (!shopId) {
    ElMessage.error('店铺ID不能为空')
    router.push('/ydshop')
    return
  }
  fetchShopInfo()
  fetchGoods()
})
</script>

<style scoped>
.ydgood-container {
  min-height: 100%;
  width: 100%;
}

.ydgood-card {
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
</style>