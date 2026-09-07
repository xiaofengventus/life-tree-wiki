<script setup></script>

<template>
  <!-- 引入用户卡片 -->
  <user_show />

  <!-- 工作台页面 -->
  <div class="workplace">
    <!-- 页面标题 -->
    <h1 class="page-title">统计台</h1>

    <!-- 欢迎信息 -->
    <div class="welcome-card">
      <h2>欢迎来到生命时序统计台</h2>
      <p>在这里，您可以管理您的进化树项目和研究数据。</p>
    </div>

    <!-- 功能卡片区域 -->
    <div class="feature-grid">
      <!-- 我的项目 -->
      <div class="feature-card">
        <div class="feature-icon">📁</div>
        <h3>我的项目</h3>
        <p>管理和查看您创建的进化树项目</p>
        <button class="btn-primary">查看项目</button>
      </div>

      <!-- 最近文件 -->
      <div class="feature-card">
        <div class="feature-icon">📄</div>
        <h3>最近文件</h3>
        <p>快速访问最近编辑的文件</p>
        <button class="btn-secondary">查看历史</button>
      </div>

      <!-- 研究工具 -->
      <div class="feature-card">
        <div class="feature-icon">🔬</div>
        <h3>研究工具</h3>
        <p>使用专业工具进行数据分析</p>
        <button class="btn-secondary">打开工具</button>
      </div>

      <!-- 协作空间 -->
      <div class="feature-card">
        <div class="feature-icon">👥</div>
        <h3>协作空间</h3>
        <p>与团队成员共享和协作</p>
        <button class="btn-secondary">进入空间</button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <h3>项目统计</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">12</div>
          <div class="stat-label">已创建项目</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">3</div>
          <div class="stat-label">进行中</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">9</div>
          <div class="stat-label">已完成</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">256</div>
          <div class="stat-label">总节点数</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 页面容器 */
.workplace {
  min-height: 100vh;
  padding: 80px 20px 60px;
  background: #f8fafc;
}

/* 页面标题 */
.page-title {
  font-size: 2rem;
  color: #1e293b;
  margin-bottom: 20px;
  padding-left: 20px;
}

/* 欢迎卡片 */
.welcome-card {
  background: linear-gradient(135deg, #4a90e2 0%, #4f46e5 100%);
  color: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
}

.welcome-card h2 {
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.welcome-card p {
  opacity: 0.9;
}

/* 功能卡片网格 */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  padding: 0 20px;
}

/* 功能卡片 */
.feature-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* 功能图标 */
.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.feature-card h3 {
  font-size: 1.25rem;
  color: #1e293b;
  margin-bottom: 8px;
}

.feature-card p {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.feature-card button {
  width: auto;
  padding: 8px 16px;
}

/* 统计区域 */
.stats-section {
  padding: 0 20px;
}

.stats-section h3 {
  font-size: 1.25rem;
  color: #1e293b;
  margin-bottom: 16px;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

/* 统计项 */
.stat-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #4a90e2;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.85rem;
  color: #64748b;
}

/* 按钮样式 */
.btn-primary {
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #3a7bc8;
}

.btn-secondary {
  background-color: #e1e8ed;
  color: #37474f;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #cbd5dc;
}
</style>
