# 实施计划: VSCode Comments Translator

**分支**: `001-comment-translator-vscode` | **日期**: 2025-12-16 | **规范**: [specs/001-comment-translator-vscode/spec.md](specs/001-comment-translator-vscode/spec.md)
**输入**: 来自 `/specs/001-comment-translator-vscode/spec.md` 的功能规范

**注意**: 此模板由 `/speckit.plan` 命令填充. 执行工作流程请参见 `.specify/templates/commands/plan.md`.

## 摘要

本功能将实现一个 VSCode 扩展，用于实时翻译 Go 语言源代码中的注释。核心方法是采用**包装器架构 (Wrapper Architecture)**，通过 CLI 调用同级的 `codei18n` 二进制文件来获取注释解析和翻译数据，然后利用 VSCode 的 **Decorator API** 在编辑器中进行非侵入式的视觉替换（中英文对照），并使用 **Hover Provider** 显示原始英文注释。

## 技术背景

<!--
  需要操作: 将此部分内容替换为项目的技术细节.
  此处的结构以咨询性质呈现, 用于指导迭代过程.
-->

**语言/版本**: TypeScript 5.x (VSCode 插件标准)
**主要依赖**: 
- `vscode`: VSCode Extension API (Documentation/Decorator, HoverProvider)
- `codei18n` (CLI): 位于 `../codei18n/bin/codei18n`，通过 `child_process` 调用
**存储**: 无（无状态插件，依赖 `codei18n` 核心管理映射数据）
**测试**: `vscode-test`, `mocha` (单元测试), `sinon` (Mocking)
**目标平台**: VSCode Desktop (macOS/Linux/Windows) - *Web 版本暂不支持由于依赖本地 CLI 二进制*
**项目类型**: VSCode Extension (Yeoman `code` generator structure)
**性能目标**: 渲染延迟 < 500ms (基于 Spec SC-001)，CLI 调用开销预计 < 200ms
**约束条件**: 
- 必须存在 `codei18n` 二进制文件（需在配置中指定路径或自动探测）
- 仅支持 `.go` 文件
- 严禁修改源文件内容

## 章程检查

*门控: 必须在阶段 0 研究前通过. 阶段 1 设计后重新检查. *

*   **I. 包装器架构**: ✅ 采用 CLI 调用模式，核心逻辑保留在 `../codei18n`，插件仅负责 UI。
*   **II. VSCode 原生集成**: ✅ 使用官方 Decorator 和 Hover API，遵循原生体验。
*   **III. 文档与注释**: ✅ 计划中包含 README 更新和 JSDoc 要求。
*   **IV. 单元测试覆盖**: ✅ 计划包含 Mocha 测试套件设置。
*   **V. 版本控制**: ✅ 遵循语义化版本。

## 项目结构

### 文档(此功能)

```
specs/001-comment-translator-vscode/
├── plan.md              # 此文件 (/speckit.plan 命令输出)
├── research.md          # 阶段 0 输出 (/speckit.plan 命令)
├── data-model.md        # 阶段 1 输出 (/speckit.plan 命令)
├── quickstart.md        # 阶段 1 输出 (/speckit.plan 命令)
├── contracts/           # 阶段 1 输出 (/speckit.plan 命令)
└── tasks.md             # 阶段 2 输出 (/speckit.tasks 命令 - 非 /speckit.plan 创建)
```

### 源代码(仓库根目录)

```
src/
├── commands/             # VSCode 命令注册 (Toggle 等)
├── configuration/        # 配置管理 (CLI 路径等)
├── decoration/           # Decorator 渲染逻辑
├── hover/                # Hover Provider 实现
├── services/             # 核心服务
│   ├── cliWrapper.ts     # codei18n CLI 调用封装
│   └── commentService.ts # 注释处理编排
├── test/                 # 测试目录
│   ├── runTest.ts
│   └── suite/
└── extension.ts          # 入口文件
```

**结构决策**: 采用标准的 VSCode 扩展结构，增加了 `services/` 层以解耦 CLI 调用与 UI 逻辑，符合包装器架构原则。

## 复杂度跟踪

*仅在章程检查有必须证明的违规时填写*

| 违规 | 为什么需要 | 拒绝更简单替代方案的原因 |
|-----------|------------|-------------------------------------|
| (无) | | |
