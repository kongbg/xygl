<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span>{{ isLogin ? '登录' : '注册' }}</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item label="验证码" prop="captcha">
          <div class="captcha-container">
            <el-input v-model="form.captcha" />
            <img
              :src="captchaUrl"
              class="captcha-image"
              @click="refreshCaptcha"
              alt="验证码"
            />
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">
            {{ isLogin ? '登录' : '注册' }}
          </el-button>
          <el-button link @click="toggleMode">
            {{ isLogin ? '没有账号？去注册' : '已有账号？去登录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()

const isLogin = ref(true)
const formRef = ref(null)
const captchaUrl = ref('')

const form = ref({
  username: '',
  password: '',
  captcha: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 4, message: '验证码长度为 4 位', trigger: 'blur' }
  ]
}

// 获取验证码
const refreshCaptcha = async () => {
  try {
    const { data } = await request.get('/user/captcha')
    captchaUrl.value = `data:image/svg+xml;base64,${btoa(data.image)}`
  } catch (error) {
    console.error('获取验证码失败:', error)
  }
}

// 切换登录/注册模式
const toggleMode = () => {
  isLogin.value = !isLogin.value
  form.value = {
    username: '',
    password: '',
    captcha: ''
  }
  refreshCaptcha()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const url = `/user/${isLogin.value ? 'login' : 'register'}`
        const { data } = await request.post(url, form.value)
        
        if (isLogin.value) {
          localStorage.setItem('token', data.token)
          ElMessage.success('登录成功')
          router.push('/todo')
        } else {
          ElMessage.success('注册成功')
          isLogin.value = true
        }
        form.value.captcha = ''
        refreshCaptcha()
      } catch (error) {
        console.error(error)
        refreshCaptcha()
      }
    }
  })
}

// 初始化获取验证码
refreshCaptcha()
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}

.login-card {
  width: 400px;
}

.card-header {
  text-align: center;
  font-size: 18px;
}

.captcha-container {
  display: flex;
  gap: 10px;
}

.captcha-image {
  height: 32px;
  cursor: pointer;
}
</style> 