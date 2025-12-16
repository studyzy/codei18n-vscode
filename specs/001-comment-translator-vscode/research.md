# 研究报告: VSCode Comments Translator

**决策**: 采用 **CLI 包装器模式 (CLI Wrapper Pattern)** 进行集成。
**决策**: 使用 **VSCode Decorator API** 实现视觉上的注释翻译替换。

## 1. 集成策略: CLI 包装器

### 决策
插件将通过 Node.js `child_process` 模块调用本地的 `codei18n` 二进制文件。插件不包含任何翻译或 AST 解析的核心逻辑。

### 理由
1.  **符合宪法原则**: 严格遵守"核心逻辑分离"原则。`codei18n` 核心已经实现了复杂的 Go AST 解析和 ID 生成算法，重新在 TypeScript 中实现不仅违反原则，而且维护成本极高。
2.  **性能**: Go 二进制文件的解析速度远快于 JS/WASM 实现（根据研究，快 3-5 倍）。
3.  **现有能力**: `codei18n` 已经提供了 `scan --stdin --format json` 命令，完美契合 IDE 插件的需求。
4.  **解耦**: 插件与核心逻辑松耦合，核心逻辑的更新（如支持新语言）不需要修改插件代码（只要 JSON 契约不变）。

### 考虑的替代方案
*   **WASM**: 将 Go 代码编译为 WASM。
    *   *拒绝原因*: Go 的 WASM 支持生成的二进制文件较大（>4MB），且 Go AST 解析在 WASM 中性能有显著损耗。
*   **Native Node Module (CGO)**: 编写 Node.js C++ 扩展调用 Go 归档文件。
    *   *拒绝原因*: 构建极其复杂，跨平台分发困难（需要为每个 OS/Arch 编译），容易导致 VSCode 进程崩溃。
*   **TypeScript 重写**:
    *   *拒绝原因*: 违反宪法原则，重复造轮子，且 JS 在 AST 解析密集型任务上性能不如 Go。

## 2. 视觉替换: Decorator API

### 决策
使用 `vscode.window.createTextEditorDecorationType` 创建装饰器，利用 `renderOptions.after` 或 `before` 属性覆盖/附加翻译文本，并将原文本设置为透明或隐藏。

### 理由
1.  **非破坏性**: Decorator 纯粹是视图层的渲染，绝对不会修改编辑器缓冲区或磁盘文件的内容，满足 Spec SC-002。
2.  **灵活性**: 支持丰富的样式（颜色、背景、字体），可以清晰地区分源代码和翻译文本。
3.  **性能**: VSCode 对 Decorator 渲染进行了优化，适合实时更新。

### 考虑的替代方案
*   **Inlay Hints API**:
    *   *拒绝原因*: Inlay Hints 主要用于简短的类型提示或参数名，不适合大段的注释文本替换。虽是新标准，但用途不符。
*   **CodeLens**:
    *   *拒绝原因*: 占用垂直空间，会导致代码行号错位或跳动，严重影响阅读体验。
*   **Phantom Text (非公开 API)**:
    *   *拒绝原因*: 不稳定，不推荐生产使用。

## 3. 未知项解决状态

*   **Integration with `../codei18n`**: 已解决。确认为 CLI 调用。
*   **VSCode Decorator API**: 已解决。确认为 `createTextEditorDecorationType`。
*   **Project Structure**: 已解决。采用标准 Yeoman 结构 + `services/` 层。
