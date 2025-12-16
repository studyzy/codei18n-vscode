import * as vscode from 'vscode';
import { CommentService } from '../services/commentService';

export class TranslationHoverProvider implements vscode.HoverProvider {
    constructor(private commentService: CommentService) {}

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const comments = this.commentService.getCachedComments(document);
        if (!comments) {
            return null;
        }

        // Find if position is within any comment range
        const hit = comments.find(c => {
            // Check lines
            // Range is 1-based in Comment, VSCode Position is 0-based
            const startLine = c.range.startLine - 1;
            const endLine = c.range.endLine - 1;
            const startCol = c.range.startCol - 1;
            const endCol = c.range.endCol - 1;

            if (position.line < startLine || position.line > endLine) {
                return false;
            }
            
            // If single line
            if (startLine === endLine) {
                return position.character >= startCol && position.character <= endCol;
            }

            // Multi-line
            if (position.line === startLine) {
                return position.character >= startCol;
            }
            if (position.line === endLine) {
                return position.character <= endCol;
            }
            
            return true;
        });

        if (hit && hit.localizedText) {
            // Show original text
            const md = new vscode.MarkdownString();
            md.appendCodeblock(hit.sourceText, 'go');
            md.appendMarkdown('**Original English Comment**');
            return new vscode.Hover(md);
        }

        return null;
    }
}
