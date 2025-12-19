# 任务拆分：add-js-ts-comment-support

- [x] 在 `package.json` 的 `activationEvents` 中新增 `onLanguage:javascript` 和 `onLanguage:typescript` 激活事件。
- [x] 在 `src/extension.ts` 的 `supportedLanguages` 数组中新增 `'javascript'` 和 `'typescript'`。
- [x] 在 `src/services/commentService.ts` 的 `supportedLanguages` 数组中新增 `'javascript'` 和 `'typescript'`。
- [x] 在 `src/extension.ts` 中为 `'javascript'` 和 `'typescript'` 注册 `TranslationHoverProvider`。
- [x] 验证现有测试框架能够处理 JavaScript/TypeScript 文件，或新增基础测试用例确保不引入回归。
- [x] 更新 `README.md` 的"Supported Languages"部分，明确列出 JavaScript 和 TypeScript 支持及其注释类型。
- [x] 更新 `CHANGELOG.md`，记录本次新增语言支持的变更。
