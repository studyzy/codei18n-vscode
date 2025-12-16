import * as vscode from 'vscode';
import { Comment } from '../types';

export class Decorator {
    // We need a dynamic decoration type for the 'transparent' effect
    // But actually, we can use one type for transparency, and individual options for the text.
    private transparentType = vscode.window.createTextEditorDecorationType({
        color: 'transparent',
    });

    // We might need a separate type if we want to style the translated text differently globally
    // But we can pass style in renderOptions.
    
    // To make it look like a replacement:
    // 1. Decoration on range: color: transparent
    // 2. before: { contentText: translation, color: 'editorComment.foreground' }
    
    public updateDecorations(editor: vscode.TextEditor, comments: Comment[]) {
        const decorations: vscode.DecorationOptions[] = [];

        for (const comment of comments) {
            if (!comment.localizedText) {
                continue;
            }

            const start = new vscode.Position(comment.range.startLine - 1, comment.range.startCol - 1);
            const end = new vscode.Position(comment.range.endLine - 1, comment.range.endCol - 1);
            const range = new vscode.Range(start, end);

            const decoration: vscode.DecorationOptions = {
                range: range,
                renderOptions: {
                    before: {
                        contentText: comment.localizedText,
                        // Match comment color
                        color: new vscode.ThemeColor('editor.foreground'), // or 'comment'
                        // Make it obvious it's a translation? Maybe italic?
                        fontStyle: 'italic',
                        margin: `0 0 0 0` 
                    }
                }
            };
            
            // Note: If we use 'before', the text appears BEFORE the range.
            // If the range text is transparent, it effectively replaces it visually.
            // However, the original text still takes up space.
            // VSCode unfortunately doesn't support "collapsing" ranges (width: 0) easily via Decorator API.
            // So the original text will be an empty gap.
            // 
            // Alternative: Display translation ABOVE the line? (Block decoration)
            // But spec implies inline replacement.
            //
            // If we cannot collapse width, "Overlay" is hard.
            // Best approach for VSCode usually:
            // 1. Dim the original text (opacity: 0.2)
            // 2. Show translation next to it (after) or above it.
            //
            // Let's refine based on "Visual Replacement":
            // If we make text transparent, we see a gap.
            // If we put content in 'before', it fills the gap? No, it pushes.
            //
            // Let's stick to: Dim original + Append Translation (or Prepend).
            // OR: Just show translation in 'after' and dim original.
            //
            // Spec FR-003: "visually replace".
            // Since we can't delete text, maybe we just set `display: none`? VSCode API doesn't allow CSS injection.
            //
            // Compromise: Make original text very faint (opacity 0.1) and show translation after.
            // OR: Use `text-decoration: none; display: none;` in `textDecoration` property? 
            // VSCode prevents some CSS.
            //
            // Let's try: `color: transparent` + `before` content.
            // The original text space will remain.
            // 
            // Let's implement: Color Transparent + Before Content.
            
            decorations.push(decoration);
        }

        editor.setDecorations(this.transparentType, decorations);
    }
}
