# 任务拆分：add-codei18n-activity-view

- [x] 在 `package.json` 中定义 CodeI18n 活动栏视图容器和侧边栏视图贡献点。
- [x] 在 `src/extension.ts` 中注册 CodeI18n 侧边栏视图（TreeView）及对应的 `TreeDataProvider` 骨架。
- [x] 为侧边栏视图实现操作节点：初始化本项目、显示本地化、文件内容本地化、英文化，并绑定 VS Code 命令。
- [x] 在配置层新增本地化模式配置项（如 `codei18n.localizationMode`），并在视图中反映当前模式状态。
- [x] 扩展或新增 CLI 封装方法，用于执行 `codei18n convert`，支持本地化与英文化两种方向，并处理错误和结果反馈。
- [x] 在执行会修改源码的操作前增加确认对话框和基本的安全提示信息。
- [x] 为新增视图和命令编写或更新测试（扩展级测试 + CLI 封装的单元测试），确保关键场景可验证。
- [x] 更新必要的文档（例如 `README.md` 或 CHANGELOG），介绍新的 CodeI18n 侧边栏和本地化模式。
