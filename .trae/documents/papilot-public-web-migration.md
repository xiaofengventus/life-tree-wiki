# Papilot 公网站内迁移

## 背景

目标是让用户登录「生命时序」，从创作中心进入 `/papilot`，在浏览器使用完整论文工作台。无需安装 Papilot、不跳端口、不嵌 iframe；前端用 Vue + JS/TS。当前站内只实现了 Laup 编辑与预览；上游 MIT 版以 React 主界面和独立审阅器为主，Node 服务默认运行在本机，不能直接作为多用户站点服务。

## 实施顺序

1. **先交付站内项目闭环。** 在 `src/views/PapilotWorkspace.vue` 和 `src/router/index.js` 保留入口，把 `packages/papilot/src/web/main.tsx` 中的项目壳、导航和项目菜单迁到 Vue，复用主题、图标、布局和本地化资源，限定样式作用域。左上角显示当前项目名：新建 Laup、新建论文、导入 TeX、导入 Laup，Overleaf 接入后也放这里；不设独立侧栏新建入口。接入站点登录后的项目列表、建立／切换／归档、上传文件夹或 ZIP、下载和按账号记忆上次使用的**站内**保存位置。未接通的功能不显示为可用。Laup 复用 `NotebookView.vue`、独立 Pinia 和 `typesetCells`：只提供 Laup 和 Code，引用下标、格内渲染与折叠预览保持不变。保留原有离线导入导出；不自动上传本地草稿。
2. **建立多用户数据层。** 新增 `/api/papilot/*` Pages Functions、D1 迁移和私有 R2 存储；复用 `server/auth.js` 的 `requireUser` 和 `server/http.js` 的 `requireSameOrigin`。校验每个项目、附件、历史版本和任务的归属／协作权限；按版本保存、防止覆盖并限制上传体积及归档展开规模。参考 `packages/papilot/src/web/api.ts`、`refresh.ts` 的状态协议，不从公网转发上游 `buildApp`，也不让客户端提交服务器目录或命令。
3. **迁移 TeX/PDF、版本与文献。** 转换 `source-panel.tsx`、`compile-button.tsx`、`build-problems.tsx`、`pdf-view.tsx`、Git 和 `library-panel.tsx` 对应界面，复用 CodeMirror、PDF.js、SyncTeX 和非 UI 逻辑。TeX 编译和 Git 在独立服务的隔离任务中运行：仅处理获授权的项目快照，限时限量，默认无外网，TeX 禁用 shell escape；将产物写回私有存储。站点 API 提交任务、授权读取状态和结果。Overleaf 仅使用支持的集成方式，凭据由服务端管理；桌面目录和安装对话以网页交互替换，不能伪装成已支持。
4. **迁移审阅、任务与论文 AI。** 将 `packages/papilot/src/web/review-frame.tsx` 和 `packages/papilot/engine/src/web/` 的 React 审阅 UI 替换为同页 Vue 组件，保留批注、对照、接受／拒绝、撤销和源文联动。Laup 默认显示整篇预览，原任务入口可切换。迁移任务会话、通知、设置和论文写作／审阅 AI；线上 AI 只访问获授权的论文及受控文档操作，不开放通用命令、本机登录凭据或任意网络工具。原应用与 MIT 许可保留为对照；不改 Laup v1 或 JupyterLab。

## 验证与发布

- 每阶段先用本地 Pages 测试，再部署到连接独立 D1/R2 的预发布环境；执行主站构建、Laup 内核回归与新增的 API 测试。用未登录会话和两个不同账号验证跨项目、附件、历史和任务访问，以及失败重试、并发和隔离限制。
- 以原版界面为基准对照桌面与窄屏；用 `packages/papilot/examples/papilot-paper` 和现有 `check-papers.mjs`、`check-compilation.mjs`、`check-task-source.mjs` 场景适配验证：创作中心 → 新建／导入 → 编辑 → 编译 → PDF → 审阅 → 应用／撤销；另验证 Laup 单元格、整篇预览及任务切换。记录网页替代的桌面能力与仍未对等项。
- 第一批代码只实施站内项目壳、身份／存储及 Laup 和 TeX 项目管理；不会把编译或审阅标成已交付。后续隔离节点和线上集成通过预发布验证后再开对应入口，生产发布与远程迁移另行确认。
