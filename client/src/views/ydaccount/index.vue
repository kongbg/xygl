<template>
  <div class="ydaccount-container">
    <el-card class="ydaccount-card">
      <template #header>
        <div class="card-header">
          <span>闲鱼账号管理</span>
          <el-button type="primary" @click="handleAdd">
            新增账号
          </el-button>
        </div>
      </template>
      
      <!-- 账号列表 -->
      <el-table :data="accounts" style="width: 100%">
        <el-table-column prop="username" label="账号" />
        <el-table-column prop="password" label="密码" />
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
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
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
          label="账号" 
          prop="username"
          :rules="[
            { required: true, message: '请输入账号', trigger: 'blur' }
          ]"
        >
          <el-input v-model="form.username" placeholder="请输入账号" />
        </el-form-item>
        
        <el-form-item 
          label="密码" 
          prop="password"
          :rules="[
            { required: true, message: '请输入密码', trigger: 'blur' }
          ]"
        >
          <el-input 
            v-model="form.password" 
            placeholder="请输入密码" 
          />
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
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加二维码弹窗 -->
    <el-dialog
      title="请扫码登录"
      v-model="qrDialogVisible"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="qr-container">
        <img v-if="qrCode" :src="'data:image/png;base64,' + qrCode" />
        <div v-if="scanning" class="scanning-tip">
          <el-icon class="is-loading"><Loading /></el-icon>
          正在等待扫码...
        </div>
        <div v-if="scanSuccess" class="success-tip">
          <el-icon><CircleCheck /></el-icon>
          扫码成功！
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancelScan">取消</el-button>
          <el-button type="primary" @click="handleConfirmScan">
            确认已扫码
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, CircleCheck } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 数据列表
const accounts = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

// 表单相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref(null)
const formRef = ref(null)
const form = ref({
  username: '',
  password: '',
  status: 1
})

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑账号' : '新增账号')

// 获取账号列表
const fetchAccounts = async () => {
  try {
    const { data } = await request.get('/ydaccounts', {
      params: {
        page: page.value,
        pageSize: pageSize.value
      }
    })
    accounts.value = data.list
    total.value = data.total
  } catch (error) {
    console.error(error)
  }
}

// 编辑按钮点击
const handleEdit = (row) => {
  isEdit.value = true
  currentId.value = row.id
  form.value = {
    username: row.username,
    password: row.password,
    status: row.status
  }
  dialogVisible.value = true
}

// 新增按钮点击
const handleAdd = () => {
  isEdit.value = false
  form.value = {
    username: '',
    password: '',
    status: 1
  }
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const formData = {
          username: form.value.username,
          password: form.value.password,
          status: form.value.status
        }
        
        if (isEdit.value) {
          await request.put(`/ydaccounts/${currentId.value}`, formData)
          ElMessage.success('编辑成功')
          dialogVisible.value = false
        } else {
          const { data } = await request.post('/ydaccounts', formData)
          if (data.needQrCode) {
            handleQrCode(data)
          } else {
            ElMessage.success('新增成功')
            dialogVisible.value = false
          }
        }
        fetchAccounts()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

// 删除账号
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该账号吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await request.delete(`/ydaccounts/${row.id}`)
      ElMessage.success('删除成功')
      fetchAccounts()
    } catch (error) {
      console.error(error)
    }
  })
}

// 切换状态
const handleToggleStatus = async (row) => {
  try {
    await request.put(`/ydaccounts/${row.id}`, {
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
  fetchAccounts()
}

const handleCurrentChange = (val) => {
  page.value = val
  fetchAccounts()
}

// 初始化
onMounted(() => {
  fetchAccounts()
})

const qrDialogVisible = ref(false)
const qrCode = ref('')
const instanceId = ref('')
const scanning = ref(false)
const scanSuccess = ref(false)
let checkTimer = null

// 处理扫码弹窗
const handleQrCode = (data) => {
  qrCode.value = data.qrCode
  instanceId.value = data.instanceId
  qrDialogVisible.value = true
  scanning.value = true
  startCheckingScanStatus()
}

// 开始检查扫码状态
const startCheckingScanStatus = () => {
  checkTimer = setInterval(async () => {
    try {
      const { data } = await request.get(`/ydaccounts/scan/${instanceId.value}`)
      if (data.scanned) {
        scanning.value = false
        scanSuccess.value = true
        clearInterval(checkTimer)
        // 自动关闭弹窗
        setTimeout(() => {
          qrDialogVisible.value = false
          fetchAccounts() // 刷新列表
        }, 1500)
      }
    } catch (error) {
      console.error('检查扫码状态失败:', error)
      clearInterval(checkTimer)
    }
  }, 2000) // 每2秒检查一次
}

// 取消扫码
const handleCancelScan = async () => {
  clearInterval(checkTimer)
  try {
    await request.post(`/ydaccounts/${instanceId.value}/close`)
  } catch (error) {
    console.error('关闭二维码失败:', error)
  }
  qrDialogVisible.value = false
  scanning.value = false
  scanSuccess.value = false
}

// 确认已扫码
const handleConfirmScan = () => {
  clearInterval(checkTimer)
  qrDialogVisible.value = false
  scanning.value = false
  scanSuccess.value = false
  fetchAccounts() // 刷新列表
}

// 在组件卸载时清理定时器
onUnmounted(() => {
  if (checkTimer) {
    clearInterval(checkTimer)
  }
})
</script>

<style scoped>
.ydaccount-container {
  min-height: 100%;
  width: 100%;
}

.ydaccount-card {
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

.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.scanning-tip,
.success-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.success-tip {
  color: #67c23a;
}

.scanning-tip {
  color: #409eff;
}
</style> 