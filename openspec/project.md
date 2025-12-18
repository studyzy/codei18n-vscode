# 项目 上下文

## 目的
本仓库是 `CodeI18n` 的 VSCode 扩展，用于在 VSCode 中对 Go / Rust 源代码的注释进行**实时、无损的本地化翻译**。扩展通过调用外部 `codei18n` CLI 和 LLM，将英文（或其它语种）注释翻译为目标语言（默认中文），以降低阅读门槛、提升跨语种协作效率，同时保证源文件内容不被修改。

## 技术栈
- TypeScript（VSCode 扩展主语言）
- Node.js / VSCode Extension Host 运行时
- VS Code Extension API（命令、装饰器、Hover Provider 等）
- 测试：Mocha + `@vscode/test-electron`
- 代码质量：ESLint + `@typescript-eslint`
- 构建：TypeScript 编译器（`tsc`）、npm scripts、`Makefile`
- 外部 CLI：Go 编写的 `codei18n` 命令行工具

## 项目约定

### 代码风格
- 优先使用 TypeScript，避免使用 `any`，保持类型信息完整。
- 遵循 ESLint / `@typescript-eslint` 推荐规则；新增代码需要通过 `npm test` 和 lint 检查。
- 文件命名：
  - 源码：全部小写，使用中划线或驼峰，例如 `cliWrapper.ts`、`hoverProvider.ts`。
  - 测试：与被测文件同名，放在 `src/test` 或相应测试目录下。
- 注释：
  - 面向用户/扩展行为的说明建议使用英文注释，必要时可补充中文解释。
  - 重要行为和边界情况必须有行内或块注释说明。

### 架构模式
- 采用**按职责分层**的扩展结构：
  - 激活层：在 `extension.ts` 中注册命令、语言激活事件、装饰和 Hover 提供者。
  - 服务层：`src/services/cliWrapper.ts` 封装与 `codei18n` CLI 的交互（进程管理、参数拼装、错误处理）。
  - 展示层：`src/decoration/` 负责注释翻译结果在编辑器中的视觉替换（Decoration）。
  - 交互层：`src/hover/` 提供 Hover 原文查看等交互能力。
- 新功能优先落在对应职责层，不在激活函数中堆积业务逻辑。

### 测试策略
- 使用 Mocha + `@vscode/test-electron` 进行 VSCode 扩展级集成测试。
- 核心能力（CLI 调用、注释定位、翻译结果渲染、Hover 行为）需要有自动化测试用例。
- bug 修复必须尽量附带回归测试，防止同类问题再次出现。
- 日常开发至少保证 `npm test` 通过后再提交。

### Git工作流
- 分支策略：
  - `main`：可发布的稳定分支。
  - 功能开发：使用 `feat/xxx`、`fix/xxx` 等前缀的短期分支。
- 提交信息：
  - 建议采用类似 Conventional Commits 的前缀：`feat: ...`、`fix: ...`、`chore: ...` 等。
  - 提交说明可以使用中文，需清晰描述变更目的和影响，必要时关联 issue。
- 与 `codei18n.git.commitLanguage` 配置兼容，不在仓库中硬编码提交信息语言。

## 领域上下文
- 领域：源代码注释的国际化 / 本地化，重点支持 Go 和 Rust 项目。
- 扩展只对**注释内容**进行翻译并做视觉替换，不更改源代码 AST 或文件内容。
- 翻译语言和 LLM 提供方（OpenAI / DeepSeek / Ollama）由用户在 VSCode 设置或 `codei18n` 配置中指定。
- 项目依赖工作区内的 `.codei18n` 配置目录来决定翻译策略、映射关系等。

## 重要约束
- 扩展必须保持“无损”：不能在磁盘上修改用户源文件，只能通过 Decoration / Hover 提供翻译结果。
- 性能要求：
  - 翻译调用不能长时间阻塞 VSCode UI 线程。
  - 对于大文件和频繁编辑场景，需要避免重复、无效的 CLI 调用（应做去抖/合并）。
- 安全与隐私：
  - 不能在仓库中硬编码任何 API Key，统一通过 VSCode 配置读取。
  - 向外部 LLM 发送的内容应尽量只包含必要的注释文本，避免附带敏感业务数据。
- 兼容性：保持对 VSCode `^1.74.0` 及后续小版本的兼容性。

## 外部依赖
- `codei18n` CLI：
  - 用户需在本地安装 `codei18n`（Go 工具），并确保其在 PATH 中或通过 `codei18n.cliPath` 显式配置。
- LLM 提供方：
  - 支持 `openai`、`deepseek`、`ollama`，通过 `codei18n.translation.*` 配置指定 `baseUrl`、`model` 和 `apiKey`。
- 开发环境：
  - Node.js + npm，用于构建、运行测试和打包 VSCode 扩展。
  - Go 环境仅用于安装和更新 `codei18n` CLI。