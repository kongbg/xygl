import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import router from '@/router'

const service = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 60000,
  withCredentials: true // 允许跨域携带 cookie
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data

    // 如果返回的 code 不是 0，说明有错误
    if (res.code !== 0) {
      ElMessage.error(res.message || 'Error')
      return Promise.reject(new Error(res.message || 'Error'))
    }

    return res
  },
  error => {
    // 处理401错误
    if (error.response && error.response.status === 401) {
      // 清除本地存储的token
      localStorage.removeItem('token');

      // 跳转到登录页面
      const router = useRouter();
      router.push('/login');

      return Promise.reject(new Error('登录已过期，请重新登录'));
    }

    // 处理其他错误
    console.error('Response error:', error)
    ElMessage.error(error.response?.data?.message || '请求失败')
    return Promise.reject(error)
  }
)

export default service 