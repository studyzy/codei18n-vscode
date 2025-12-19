# 变更提案：新增 JavaScript/TypeScript 注释翻译支持

## 背景与动机
当前 CodeI18n VSCode 扩展仅支持 Go 和 Rust 源代码的注释翻译。然而，`codei18n` CLI 工具已经支持 JavaScript 和 TypeScript 文件的注释提取和翻译（将这些文件识别为 `language: "typescript"`）。

许多开发者在日常工作中需要阅读 JavaScript/TypeScript 项目的源码（例如 Node.js 库、前端框架等），这些项目往往包含大量英文注释。如果能在 VSCode 中像 Go/Rust 一样实时显示注释的中文翻译，将显著提升这些开发者的阅读效率。

根据用户反馈，codei18n 已经支持了 JavaScript/TypeScript 的注释提取和翻译，因此本次变更的目标是在 VSCode 插件侧启用对这两种语言的支持，使用户能够在阅读 JS/TS 代码时享受与 Go/Rust 相同的注释翻译体验。

## 目标
- 扩展 VSCode 插件的语言支持范围，新增 `javascript` 和 `typescript` 两种语言 ID。
- 确保 JavaScript/TypeScript 文件在打开时能够触发注释扫描和翻译装饰。
- 为 JavaScript/TypeScript 文件提供与 Go/Rust 相同的悬停查看原文功能。
- 保持与现有 Go/Rust 支持的一致性，不引入特殊的配置或行为差异。

## 非目标
- 不在本次变更中修改 `codei18n` CLI 工具本身（CLI 已经支持 JS/TS）。
- 不在本次变更中引入针对 JavaScript/TypeScript 特有语法（如 JSX/TSX）的特殊处理逻辑，优先保持简单。
- 不在本次变更中修改现有的注释扫描、装饰或悬停实现的核心逻辑。

## 高层方案概述
- 在 `package.json` 的 `activationEvents` 中新增 `onLanguage:javascript` 和 `onLanguage:typescript` 激活事件。
- 在 `src/extension.ts` 和 `src/services/commentService.ts` 的 `supportedLanguages` 数组中新增 `'javascript'` 和 `'typescript'`。
- 在 `src/extension.ts` 中为 `javascript` 和 `typescript` 注册 `TranslationHoverProvider`，使其能够在悬停时显示原文。
- 确保所有相关测试覆盖 JavaScript/TypeScript 场景，或至少验证新语言不会导致现有功能退化。
- 更新 `README.md` 的"支持语言"部分，明确说明已支持 JavaScript/TypeScript。

## 关键权衡
- **最小化修改 vs. 未来扩展性**：本次变更采用最小化修改策略，仅在必要位置新增 `javascript` 和 `typescript` 条目，避免重构现有代码。如果未来需要针对特定语言的特殊逻辑（如 JSX/TSX、装饰器注释等），可以在后续增量中引入。
- **测试覆盖 vs. 实施速度**：优先验证现有测试框架能够处理 JavaScript/TypeScript 文件的基本场景（如注释扫描、装饰渲染），而不急于为每种新语言编写完整的测试套件。可以在后续增量中补充更全面的测试。
- **文档更新 vs. 用户感知**：在 `README.md` 中明确列出 JavaScript/TypeScript 支持，使用户能够直观感知新增的语言范围，同时在 CHANGELOG 中记录本次变更，便于版本追踪。
