import * as vscode from 'vscode';
import { Comment } from '../types';

export class Decorator {
    // 创建一个装饰类型，将原始注释隐藏并在前面显示翻译
    private translationDecorationType = vscode.window.createTextEditorDecorationType({
        // 让原始文本不可见且不占空间
        opacity: '0',
        letterSpacing: '-1000px', // 将字母间距设为极大的负值，压缩文本到几乎不可见
    });

    public updateDecorations(editor: vscode.TextEditor, comments: Comment[]) {
        console.log(`[CodeI18n] Updating decorations for ${comments.length} comments`);
        
        const decorations: vscode.DecorationOptions[] = [];

        for (const comment of comments) {
            // 只处理有翻译的注释
            if (!comment.localizedText) {
                console.log(`[CodeI18n] Skipping comment without localizedText: ${comment.sourceText}`);
                continue;
            }

            console.log(`[CodeI18n] Adding decoration: "${comment.sourceText}" -> "${comment.localizedText}"`);

            // 注意：codei18n CLI 返回的行列号是 1-indexed，VSCode Position 是 0-indexed
            const start = new vscode.Position(comment.range.startLine - 1, comment.range.startCol - 1);
            const end = new vscode.Position(comment.range.endLine - 1, comment.range.endCol - 1);
            const range = new vscode.Range(start, end);

            const decoration: vscode.DecorationOptions = {
                range: range,
                // 悬停时显示原始英文注释
                hoverMessage: new vscode.MarkdownString(`**原文:** ${comment.sourceText}`),
                renderOptions: {
                    // 在原始文本前面添加翻译
                    before: {
                        contentText: comment.localizedText,
                        color: new vscode.ThemeColor('editorLineNumber.foreground'),
                        fontStyle: 'normal',
                    }
                }
            };
            
            decorations.push(decoration);
        }

        console.log(`[CodeI18n] Setting ${decorations.length} decorations`);
        editor.setDecorations(this.translationDecorationType, decorations);
    }

    public clearDecorations(editor: vscode.TextEditor) {
        editor.setDecorations(this.translationDecorationType, []);
    }
}