# 项目 上下文

## 目的
CodeI18n VSCode 扩展为 Go / Rust 等语言的源代码注释提供实时机器翻译能力，帮助非英语母语的开发者在不修改源码的前提下无损阅读和理解代码。通过与 `codei18n` CLI 和 LLM 服务集成，本项目希望降低阅读开源项目和多人协作时的语言门槛，提升代码审查和日常开发效率。

## 技术栈
- TypeScript（VS Code 扩展开发语言）
- Node.js 运行时（基于 VS Code 扩展宿主环境）
- VS Code Extension API（命令、配置、装饰、悬停提示等）
- Mocha + @vscode/test-electron + Sinon（单元测试与集成测试）
- ESLint + @typescript-eslint（静态检查与代码风格约束）
- 外部依赖：`codei18n` CLI（Go 实现），LLM 提供方：OpenAI / DeepSeek / Ollama

## 项目约定

### 代码风格
- 所有业务代码使用 TypeScript，保持明确的类型定义，避免使用 `any`。
- 统一通过 ESLint + @typescript-eslint 规则进行静态检查，提交前应保证无 lint 错误。
- 命名以可读性为优先：函数使用动词短语，变量使用名词短语，避免不必要的缩写。
- 保持模块职责单一：配置、CLI 调用、装饰、悬停逻辑分别放在对应目录中。

### 架构模式
- 采用典型 VS Code 扩展分层结构：
  - `src/extension.ts` 作为入口，负责激活扩展、注册命令和语言特性。
  - `src/services/` 封装与 `codei18n` CLI、配置文件等交互的领域服务。
  - `src/decoration/` 负责编辑器中的文本装饰和视觉替换，实现无损模式。
  - `src/hover/` 提供悬停原文展示等交互能力。
- 与外部翻译逻辑通过 `cliWrapper` 解耦，VS Code 端只关心注释提取与渲染，不直接处理翻译细节。
- 尽量保持扩展为“无副作用阅读工具”，不直接修改用户工作区中的源码内容。

### 测试策略
- 使用 Mocha + @vscode/test-electron 运行扩展级测试，覆盖激活流程和核心命令行为。
- 对 `services/` 中的核心逻辑（如注释提取、配置解析、CLI 调用封装）编写单元测试，可结合 Sinon 进行依赖模拟。
- 对关键回归场景（如 Go 与 Rust 注释支持、多语言配置、CLI 不可用时的错误处理）保持稳定的测试用例。
- 本地开发建议通过 `npm test` 或 `make test` 在提交前执行完整测试。

### Git工作流
- 使用 `main` 作为稳定分支，日常开发通过功能分支（`feature/...`、`fix/...`）进行。
- 功能开发完成后通过 Pull Request 合并，至少经过一次代码审查，保证测试通过且无明显 lint 问题。
- 提交信息要求简洁、具描述性，建议英文动词开头（如 `feat: add rust doc comment support`）或清晰的中文描述。
- 对影响较大的变更（行为变更、配置项新增等）需要在 `CHANGELOG.md` 和 `README.md` 中同步更新说明。

## 领域上下文
- 项目服务的核心场景是“阅读源码时的注释理解”，特别是英文注释较多的 Go / Rust 项目。
- 目标用户包括个人开发者、开源贡献者以及需要在多语言团队中协作的工程师。
- 本扩展只在编辑器视图层做翻译渲染，不替代项目内的正式国际化方案。

## 重要约束
- 依赖外部 `codei18n` CLI 和 LLM 服务，用户需要自行配置 CLI 安装、API Key、模型等信息。
- 必须保证对源码的“无损性”：扩展不能直接写回翻译结果到文件。
- 在网络受限或 LLM 服务不可用时，需要优雅降级（例如仅显示原始注释、不阻塞编辑体验）。

## 外部依赖
- `codei18n` CLI：由主仓库 `github.com/studyzy/codei18n` 提供，用于实际翻译执行。
- LLM 提供方：OpenAI / DeepSeek / Ollama 等，具体通过用户配置的 `codei18n.translation.*` 参数指定。
- VS Code：要求版本 `^1.74.0` 及以上。
