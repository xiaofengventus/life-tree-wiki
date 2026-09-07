<template>
  <!-- 滚动揭示式页脚组件 -->
  <div class="footer-wrapper">
    <!-- 页脚标题 -->
    <div class="footer-title">
      <span class="footer-title">生命时序 life_tree</span>
    </div>

    <!-- 页脚内容区域 -->
    <div class="footer-content">
      <div class="footer-section">
        <!-- 版权信息 -->
        <p>&copy; 2026.7.13- 生命时序 life_tree. 保留所有权利.</p>
        <!-- 联系方式 -->
        <p><a href="mailto:1163919575@qq.com">邮箱反馈</a></p>
      </div>

      <div class="footer-section">
        <p>科普组织推荐：</p>
        <ul>
          <li>
            <a
              href="https://space.bilibili.com/1116218096?spm_id_from=333.337.0.0"
              target="_blank"
              >非村科普墙</a
            >
          </li>
          <li>
            <a
              href="https://space.bilibili.com/346118363?spm_id_from=333.1387"
              target="_blank"
              >烈焰之魂Fire_Soul</a
            >
          </li>
        </ul>
      </div>

      <div class="footer-section">
        <p>快速链接：</p>
        <ul>
          <li><a href="/">首页</a></li>
          <li><a href="/research">研究</a></li>
          <li><a href="/workplace">工作台</a></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 页脚包装器，接在主图后参与整页滚动 */
.footer-wrapper {
  position: relative;
  width: 100%;
  background: #1e293b;
  color: #94a3b8;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

/* 标题 */
.footer-title {
  width: 100%;
  height: 45px;
  background: #1e293b;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 1px;
}

/* 内容区域，随页面自然上下滚动 */
.footer-content {
  padding: 20px;
  border-top: 1px solid #334155;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 20px;
}

/* 区块 */
.footer-section {
  min-width: 150px;
}

.footer-section p {
  font-size: 12px;
  margin-bottom: 8px;
  font-weight: 500;
  color: #cbd5e1;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section li {
  margin-bottom: 4px;
}

.footer-section li a {
  font-size: 12px;
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-section li a:hover {
  color: aqua;
}

/* 邮箱链接 */
.footer-content a[href^="mailto"] {
  color: aqua;
}

.footer-content a[href^="mailto"]:hover {
  text-decoration: underline;
}
</style>
