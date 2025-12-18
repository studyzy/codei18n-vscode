import * as vscode from 'vscode';
import { CliWrapper } from './cliWrapper';
import { Comment } from '../types';

export class CommentService {
    // Simple in-memory cache: document.uri.toString() -> Comment[]
    private cache: Map<string, Comment[]> = new Map();

    private hasShownError = false;

    constructor(private cliWrapper: CliWrapper) {}

    public async getComments(document: vscode.TextDocument): Promise<Comment[]> {
        const supportedLanguages = ['go', 'rust'];
        if (!supportedLanguages.includes(document.languageId)) {
            console.log(`[CodeI18n] CommentService: Skipping unsupported file: ${document.languageId}`);
            return [];
        }

        try {
            console.log(`[CodeI18n] CommentService: Scanning ${document.fileName}`);
            // Using relative path for CLI might be better if CLI expects it,
            // or absolute path. Let's send what document.fileName provides.
            const output = await this.cliWrapper.scan(document.fileName, document.getText());
            
            // Safely handle the comments array that may be null
            const comments = output.comments || [];
            console.log(`[CodeI18n] CommentService: Got ${comments.length} comments`);
            // Print the number of translated comments
            const withTranslation = comments.filter(c => c.localizedText).length;
            console.log(`[CodeI18n] CommentService: ${withTranslation} comments have localizedText`);
            
            this.cache.set(document.uri.toString(), comments);
            return comments;
        } catch (error: any) {
            console.error('Failed to scan comments:', error);
            
            if (!this.hasShownError) {
                this.hasShownError = true;
                const msg = `CodeI18n Scan Error: ${error.message || error}`;
                vscode.window.showErrorMessage(msg, 'Open Settings').then(selection => {
                    if (selection === 'Open Settings') {
                        vscode.commands.executeCommand('workbench.action.openSettings', 'codei18n.cliPath');
                    }
                });
            }

            // Return cached comments if available on error? Or empty?
            // For now, return empty array to avoid stale state issues.
            return [];
        }
    }

    public getCachedComments(document: vscode.TextDocument): Comment[] | undefined {
        return this.cache.get(document.uri.toString());
    }

    public clearCache(document: vscode.TextDocument) {
        this.cache.delete(document.uri.toString());
    }
}
