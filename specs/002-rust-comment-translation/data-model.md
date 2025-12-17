# 数据模型: Rust源码注释翻译支持

**日期**: 2025-12-17
**功能**: Rust源码注释翻译支持
**关联**: [plan.md](./plan.md) | [spec.md](./spec.md) | [research.md](./research.md)

## 概述

本文档定义 CodeI18n VSCode 插件中用于支持 Rust 源码注释翻译的数据结构和接口。由于本功能复用现有架构,大部分数据模型已在 `src/types.ts` 中定义,本文档主要记录现有模型并说明 Rust 扩展的适配方式。

---

## 核心数据实体

### 1. Comment (注释对象)

**定义位置**: `src/types.ts`

**用途**: 表示从源代码中提取的单条注释及其翻译

**接口定义**:

```typescript
export interface Comment {
    id: string;                  // 注释唯一标识符 (通常为内容哈希)
    file: string;               // 文件路径 (相对于工作区根目录)
    range: CommentRange;        // 注释在文件中的位置范围
    sourceText: string;         // 原始注释文本 (英文)
    localizedText?: string;     // 翻译后的文本 (中文,可选)
    type: 'line' | 'block' | 'doc';  // 注释类型
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 | Rust 特定行为 |
|------|------|------|------|---------------|
| `id` | string | 是 | CLI 生成的唯一标识 | 与 Go 相同 |
| `file` | string | 是 | 相对路径,如 `src/main.rs` | `.rs` 扩展名 |
| `range` | CommentRange | 是 | 注释位置 | 与 Go 相同 |
| `sourceText` | string | 是 | 原始英文注释 | 与 Go 相同 |
| `localizedText` | string? | 否 | 中文翻译,空表示无翻译 | 与 Go 相同 |
| `type` | string | 是 | 注释类型枚举 | 见下方 Rust 类型映射 |

**Rust 注释类型映射**:

| Rust 语法 | `type` 值 | 说明 | 示例 |
|-----------|-----------|------|------|
| `//` | `'line'` | 单行注释 | `// This is a comment` |
| `/* */` | `'block'` | 块注释 | `/* Multi-line */` |
| `///` | `'doc'` | 外部文档注释 | `/// Returns sum` |
| `//!` | `'doc'` | 内部文档注释 | `//! Module docs` |
| `/** */` | `'doc'` | 外部块文档注释 | `/** Function doc */` |
| `/*! */` | `'doc'` | 内部块文档注释 | `/*! Crate docs */` |

**注意**: 所有 Rust 文档注释(`///`, `//!`, `/** */`, `/*! */`)统一映射为 `'doc'` 类型,插件层不区分外部/内部文档注释。

**数据流**:

```
codei18n CLI (Rust 解析器)
    ↓ JSON 输出
Comment[] (1-indexed 坐标)
    ↓ CliWrapper 解析
Comment[] (内存对象)
    ↓ CommentService 缓存
Map<documentUri, Comment[]>
    ↓ Decorator 消费
装饰渲染 (0-indexed 转换)
```

**验证规则**:

- `sourceText` 不能为空字符串
- `range.startLine` <= `range.endLine`
- `range.startCol` <= `range.endCol` (同一行时)
- `type` 必须为枚举值之一
- `localizedText` 可选,但 Decorator 仅渲染有翻译的注释

---

### 2. CommentRange (注释位置)

**定义位置**: `src/types.ts`

**用途**: 描述注释在源文件中的精确位置

**接口定义**:

```typescript
export interface CommentRange {
    startLine: number;   // 起始行号 (1-indexed)
    startCol: number;    // 起始列号 (1-indexed)
    endLine: number;     // 结束行号 (1-indexed)
    endCol: number;      // 结束列号 (1-indexed)
}
```

**字段说明**:

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `startLine` | number | 起始行号,从 1 开始 | 第 1 行 = 1 |
| `startCol` | number | 起始列号,从 1 开始 | 第 1 个字符 = 1 |
| `endLine` | number | 结束行号 | 多行注释时 > startLine |
| `endCol` | number | 结束列号 | 单行注释时 > startCol |

**坐标系统对比**:

```
CLI 输出 (1-indexed):
1 // Comment at line 1, column 1
2 fn main() {
3     /* Block
4        comment */
5 }

VSCode API (0-indexed):
0 // Comment at line 0, character 0
1 fn main() {
2     /* Block
3        comment */
4 }
```

**坐标转换** (在 Decorator 和 HoverProvider 中):

```typescript
// CLI → VSCode
const vscodeStart = new vscode.Position(
    cliRange.startLine - 1,
    cliRange.startCol - 1
);

const vscodeEnd = new vscode.Position(
    cliRange.endLine - 1,
    cliRange.endCol - 1
);

const vscodeRange = new vscode.Range(vscodeStart, vscodeEnd);
```

**Rust 特定场景**:

```rust
/// This is a doc comment  ← range: {1, 1, 1, 28}
fn example() {}

/* Multi-line
   block comment */          ← range: {4, 1, 5, 20}
```

---

### 3. ScanOutput (CLI 扫描结果)

**定义位置**: `src/types.ts`

**用途**: CLI 工具返回的完整扫描结果结构

**接口定义**:

```typescript
export interface ScanOutput {
    file: string;           // 文件路径 (相对于工作区根目录)
    comments: Comment[];    // 扫描到的所有注释
}
```

**JSON 示例** (CLI 输出):

```json
{
  "file": "src/main.rs",
  "comments": [
    {
      "id": "abc123",
      "file": "src/main.rs",
      "type": "line",
      "sourceText": "Line comment",
      "localizedText": "行注释",
      "range": {
        "startLine": 1,
        "startCol": 1,
        "endLine": 1,
        "endCol": 16
      }
    },
    {
      "id": "def456",
      "file": "src/main.rs",
      "type": "doc",
      "sourceText": "Returns the sum of two numbers",
      "localizedText": "返回两个数字的和",
      "range": {
        "startLine": 3,
        "startCol": 1,
        "endLine": 3,
        "endCol": 34
      }
    }
  ]
}
```

**Rust vs Go 输出差异**:

| 字段 | Go 示例值 | Rust 示例值 | 差异 |
|------|-----------|-------------|------|
| `file` | `pkg/main.go` | `src/main.rs` | 扩展名不同 |
| `type` | `'line'`, `'block'` | `'line'`, `'block'`, `'doc'` | Rust 增加 'doc' |
| `sourceText` | 与 Rust 相同 | 与 Go 相同 | 无差异 |

---

## 运行时数据结构

### 4. CommentCache (注释缓存)

**定义位置**: `src/services/commentService.ts` (私有成员)

**用途**: 缓存已扫描的注释,避免重复 CLI 调用

**实现**:

```typescript
class CommentService {
    private cache: Map<string, Comment[]> = new Map();
    //              ↑               ↑
    //           缓存键           缓存值
}
```

**缓存键格式**:

```typescript
// 缓存键 = VSCode 文档 URI (包含语言和路径信息)
const cacheKey = document.uri.toString();

// 示例缓存键
// Go 文件:
"file:///Users/name/project/main.go"

// Rust 文件:
"file:///Users/name/project/src/main.rs"
```

**缓存策略**:

| 操作 | 触发条件 | 缓存行为 |
|------|---------|---------|
| 打开文件 | `onDidChangeActiveTextEditor` | 缓存未命中 → CLI 扫描 → 写入缓存 |
| 编辑文件 | `onDidChangeTextDocument` (500ms 后) | 失效旧缓存 → CLI 重新扫描 → 更新缓存 |
| 切换标签 | `onDidChangeActiveTextEditor` | 缓存命中 → 直接返回 |
| 悬停注释 | `provideHover` | 从缓存读取,无 CLI 调用 |

**Rust 特定行为**:

- Rust 文件与 Go 文件的缓存完全隔离 (不同的 URI)
- Rust 文档注释 (`'doc'` 类型) 与普通注释同等缓存
- 缓存键包含完整路径,支持同名文件 (如 `lib.rs` 和 `main.rs`)

**内存管理**:

- 缓存永久保存,直到插件停用或文件编辑
- 未来优化: 考虑 LRU 缓存,限制最大条目数

---

### 5. DecorationOptions (装饰选项)

**定义位置**: VSCode API (`vscode.DecorationOptions`)

**用途**: 定义如何在编辑器中渲染翻译

**接口定义**:

```typescript
interface DecorationOptions {
    range: vscode.Range;         // 装饰应用的范围 (0-indexed)
    hoverMessage?: string | vscode.MarkdownString;  // 悬停提示
    renderOptions?: {
        before?: {
            contentText?: string;        // 在范围前插入的文本
            color?: string | vscode.ThemeColor;  // 文本颜色
            fontStyle?: string;          // 字体样式
        };
        after?: { /* 类似 before */ };
    };
}
```

**Decorator 中的实际使用**:

```typescript
const decoration: vscode.DecorationOptions = {
    range: vscodeRange,  // 转换后的 0-indexed 范围
    renderOptions: {
        before: {
            contentText: comment.localizedText,  // 显示中文翻译
            color: new vscode.ThemeColor('editorLineNumber.foreground'),
            fontStyle: 'normal',
        }
    },
    hoverMessage: `**原文:** ${comment.sourceText}`  // 悬停显示原文
};
```

**视觉效果**:

```
原始编辑器内容:
// Line comment        ← sourceText (opacity=0, 不可见)

渲染后效果:
行注释 // Line comment  ← localizedText (before, 可见) + sourceText (隐藏)
```

**Rust 特定渲染**:

```rust
// 原始 Rust 代码
/// Returns the sum of two numbers
fn add(a: i32, b: i32) -> i32 { a + b }

// 渲染后效果
返回两个数字的和 /// Returns the sum of two numbers
fn add(a: i32, b: i32) -> i32 { a + b }
```

**装饰类型定义** (`src/decoration/decorator.ts`):

```typescript
private translationDecorationType = vscode.window.createTextEditorDecorationType({
    opacity: '0',              // 原文完全透明
    letterSpacing: '-1000px',  // 原文不占空间
});
```

---

## 数据关系图

```
┌─────────────────────────────────────────────────────────────┐
│                      数据流向                                │
└─────────────────────────────────────────────────────────────┘

  VSCode TextDocument (Rust 文件)
         │
         │ languageId: 'rust'
         │ uri: file:///path/to/main.rs
         │ getText()
         ▼
  ┌──────────────────┐
  │  CliWrapper      │
  │  .scan()         │
  └────────┬─────────┘
           │ spawn('codei18n scan ...')
           │ stdin: file content
           │ stdout: JSON
           ▼
  ┌──────────────────┐
  │  ScanOutput      │
  │  {               │
  │    file,         │
  │    comments[]    │
  │  }               │
  └────────┬─────────┘
           │ parse JSON
           ▼
  ┌──────────────────┐
  │  Comment[]       │  (1-indexed 坐标)
  │  [               │
  │    {id, range,   │
  │     sourceText,  │
  │     localizedText}│
  │  ]               │
  └────────┬─────────┘
           │
           ├─► CommentService.cache
           │   └─ Map<uri, Comment[]>
           │
           └─► Decorator.updateDecorations()
                   │
                   │ 过滤 localizedText 存在的注释
                   │ 坐标转换 (1-indexed → 0-indexed)
                   ▼
               ┌───────────────────────┐
               │  DecorationOptions[]  │  (0-indexed)
               │  [                    │
               │    {range, renderOptions}│
               │  ]                    │
               └───────────┬───────────┘
                           │
                           ▼
               editor.setDecorations()
                           │
                           ▼
               ┌───────────────────────┐
               │  VSCode 编辑器渲染     │
               │  [翻译] [原文(隐藏)]  │
               └───────────────────────┘


  用户悬停在注释上
         │
         ▼
  TranslationHoverProvider.provideHover()
         │
         ├─ CommentService.getCachedComments()
         │  └─ 返回 Comment[]
         │
         ├─ 范围匹配 (position 是否在 comment.range 内)
         │
         └─ 返回 vscode.Hover
               └─ contents: "**原文:** sourceText"
```

---

## 数据验证规则

### Comment 对象验证

```typescript
function validateComment(comment: Comment): boolean {
    // 必填字段
    if (!comment.id || !comment.file || !comment.sourceText) {
        return false;
    }
    
    // 类型枚举
    if (!['line', 'block', 'doc'].includes(comment.type)) {
        return false;
    }
    
    // 范围有效性
    if (comment.range.startLine > comment.range.endLine) {
        return false;
    }
    
    if (comment.range.startLine === comment.range.endLine &&
        comment.range.startCol > comment.range.endCol) {
        return false;
    }
    
    // 坐标正数
    if (comment.range.startLine < 1 || comment.range.startCol < 1) {
        return false;
    }
    
    return true;
}
```

### ScanOutput 验证

```typescript
function validateScanOutput(output: ScanOutput): boolean {
    if (!output.file || !Array.isArray(output.comments)) {
        return false;
    }
    
    return output.comments.every(validateComment);
}
```

**实际使用**: 在 `CliWrapper.scan()` 解析 JSON 后进行验证

---

## 扩展性设计

### 未来支持更多语言

**数据模型无需修改**:
- `Comment` 接口已语言无关
- `type` 枚举值通用 (line, block, doc)
- `file` 字段仅存储路径,不限制扩展名

**仅需配置变更**:

```typescript
// extension.ts
const supportedLanguages = ['go', 'rust', 'python', 'typescript'];

// package.json
"activationEvents": [
    "onLanguage:go",
    "onLanguage:rust",
    "onLanguage:python",
    "onLanguage:typescript"
]
```

### 未来支持自定义注释类型

**扩展 Comment 接口**:

```typescript
export interface Comment {
    // 现有字段...
    type: 'line' | 'block' | 'doc' | 'custom';  // 扩展枚举
    metadata?: {                                 // 可选元数据
        isDocComment?: boolean;
        isInnerDoc?: boolean;
        markdownFormatted?: boolean;
    };
}
```

**向后兼容**: 旧代码忽略 `metadata` 字段

---

## Rust 特定数据示例

### 示例 1: 基础 Rust 文件

**源代码** (`src/lib.rs`):

```rust
// Module-level comment
pub mod utils;

/// Adds two numbers together
fn add(a: i32, b: i32) -> i32 {
    a + b  /* inline block */
}
```

**CLI 输出 (ScanOutput)**:

```json
{
  "file": "src/lib.rs",
  "comments": [
    {
      "id": "hash1",
      "file": "src/lib.rs",
      "type": "line",
      "sourceText": "Module-level comment",
      "localizedText": "模块级注释",
      "range": {"startLine": 1, "startCol": 1, "endLine": 1, "endCol": 24}
    },
    {
      "id": "hash2",
      "file": "src/lib.rs",
      "type": "doc",
      "sourceText": "Adds two numbers together",
      "localizedText": "将两个数字相加",
      "range": {"startLine": 4, "startCol": 1, "endLine": 4, "endCol": 29}
    },
    {
      "id": "hash3",
      "file": "src/lib.rs",
      "type": "block",
      "sourceText": "inline block",
      "localizedText": "内联块",
      "range": {"startLine": 6, "startCol": 11, "endLine": 6, "endCol": 30}
    }
  ]
}
```

### 示例 2: 多行文档注释

**源代码**:

```rust
/// Calculates the factorial of a number.
///
/// # Examples
///
/// ```
/// let result = factorial(5);
/// ```
fn factorial(n: u32) -> u32 {
    // Implementation
}
```

**CLI 输出**:

```json
{
  "file": "src/math.rs",
  "comments": [
    {
      "id": "hash1",
      "file": "src/math.rs",
      "type": "doc",
      "sourceText": "Calculates the factorial of a number.\n\n# Examples\n\n```\nlet result = factorial(5);\n```",
      "localizedText": "计算一个数字的阶乘。\n\n# 示例\n\n```\nlet result = factorial(5);\n```",
      "range": {"startLine": 1, "startCol": 1, "endLine": 7, "endCol": 7}
    },
    {
      "id": "hash2",
      "file": "src/math.rs",
      "type": "line",
      "sourceText": "Implementation",
      "localizedText": "实现",
      "range": {"startLine": 9, "startCol": 5, "endLine": 9, "endCol": 23}
    }
  ]
}
```

**注意**: 多行文档注释 CLI 应合并为单个 Comment 对象,保留换行符

---

## 数据模型总结

### 核心接口

| 接口 | 定义位置 | 用途 | Rust 特定修改 |
|------|---------|------|---------------|
| `Comment` | types.ts | 注释对象 | 无需修改,`type` 增加 'doc' |
| `CommentRange` | types.ts | 位置信息 | 无需修改 |
| `ScanOutput` | types.ts | CLI 输出 | 无需修改 |
| `DecorationOptions` | VSCode API | 装饰配置 | 无需修改 |

### 运行时数据

| 数据 | 类型 | 位置 | 生命周期 |
|------|------|------|---------|
| 缓存 | `Map<string, Comment[]>` | CommentService | 插件激活到停用 |
| 装饰 | `DecorationOptions[]` | Decorator | 每次 update() 重建 |
| CLI 输出 | `ScanOutput` | CliWrapper | 临时,解析后丢弃 |

### 坐标系统

- **CLI 输出**: 1-indexed (人类可读)
- **VSCode API**: 0-indexed (程序员惯例)
- **转换位置**: Decorator.updateDecorations() 和 HoverProvider.provideHover()

### 扩展性

- ✅ 语言无关设计,支持未来扩展
- ✅ 向后兼容,可添加可选字段
- ✅ 数据验证规则清晰

---

**数据模型文档完成日期**: 2025-12-17
**下一步**: 创建 `quickstart.md` 开发者快速开始指南
