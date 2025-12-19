# js-ts-comment-translation Specification

## Purpose
TBD - created by archiving change add-js-ts-comment-support. Update Purpose after archive.
## 需求
### 需求：扩展支持 JavaScript 和 TypeScript 语言的注释翻译
该需求规定扩展必须支持 JavaScript（`.js`）和 TypeScript（`.ts`, `.tsx`, `.jsx`）文件的注释翻译，与当前支持的 Go 和 Rust 语言保持一致的用户体验。

#### 场景：开发者打开 JavaScript 文件时自动显示注释翻译
- 开发者在 VSCode 中打开一个 `.js` 文件，文件中包含英文行注释（`// comment`）和块注释（`/* comment */`）。
- 扩展必须自动触发注释扫描，调用 `codei18n` CLI 获取注释的翻译结果。
- 扩展必须在编辑器中以装饰形式显示翻译后的注释，隐藏原始英文注释文本。
- 开发者将鼠标悬停在翻译后的注释上时，必须能够看到原始英文注释的悬停提示。

#### 场景：开发者打开 TypeScript 文件时自动显示注释翻译
- 开发者在 VSCode 中打开一个 `.ts` 文件，文件中包含 TypeScript 注释（行注释和块注释）。
- 扩展必须自动触发注释扫描，调用 `codei18n` CLI 获取注释的翻译结果。
- 扩展必须在编辑器中以装饰形式显示翻译后的注释，与 JavaScript 文件行为一致。
- 开发者将鼠标悬停在翻译后的注释上时，必须能够看到原始注释的悬停提示。

#### 场景：开发者编辑 JavaScript/TypeScript 文件时实时更新翻译
- 开发者在已打开的 JavaScript 或 TypeScript 文件中新增或修改注释。
- 扩展必须在编辑停止后（去抖延迟内）自动重新扫描注释并更新装饰。
- 新增或修改的注释必须能够像 Go/Rust 文件一样实时获得翻译并显示。

#### 场景：JavaScript/TypeScript 文件支持与配置保持一致
- 开发者在 VSCode 设置中禁用 `codei18n.enable` 配置项。
- JavaScript 和 TypeScript 文件的注释翻译必须与 Go/Rust 文件一样被禁用，不显示任何翻译装饰。
- 开发者通过命令面板执行"CodeI18n: Toggle Translation"命令时，JavaScript/TypeScript 文件的翻译状态必须与其他支持语言同步切换。

### 需求：在文档中明确说明 JavaScript/TypeScript 支持
该需求规定扩展的用户文档（README 等）必须明确列出 JavaScript 和 TypeScript 作为支持的语言，并说明支持的注释类型。

#### 场景：用户查看 README 了解支持的语言
- 用户在安装扩展前或使用过程中查看 `README.md` 的"Supported Languages"部分。
- 文档必须明确列出 JavaScript 和 TypeScript，并说明支持的注释类型（行注释 `//` 和块注释 `/* */`）。
- 文档格式必须与现有的 Go 和 Rust 说明保持一致，便于用户快速理解支持范围。

#### 场景：用户查看 CHANGELOG 了解版本变更
- 用户在升级扩展后查看 `CHANGELOG.md` 了解新版本的功能变化。
- CHANGELOG 必须记录本次新增 JavaScript/TypeScript 支持的变更，并标注对应的版本号。
- 变更说明必须清晰说明新增的语言支持及其影响范围，便于用户了解功能增强。

