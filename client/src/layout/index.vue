<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
      <el-menu
        :default-active="route.path"
        class="el-menu-vertical"
        :collapse="isCollapse"
        router
      >
        <el-menu-item index="/todo">
          <el-icon><List /></el-icon>
          <span>待办事项</span>
        </el-menu-item>
        <el-menu-item index="/shop">
          <el-icon><Shop /></el-icon>
          <span>店铺管理</span>
        </el-menu-item>
        <el-menu-item index="/good">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/ydshop">
          <el-icon><Shop /></el-icon>
          <span>闲鱼店铺</span>
        </el-menu-item>
        <el-menu-item index="/ydaccount">
          <el-icon><User /></el-icon>
          <span>闲鱼账号</span>
        </el-menu-item>
        
      </el-menu>
    </el-aside>

    <!-- 主要内容区 -->
    <el-container class="main-container">
      <!-- 头部 -->
      <el-header>
        <div class="header-left">
          <el-icon class="toggle-sidebar" @click="toggleSidebar">
            <Expand :class="{ 'is-collapse': isCollapse }" />
          </el-icon>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              Admin <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人信息</el-dropdown-item>
                <el-dropdown-item>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { List, Shop, Goods, Expand, ArrowDown, User } from '@element-plus/icons-vue'

const route = useRoute()
const isCollapse = ref(false)

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
}

.aside {
  transition: width 0.3s;
  background-color: #1f2d3d;
  overflow: hidden;
}

.el-menu-vertical {
  height: 100%;
  background-color: #1f2d3d;
  border-right: none;
  
  :deep(.el-menu-item) {
    background-color: #1f2d3d;
    color: #a6b0bc;
    
    &:hover {
      background-color: #263445;
      color: #fff;
    }
    
    &.is-active {
      background-color: #263445 !important;
      color: #409eff !important;
      border-right: 3px solid #409eff;
    }
    
    .el-icon {
      color: inherit;
    }
    
    span {
      color: inherit;
      margin-left: 10px;
    }
  }
}

.main-container {
  width: calc(100% - var(--el-aside-width));
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.el-header {
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  height: 50px;
}

.header-left {
  display: flex;
  align-items: center;
}

.toggle-sidebar {
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.3s;
}

.toggle-sidebar .is-collapse {
  transform: rotate(180deg);
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
  height: calc(100vh - 50px);
  overflow-y: auto;
}

:deep(.el-menu) {
  border-right: none !important;
}

:deep(.el-menu--collapse) {
  .el-menu-item {
    span {
      display: none;
    }
  }
}
</style> 