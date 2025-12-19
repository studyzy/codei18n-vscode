# 设计文档：Java 语言系列支持

## 架构概览

本次变更不涉及架构调整,完全复用现有的注释翻译架构。新增 Java、Kotlin、Scala 支持仅需在配置层和注册层添加语言标识符即可。

### 现有架构回顾

```
┌─────────────────────┐
│   VSCode 编辑器     │
│  (onDidOpen事件)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Extension.ts      │
│  - 激活事件监听     │
│  - Hover Provider   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  CommentService     │
│  - 语言检查         │
│  - CLI 调用         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   CLIWrapper        │
│  - codei18n scan    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   CodeI18n CLI      │
│  (已支持 Java 等)   │
└─────────────────────┘
```

## 技术决策

### 决策1: 使用语言列表扩展而非特殊逻辑

**选择**: 在现有的 `supportedLanguages` 数组中添加 `'java'`, `'kotlin'`, `'scala'`

**理由**:
- Java/Kotlin/Scala 的注释语法与 JavaScript/TypeScript 高度相似(均使用 `//` 和 `/* */`)
- CodeI18n CLI 已经为这些语言实现了专门的解析器
- 不需要在 VSCode 扩展层添加任何特殊的注释识别逻辑

**考虑的替代方案**:
- ❌ 为每种语言创建独立的 Service 类 → 过度设计,增加维护负担
- ❌ 使用配置文件动态加载语言列表 → 当前仅7种语言,不值得引入复杂性

---

### 决策2: 复制 Hover Provider 注册模式

**选择**: 为每种语言独立注册 `HoverProvider`,而非使用数组注册

**理由**:
- 保持与现有代码风格一致(Go、Rust、JS、TS 均独立注册)
- 便于调试(每个 Provider 有独立的 disposable 对象)
- 性能影响可忽略(仅在激活时注册一次)

**代码示例**:
```typescript
const javaHoverProvider = vscode.languages.registerHoverProvider(
    'java', 
    new TranslationHoverProvider(commentService)
);
context.subscriptions.push(javaHoverProvider);
```

**考虑的替代方案**:
- ❌ 循环注册 → 代码简洁但降低可读性,不符合当前代码风格

---

### 决策3: 测试策略采用基础覆盖

**选择**: 为每种语言创建独立的测试文件,仅验证语言识别和基础扫描

**理由**:
- 注释翻译的核心逻辑已在现有测试中验证
- 新增语言的主要风险在于 VSCode 语言 ID 识别
- 全面的翻译质量测试应在 CLI 层进行

**测试覆盖范围**:
1. 语言 ID 识别(`.java` → `'java'`)
2. 注释扫描不抛出异常
3. 支持语言列表包含新语言

**不测试的内容**(已在其他测试覆盖):
- 翻译质量
- 装饰渲染
- Hover 详细行为

---

### 决策4: 文档更新遵循现有格式

**选择**: 在 README 的 "Supported Languages" 部分按字母顺序插入新语言

**理由**:
- 用户可以快速扫描支持的语言列表
- 保持文档结构稳定

**格式**:
```markdown
## Supported Languages

- **Go**: Full support for line comments (`//`) and block comments (`/* */`).
- **Java**: Full support for line comments (`//`) and block comments (`/* */`).
- **JavaScript**: Full support for line comments (`//`) and block comments (`/* */`).
- **Kotlin**: Full support for line comments (`//`) and block comments (`/* */`).
- **Rust**: ...
- **Scala**: Full support for line comments (`//`) and block comments (`/* */`).
- **TypeScript**: ...
```

---

## 实施细节

### 配置变更 (`package.json`)

```json
{
  "activationEvents": [
    "onLanguage:go",
    "onLanguage:java",
    "onLanguage:kotlin",
    "onLanguage:rust",
    "onLanguage:scala",
    "onLanguage:javascript",
    "onLanguage:typescript",
    ...
  ]
}
```

### 代码变更

**文件**: `src/extension.ts`
```typescript
const supportedLanguages = [
    'go', 
    'rust', 
    'javascript', 
    'typescript',
    'java',
    'kotlin',
    'scala'
];
```

**文件**: `src/services/commentService.ts`
```typescript
const supportedLanguages = [
    'go', 
    'rust', 
    'javascript', 
    'typescript',
    'java',
    'kotlin',
    'scala'
];
```

---

## 性能考虑

### 预期性能影响

1. **激活时间**: 新增3个 Hover Provider 注册,预计增加 <5ms
2. **运行时内存**: 每个 Provider 约 1KB,总增加 <10KB
3. **扫描延迟**: 与 JavaScript/TypeScript 相当,取决于 CLI 性能

### 性能优化

当前不需要特殊优化,因为:
- 扫描已实现缓存机制(`CommentService.cache`)
- 文档变更使用去抖延迟(防止频繁调用)
- CLI 性能已在其自身项目中优化

---

## 风险缓解

### 风险1: VSCode 语言 ID 不匹配

**缓解措施**:
- 在集成测试中验证实际的 `document.languageId`
- 参考 VSCode 官方文档确认标准语言标识符

**验证步骤**:
```typescript
// 测试代码
assert.strictEqual(document.languageId, 'java');
assert.strictEqual(document.languageId, 'kotlin');
assert.strictEqual(document.languageId, 'scala');
```

---

### 风险2: CLI 版本不兼容

**缓解措施**:
- 在文档中说明需要最新版本的 CodeI18n CLI
- 扩展在调用 CLI 失败时优雅降级(仅记录错误,不崩溃)

**兼容性检查**:
```bash
# 用户可以验证 CLI 版本
codei18n --version
# 测试 Java 文件扫描
codei18n scan --file example.java --format json
```

---

## 待决问题

无待决问题。所有技术决策已明确,实施路径清晰。

---

## 未来扩展点

1. **更多 JVM 语言**: 如果 CLI 支持 Groovy、Clojure 等语言,可快速添加
2. **语言特定配置**: 未来可以为不同语言提供独立的翻译配置(如不同的 LLM 模型)
3. **JSDoc/ScalaDoc 特殊处理**: 可以在 CLI 层增强文档注释的翻译质量

---

## 参考资料

- [VSCode 语言标识符列表](https://code.visualstudio.com/docs/languages/identifiers)
- [CodeI18n CLI 文档](https://github.com/studyzy/codei18n)
- [现有变更: add-js-ts-comment-support](../add-js-ts-comment-support/)
