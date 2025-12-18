import * as vscode from 'vscode';
import { Comment } from '../types';

export class Decorator {
    // Create a decorator type that hides the original comment and displays the translation in front
    private translationDecorationType = vscode.window.createTextEditorDecorationType({
        // Make the original text invisible and not take up space
        opacity: '0',
        letterSpacing: '-1000px', // Set the letter-spacing to an extremely negative value, compressing the text until it is almost invisible
    });

    /**
     * Applies decorations to the editor to display translated comments.
     * Hides the original comment text and displays the translation in its place.
     * 
     * @param editor - The text editor to apply decorations to
     * @param comments - List of comments with translations
     */
    public updateDecorations(editor: vscode.TextEditor, comments: Comment[]) {
        console.log(`[CodeI18n] Updating decorations for ${comments.length} comments`);
        
        const decorations: vscode.DecorationOptions[] = [];

        for (const comment of comments) {
            // Only process comments that have translations
            if (!comment.localizedText) {
                console.log(`[CodeI18n] Skipping comment without localizedText: ${comment.sourceText}`);
                continue;
            }

            console.log(`[CodeI18n] Adding decoration: "${comment.sourceText}" -> "${comment.localizedText}"`);

            // Note: The line and column numbers returned by the codei18n CLI are 1-indexed, while VSCode Position is 0-indexed
            const start = new vscode.Position(comment.range.startLine - 1, comment.range.startCol - 1);
            const end = new vscode.Position(comment.range.endLine - 1, comment.range.endCol - 1);
            const range = new vscode.Range(start, end);

            const decoration: vscode.DecorationOptions = {
                range: range,
                // Show original English comment on hover
                hoverMessage: new vscode.MarkdownString(`**原文:** ${comment.sourceText}`),
                renderOptions: {
                    // Add translation before the original text
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

    /**
     * Clears all translation decorations from the editor.
     * 
     * @param editor - The text editor to clear decorations from
     */
    public clearDecorations(editor: vscode.TextEditor) {
        editor.setDecorations(this.translationDecorationType, []);
    }
}