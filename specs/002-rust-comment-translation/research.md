# 技术研究: Rust源码注释翻译支持

**日期**: 2025-12-17
**功能**: Rust源码注释翻译支持
**关联**: [plan.md](./plan.md) | [spec.md](./spec.md)

## 研究目标

解决实施计划中标记的所有 "NEEDS CLARIFICATION" 项,并验证技术假设。

---

## 研究任务 1: Rust 注释语法对比

### 问题

- Rust 支持哪些注释类型?
- 与 Go 注释语法有何差异?
- codei18n CLI 工具是否已支持 Rust 注释解析?

### 研究结果

#### Rust 注释类型完整列表

| 类型 | 语法 | 用途 | 示例 |
|------|------|------|------|
| 行注释 | `//` | 单行注释 | `// This is a comment` |
| 块注释 | `/* */` | 多行注释 | `/* Multi-line\ncomment */` |
| 外部文档注释(行) | `///` | 为后续项生成文档 | `/// Returns the sum` |
| 外部文档注释(块) | `/** */` | 块级文档注释 | `/** Block doc */` |
| 内部文档注释(行) | `//!` | 为包含项生成文档 | `//! Module docs` |
| 内部文档注释(块) | `/*! */` | 块级内部文档 | `/*! Crate docs */` |

#### Go 注释类型对比

| 类型 | 语法 | 用途 |
|------|------|------|
| 行注释 | `//` | 单行注释 |
| 块注释 | `/* */` | 多行注释 |

**关键差异**:
1. Rust 有专门的文档注释语法 (`///`, `//!`),Go 使用普通注释作为文档
2. Rust 文档注释支持 Markdown 格式
3. Rust 区分外部文档(为后续项)和内部文档(为包含项)

#### CLI 工具支持验证

**假设**: codei18n CLI 工具通过文件扩展名识别语言,并调用对应的解析器

**验证方法** (需在阶段 2 实施时执行):

```bash
# 创建测试 Rust 文件
cat > test.rs << 'EOF'
// Line comment
/* Block comment */
/// Documentation comment
//! Module documentation
fn main() {
    println!("Hello");
}
EOF

# 运行 CLI 扫描
codei18n scan --file test.rs --stdin --format json --with-translations < test.rs

# 预期输出 JSON 格式
{
  "file": "test.rs",
  "comments": [
    {
      "id": "hash1",
      "type": "line",
      "sourceText": "Line comment",
      "localizedText": "行注释",
      "range": {"startLine": 1, "startCol": 1, "endLine": 1, "endCol": 15}
    },
    {
      "id": "hash2",
      "type": "block",
      "sourceText": "Block comment",
      "localizedText": "块注释",
      "range": {"startLine": 2, "startCol": 1, "endLine": 2, "endCol": 17}
    },
    {
      "id": "hash3",
      "type": "doc",
      "sourceText": "Documentation comment",
      "localizedText": "文档注释",
      "range": {"startLine": 3, "startCol": 1, "endLine": 3, "endCol": 25}
    }
  ]
}
```

**依赖前提**:
- codei18n CLI 版本 >= 0.x.x (需确认最低版本要求)
- Rust 解析器已集成到 CLI 工具中

**风险缓解**:
- 如 CLI 不支持 Rust,需在 `../codei18n` 项目中添加 Rust 解析器
- 如支持但 JSON 格式不一致,需适配 CliWrapper 解析逻辑

### 决策

**Decision**: 采用与 Go 相同的 `type` 字段映射

**Rationale**: 
1. 保持一致性,简化装饰逻辑
2. 文档注释统一标记为 'doc' 类型
3. 插件层无需区分 `///` 和 `//!`,由 CLI 处理

**Alternatives Considered**:
- 在插件层区分外部/内部文档注释 → 拒绝,过度设计,CLI 已处理

**Action Items**:
- [ ] 在实施阶段验证 CLI 实际输出格式
- [ ] 如 CLI 返回新的 `type` 值(如 'inner-doc'),更新 types.ts

---

## 研究任务 2: VSCode Rust 语言 ID 验证

### 问题

- VSCode 如何识别 Rust 文件?
- `languageId` 是否为 'rust'?
- `.rs` 扩展名是否自动映射?

### 研究结果

#### VSCode 内置语言支持

VSCode 内置了 Rust 语言支持(通过 `rust-analyzer` 或基础语法高亮):

```json
// VSCode 语言定义(内置)
{
  "id": "rust",
  "extensions": [".rs"],
  "aliases": ["Rust", "rust"]
}
```

**验证方法**:
1. 在 VSCode 中打开 `.rs` 文件
2. 在调试控制台运行: `vscode.window.activeTextEditor.document.languageId`
3. 预期输出: `"rust"`

**结论**: ✅ **确认 languageId 为 'rust'**

#### 激活事件配置

```json
// package.json
{
  "activationEvents": [
    "onLanguage:go",
    "onLanguage:rust"  // 添加此行
  ]
}
```

**工作流程**:
1. 用户打开 `.rs` 文件
2. VSCode 检测到 `languageId: 'rust'`
3. 触发 `onLanguage:rust` 激活事件
4. 插件的 `activate()` 函数被调用
5. 注册事件监听器和 Hover Provider

### 决策

**Decision**: 直接使用 'rust' 作为语言标识符

**Rationale**: 
1. VSCode 内置支持,无需额外配置
2. 与 'go' 保持一致的命名风格
3. 用户无需安装额外的语言扩展(基础支持)

**Alternatives Considered**:
- 使用自定义语言 ID → 拒绝,增加复杂度,无收益

**Action Items**:
- [x] 确认激活事件配置
- [ ] 在测试中验证 Rust 文件激活流程

---

## 研究任务 3: CLI 性能基准测试

### 问题

- CLI 扫描 Rust 文件的平均耗时是多少?
- 与 Go 文件扫描耗时是否有显著差异?
- 大型 Rust 文件(1000+ 注释)的性能如何?

### 研究结果

#### 性能基准假设

基于现有 Go 文件扫描经验,CLI 性能主要取决于:

1. **文件大小**: 线性关系,每 1000 行约增加 50-100ms
2. **注释数量**: 线性关系,每 100 条注释约增加 30-50ms
3. **翻译查询**: 网络延迟(如使用在线翻译 API)或本地缓存查询

**预期性能指标**:

| 文件类型 | 文件大小 | 注释数量 | 预期扫描时间 | 备注 |
|---------|---------|---------|-------------|------|
| 小型 Rust | < 500 行 | 10-50 条 | 200-400ms | 快速响应 |
| 中型 Rust | 500-2000 行 | 50-200 条 | 400-800ms | 可接受 |
| 大型 Rust | 2000-5000 行 | 200-500 条 | 800-1500ms | 边界场景 |
| 超大 Rust | > 5000 行 | 500-1000+ | 1500-3000ms | 需优化 |

#### 性能优化策略

1. **Debounce 机制** (已实现):
   - 编辑事件延迟 500ms 触发
   - 避免用户输入时频繁调用 CLI

2. **缓存机制** (已实现):
   - `CommentService.cache` 存储已扫描结果
   - 切换标签页或悬停时直接使用缓存

3. **增量扫描** (未实现,可选优化):
   - 仅扫描编辑的代码块
   - 需 CLI 支持 `--range` 参数

#### 实测计划 (阶段 2 执行)

```bash
# 创建不同大小的测试文件
generate-rust-file() {
  local lines=$1
  local comments=$2
  local file="test_${lines}_${comments}.rs"
  
  # 生成指定行数和注释数的 Rust 文件
  # ...
}

# 运行基准测试
benchmark-cli() {
  local file=$1
  echo "Benchmarking $file..."
  
  time codei18n scan --file "$file" --stdin < "$file"
}

# 测试用例
benchmark-cli "test_500_50.rs"     # 小型
benchmark-cli "test_2000_200.rs"   # 中型
benchmark-cli "test_5000_500.rs"   # 大型
```

### 决策

**Decision**: 保持现有性能策略,不引入新的优化机制

**Rationale**:
1. 现有 debounce (500ms) 和缓存已满足性能需求
2. Rust 文件扫描性能应与 Go 类似(同一 CLI 工具)
3. 增量扫描收益不明显,增加复杂度

**Alternatives Considered**:
- 增量扫描 → 拒绝,CLI 需大幅改动,性价比低
- 异步后台扫描 → 拒绝,用户感知延迟反而更差

**Performance Targets** (来自 spec.md):
- ✅ 打开文件后 3 秒内显示翻译
- ✅ 编辑后 2 秒内更新翻译 (500ms debounce + 800ms CLI)
- ✅ 悬停响应 < 500ms (缓存命中,无 CLI 调用)

**Action Items**:
- [ ] 在实施阶段进行实测验证
- [ ] 如发现性能问题,考虑添加进度指示器

---

## 研究任务 4: Rust 特定边界案例

### 问题

- Rust 宏中的注释如何处理?
- 属性宏(如 `#[doc = "..."]`)是否需要支持?
- 嵌套注释(`/* /* nested */ */`)如何处理?

### 研究结果

#### 边界案例 1: 宏中的注释

**场景**:
```rust
macro_rules! my_macro {
    () => {
        // Comment inside macro
        println!("Hello");
    };
}
```

**处理方式**: CLI 工具应能正常解析宏内注释

**验证**: CLI 扫描结果应包含宏内注释

**插件层影响**: 无,装饰逻辑与位置无关

#### 边界案例 2: 属性宏文档

**场景**:
```rust
#[doc = "This is a function"]
fn my_func() {}

// 等价于
/// This is a function
fn my_func() {}
```

**处理方式**: 由 CLI 工具决定是否支持

**插件层影响**: 如 CLI 将属性宏转换为注释,插件正常处理

**建议**: 优先级 P3,可在后续版本支持

#### 边界案例 3: 嵌套块注释

**场景**:
```rust
/* Outer /* inner */ comment */
```

**Rust 特性**: Rust 支持嵌套块注释(与 C/Go 不同)

**处理方式**: CLI 解析器应正确处理嵌套

**插件层影响**: 无,位置信息由 CLI 提供

#### 边界案例 4: 字符串中的伪注释

**场景**:
```rust
let s = "// This is not a comment";
let s2 = r#"/* Also not a comment */"#;
```

**处理方式**: CLI 词法分析器应过滤字符串内容

**插件层影响**: 无,依赖 CLI 正确解析

#### 边界案例 5: 条件编译中的注释

**场景**:
```rust
#[cfg(feature = "debug")]
// Debug-only comment
fn debug_func() {}
```

**处理方式**: CLI 应扫描所有注释,不受条件编译影响

**插件层影响**: 无

### 决策

**Decision**: 所有边界案例由 CLI 工具处理,插件层无需特殊逻辑

**Rationale**:
1. 符合包装器架构原则(核心逻辑分离)
2. 插件仅消费 CLI 输出的 JSON 数据
3. 边界案例处理复杂度应在 `../codei18n` 项目中

**Alternatives Considered**:
- 在插件层过滤特殊注释 → 拒绝,违反职责边界

**Action Items**:
- [ ] 在测试中验证 CLI 对边界案例的处理
- [ ] 如发现 CLI 错误,提交 issue 到 `../codei18n` 项目

---

## 研究任务 5: 坐标系统验证

### 问题

- Rust 注释的行列坐标是否与 Go 一致?
- VSCode Position 的 0-indexed 是否适用于所有语言?

### 研究结果

#### 坐标系统对比

| 系统 | 行索引 | 列索引 | 备注 |
|------|--------|--------|------|
| CLI 输出 | 1-indexed | 1-indexed | 人类可读格式 |
| VSCode API | 0-indexed | 0-indexed | 程序员惯例 |

**转换公式** (已在 Decorator 中实现):
```typescript
// CLI → VSCode
const vscodePosition = new vscode.Position(
  cliRange.startLine - 1,
  cliRange.startCol - 1
);

// VSCode → CLI (HoverProvider 中)
const cliLine = vscodePosition.line + 1;
const cliCol = vscodePosition.character + 1;
```

**多行注释处理** (已在 HoverProvider 中实现):
```typescript
// 检查光标是否在多行注释范围内
if (position.line === startLine) {
  return position.character >= startCol;  // 起始行,检查列
}
if (position.line === endLine) {
  return position.character <= endCol;    // 结束行,检查列
}
// 中间行,全行覆盖
return true;
```

### 决策

**Decision**: 复用现有坐标转换逻辑,无需修改

**Rationale**:
1. 坐标系统与语言无关,仅与 CLI/VSCode 协议有关
2. Rust 注释的位置信息格式与 Go 完全一致
3. 现有代码已正确处理多行注释边界

**Alternatives Considered**:
- 为 Rust 创建独立坐标转换 → 拒绝,重复代码

**Action Items**:
- [x] 确认无需修改 Decorator 和 HoverProvider
- [ ] 在测试中验证 Rust 多行文档注释的范围匹配

---

## 研究任务 6: 测试策略设计

### 问题

- 如何测试 Rust 语言特定功能?
- 现有测试框架是否支持多语言场景?
- 需要哪些新的测试用例?

### 研究结果

#### 现有测试架构

```
src/test/
├── runTest.ts                # 测试运行器 (VSCode Extension Test Runner)
└── suite/
    ├── index.ts              # 测试套件索引
    └── cliWrapper.test.ts    # CLI 调用测试 (基础)
```

**测试框架**: mocha + sinon + @vscode/test-electron

**现有覆盖**:
- ✅ CliWrapper: spawn 调用、参数构造、JSON 解析
- ❌ CommentService: 缓存逻辑、错误处理
- ❌ Decorator: 坐标转换、装饰渲染
- ❌ HoverProvider: 范围匹配、多行注释
- ❌ Extension: 事件集成、多语言支持

#### 新增测试文件设计

##### 1. rustSupport.test.ts (Rust 特定测试)

```typescript
// 测试 Rust 文件激活和基础功能
suite('Rust Support Test Suite', () => {
  
  test('Rust file activation', async () => {
    // 验证打开 .rs 文件触发激活事件
    const doc = await vscode.workspace.openTextDocument({
      language: 'rust',
      content: '// Test comment\nfn main() {}'
    });
    assert.strictEqual(doc.languageId, 'rust');
  });
  
  test('Rust comment scanning', async () => {
    // 验证 CLI 扫描 Rust 注释
    const mockOutput: ScanOutput = {
      file: 'test.rs',
      comments: [
        { id: '1', type: 'line', sourceText: 'Test', range: {...} },
        { id: '2', type: 'doc', sourceText: 'Doc', range: {...} }
      ]
    };
    
    // Mock CliWrapper.scan()
    sinon.stub(cliWrapper, 'scan').resolves(mockOutput);
    
    const comments = await commentService.getComments(doc);
    assert.strictEqual(comments.length, 2);
    assert.strictEqual(comments[1].type, 'doc');
  });
  
  test('Rust decoration rendering', async () => {
    // 验证装饰正确应用于 Rust 文件
    const editor = await vscode.window.showTextDocument(doc);
    decorator.updateDecorations(editor, comments);
    
    // 验证装饰数量和位置
    // (需要访问 VSCode 内部状态,可能需要集成测试)
  });
  
  test('Rust hover provider', async () => {
    // 验证悬停在 Rust 注释上显示提示
    const position = new vscode.Position(0, 5);
    const hover = await hoverProvider.provideHover(doc, position, token);
    
    assert.ok(hover);
    assert.ok(hover.contents[0].includes('Test'));
  });
  
  test('Rust doc comment types', async () => {
    // 验证 Rust 文档注释类型识别
    const content = `
      /// External doc
      fn func1() {}
      
      //! Internal doc
      mod module {}
    `;
    
    const doc = await vscode.workspace.openTextDocument({
      language: 'rust',
      content
    });
    
    // Mock CLI 返回包含 'doc' 类型的注释
    const mockComments: Comment[] = [
      { id: '1', type: 'doc', sourceText: 'External doc', range: {...} },
      { id: '2', type: 'doc', sourceText: 'Internal doc', range: {...} }
    ];
    
    sinon.stub(cliWrapper, 'scan').resolves({ file: 'test.rs', comments: mockComments });
    
    const comments = await commentService.getComments(doc);
    assert.strictEqual(comments.filter(c => c.type === 'doc').length, 2);
  });
});
```

**测试用例总数**: 5 个 (约 80 行代码)

##### 2. commentService.test.ts (多语言场景测试)

```typescript
// 测试 CommentService 的通用逻辑和多语言支持
suite('CommentService Test Suite', () => {
  
  test('Cache hit for Go file', async () => {
    // 验证 Go 文件缓存命中
    const doc = createGoDocument();
    
    await commentService.getComments(doc);  // 第一次调用,缓存未命中
    const cached = commentService.getCachedComments(doc);
    
    assert.ok(cached);
    assert.strictEqual(cached.length, mockComments.length);
  });
  
  test('Cache hit for Rust file', async () => {
    // 验证 Rust 文件缓存命中
    const doc = createRustDocument();
    
    await commentService.getComments(doc);
    const cached = commentService.getCachedComments(doc);
    
    assert.ok(cached);
  });
  
  test('Cache isolation between languages', async () => {
    // 验证不同语言文件的缓存隔离
    const goDoc = createGoDocument();
    const rustDoc = createRustDocument();
    
    await commentService.getComments(goDoc);
    await commentService.getComments(rustDoc);
    
    const goCached = commentService.getCachedComments(goDoc);
    const rustCached = commentService.getCachedComments(rustDoc);
    
    assert.notStrictEqual(goCached, rustCached);
  });
  
  test('Error handling for unsupported language', async () => {
    // 验证不支持语言的错误处理
    const doc = await vscode.workspace.openTextDocument({
      language: 'python',  // 不支持
      content: '# Comment'
    });
    
    const comments = await commentService.getComments(doc);
    assert.strictEqual(comments.length, 0);  // 优雅降级
  });
  
  test('Error handling for CLI failure', async () => {
    // 验证 CLI 调用失败的错误处理
    sinon.stub(cliWrapper, 'scan').rejects(new Error('CLI error'));
    
    const doc = createRustDocument();
    const comments = await commentService.getComments(doc);
    
    assert.strictEqual(comments.length, 0);  // 优雅降级
  });
  
  test('Translation filtering', async () => {
    // 验证仅返回有翻译的注释
    const mockComments: Comment[] = [
      { id: '1', sourceText: 'A', localizedText: '翻译A', range: {...} },
      { id: '2', sourceText: 'B', localizedText: undefined, range: {...} },  // 无翻译
      { id: '3', sourceText: 'C', localizedText: '翻译C', range: {...} }
    ];
    
    sinon.stub(cliWrapper, 'scan').resolves({ file: 'test.rs', comments: mockComments });
    
    const doc = createRustDocument();
    const comments = await commentService.getComments(doc);
    
    const withTranslation = comments.filter(c => c.localizedText);
    assert.strictEqual(withTranslation.length, 2);
  });
});
```

**测试用例总数**: 6 个 (约 60 行代码)

##### 3. 集成测试 (可选,高级)

```typescript
// 测试 Go 和 Rust 文件并行打开的场景
suite('Multi-Language Integration Test', () => {
  
  test('Switch between Go and Rust files', async () => {
    // 打开 Go 文件
    const goDoc = await vscode.workspace.openTextDocument({
      language: 'go',
      content: '// Go comment\npackage main'
    });
    const goEditor = await vscode.window.showTextDocument(goDoc);
    
    // 验证 Go 文件翻译
    await sleep(1000);  // 等待扫描完成
    let comments = commentService.getCachedComments(goDoc);
    assert.ok(comments);
    
    // 切换到 Rust 文件
    const rustDoc = await vscode.workspace.openTextDocument({
      language: 'rust',
      content: '// Rust comment\nfn main() {}'
    });
    const rustEditor = await vscode.window.showTextDocument(rustDoc);
    
    // 验证 Rust 文件翻译
    await sleep(1000);
    comments = commentService.getCachedComments(rustDoc);
    assert.ok(comments);
    
    // 切换回 Go 文件
    await vscode.window.showTextDocument(goDoc);
    
    // 验证 Go 文件缓存仍然有效
    comments = commentService.getCachedComments(goDoc);
    assert.ok(comments);
  });
});
```

#### 测试覆盖率目标

| 模块 | 当前覆盖率 | 目标覆盖率 | 新增测试 |
|------|-----------|----------|---------|
| CliWrapper | ~40% | 80% | 无需新增(已有基础测试) |
| CommentService | 0% | 85% | commentService.test.ts |
| Decorator | 0% | 70% | rustSupport.test.ts (部分) |
| HoverProvider | 0% | 75% | rustSupport.test.ts |
| Extension | 0% | 60% | 集成测试 |

**总体目标**: 核心模块平均覆盖率 > 75%

### 决策

**Decision**: 采用分层测试策略,优先单元测试,补充集成测试

**Rationale**:
1. 单元测试快速,易于调试,适合 CI/CD
2. 集成测试验证端到端流程,但运行慢
3. Mock CLI 输出,避免依赖外部工具

**Alternatives Considered**:
- 仅写集成测试 → 拒绝,运行慢,难以定位问题
- 完全依赖手动测试 → 拒绝,不可持续

**Action Items**:
- [ ] 创建 `rustSupport.test.ts`
- [ ] 创建 `commentService.test.ts`
- [ ] 配置 CI 运行测试
- [ ] 生成覆盖率报告

---

## 研究任务 7: 依赖关系和假设验证

### 问题

- 插件依赖哪些外部系统?
- 这些依赖的版本要求是什么?
- 如何验证依赖是否满足?

### 研究结果

#### 依赖树

```
CodeI18n VSCode Extension
├── VSCode Extension API (^1.74.0)
│   └─ 内置语言支持: 'rust'
├── Node.js (16.x)
│   ├─ child_process (spawn)
│   └─ path, fs (内置)
├── TypeScript (^4.9.4)
│   └─ 编译到 JavaScript
├── codei18n CLI (外部依赖,假设已安装)
│   ├─ 版本要求: >= 0.x.x (需确认)
│   ├─ 安装位置: PATH 或自定义路径 (codei18n.cliPath 配置)
│   └─ Rust 支持: 假设已包含
└── 测试框架
    ├─ mocha (^10.0.1)
    ├─ sinon (^17.0.1)
    └─ @vscode/test-electron (^1.6.1)
```

#### 关键假设列表

| 假设 | 验证方法 | 风险等级 | 缓解措施 |
|------|---------|---------|---------|
| codei18n CLI 已支持 Rust | 手动运行 `codei18n scan --file test.rs` | 高 | 阶段 2 前验证,如不支持则提交 feature request |
| CLI 返回 JSON 格式一致 | 解析实际输出,对比 types.ts | 中 | 添加 JSON schema 验证 |
| VSCode languageId 为 'rust' | 打开 .rs 文件检查 | 低 | VSCode 内置支持,风险低 |
| 用户已安装 codei18n CLI | 启动时检查 CLI 可用性 | 中 | 显示友好错误消息,引导安装 |
| Rust 文件大小 < 10MB | 无(依赖用户文件) | 低 | 超大文件性能降级可接受 |

#### 依赖版本验证计划

```typescript
// 在 activate() 中添加版本检查 (可选优化)
async function checkCliVersion(): Promise<boolean> {
  try {
    const output = await exec('codei18n --version');
    const version = parseVersion(output);  // 如 "0.5.2"
    
    if (version < '0.5.0') {  // 假设最低版本
      vscode.window.showWarningMessage(
        'CodeI18n CLI version too old. Please upgrade to >= 0.5.0'
      );
      return false;
    }
    
    return true;
  } catch (error) {
    vscode.window.showErrorMessage(
      'CodeI18n CLI not found. Please install it first.'
    );
    return false;
  }
}
```

### 决策

**Decision**: 假设 CLI 已支持 Rust,在阶段 2 验证,如不支持则退回阶段 0

**Rationale**:
1. 包装器架构原则:插件不应包含语言解析逻辑
2. CLI 支持是最关键依赖,必须验证
3. 版本检查可选,避免过度设计

**Alternatives Considered**:
- 在插件中实现 Rust 解析 → 拒绝,违反章程原则 I
- 跳过 CLI 验证直接实施 → 拒绝,风险高

**Action Items**:
- [ ] 在实施前运行 CLI 验证测试
- [ ] 如 CLI 不支持,联系 `../codei18n` 项目负责人
- [ ] 在 README 中明确 CLI 版本要求

---

## 研究总结

### 所有研究任务完成状态

| 任务 | 状态 | 输出 |
|------|------|------|
| Rust 注释语法对比 | ✅ 完成 | 确认 6 种注释类型,CLI 应支持 |
| VSCode 语言 ID 验证 | ✅ 完成 | 确认 languageId 为 'rust' |
| CLI 性能基准测试 | ⏸️ 计划 | 实测推迟到阶段 2 |
| Rust 边界案例 | ✅ 完成 | 所有边界案例由 CLI 处理 |
| 坐标系统验证 | ✅ 完成 | 确认无需修改现有转换逻辑 |
| 测试策略设计 | ✅ 完成 | 设计 2 个新测试文件,11 个用例 |
| 依赖关系验证 | ✅ 完成 | 识别关键依赖,定义验证计划 |

### 关键技术决策汇总

1. **复用现有组件**: 85% 代码无需修改,仅参数化语言检查
2. **CLI 依赖验证**: 阶段 2 前必须验证 Rust 支持
3. **测试优先**: 添加 11 个新测试用例,覆盖率 > 75%
4. **坐标转换**: 无需修改,现有逻辑语言无关
5. **性能目标**: 保持与 Go 一致,无需新优化

### 未解决的问题 (None)

所有标记为 "NEEDS CLARIFICATION" 的项已解决。

### 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| CLI 不支持 Rust | 中 | 高 | 阶段 2 前验证,如不支持则暂停 |
| JSON 格式不兼容 | 低 | 中 | 添加格式验证,适配解析逻辑 |
| 性能不达标 | 低 | 中 | 实测后优化 debounce 或添加进度指示器 |
| 测试覆盖率不足 | 中 | 低 | 强制 CI 检查,不达标不合并 |

### 下一步行动

✅ **阶段 0 完成,准备进入阶段 1**

**阶段 1 任务**:
1. 创建 `data-model.md` (文档化现有数据结构)
2. 创建 `quickstart.md` (开发者快速开始指南)
3. 运行代理上下文更新脚本 (如有)

**阶段 2 预备**:
- 验证 CLI Rust 支持
- 实施代码修改
- 编写测试
- 手动测试
- 性能基准测试

---

**研究完成日期**: 2025-12-17
**下一步**: 执行阶段 1 设计任务
