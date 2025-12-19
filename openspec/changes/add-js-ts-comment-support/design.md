# 设计文档：JavaScript/TypeScript 注释翻译支持

## 为什么需要这个变更

### 用户需求
CodeI18n VSCode 扩展当前仅支持 Go 和 Rust 语言，但许多开发者的日常工作涉及大量 JavaScript/TypeScript 代码阅读，例如：
- 学习和理解流行的 Node.js 框架（Express、NestJS 等）
- 阅读前端库的源码（React、Vue、Angular 等）
- 维护和调试 JavaScript/TypeScript 项目

这些项目通常包含大量英文注释，对非英语母语开发者构成阅读障碍。

### 技术可行性
`codei18n` CLI 工具已经完整支持 JavaScript/TypeScript 注释的提取和翻译：
- CLI 能够正确识别 `.js`、`.ts`、`.tsx`、`.jsx` 文件
- CLI 将这些文件标记为 `language: "typescript"`
- CLI 能够提取行注释（`//`）和块注释（`/* */`）
- 翻译结果的数据格式与 Go/Rust 完全一致

因此，VSCode 插件侧只需要极小的修改即可启用对这两种语言的支持。

### 一致性与用户体验
当前实现已经为 Go 和 Rust 建立了一套完整的注释翻译工作流：
- 自动扫描注释
- 装饰显示翻译
- 悬停查看原文
- 配置统一管理

将这套工作流扩展到 JavaScript/TypeScript，能够为用户提供一致的跨语言体验，无需学习新的交互模式。

## 架构决策

### 决策 1：最小化修改策略
**背景**：现有代码通过 `supportedLanguages` 数组统一管理支持的语言，没有针对特定语言的分支逻辑。

**选项**：
1. 仅在 `supportedLanguages` 数组中新增条目
2. 为 JavaScript/TypeScript 创建单独的处理流程

**决策**：选择选项 1 - 仅在必要位置新增语言 ID 条目。

**理由**：
- 现有架构已经是语言无关的，CLI 工具返回的数据格式对所有语言保持一致
- 新增条目的修改风险极低，不会影响现有 Go/Rust 功能
- 保持代码简洁，避免引入不必要的复杂性
- 如果未来需要语言特定逻辑（如 JSX/TSX 特殊注释），可以在后续增量中引入

### 决策 2：统一的激活事件
**背景**：VSCode 扩展通过 `activationEvents` 控制在何时激活。

**选项**：
1. 使用 `onLanguage:javascript` 和 `onLanguage:typescript` 作为激活事件
2. 使用通配符或延迟激活策略

**决策**：选择选项 1 - 明确声明每种语言的激活事件。

**理由**：
- 与现有的 Go 和 Rust 激活方式保持一致
- 激活时机明确，用户打开 JS/TS 文件时立即可用
- 避免不必要的扩展激活，减少对 VSCode 性能的影响

### 决策 3：共享 HoverProvider
**背景**：当前为 Go 和 Rust 分别注册了 `TranslationHoverProvider`。

**选项**：
1. 为 JavaScript 和 TypeScript 分别注册 `TranslationHoverProvider`
2. 使用一个 HoverProvider 注册到多种语言

**决策**：选择选项 1 - 为每种语言单独注册 HoverProvider。

**理由**：
- 与现有的 Go/Rust 实现保持一致
- 代码清晰，每种语言的注册逻辑独立可见
- 未来如果需要为特定语言定制 Hover 内容，修改更容易
- 注册多个 Provider 的性能开销可以忽略

## 实施策略

### 修改范围
本次变更涉及的文件极少，修改点明确：
1. `package.json` - 新增激活事件
2. `src/extension.ts` - 扩展 `supportedLanguages` 并注册 HoverProvider
3. `src/services/commentService.ts` - 扩展 `supportedLanguages`
4. `README.md` - 更新支持语言列表
5. `CHANGELOG.md` - 记录变更

### 测试策略
- 利用现有的测试框架验证基本功能
- 确保 JavaScript/TypeScript 文件能够触发扫描和装饰
- 可选：为 JavaScript/TypeScript 添加专门的测试用例（可在后续增量中完善）

### 回滚计划
如果发现问题，回滚非常简单：
- 从 `supportedLanguages` 数组中移除 `'javascript'` 和 `'typescript'`
- 从 `package.json` 中移除对应的激活事件
- 移除对应的 HoverProvider 注册

## 风险与缓解

### 风险 1：CLI 工具对 JavaScript/TypeScript 的支持不完整
**缓解措施**：
- 已通过实际测试验证 CLI 能够正确处理 `.js` 和 `.ts` 文件
- CLI 返回的数据格式与 Go/Rust 完全一致
- 如果发现问题，可以快速回滚

### 风险 2：JavaScript/TypeScript 特有语法可能导致注释提取不准确
**缓解措施**：
- 初期版本优先支持标准注释（`//` 和 `/* */`）
- 对于 JSDoc、装饰器注释等特殊场景，可以在后续增量中优化
- 用户可以通过配置禁用特定文件的翻译

### 风险 3：性能影响
**缓解措施**：
- JavaScript/TypeScript 文件的注释扫描与 Go/Rust 使用相同的去抖机制
- CLI 工具对所有语言的处理性能相当
- 用户可以根据需要通过配置启用/禁用特定语言

## 未来扩展

### 潜在的后续增量
- 支持 JSX/TSX 中的 JSDoc 注释
- 支持装饰器（Decorator）注释的翻译
- 针对大型 JavaScript/TypeScript 项目优化扫描性能
- 为 JavaScript/TypeScript 提供专门的配置选项（如排除 `node_modules`）

### 兼容性承诺
- 本次变更仅新增功能，不影响现有 Go/Rust 支持
- 配置项保持向后兼容
- 用户可以选择性启用/禁用特定语言的翻译
