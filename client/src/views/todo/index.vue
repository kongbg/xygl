<template>
  <div class="todo-container">
    <el-card class="todo-card">
      <template #header>
        <div class="card-header">
          <span>待办事项列表</span>
          <el-button type="primary" @click="handleAdd">
            新增待办
          </el-button>
        </div>
      </template>
      
      <!-- 待办列表 -->
      <el-table :data="todos" style="width: 100%">
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.createTime).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="completed" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.completed ? 'success' : 'info'">
              {{ row.completed ? '已完成' : '未完成' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
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
              {{ row.completed ? '标记未完成' : '标记完成' }}
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
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入待办事项名称" />
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
const todos = ref([])

// 表单相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref(null)
const formRef = ref(null)

const form = ref({
  name: ''
})

const rules = {
  name: [
    { required: true, message: '请输入待办事项名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ]
}

const dialogTitle = computed(() => isEdit.value ? '编辑待办事项' : '新增待办事项')

// 获取列表数据
const fetchTodos = async () => {
  try {
    const { data } = await request.get('/todos', {
      params: { page: page.value, pageSize: pageSize.value }
    })
    todos.value = data.list
    total.value = data.pagination.total
  } catch (error) {
    console.error('获取待办事项失败:', error)
  }
}

// 新增按钮点击
const handleAdd = () => {
  isEdit.value = false
  form.value = { name: '' }
  dialogVisible.value = true
}

// 编辑按钮点击
const handleEdit = (row) => {
  isEdit.value = true
  currentId.value = row.id
  form.value = { name: row.name }
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await request.put(`/todos/${currentId.value}`, { name: form.value.name })
        } else {
          await request.post('/todos', { name: form.value.name })
        }
        
        ElMessage.success(`${isEdit.value ? '编辑' : '新增'}成功`)
        dialogVisible.value = false
        fetchTodos()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

// 切换状态
const handleToggleStatus = async (row) => {
  try {
    await request.put(`/todos/${row.id}`, { completed: !row.completed })
    ElMessage.success('更新成功')
    fetchTodos()
  } catch (error) {
    console.error('更新失败:', error)
  }
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确认删除该待办事项吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await request.delete(`/todos/${row.id}`)
      ElMessage.success('删除成功')
      fetchTodos()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

// 处理分页变化
const handleSizeChange = (val) => {
  pageSize.value = val
  page.value = 1
  fetchTodos()
}

const handleCurrentChange = (val) => {
  page.value = val
  fetchTodos()
}

// 初始化
fetchTodos()
</script>

<style scoped>
.todo-container {
  min-height: 100%;
  width: 100%;
}

.todo-card {
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
</style> 