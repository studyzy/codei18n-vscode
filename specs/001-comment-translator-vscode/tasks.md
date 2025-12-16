---
description: "功能实现任务列表模板"
---

# 任务: VSCode Comments Translator

**输入**: 来自 `/specs/001-comment-translator-vscode/` 的设计文档
**前置条件**: plan.md(必需)、spec.md(用户故事必需)、research.md、data-model.md
**输入指令**: "分解任务，另外加上Makefile任务和GitHub Action CI任务"

**组织结构**: 任务按阶段和用户故事分组。

## 格式: `[ID] [P?] [Story] 描述`
- **[P]**: 可以并行运行
- **[Story]**: 此任务属于哪个用户故事(例如: US1、US2)

## 路径约定
- 根目录: `/Users/devinzeng/go/src/github.com/studyzy/codei18n-vscode`
- 源代码: `src/`

## 阶段 1: 设置与基础设施 (Setup)

**目的**: 项目初始化、构建工具链和 CI/CD 环境。

- [ ] T001 初始化 VSCode 扩展项目结构 (src, .vscode, tsconfig.json)
- [ ] T002 配置 `package.json`
    - 添加 `activationEvents`: `["onLanguage:go"]`
    - 添加 `contributes.configuration`: `codei18n.cliPath`, `codei18n.enable`
- [ ] T003 [P] 安装开发依赖 (`mocha`, `@types/vscode`, `@types/node`, `typescript`, `eslint`)
- [ ] T004 创建 `Makefile`
    - 包含目标: `install` (npm install), `compile` (tsc), `test` (run tests), `package` (vsce package)
- [ ] T005 创建 GitHub Action CI 工作流 `.github/workflows/ci.yml`
    - 在 Ubuntu/macOS/Windows 上运行测试
    - 运行 Lint 检查

---

## 阶段 2: 基础 (Foundations)

**目的**: 核心服务层，所有用户故事的阻塞先决条件。

**⚠️ 关键**: 必须在 UI 逻辑之前完成。

- [ ] T006 [P] 创建 `src/configuration/configManager.ts`
    - 实现配置读取 (CLI 路径, 启用状态)
    - 监听配置变更事件
- [ ] T007 创建 `src/services/cliWrapper.ts`
    - 实现 `spawn` 调用 `codei18n`
    - 实现 `scan(filePath, content)` 方法
    - 处理 JSON 解析与错误捕获
- [ ] T008 [P] 为 `cliWrapper.ts` 编写单元测试 (`src/test/suite/cliWrapper.test.ts`)
    - Mock `child_process` 验证参数传递和输出解析

**检查点**: CLI 调用层已就绪，可以通过单元测试验证与 `codei18n` 的通信。

---

## 阶段 3: 用户故事 1 - 自动显示中文注释 (优先级: P1)

**目标**: 打开 Go 文件时，英文注释被中文翻译覆盖显示。

**独立测试**: 
- 打开 Go 文件，注释视觉上变为中文。
- 磁盘文件未修改。

### 用户故事 1 的实施

- [ ] T009 [US1] 创建 `src/decoration/decorationTypes.ts`
    - 定义 `translationDecorationType` (设置 `after` 属性样式, 透明度, 颜色)
- [ ] T010 [US1] 创建 `src/services/commentService.ts`
    - 封装 `CliWrapper`，提供 `getComments(document)` 方法
    - 负责缓存或防抖逻辑 (可选)
- [ ] T011 [US1] 创建 `src/decoration/decorator.ts`
    - 实现 `updateDecorations(editor, comments)`
    - 将 `Comment` 对象转换为 `vscode.DecorationOptions` (设置 `renderOptions.after.contentText`)
- [ ] T012 [US1] 在 `src/extension.ts` 中集成核心逻辑
    - 注册 `activeTextEditor` 监听器
    - 注册 `onDidChangeTextDocument` 监听器 (配合防抖)
    - 实现主入口 `activate` 函数
- [ ] T013 [P] [US1] 添加防抖工具函数 `src/utils/debounce.ts` 并应用到事件监听

**检查点**: 打开 Go 文件应能看到翻译效果。

---

## 阶段 4: 用户故事 2 - 悬停查看原文 (优先级: P1)

**目标**: 鼠标悬停在翻译上时显示原文。

**独立测试**: 
- 悬停在中文注释上，显示包含英文原文的提示框。

### 用户故事 2 的实施

- [ ] T014 [US2] 创建 `src/hover/translationHoverProvider.ts`
    - 实现 `vscode.HoverProvider` 接口
    - `provideHover` 方法：根据光标位置查找对应的 `Comment` 对象
    - 返回包含 `sourceText` 的 MarkdownString
- [ ] T015 [US2] 在 `src/extension.ts` 中注册 Hover Provider
    - `vscode.languages.registerHoverProvider('go', ...)`

**检查点**: 悬停功能正常工作。

---

## 阶段 5: 完善与横切关注点

**目的**: 错误处理、文档和打包。

- [ ] T016 优化错误处理
    - 当 `codei18n` 命令未找到时，显示一次性错误提示并提供设置跳转按钮
- [ ] T017 [P] 更新 `README.md`
    - 添加安装指南 (需安装 `codei18n` CLI)
    - 添加配置说明
- [ ] T018 运行完整构建与测试 (`make test`)

---

## 依赖关系与执行顺序

### 阶段依赖关系
- **设置(阶段 1)**: 无依赖。
- **基础(阶段 2)**: 依赖设置。阻塞所有 UI 功能。
- **US1 & US2**: 依赖基础层 (`cliWrapper`).
  - US2 (Hover) 逻辑上依赖 US1 的数据流 (Comment 对象)，建议在 US1 后实现，或并行开发但共享 `CommentService`。

### 并行机会
- T003 (Install deps), T004 (Makefile), T005 (CI) 可并行。
- T006 (Config) 与 T007 (CLI Wrapper) 可并行。
- T009 (Decorations) 与 T014 (Hover Provider) 可并行 (一旦数据模型确定)。

## 实施策略

### 仅 MVP (Story 1 + 2)
1. 完成阶段 1 & 2 (基础设施)。
2. 实现 Story 1 (核心价值: 翻译显示)。
3. 实现 Story 2 (核心价值: 原文对照)。
4. 验证并发布。
