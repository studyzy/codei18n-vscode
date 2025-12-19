# 提案：为 VSCode 扩展添加 Java 语言系列支持

## 为什么

CodeI18n CLI 已经支持 Java、Kotlin 和 Scala 三种 JVM 语言的注释扫描和翻译，但 VSCode 扩展仅支持 Go、Rust、JavaScript 和 TypeScript。这导致使用 Java 生态语言的开发者无法在 VSCode 中享受注释实时翻译功能，限制了工具的适用范围。

## 变更内容

- 在 `package.json` 中添加 `java`、`kotlin`、`scala` 的激活事件
- 在扩展代码中的语言白名单添加这三种语言 ID
- 为这三种语言注册 Hover Provider
- 更新 README 和 CHANGELOG 文档说明新增语言支持
- 添加基础测试验证语言识别和注释扫描功能

## 影响

- 受影响规范：无（新增功能，不修改现有规范）
- 受影响代码：
  - `package.json`（激活事件配置）
  - `src/extension.ts`（语言列表、Hover Provider 注册）
  - `src/services/commentService.ts`（语言检查逻辑）
  - `src/test/suite/`（新增测试文件）
  - `README.md`、`CHANGELOG.md`（文档更新）

---

## 概述
CodeI18n CLI 已经实现了对 Java、Kotlin 和 Scala 三种 JVM 语言的注释扫描和翻译能力。本提案旨在使 CodeI18n VSCode 扩展同步支持这些语言,让使用这些语言的开发者也能享受到注释实时翻译的便利。

## 背景与动机
当前 VSCode 扩展仅支持 Go、Rust、JavaScript 和 TypeScript 四种语言。然而:
- CodeI18n CLI 底层已经完全支持 Java、Kotlin 和 Scala 的注释解析
- 这三种语言在企业开发中广泛使用,特别是 Java 生态系统
- 用户打开 `.java`、`.kt`、`.scala` 文件时无法获得注释翻译功能
- 所需的技术改动最小,主要是配置层面的扩展

通过本次变更,我们将填补这一功能空白,使 VSCode 扩展的语言支持与 CLI 工具保持一致。

## 目标
1. **功能对齐**: 使 VSCode 扩展支持的编程语言与 CodeI18n CLI 保持一致
2. **用户体验**: Java/Kotlin/Scala 开发者打开相应文件时自动激活翻译功能
3. **文档完整**: 在用户文档中明确说明对这三种语言的支持
4. **代码质量**: 保持现有架构模式,复用注释服务和装饰逻辑

## 范围
### 包含内容
- 在 `package.json` 中添加 `java`、`kotlin`、`scala` 激活事件
- 在扩展代码中将这三种语言 ID 加入支持列表
- 为这三种语言注册 Hover Provider
- 更新 README 文档说明新增语言支持
- 添加基础测试验证三种语言的注释识别

### 不包含内容
- 不修改 CodeI18n CLI 本身(已经支持)
- 不涉及新的翻译逻辑或装饰模式
- 不改变现有 Go/Rust/JS/TS 的行为

## 实施策略
采用**最小化变更原则**,在现有架构基础上扩展语言列表:
1. 配置层: 在 `package.json` 中声明新语言激活
2. 代码层: 在语言列表常量中添加新语言 ID
3. 注册层: 复制现有 Hover Provider 注册模式
4. 测试层: 添加基础的语言识别测试
5. 文档层: 更新用户文档

**关键假设**:
- CodeI18n CLI 的注释解析对 Java/Kotlin/Scala 已稳定可用
- VSCode 对这三种语言的 `languageId` 识别标准为 `java`、`kotlin`、`scala`
- 注释格式(行注释 `//` 和块注释 `/* */`)与现有支持的语言兼容

## 风险与依赖
### 风险
- **低风险**: VSCode 语言 ID 不匹配 → 通过测试验证
- **低风险**: CLI 解析某些边界情况失败 → 依赖 CLI 自身稳定性,扩展只负责调用

### 依赖
- CodeI18n CLI 版本需支持 Java/Kotlin/Scala(当前 dev 版本已验证)
- 无新增外部依赖

## 成功标准
1. 用户打开 `.java`、`.kt`、`.scala` 文件时扩展自动激活
2. 这三种语言的注释能正确调用 CLI 获取翻译并渲染
3. Hover 原文查看功能对这三种语言生效
4. 文档中明确列出支持的语言包含 Java/Kotlin/Scala
5. 所有现有测试继续通过,新增测试覆盖基本场景

## 后续计划
- 如果 CLI 未来支持更多 JVM 语言(如 Groovy、Clojure),可以快速在扩展中添加
- 可以考虑在侧边栏中显示当前文件的语言类型和翻译状态
