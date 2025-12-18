# CodeI18n VSCode 扩展

[CodeI18n](https://github.com/studyzy/codei18n) 的 VSCode 扩展，实现源代码注释的实时翻译。

## 功能特性

- **自动翻译**：实时将英文注释自动翻译为你的母语（例如中文）。
- **无损模式**：仅进行视觉替换；源文件内容永远不会被修改。
- **悬停查看原文**：将鼠标悬停在已翻译的注释上即可查看原始英文文本。
- **CodeI18n 侧边栏**：在 VSCode 左侧活动栏中提供 CodeI18n 视图，可初始化项目、切换本地化模式，并执行“文件内容本地化”和“英文化”操作。

## Supported Languages

- **Go**: Full support for line comments (`//`) and block comments (`/* */`).
- **Rust**: v0.2.0+ support, including:
  - Line comments (`//`)
  - Block comments (`/* */`)
  - Doc comments (`///`, `//!`)
  - External doc comments (`/** */`, `/*! */`)

## 环境要求

你必须在系统上安装并配置好 `codei18n` CLI 工具。

### 安装 CodeI18n CLI

```bash
go install github.com/studyzy/codei18n/cmd/codei18n@latest
```

确保 `codei18n` 已添加到系统的 PATH 环境变量中。

## 配置项

| 设置项 | 默认值 | 描述 |
|---------|---------|-------------|
| `codei18n.enable` | `true` | 启用/禁用扩展。 |
| `codei18n.cliPath` | `codei18n` | `codei18n` 可执行文件的路径（如果不在 PATH 中，建议使用绝对路径）。 |

## 使用方法

1. 打开任何 Go (`.go`) 文件。
2. 注释将被自动翻译。
3. 将鼠标悬停在翻译后的文本上以查看原文。

## 命令

- `CodeI18n: Toggle Translation`: 快速启用/禁用翻译功能。
- `CodeI18n: Initialize Project`: 通过 CLI 初始化当前工作区中的 CodeI18n 配置。
- `CodeI18n: Use Display Localization Mode`: 切换为显示本地化模式，仅在编辑器中以装饰形式显示翻译结果。
- `CodeI18n: Use File Localization Mode`: 切换为文件内容本地化模式，为后续批量修改源码注释做准备。
- `CodeI18n: Run File Content Localization`: 调用 `codei18n convert` 将当前工作区中的注释批量转换为目标语言（默认 `codei18n.targetLanguage`）。
- `CodeI18n: Run English Localization`: 调用 `codei18n convert` 将已本地化的注释尝试恢复为英文。

## 故障排除

1. Open any Go (`.go`) or Rust (`.rs`) file.
2. Comments will be automatically translated.
3. Hover over a translation to view the original text.
- **Error: codei18n process exited**: 这通常意味着 CLI 工具未找到或崩溃。请检查你的 `codei18n.cliPath` 设置。
- **No translations**: 确保你的项目根目录下的 `codei18n` 配置（映射）已正确设置（`.codei18n/`）。

## 开发指南

### 前置条件
- Node.js & npm
- [codei18n](https://github.com/studyzy/codei18n) CLI

### 项目设置
```bash
git clone https://github.com/studyzy/codei18n-vscode.git
cd codei18n-vscode
npm install
```

### 构建与测试
为了方便起见，你可以使用提供的 `Makefile`：

```bash
make compile   # 编译 TypeScript
make test      # 运行测试
make package   # 创建 .vsix 安装包
```

### 项目结构
- `src/services/cliWrapper.ts`: 与 `codei18n` 二进制文件交互。
- `src/decoration/`: 处理编辑器中的视觉文本替换。
- `src/hover/`: 提供悬停时的原文显示。

## 许可证

MIT
