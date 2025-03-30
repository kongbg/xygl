<template>
    <div class="source-container">
        <div class="header">
            <el-button type="primary" @click="handleImport">从商品导入</el-button>
            <el-button type="primary" @click="handleAdd">新增资源</el-button>
        </div>

        <!-- 商品列表 -->
        <el-table :data="sourceList" style="width: 100%">
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
                    <el-button
                        v-if="activeTab === 'available' && row.description.length <= 500 && row.shareUrl && row.sendTxt"
                        type="success" link @click="handlePublish(row)">
                        上架
                    </el-button>
                </template>
            </el-table-column>
        </el-table>



        <el-pagination v-if="total > 0" class="pagination" v-model:current-page="currentPage"
            v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :total="total" @size-change="handleSizeChange"
            @current-change="handleCurrentChange" layout="total, sizes, prev, pager, next" />

        <!-- 编辑/新增弹窗 -->
        <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增资源' : '编辑资源'" width="500px">
            <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
                <el-form-item label="资源名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入资源名称" />
                </el-form-item>
                <el-form-item label="资源链接" prop="shareUrl">
                    <el-input type="textarea" v-model="form.shareUrl" :rows="3" placeholder="请输入资源链接" />
                </el-form-item>
                <el-form-item label="价格" prop="price">
                    <el-input-number v-model="form.price" :min="0" :precision="2" />
                </el-form-item>
                <el-form-item label="编号" prop="no">
                    <el-input v-model="form.no" placeholder="请输入编号" />
                </el-form-item>
                <el-form-item label="描述" prop="description">
                    <el-input type="textarea" v-model="form.description" :rows="4" placeholder="请输入描述" />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleSubmit">确定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const sourceList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const dialogType = ref('add') // add or edit
const form = ref({
    name: '',
    shareUrl: '',
    price: 0,
    no: '',
    description: ''
})
const formRef = ref(null)

const rules = {
    name: [{ required: true, message: '请输入资源名称', trigger: 'blur' }],
    shareUrl: [{ required: true, message: '请输入资源链接', trigger: 'blur' }]
}

// 获取资源列表
const getSourceList = async () => {
    loading.value = true
    try {
        const res = await request.get('/sources', {
            params: {
                page: currentPage.value,
                pageSize: pageSize.value,
                sort: 'wantCot:desc'
            }
        })
        sourceList.value = res.data.list
        total.value = res.data.total
    } catch (error) {
        console.error('获取资源列表失败:', error)
    } finally {
        loading.value = false
    }
}

// 从商品导入
const handleImport = async () => {
    try {
        await request.post('/sources/import-from-goods')
        ElMessage.success('导入成功')
        getSourceList()
    } catch (error) {
        console.error('导入失败:', error)
    }
}

// 新增资源
const handleAdd = () => {
    dialogType.value = 'add'
    form.value = {
        name: '',
        shareUrl: '',
        price: 0,
        no: '',
        description: ''
    }
    dialogVisible.value = true
}

// 编辑资源
const handleEdit = (row) => {
    dialogType.value = 'edit'
    form.value = { ...row }
    dialogVisible.value = true
}

// 复制链接
const handleCopy = async (row) => {
    try {
        await navigator.clipboard.writeText(row.shareUrl)
        ElMessage.success('复制成功')
    } catch (error) {
        console.error('复制失败:', error)
        ElMessage.error('复制失败')
    }
}

// 删除资源
const handleDelete = (row) => {
    ElMessageBox.confirm('确定要删除该资源吗？', '提示', {
        type: 'warning'
    })
        .then(async () => {
            await request.delete(`/sources/${row.id}`)
            ElMessage.success('删除成功')
            getSourceList()
        })
        .catch(() => { })
}

// 提交表单
const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate()

    try {
        if (dialogType.value === 'add') {
            await request.post('/sources', form.value)
            ElMessage.success('添加成功')
        } else {
            await request.put(`/sources/${form.value.id}`, form.value)
            ElMessage.success('更新成功')
        }
        dialogVisible.value = false
        getSourceList()
    } catch (error) {
        console.error('提交失败:', error)
    }
}

// 分页相关
const handleSizeChange = (val) => {
    pageSize.value = val
    getSourceList()
}

const handleCurrentChange = (val) => {
    currentPage.value = val
    getSourceList()
}

onMounted(() => {
    getSourceList()
})
</script>

<style scoped>
.source-container {
    padding: 20px;
}

.header {
    display: flex;
    gap: 10px;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

:deep(.el-input-number) {
    width: 100%;
}
</style>