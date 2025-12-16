# 数据模型与接口契约

## 数据模型

本插件作为无状态 UI 层，不持久化存储业务数据。以下模型主要用于与 `codei18n` CLI 进行数据交换的内存对象。

### 核心实体: `Comment` (注释)

从 `codei18n scan` 命令返回的 JSON 对象映射而来。

| 字段 | 类型 | 描述 |
|------|------|------|
| `id` | `string` | 注释的唯一标识符 (SHA1 Hash)，由核心计算。 |
| `file` | `string` | 文件相对路径。 |
| `range` | `Range` | 注释在文件中的位置 (StartLine, StartCol, EndLine, EndCol)。 |
| `sourceText` | `string` | 原始英文注释文本。 |
| `localizedText` | `string` (可选) | 已翻译的中文文本。如果未翻译则为空或 undefined。 |
| `type` | `string` | 注释类型：`line` (单行) 或 `block` (多行)。 |

### VSCode 内部模型

| 实体 | 描述 |
|------|------|
| `TranslationDecoration` | 包含 `vscode.Range` 和 `vscode.DecorationOptions`，用于渲染翻译。 |

## 接口契约 (CLI Contract)

插件与 `codei18n` 核心之间的通信契约。

### 1. 扫描与获取翻译 (Scan & Translate)

**调用方式**:
```bash
codei18n scan --file <FILE_PATH> --stdin --format json --with-translations
```
*   `stdin`: 输入当前编辑器中的文件内容（确保未保存的更改也能被解析）。

**输出 (STDOUT JSON)**:

```json
{
  "file": "src/main.go",
  "comments": [
    {
      "id": "a1b2c3d4...",
      "range": {
        "startLine": 10,
        "startCol": 2,
        "endLine": 10,
        "endCol": 25
      },
      "sourceText": "// This is a test",
      "localizedText": "// 这是一个测试",
      "type": "line"
    }
  ]
}
```

**错误处理**:
*   Exit Code != 0: 视为扫描失败，插件应捕获 stderr 并记录日志，但不弹窗打扰用户（除非调试模式）。
*   JSON Parse Error: 视为核心异常，记录日志。

## 配置项 (Configuration)

将在 `package.json` 中定义的配置项：

| 配置 ID | 类型 | 默认值 | 描述 |
|---------|------|--------|------|
| `codei18n.cliPath` | `string` | `codei18n` | `codei18n` 二进制文件的路径。默认为系统 PATH 中的命令。 |
| `codei18n.enable` | `boolean` | `true` | 是否启用插件功能。 |
| `codei18n.targetLanguage` | `string` | `zh-CN` | 目标翻译语言（预留，当前核心默认可能是中文）。 |
| `codei18n.decorationStyle` | `object` | `{...}` | 自定义翻译文本的显示样式（颜色、字体等）。 |
