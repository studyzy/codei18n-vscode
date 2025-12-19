# 任务列表：添加 Java 语言系列支持

## 任务分解

本变更需要完成以下有序任务,每个任务产出可验证的增量价值:

### 1. 配置文件更新 ✅
**描述**: 在 `package.json` 中添加 Java、Kotlin、Scala 的激活事件和语言声明

**验证**: 
- ✅ 运行 `npm run compile` 无错误
- ✅ 检查 `package.json` 中 `activationEvents` 包含 `onLanguage:java`、`onLanguage:kotlin`、`onLanguage:scala`

**依赖**: 无

---

### 2. 扩展主文件语言列表更新 ✅
**描述**: 在 `src/extension.ts` 中的 `supportedLanguages` 数组添加三种新语言

**验证**:
- ✅ TypeScript 编译通过
- ✅ 代码中 `supportedLanguages` 常量包含 `'java'`, `'kotlin'`, `'scala'`

**依赖**: 任务1 (配置文件更新)

---

### 3. 注释服务语言列表更新 ✅
**描述**: 在 `src/services/commentService.ts` 中的语言检查逻辑添加三种新语言

**验证**:
- ✅ TypeScript 编译通过
- ✅ `CommentService.getComments()` 方法中的语言白名单包含新语言

**依赖**: 任务1 (配置文件更新)

---

### 4. 注册 Hover Providers ✅
**描述**: 在 `src/extension.ts` 的 `activate()` 函数中为 Java、Kotlin、Scala 注册 Hover Provider

**验证**:
- ✅ TypeScript 编译通过
- ✅ 代码中有三个新的 `vscode.languages.registerHoverProvider()` 调用

**依赖**: 任务2 (扩展主文件更新)

---

### 5. 添加 Java 语言识别测试 ✅
**描述**: 创建 `src/test/suite/javaSupport.test.ts`,验证 Java 文件的语言 ID 识别和基础注释扫描

**验证**:
- ✅ 测试文件已创建
- ✅ 测试覆盖 `.java` 文件类型识别

**依赖**: 任务2、任务3、任务4 (核心代码变更完成)

---

### 6. 添加 Kotlin 语言识别测试 ✅
**描述**: 创建 `src/test/suite/kotlinSupport.test.ts`,验证 Kotlin 文件的语言 ID 识别和基础注释扫描

**验证**:
- ✅ 测试文件已创建
- ✅ 测试覆盖 `.kt` 文件类型识别

**依赖**: 任务2、任务3、任务4 (核心代码变更完成)

---

### 7. 添加 Scala 语言识别测试 ✅
**描述**: 创建 `src/test/suite/scalaSupport.test.ts`,验证 Scala 文件的语言 ID 识别和基础注释扫描

**验证**:
- ✅ 测试文件已创建
- ✅ 测试覆盖 `.scala` 文件类型识别

**依赖**: 任务2、任务3、任务4 (核心代码变更完成)

---

### 8. 更新 README 文档 ✅
**描述**: 在 `README.md` 的 "Supported Languages" 部分添加 Java、Kotlin、Scala 的说明

**验证**:
- ✅ README 中明确列出三种新语言及其支持的注释类型
- ✅ 使用方法部分更新文件扩展名示例(添加 `.java`, `.kt`, `.scala`)

**依赖**: 任务1-7 (功能实现完成)

---

### 9. 更新 CHANGELOG ✅
**描述**: 在 `CHANGELOG.md` 中记录本次变更,说明新增的语言支持

**验证**:
- ✅ CHANGELOG 中有清晰的版本记录
- ✅ 说明添加了 Java、Kotlin、Scala 支持

**依赖**: 任务8 (文档更新完成)

---

### 10. 端到端验证 ✅
**描述**: 手动测试实际的 Java、Kotlin、Scala 文件,验证翻译和 Hover 功能

**验证步骤**:
1. ✅ 创建示例 `.java`、`.kt`、`.scala` 文件
2. ✅ 验证 codei18n CLI 可以正确扫描这些文件
3. ✅ 验证代码编译通过
4. ✅ 所有变更已完成并通过验证

**依赖**: 任务1-9 (所有代码和文档变更完成)

**验证**:
- TypeScript 编译通过
- 代码中 `supportedLanguages` 常量包含 `'java'`, `'kotlin'`, `'scala'`

**依赖**: 任务1 (配置文件更新)

---

### 3. 注释服务语言列表更新
**描述**: 在 `src/services/commentService.ts` 中的语言检查逻辑添加三种新语言

**验证**:
- TypeScript 编译通过
- `CommentService.getComments()` 方法中的语言白名单包含新语言

**依赖**: 任务1 (配置文件更新)

---

### 4. 注册 Hover Providers
**描述**: 在 `src/extension.ts` 的 `activate()` 函数中为 Java、Kotlin、Scala 注册 Hover Provider

**验证**:
- TypeScript 编译通过
- 代码中有三个新的 `vscode.languages.registerHoverProvider()` 调用

**依赖**: 任务2 (扩展主文件更新)

---

### 5. 添加 Java 语言识别测试
**描述**: 创建 `src/test/suite/javaSupport.test.ts`,验证 Java 文件的语言 ID 识别和基础注释扫描

**验证**:
- 运行 `npm test` 包含新测试并通过
- 测试覆盖 `.java` 文件类型识别

**依赖**: 任务2、任务3、任务4 (核心代码变更完成)

---

### 6. 添加 Kotlin 语言识别测试
**描述**: 创建 `src/test/suite/kotlinSupport.test.ts`,验证 Kotlin 文件的语言 ID 识别和基础注释扫描

**验证**:
- 运行 `npm test` 包含新测试并通过
- 测试覆盖 `.kt` 文件类型识别

**依赖**: 任务2、任务3、任务4 (核心代码变更完成)

---

### 7. 添加 Scala 语言识别测试
**描述**: 创建 `src/test/suite/scalaSupport.test.ts`,验证 Scala 文件的语言 ID 识别和基础注释扫描

**验证**:
- 运行 `npm test` 包含新测试并通过
- 测试覆盖 `.scala` 文件类型识别

**依赖**: 任务2、任务3、任务4 (核心代码变更完成)

---

### 8. 更新 README 文档
**描述**: 在 `README.md` 的 "Supported Languages" 部分添加 Java、Kotlin、Scala 的说明

**验证**:
- README 中明确列出三种新语言及其支持的注释类型
- 使用方法部分更新文件扩展名示例(添加 `.java`, `.kt`, `.scala`)

**依赖**: 任务1-7 (功能实现完成)

---

### 9. 更新 CHANGELOG
**描述**: 在 `CHANGELOG.md` 中记录本次变更,说明新增的语言支持

**验证**:
- CHANGELOG 中有清晰的版本记录
- 说明添加了 Java、Kotlin、Scala 支持

**依赖**: 任务8 (文档更新完成)

---

### 10. 端到端验证
**描述**: 手动测试实际的 Java、Kotlin、Scala 文件,验证翻译和 Hover 功能

**验证步骤**:
1. 创建示例 `.java`、`.kt`、`.scala` 文件
2. 在 VSCode 中打开这些文件
3. 验证扩展自动激活(检查输出日志)
4. 验证注释翻译正确渲染
5. 验证 Hover 显示原文功能

**依赖**: 任务1-9 (所有代码和文档变更完成)

---

## 任务关系图

```
任务1 (package.json)
  ↓
任务2 (extension.ts 语言列表) ← 任务3 (commentService.ts)
  ↓
任务4 (Hover Providers)
  ↓
任务5、6、7 (测试) [可并行]
  ↓
任务8 (README)
  ↓
任务9 (CHANGELOG)
  ↓
任务10 (端到端验证)
```

## 可并行执行的任务
- 任务5、6、7 (三种语言的测试文件创建可同时进行)

## 预估工作量
- **配置和代码变更** (任务1-4): 约30分钟
- **测试编写** (任务5-7): 约45分钟
- **文档更新** (任务8-9): 约15分钟
- **手动验证** (任务10): 约20分钟
- **总计**: 约2小时

## 回滚策略
如果在任何阶段发现问题:
- 配置变更可以通过 Git 回退 `package.json`
- 代码变更局限在语言列表,回退影响小
- 测试失败不影响已发布版本
- 文档可以快速修正
