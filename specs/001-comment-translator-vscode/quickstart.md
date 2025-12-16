# 快速开始: VSCode Comments Translator

本指南用于验证插件是否正确安装并正常工作。

## 前置条件

1.  **安装 CodeI18n CLI**: 确保系统 PATH 中有 `codei18n` 命令，或者知道其绝对路径。
    ```bash
    codei18n --version
    # 应输出版本号
    ```
2.  **准备测试项目**: 准备一个简单的 Go 项目，包含英文注释。

## 安装步骤

1.  获取 `codei18n-vscode-0.0.1.vsix` 安装包。
2.  在 VSCode 中，按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P`，输入 `Extensions: Install from VSIX...`。
3.  选择 `.vsix` 文件进行安装。
4.  (可选) 如果 `codei18n` 不在 PATH 中，打开设置搜索 `codei18n.cliPath` 并填入绝对路径。

## 验证流程 (Happy Path)

1.  **打开 Go 文件**:
    *   在 VSCode 中打开一个包含英文注释的 `.go` 文件。
    *   示例代码:
        ```go
        package main

        // This is a main function
        func main() {
            // Print hello world
            fmt.Println("Hello")
        }
        ```

2.  **观察翻译**:
    *   等待约 1 秒。
    *   确认 `// This is a main function` 在视觉上变为 `// 这是一个主函数` (或其他翻译内容，取决于 codei18n 的映射)。
    *   确认 `// Print hello world` 变为对应的中文。

3.  **验证悬停 (Hover)**:
    *   将鼠标悬停在 `// 这是一个主函数` 上。
    *   确认出现悬停提示框。
    *   确认提示框内容显示 `This is a main function`。

4.  **验证文件未修改**:
    *   右键点击文件标签页 -> "Reveal in Finder/Explorer"。
    *   用文本编辑器（非 VSCode）打开该文件。
    *   确认文件内容仍然是英文注释。

## 常见问题排查

*   **没有显示翻译**:
    *   检查输出面板: View -> Output -> 选择 "CodeI18n"。是否有报错信息？
    *   检查 `codei18n` 是否配置正确。
*   **显示乱码**:
    *   确认 `codei18n` CLI 输出的 JSON 编码是否为 UTF-8。
