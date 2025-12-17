# 实施计划: Rust源码注释翻译支持

**分支**: `002-rust-comment-translation` | **日期**: 2025-12-17 | **规范**: [spec.md](./spec.md)
**输入**: 来自 `/specs/002-rust-comment-translation/spec.md` 的功能规范

**注意**: 此模板由 `/speckit.plan` 命令填充. 执行工作流程请参见 `.specify/templates/commands/plan.md`.

## 摘要

本功能扩展现有的 CodeI18n VSCode 插件,为 Rust 源代码文件 (.rs) 添加注释翻译支持。当前插件已实现 Go 语言注释的实时翻译显示,现需按照相同的设计模式扩展到 Rust。核心需求包括:

1. **自动翻译**: 打开 Rust 文件时自动将英文注释翻译为中文并显示
2. **实时更新**: 编辑注释后自动更新翻译
3. **悬停提示**: 悬停注释时显示原文和译文对比
4. **统一体验**: 保持与 Go 语言翻译功能一致的用户体验

**技术方法**: 
- 扩展 VSCode 激活事件以支持 `onLanguage:rust`
- 参数化现有的语言检查逻辑,将硬编码的 'go' 替换为语言列表 ['go', 'rust']
- 为 Rust 注册独立的 Hover Provider
- 复用现有的 CliWrapper、CommentService、Decorator 组件
- 依赖 codei18n CLI 工具已支持 Rust 语言扫描(假设前提)

## 技术背景

**语言/版本**: TypeScript 4.9.4 + Node.js 16.x
**主要依赖**: 
- VSCode Extension API (^1.74.0)
- codei18n CLI (外部 Go 二进制,通过子进程调用)
- mocha + @vscode/test-electron (测试框架)

**存储**: 无持久化存储,仅内存缓存 (Map<documentUri, Comment[]>)
**测试**: mocha + sinon (单元测试) + VSCode Extension Test Runner (集成测试)
**目标平台**: VSCode Desktop (Windows, macOS, Linux)
**项目类型**: VSCode 插件 (单一项目结构)
**性能目标**: 
- 打开文件后 3 秒内显示翻译
- 编辑后 2 秒内更新翻译 (500ms debounce + CLI 处理时间)
- 悬停响应 < 500ms

**约束条件**: 
- CLI 调用延迟: 每次扫描约 200-800ms (取决于文件大小)
- 内存: 缓存所有已打开文件的注释数据
- 并发: 同时打开多个 Rust 文件时,每个文件独立 CLI 调用

**规模/范围**: 
- 单个 Rust 文件注释数量: 通常 10-200 条
- 大型 Rust 文件: 最多 1000+ 注释(性能测试边界)
- 用户同时打开的 Rust 文件数: 通常 5-10 个

## 章程检查

*门控: 必须在阶段 0 研究前通过. 阶段 1 设计后重新检查. *

根据 `.specify/memory/constitution.md` 中定义的项目章程,本功能的合规性评估如下:

### I. 包装器架构 (Wrapper Architecture)

**评估**: ✅ **合规**

- **核心逻辑分离**: 所有翻译逻辑由 `../codei18n` CLI 工具处理,本插件仅负责调用和结果展示
- **依赖引用**: 通过 CliWrapper 的子进程调用机制与 codei18n CLI 通信
- **职责边界**: 
  - 插件职责: VSCode UI 集成、事件监听、配置管理、装饰渲染
  - CLI 职责: 注释解析、翻译查询、语言特定逻辑
- **Rust 扩展影响**: 无违规,仅扩展 VSCode 层的语言支持,CLI 层独立维护

### II. VSCode 原生集成 (VSCode Native Integration)

**评估**: ✅ **合规**

- **API 使用**: 仅使用官方稳定 API:
  - `vscode.languages.registerHoverProvider()`
  - `vscode.window.createTextEditorDecorationType()`
  - `vscode.workspace.onDidChangeTextDocument()`
- **用户体验**: 
  - 遵循 VSCode 装饰 API 规范
  - 配置项命名遵循 `codei18n.*` 约定
  - 使用 VSCode 主题颜色 (`editorLineNumber.foreground`)
- **性能**: 
  - 使用 debounce (500ms) 防止阻塞主线程
  - CLI 调用通过子进程异步执行
  - 缓存机制减少重复 CLI 调用
- **Rust 扩展影响**: 无违规,复用相同的性能优化策略

### III. 文档与注释 (Documentation & Comments)

**评估**: ⚠️ **需改进**

- **代码注释**: 现有代码已有 JSDoc 注释,但部分复杂逻辑缺少解释
- **复杂逻辑**: Decorator 的坐标转换 (1-indexed ↔ 0-indexed) 需要添加注释
- **README**: 现有 README 需更新,添加 Rust 支持说明
- **改进计划**: 
  1. 为新增的语言参数化逻辑添加注释
  2. 更新 README.md 添加 Rust 使用示例
  3. 在 quickstart.md 中提供开发者文档

### IV. 单元测试覆盖 (Unit Testing Coverage)

**评估**: ⚠️ **需补充**

- **现有测试**: 仅有 `cliWrapper.test.ts` (基础 CLI 调用测试)
- **缺失测试**: 
  - CommentService 的缓存逻辑
  - Decorator 的坐标转换
  - HoverProvider 的范围匹配(多行注释边界)
  - Rust 语言特定场景
- **测试计划**: 
  1. 添加 `rustSupport.test.ts` 覆盖 Rust 文件激活和扫描
  2. 扩展 `commentService.test.ts` 覆盖多语言场景
  3. 添加集成测试验证 Go 和 Rust 并行工作
- **覆盖率目标**: 核心功能模块 > 80%

### V. 版本控制 (Versioning)

**评估**: ✅ **合规**

- **当前版本**: 0.1.0 (package.json)
- **本功能版本规划**: 0.2.0 (MINOR 版本,向下兼容的功能新增)
- **发布策略**: 
  - 功能完成后更新为 0.2.0
  - Changelog 记录: "Added Rust language support"
  - Git 标签: `v0.2.0`

### 门控决策

**结论**: ✅ **通过,允许进入阶段 0**

所有关键原则(I, II, V)符合要求,仅有文档(III)和测试(IV)需在后续阶段改进,但不阻塞研究和设计阶段。测试补充将在任务执行阶段完成。

## 项目结构

### 文档(此功能)

```
specs/002-rust-comment-translation/
├── spec.md              # 功能规范 (已完成)
├── plan.md              # 此文件 (当前正在创建)
├── research.md          # 阶段 0 输出 (下一步)
├── data-model.md        # 阶段 1 输出
├── quickstart.md        # 阶段 1 输出 (开发者指南)
├── contracts/           # 无 API 合同 (VSCode 扩展无需)
│   └── (不适用)
├── checklists/
│   └── requirements.md  # 规范质量检查 (已完成)
└── tasks.md             # 阶段 2 输出 (通过 /speckit.tasks 命令生成)
```

### 源代码(仓库根目录)

**结构决策**: 单一项目结构,复用现有 VSCode 插件架构

```
codei18n-vscode/                        # 项目根目录
├── src/                                 # TypeScript 源代码
│   ├── extension.ts                     # 🔧 需修改: 扩展语言支持
│   ├── types.ts                         # ✅ 无需修改: 类型定义通用
│   ├── configuration/
│   │   └── configManager.ts             # ✅ 无需修改: 配置通用
│   ├── services/
│   │   ├── cliWrapper.ts                # ✅ 无需修改: CLI 通用
│   │   └── commentService.ts            # 🔧 需修改: 参数化语言检查
│   ├── decoration/
│   │   ├── decorator.ts                 # ✅ 无需修改: 装饰通用
│   │   └── decorationTypes.ts           # ❌ 未使用,可考虑删除
│   ├── hover/
│   │   └── translationHoverProvider.ts  # ✅ 无需修改: 范围匹配通用
│   └── utils/
│       └── debounce.ts                  # ✅ 无需修改: 工具函数通用
│
├── src/test/                            # 测试套件
│   ├── runTest.ts                       # 测试运行器
│   └── suite/
│       ├── index.ts                     # 测试索引
│       ├── cliWrapper.test.ts           # 现有测试
│       ├── commentService.test.ts       # 🆕 新增: 多语言场景测试
│       └── rustSupport.test.ts          # 🆕 新增: Rust 特定测试
│
├── out/                                 # 编译输出 (JavaScript)
│   └── (由 tsc 生成,不纳入版本控制)
│
├── package.json                         # 🔧 需修改: 添加 onLanguage:rust
├── tsconfig.json                        # ✅ 无需修改
├── README.md                            # 🔧 需修改: 添加 Rust 使用说明
└── .specify/                            # Speckit 配置和模板
    ├── memory/
    │   └── constitution.md              # 项目章程
    └── templates/                       # 工作流模板
```

**修改文件总结**:

| 文件 | 修改类型 | 估计行数变化 | 优先级 |
|------|---------|-------------|--------|
| `package.json` | 扩展激活事件 | +1 行 | P1 |
| `src/extension.ts` | 参数化语言列表 | +5 行 | P1 |
| `src/commentService.ts` | 日志消息更新 | +2 行 | P2 |
| `src/test/suite/rustSupport.test.ts` | 新建测试文件 | +80 行 | P1 |
| `src/test/suite/commentService.test.ts` | 新建测试文件 | +60 行 | P2 |
| `README.md` | 文档更新 | +20 行 | P2 |

**无需修改的组件**:
- CliWrapper: 通用进程管理,语言无关
- Decorator: 通用装饰逻辑,语言无关
- HoverProvider: 通用范围匹配,语言无关
- ConfigManager: 通用配置管理,语言无关
- types.ts: 类型定义通用(Comment 接口已支持多语言)

**复用比例**: 约 85% 现有代码可直接复用

## 复杂度跟踪

*仅在章程检查有必须证明的违规时填写*

**评估结果**: 无违规,无需填写此节

本功能严格遵循现有架构,未引入新的复杂度:
- ✅ 无新增第三方依赖
- ✅ 无架构模式变更
- ✅ 无额外的设计模式需求
- ✅ 仅扩展现有语言支持列表

**设计简洁性验证**:
- 改动范围最小化 (仅 3 个文件需修改)
- 复用现有组件最大化 (85% 代码无需改动)
- 参数化优于重复代码 (语言列表配置化)

## 后续阶段

### 阶段 0: 研究与澄清 (下一步)

**输出文件**: `research.md`

**研究任务**:

1. **Rust 注释语法对比**
   - 研究 Rust 注释类型: `//`, `/* */`, `///`, `//!`, `//!!`
   - 对比 Go 注释: `//`, `/* */`
   - 确认 CLI 工具 `codei18n` 是否已支持 Rust 解析

2. **CLI 工具验证**
   - 验证 `codei18n scan --file test.rs` 是否返回正确的 JSON
   - 确认 `type` 字段是否包含 Rust 特定注释类型(如 'doc')
   - 测试 CLI 对 Rust 文档注释的翻译质量

3. **VSCode Rust 语言 ID**
   - 确认 VSCode 对 Rust 文件的 `languageId` 为 'rust'
   - 验证 `.rs` 文件扩展名自动映射

4. **性能基准**
   - 测试 CLI 扫描 Rust 文件的平均耗时
   - 对比 Go 文件扫描耗时,确认性能差异

5. **边界案例**
   - 研究 Rust 宏中的注释处理
   - 研究 Rust 属性宏(如 `#[doc = "..."]`)是否需要支持

**研究方法**:
- 运行实际测试: 创建 `test.rs` 文件,手动运行 `codei18n scan`
- 查阅文档: VSCode API 文档、Rust 语法规范
- 原型验证: 在现有插件中添加临时代码测试 Rust 支持

### 阶段 1: 设计 (research.md 完成后)

**输出文件**: 
- `data-model.md`: 数据结构定义(基本无变化,仅文档化)
- `quickstart.md`: 开发者快速开始指南

**设计任务**:

1. **数据模型文档化**
   - 记录现有 `Comment` 接口结构
   - 说明 Rust 特定的 `type` 值(如 'doc', 'inner-doc')
   - 定义缓存键格式(documentUri 包含语言信息)

2. **快速开始指南**
   - 如何为插件添加新语言支持
   - 开发环境设置
   - 测试 Rust 支持的步骤
   - 常见问题排查

3. **无需 API 合同**
   - VSCode 插件不涉及 HTTP API
   - CLI 工具接口已由 `../codei18n` 项目定义
   - 本项目仅消费 CLI 输出,不定义新合同

### 阶段 2: 任务分解 (通过 /speckit.tasks 命令)

**输出文件**: `tasks.md`

**预期任务列表** (将由 `/speckit.tasks` 自动生成):

1. 更新 `package.json` 添加 `onLanguage:rust`
2. 修改 `extension.ts` 参数化语言支持
3. 修改 `commentService.ts` 日志消息
4. 创建 `rustSupport.test.ts` 测试文件
5. 创建 `commentService.test.ts` 测试文件
6. 更新 `README.md` 添加 Rust 说明
7. 手动测试 Rust 文件翻译
8. 性能测试(大型 Rust 文件)
9. 更新版本号为 0.2.0
10. 创建 Git 标签和发布 Changelog

**任务依赖**:
- 任务 2 依赖任务 1 (激活事件必须先配置)
- 任务 4-5 依赖任务 2-3 (测试依赖实现)
- 任务 7 依赖任务 2-3 (手动测试依赖实现)
- 任务 9-10 依赖任务 7-8 (发布依赖测试通过)

---

## 设计决策记录

### 决策 1: 复用现有组件 vs 创建 Rust 特定组件

**选择**: 复用现有组件

**理由**:
1. 现有组件已通过依赖注入设计,语言无关
2. Decorator、HoverProvider、CliWrapper 的逻辑与语言解耦
3. 仅需参数化语言检查,无需重复代码
4. 符合 DRY (Don't Repeat Yourself) 原则

**替代方案**: 为 Rust 创建独立的 RustCommentService、RustDecorator
- **拒绝原因**: 违反单一职责原则,增加维护成本,且逻辑重复

### 决策 2: 硬编码语言列表 vs 配置文件

**选择**: 硬编码语言列表 `const languages = ['go', 'rust']`

**理由**:
1. 当前仅支持 2 种语言,配置过度设计
2. 添加新语言通常需要代码改动(测试、文档),非纯配置
3. 简化部署,避免配置错误

**替代方案**: 从 `package.json` 读取支持语言列表
- **拒绝原因**: 增加复杂度,收益不明显(语言列表变更频率低)
- **未来考虑**: 当支持 5+ 语言时,可重新评估配置化方案

### 决策 3: 单独的 Rust Hover Provider vs 共享 Provider

**选择**: 为 Rust 注册独立的 Hover Provider 实例

**理由**:
1. VSCode API 要求每种语言单独注册 Provider
2. 允许未来为不同语言定制悬停行为
3. 实现简单,仅增加一行注册代码

**实现**:
```typescript
// Go
vscode.languages.registerHoverProvider('go', hoverProvider);

// Rust (新增)
vscode.languages.registerHoverProvider('rust', hoverProvider);
```

### 决策 4: CLI 工具扩展方式

**选择**: 假设 CLI 工具已支持 Rust,通过文件扩展名自动检测

**理由**:
1. 符合包装器架构原则(III.1: 核心逻辑分离)
2. 插件无需知道 CLI 内部语言识别机制
3. 统一接口: `codei18n scan --file <path>` 对所有语言生效

**风险缓解**:
- 阶段 0 研究验证 CLI 实际支持情况
- 如 CLI 未支持,将作为前置依赖提交给 `../codei18n` 项目

---

## 章程检查后评估 (阶段 1 后)

**计划**: 在阶段 1 设计完成后,重新评估以下项:

### III. 文档与注释

**改进措施**:
- [ ] 为 `extension.ts` 的语言参数化逻辑添加 JSDoc
- [ ] 为 `Decorator` 的坐标转换添加行内注释
- [ ] 完成 `quickstart.md` 开发者文档
- [ ] 更新 `README.md` 添加 Rust 使用示例

**验收标准**: 所有导出函数有 JSDoc,复杂逻辑块有解释注释

### IV. 单元测试覆盖

**改进措施**:
- [ ] 完成 `rustSupport.test.ts` (80 行+)
- [ ] 完成 `commentService.test.ts` (60 行+)
- [ ] 运行测试覆盖率报告,确保核心模块 > 80%
- [ ] 添加集成测试验证 Go/Rust 并行工作

**验收标准**: 
- 所有新增代码有对应单元测试
- 覆盖率报告通过 CI 验证

---

**状态**: 阶段 0 准备就绪,等待 `/speckit.plan` 命令执行后续阶段
