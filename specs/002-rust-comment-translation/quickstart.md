# 快速开始指南: Rust 源码注释翻译支持

**日期**: 2025-12-17
**功能**: Rust源码注释翻译支持
**目标读者**: 开发者、贡献者
**关联**: [plan.md](./plan.md) | [data-model.md](./data-model.md) | [research.md](./research.md)

## 概述

本指南帮助开发者快速理解并实施 Rust 源码注释翻译支持功能。如果你是第一次为 CodeI18n VSCode 插件添加新语言支持,本文档将指导你完成整个流程。

**预计时间**: 2-4 小时(包括测试)

---

## 前置条件

### 1. 开发环境

**必需**:
- Node.js >= 16.x
- VSCode >= 1.74.0
- TypeScript 编译器 (项目已配置)
- Git (版本控制)

**推荐**:
- VSCode Extension Test Runner 扩展
- Rust 语言支持扩展 (用于测试)

### 2. 依赖工具

**codei18n CLI**:

```bash
# 验证 CLI 是否已安装
codei18n --version

# 如未安装,请参考 ../codei18n 项目文档
# 确保 CLI 版本 >= 0.5.0 (假设最低版本)
```

**验证 Rust 支持**:

```bash
# 创建测试 Rust 文件
cat > test.rs << 'EOF'
// Line comment
/// Doc comment
fn main() {}
EOF

# 运行扫描测试
codei18n scan --file test.rs --stdin --format json --with-translations < test.rs

# 预期输出包含 JSON 格式的注释数据
```

**如果 CLI 不支持 Rust**:
- 暂停此功能开发
- 联系 `../codei18n` 项目团队添加 Rust 解析器
- 待 CLI 更新后继续

### 3. 克隆仓库

```bash
# 克隆项目
git clone https://github.com/studyzy/codei18n-vscode.git
cd codei18n-vscode

# 检出功能分支
git checkout 002-rust-comment-translation

# 安装依赖
npm install

# 编译 TypeScript
npm run compile

# 验证编译成功
ls out/extension.js  # 应存在
```

---

## 架构概览

### 核心组件

```
┌─────────────────────────────────────────────────────┐
│  extension.ts (协调器)                               │
│  ├─ ConfigManager (配置管理)                        │
│  ├─ CliWrapper (CLI 调用)                           │
│  ├─ CommentService (注释扫描)                       │
│  ├─ Decorator (视觉渲染)                            │
│  └─ TranslationHoverProvider (悬停提示)             │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  codei18n CLI (外部 Go 二进制)                      │
│  ├─ Go 解析器 (已实现)                              │
│  └─ Rust 解析器 (假设已实现)                        │
└─────────────────────────────────────────────────────┘
```

### 数据流

1. 用户打开 `.rs` 文件
2. VSCode 触发 `onLanguage:rust` 激活事件
3. `extension.ts` 调用 `CommentService.getComments()`
4. `CommentService` 调用 `CliWrapper.scan()`
5. `CliWrapper` 启动子进程运行 `codei18n scan`
6. CLI 返回 JSON 格式的注释数据
7. `CommentService` 缓存结果
8. `Decorator` 渲染翻译装饰
9. 用户看到翻译后的注释

**关键点**: 插件仅负责 VSCode 集成,所有语言解析由 CLI 处理

---

## 实施步骤

### 步骤 1: 更新 package.json

**文件**: `package.json`

**修改**: 添加 Rust 激活事件

```json
{
  "activationEvents": [
    "onLanguage:go",
    "onLanguage:rust"  // 新增此行
  ]
}
```

**验证**:

```bash
# 检查 JSON 语法
npm run compile

# 如有错误,修复后重新编译
```

**说明**: 当用户打开 `.rs` 文件时,VSCode 自动激活插件

---

### 步骤 2: 参数化语言支持 (extension.ts)

**文件**: `src/extension.ts`

**修改 1**: 定义支持的语言列表

```typescript
// 在 activate() 函数开头添加
export function activate(context: vscode.ExtensionContext) {
    console.log('CodeI18n active');
    
    // 新增: 支持的语言列表
    const supportedLanguages = ['go', 'rust'];
    
    // 现有代码...
    const configManager = new ConfigManager();
    // ...
}
```

**修改 2**: 替换硬编码的语言检查

**查找**:

```typescript
if (editor.document.languageId !== 'go') {
    console.log(`[CodeI18n] Skipping non-go file: ${editor.document.languageId}`);
    return;
}
```

**替换为**:

```typescript
if (!supportedLanguages.includes(editor.document.languageId)) {
    console.log(`[CodeI18n] Skipping unsupported file: ${editor.document.languageId}`);
    return;
}
```

**修改 3**: 为 Rust 注册 Hover Provider

**在现有 Hover Provider 注册后添加**:

```typescript
// 现有代码: Go 的 Hover Provider
const hoverProvider = vscode.languages.registerHoverProvider(
    'go',
    new TranslationHoverProvider(commentService)
);
context.subscriptions.push(hoverProvider);

// 新增: Rust 的 Hover Provider
const rustHoverProvider = vscode.languages.registerHoverProvider(
    'rust',
    new TranslationHoverProvider(commentService)
);
context.subscriptions.push(rustHoverProvider);
```

**完整代码片段**:

```typescript
export function activate(context: vscode.ExtensionContext) {
    console.log('CodeI18n active');

    // 支持的语言列表
    const supportedLanguages = ['go', 'rust'];

    const configManager = new ConfigManager();
    const cliWrapper = new CliWrapper(configManager);
    const commentService = new CommentService(cliWrapper);
    const decorator = new Decorator();

    if (!configManager.isEnabled()) {
        console.log('CodeI18n disabled via config');
        return;
    }

    // 核心更新逻辑
    const update = async (editor: vscode.TextEditor | undefined) => {
        if (!editor) {
            console.log('[CodeI18n] No active editor');
            return;
        }
        
        // 参数化语言检查
        if (!supportedLanguages.includes(editor.document.languageId)) {
            console.log(`[CodeI18n] Skipping unsupported file: ${editor.document.languageId}`);
            return;
        }
        
        console.log(`[CodeI18n] Processing ${editor.document.languageId} file: ${editor.document.fileName}`);
        
        try {
            const comments = await commentService.getComments(editor.document);
            console.log(`[CodeI18n] Got ${comments.length} comments from CLI`);
            decorator.updateDecorations(editor, comments);
        } catch (error) {
            console.error('[CodeI18n] Error during update:', error);
        }
    };

    // 事件监听 (保持不变)
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        update(activeEditor);
    }

    const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(editor => {
        update(editor);
    }, null, context.subscriptions);

    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(debounce(async event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            update(editor);
        }
    }, 500), null, context.subscriptions);

    // Hover Providers
    const goHoverProvider = vscode.languages.registerHoverProvider('go', new TranslationHoverProvider(commentService));
    context.subscriptions.push(goHoverProvider);
    
    const rustHoverProvider = vscode.languages.registerHoverProvider('rust', new TranslationHoverProvider(commentService));
    context.subscriptions.push(rustHoverProvider);

    // Commands (保持不变)
    const toggleCmd = vscode.commands.registerCommand('codei18n.toggle', async () => {
        const config = vscode.workspace.getConfiguration('codei18n');
        const current = config.get<boolean>('enable');
        await config.update('enable', !current, true);
        vscode.window.showInformationMessage(`CodeI18n: ${!current ? 'Enabled' : 'Disabled'}`);
    });

    context.subscriptions.push(toggleCmd);
}
```

**验证**:

```bash
# 编译检查
npm run compile

# 应无 TypeScript 错误
```

---

### 步骤 3: 更新日志消息 (可选)

**文件**: `src/services/commentService.ts`

**修改**: 更新日志消息以反映多语言支持

**查找**:

```typescript
console.log(`[CodeI18n] Got ${comments.length} comments from CLI`);
```

**替换为**:

```typescript
console.log(`[CodeI18n] Got ${comments.length} comments for ${document.languageId} file`);
```

**说明**: 这是可选优化,帮助调试多语言场景

---

### 步骤 4: 编写测试

#### 4.1 创建 Rust 支持测试

**文件**: `src/test/suite/rustSupport.test.ts` (新建)

**内容**:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { CommentService } from '../../services/commentService';
import { CliWrapper } from '../../services/cliWrapper';
import { Comment, ScanOutput } from '../../types';

suite('Rust Support Test Suite', () => {
    let commentService: CommentService;
    let cliWrapper: CliWrapper;
    let cliStub: sinon.SinonStub;

    setup(() => {
        cliWrapper = new CliWrapper({} as any);
        commentService = new CommentService(cliWrapper);
        cliStub = sinon.stub(cliWrapper, 'scan');
    });

    teardown(() => {
        sinon.restore();
    });

    test('Rust file language ID recognition', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'rust',
            content: '// Test comment\nfn main() {}'
        });
        
        assert.strictEqual(doc.languageId, 'rust');
    });

    test('Rust comment scanning', async () => {
        const mockOutput: ScanOutput = {
            file: 'test.rs',
            comments: [
                {
                    id: '1',
                    file: 'test.rs',
                    type: 'line',
                    sourceText: 'Test comment',
                    localizedText: '测试注释',
                    range: { startLine: 1, startCol: 1, endLine: 1, endCol: 16 }
                }
            ]
        };
        
        cliStub.resolves(mockOutput);
        
        const doc = await vscode.workspace.openTextDocument({
            language: 'rust',
            content: '// Test comment\nfn main() {}'
        });
        
        const comments = await commentService.getComments(doc);
        assert.strictEqual(comments.length, 1);
        assert.strictEqual(comments[0].type, 'line');
        assert.strictEqual(comments[0].localizedText, '测试注释');
    });

    test('Rust doc comment type recognition', async () => {
        const mockOutput: ScanOutput = {
            file: 'test.rs',
            comments: [
                {
                    id: '2',
                    file: 'test.rs',
                    type: 'doc',
                    sourceText: 'Documentation',
                    localizedText: '文档',
                    range: { startLine: 1, startCol: 1, endLine: 1, endCol: 18 }
                }
            ]
        };
        
        cliStub.resolves(mockOutput);
        
        const doc = await vscode.workspace.openTextDocument({
            language: 'rust',
            content: '/// Documentation\nfn test() {}'
        });
        
        const comments = await commentService.getComments(doc);
        assert.strictEqual(comments.length, 1);
        assert.strictEqual(comments[0].type, 'doc');
    });

    test('Rust cache functionality', async () => {
        const mockOutput: ScanOutput = {
            file: 'test.rs',
            comments: [{ id: '1', file: 'test.rs', type: 'line', sourceText: 'Test', range: { startLine: 1, startCol: 1, endLine: 1, endCol: 8 } }]
        };
        
        cliStub.resolves(mockOutput);
        
        const doc = await vscode.workspace.openTextDocument({
            language: 'rust',
            content: '// Test\nfn main() {}'
        });
        
        await commentService.getComments(doc);
        const cached = commentService.getCachedComments(doc);
        
        assert.ok(cached);
        assert.strictEqual(cached.length, 1);
    });
});
```

**运行测试**:

```bash
# 编译测试
npm run compile

# 运行测试 (通过 VSCode Extension Test Runner)
npm test

# 或在 VSCode 中: F5 启动调试,选择 "Extension Tests"
```

#### 4.2 创建多语言场景测试

**文件**: `src/test/suite/commentService.test.ts` (新建)

**内容**:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { CommentService } from '../../services/commentService';
import { CliWrapper } from '../../services/cliWrapper';

suite('CommentService Multi-Language Test Suite', () => {
    let commentService: CommentService;
    let cliWrapper: CliWrapper;
    let cliStub: sinon.SinonStub;

    setup(() => {
        cliWrapper = new CliWrapper({} as any);
        commentService = new CommentService(cliWrapper);
        cliStub = sinon.stub(cliWrapper, 'scan');
    });

    teardown(() => {
        sinon.restore();
    });

    test('Cache isolation between Go and Rust', async () => {
        // Mock Go 文件输出
        cliStub.onFirstCall().resolves({
            file: 'test.go',
            comments: [{ id: 'go1', file: 'test.go', type: 'line', sourceText: 'Go comment', range: { startLine: 1, startCol: 1, endLine: 1, endCol: 14 } }]
        });
        
        // Mock Rust 文件输出
        cliStub.onSecondCall().resolves({
            file: 'test.rs',
            comments: [{ id: 'rust1', file: 'test.rs', type: 'line', sourceText: 'Rust comment', range: { startLine: 1, startCol: 1, endLine: 1, endCol: 16 } }]
        });
        
        const goDoc = await vscode.workspace.openTextDocument({
            language: 'go',
            content: '// Go comment\npackage main'
        });
        
        const rustDoc = await vscode.workspace.openTextDocument({
            language: 'rust',
            content: '// Rust comment\nfn main() {}'
        });
        
        await commentService.getComments(goDoc);
        await commentService.getComments(rustDoc);
        
        const goCached = commentService.getCachedComments(goDoc);
        const rustCached = commentService.getCachedComments(rustDoc);
        
        assert.ok(goCached);
        assert.ok(rustCached);
        assert.notStrictEqual(goCached, rustCached);
        assert.strictEqual(goCached![0].sourceText, 'Go comment');
        assert.strictEqual(rustCached![0].sourceText, 'Rust comment');
    });

    test('Error handling for CLI failure', async () => {
        cliStub.rejects(new Error('CLI error'));
        
        const doc = await vscode.workspace.openTextDocument({
            language: 'rust',
            content: '// Test'
        });
        
        const comments = await commentService.getComments(doc);
        assert.strictEqual(comments.length, 0);  // 优雅降级
    });
});
```

---

### 步骤 5: 手动测试

#### 5.1 准备测试文件

**创建测试工作区**:

```bash
mkdir -p /tmp/codei18n-test
cd /tmp/codei18n-test

# 创建 Go 测试文件
cat > main.go << 'EOF'
package main

// Main function entry point
func main() {
    // Print hello message
    println("Hello")
}
EOF

# 创建 Rust 测试文件
cat > main.rs << 'EOF'
/// Program entry point
fn main() {
    // Print hello message
    println!("Hello");
}

/// Adds two numbers
fn add(a: i32, b: i32) -> i32 {
    a + b  /* inline comment */
}
EOF
```

#### 5.2 运行插件

```bash
# 在 VSCode 中按 F5 启动调试
# 或者
npm run watch  # 监听文件变化并自动编译
```

**在扩展开发宿主(Extension Development Host)窗口中**:

1. 打开测试工作区 `/tmp/codei18n-test`
2. 打开 `main.rs` 文件
3. 验证:
   - [ ] 插件自动激活 (检查输出通道: "CodeI18n active")
   - [ ] 注释自动翻译显示
   - [ ] 悬停在注释上显示原文提示
   - [ ] 编辑注释后 2 秒内更新翻译

4. 切换到 `main.go` 文件
5. 验证:
   - [ ] Go 注释仍然正常翻译
   - [ ] 切换回 `main.rs` 缓存仍有效

#### 5.3 检查调试输出

**打开 VSCode 输出通道**:

```
View > Output > Select "Log (Extension Host)"
```

**预期日志**:

```
[CodeI18n] CodeI18n active
[CodeI18n] Processing rust file: /tmp/codei18n-test/main.rs
[CodeI18n] Got 3 comments for rust file
[CodeI18n] Processing go file: /tmp/codei18n-test/main.go
[CodeI18n] Got 2 comments for go file
```

---

### 步骤 6: 性能测试

#### 6.1 创建大型 Rust 文件

**生成工具** (Python 脚本):

```python
#!/usr/bin/env python3
# generate_large_rust.py

def generate_rust_file(num_comments):
    with open('large_test.rs', 'w') as f:
        f.write('//! Large Rust file for testing\n\n')
        
        for i in range(num_comments):
            f.write(f'/// Documentation for function {i}\n')
            f.write(f'fn func_{i}() {{\n')
            f.write(f'    // Implementation comment {i}\n')
            f.write(f'    println!("Function {i}");\n')
            f.write('}\n\n')

if __name__ == '__main__':
    generate_rust_file(500)  # 生成 500 个函数,1000 条注释
    print("Generated large_test.rs with 1000 comments")
```

**运行**:

```bash
python3 generate_large_rust.py
```

#### 6.2 性能基准测试

**在 VSCode 中打开 `large_test.rs`**:

1. 记录打开文件到翻译显示的时间 (目标: < 3 秒)
2. 编辑任意注释,记录更新时间 (目标: < 2 秒)
3. 快速切换标签页,验证缓存命中 (目标: 即时)

**性能指标**:

| 指标 | 目标 | 测试结果 | 通过 |
|------|------|---------|------|
| 打开文件 | < 3s | _____ | ☐ |
| 编辑更新 | < 2s | _____ | ☐ |
| 切换标签 | < 500ms | _____ | ☐ |
| 悬停响应 | < 500ms | _____ | ☐ |

**如果性能不达标**:
- 检查 CLI 调用耗时 (添加日志)
- 增加 debounce 延迟
- 考虑添加进度指示器

---

### 步骤 7: 更新文档

#### 7.1 更新 README.md

**文件**: `README.md`

**添加 Rust 支持说明**:

```markdown
## 支持的语言

- **Go**: 全功能支持,包括行注释 (`//`)、块注释 (`/* */`)
- **Rust**: v0.2.0+ 支持,包括:
  - 行注释 (`//`)
  - 块注释 (`/* */`)
  - 外部文档注释 (`///`, `/** */`)
  - 内部文档注释 (`//!`, `/*! */`)

## 使用方法

### 对于 Rust 开发者

1. 安装 CodeI18n VSCode 扩展
2. 配置 codei18n CLI 路径 (如果不在 PATH 中)
3. 打开任意 `.rs` 文件
4. 英文注释自动显示为中文翻译
5. 悬停在注释上查看原文对照

### 配置示例

```json
{
  "codei18n.enable": true,
  "codei18n.cliPath": "/usr/local/bin/codei18n"
}
```
```

#### 7.2 更新 CHANGELOG.md (如果存在)

```markdown
## [0.2.0] - 2025-12-17

### Added
- Rust 源码注释翻译支持
  - 支持所有 Rust 注释类型 (行、块、文档注释)
  - 与 Go 语言保持一致的用户体验
  - 独立的 Hover Provider
  - 缓存隔离,支持多语言并行工作

### Changed
- 参数化语言支持逻辑,方便未来扩展新语言
- 改进日志消息,区分不同语言文件

### Fixed
- 无
```

#### 7.3 更新 package.json 版本号

```json
{
  "version": "0.2.0"
}
```

---

## 调试技巧

### 1. VSCode 扩展调试

**启动调试**:

1. 在 VSCode 中打开项目
2. 按 `F5` 启动扩展开发宿主
3. 在源代码中设置断点
4. 在扩展开发宿主中触发功能 (打开 Rust 文件)

**常用断点位置**:

- `extension.ts:update()` - 检查事件触发
- `commentService.ts:getComments()` - 检查缓存命中
- `cliWrapper.ts:scan()` - 检查 CLI 调用
- `decorator.ts:updateDecorations()` - 检查装饰渲染

### 2. CLI 调用调试

**添加日志**:

```typescript
// 在 cliWrapper.ts 的 scan() 方法中
console.log(`[CLI] Command: ${cliPath} ${args.join(' ')}`);
console.log(`[CLI] Working directory: ${workspaceFolder}`);
console.log(`[CLI] Input length: ${fileContent.length}`);

// 在回调中
childProcess.on('close', (code) => {
    console.log(`[CLI] Exit code: ${code}`);
    console.log(`[CLI] Output length: ${stdout.length}`);
});
```

**手动测试 CLI**:

```bash
# 复制插件调用的命令
cd /path/to/workspace
cat main.rs | codei18n scan --file main.rs --stdin --format json --with-translations

# 检查输出是否为有效 JSON
```

### 3. 查看 VSCode 日志

**扩展宿主日志**:

```
View > Output > Select "Log (Extension Host)"
```

**扩展输出通道**:

```
View > Output > Select "CodeI18n" (如果已创建 OutputChannel)
```

### 4. 常见问题排查

| 问题 | 可能原因 | 解决方法 |
|------|---------|---------|
| 插件未激活 | `activationEvents` 未配置 | 检查 `package.json` |
| 无翻译显示 | CLI 调用失败 | 检查 CLI 路径、权限 |
| 翻译延迟 | 文件过大或 CLI 慢 | 检查文件大小、CLI 性能 |
| 缓存失效 | URI 键值不一致 | 检查 `document.uri.toString()` |
| Hover 不显示 | Provider 未注册 | 检查 `registerHoverProvider` 调用 |

---

## 发布流程

### 1. 代码审查

**自我检查清单**:

- [ ] 所有测试通过 (`npm test`)
- [ ] 手动测试通过 (Go + Rust 并行工作)
- [ ] 性能基准达标
- [ ] 文档已更新 (README, CHANGELOG)
- [ ] 代码有 JSDoc 注释
- [ ] 无 TypeScript 编译错误
- [ ] 无 ESLint 警告

### 2. 创建 Pull Request

**PR 模板**:

```markdown
## 功能: Rust 源码注释翻译支持

### 摘要
扩展 CodeI18n VSCode 插件以支持 Rust 源码注释的实时翻译。

### 改动
- 更新 `package.json` 添加 `onLanguage:rust` 激活事件
- 参数化 `extension.ts` 的语言支持逻辑
- 为 Rust 注册 Hover Provider
- 新增 `rustSupport.test.ts` 测试文件 (5 个测试用例)
- 新增 `commentService.test.ts` 多语言测试 (2 个测试用例)
- 更新 README.md 添加 Rust 使用说明

### 测试
- [x] 单元测试通过 (11/11)
- [x] 手动测试: Rust 文件翻译正常
- [x] 手动测试: Go 文件翻译仍正常
- [x] 性能测试: 1000 条注释 < 3 秒

### 截图
![Rust 注释翻译效果](screenshots/rust-translation.png)

### 相关 Issue
Closes #123 (如果有)
```

### 3. 发布新版本

**发布步骤**:

```bash
# 1. 合并 PR 到 main
git checkout main
git pull origin main

# 2. 更新版本号 (package.json)
# "version": "0.2.0"

# 3. 创建 Git 标签
git tag -a v0.2.0 -m "Release v0.2.0: Add Rust support"
git push origin v0.2.0

# 4. 打包扩展
vsce package

# 5. 发布到 VSCode Marketplace (如果有权限)
vsce publish

# 6. 发布 GitHub Release
# 在 GitHub 仓库创建 Release,附加 .vsix 文件
```

---

## 扩展到其他语言

**基于此功能,扩展新语言(如 Python)的步骤**:

1. **验证 CLI 支持**: `codei18n scan --file test.py`
2. **更新 `package.json`**: 添加 `"onLanguage:python"`
3. **更新 `supportedLanguages`**: `['go', 'rust', 'python']`
4. **注册 Hover Provider**: `registerHoverProvider('python', ...)`
5. **编写测试**: `pythonSupport.test.ts`
6. **手动测试**: 打开 `.py` 文件验证
7. **更新文档**: README.md

**无需修改**:
- CliWrapper (语言无关)
- CommentService (通用逻辑)
- Decorator (通用装饰)
- HoverProvider (通用范围匹配)

---

## 参考资料

### 项目文档

- [功能规范 (spec.md)](./spec.md)
- [实施计划 (plan.md)](./plan.md)
- [技术研究 (research.md)](./research.md)
- [数据模型 (data-model.md)](./data-model.md)
- [项目章程 (.specify/memory/constitution.md)](../../.specify/memory/constitution.md)

### 外部文档

- [VSCode Extension API](https://code.visualstudio.com/api)
- [VSCode Decoration API](https://code.visualstudio.com/api/references/vscode-api#TextEditorDecorationType)
- [Rust 注释语法](https://doc.rust-lang.org/reference/comments.html)
- [codei18n CLI 文档](../../../codei18n/README.md) (假设路径)

### 社区支持

- GitHub Issues: https://github.com/studyzy/codei18n-vscode/issues
- 邮件列表: (如果有)

---

## 常见问题 (FAQ)

**Q: 为什么不在插件中实现 Rust 解析器?**

A: 遵循项目章程的"包装器架构"原则,所有核心业务逻辑(包括语言解析)应维护在 `../codei18n` 项目中,插件仅负责 VSCode 集成。

**Q: 如果 CLI 不支持 Rust 怎么办?**

A: 暂停此功能开发,联系 `../codei18n` 项目团队添加 Rust 支持。包装器架构确保插件和 CLI 职责分离。

**Q: 为什么需要两个 Hover Provider (Go 和 Rust)?**

A: VSCode API 要求每种语言单独注册 Provider。虽然实现逻辑相同(共享 `TranslationHoverProvider` 类),但注册时必须指定语言 ID。

**Q: 缓存会永久占用内存吗?**

A: 当前版本是的。未来可以优化为 LRU 缓存或定期清理。对于典型使用场景(同时打开 5-10 个文件),内存占用可接受。

**Q: 测试覆盖率不达标怎么办?**

A: 确保所有新增代码有对应的单元测试。运行 `npm test -- --coverage` 生成覆盖率报告,重点补充覆盖率低的模块。

---

## 下一步

完成此功能后,你可以:

1. **运行 `/speckit.tasks`**: 生成详细的任务分解 (`tasks.md`)
2. **开始实施**: 按照任务列表逐项完成
3. **提交 PR**: 代码审查和合并
4. **发布新版本**: v0.2.0

**预计总时间**: 2-4 小时 (包括测试和文档)

---

**快速开始指南完成日期**: 2025-12-17
**下一步**: 运行 `/speckit.tasks` 生成任务分解,或直接开始实施
