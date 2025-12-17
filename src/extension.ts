import * as vscode from 'vscode';
import { ConfigManager } from './configuration/configManager';
import { CliWrapper } from './services/cliWrapper';
import { CommentService } from './services/commentService';
import { Decorator } from './decoration/decorator';
import { debounce } from './utils/debounce';
import { TranslationHoverProvider } from './hover/translationHoverProvider';

/**
 * Activates the CodeI18n VSCode extension.
 * Sets up comment translation services, decorators, and event listeners
 * for supported programming languages (Go, Rust).
 * 
 * @param context - The extension context provided by VSCode
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('CodeI18n active');

    const configManager = new ConfigManager();
    const cliWrapper = new CliWrapper(configManager);
    const commentService = new CommentService(cliWrapper);
    const decorator = new Decorator();

    // Supported programming languages for comment translation
    const supportedLanguages = ['go', 'rust'];

    if (!configManager.isEnabled()) {
        console.log('CodeI18n disabled via config');
        return;
    }

    // Core update logic
    /**
     * Updates comment translations for the active editor.
     * Scans the document for comments using the CLI tool and applies
     * decorations to display translations inline.
     * 
     * @param editor - The active text editor, or undefined if none
     */
    const update = async (editor: vscode.TextEditor | undefined) => {
        if (!editor) {
            console.log('[CodeI18n] No active editor');
            return;
        }
        if (!supportedLanguages.includes(editor.document.languageId)) {
            console.log(`[CodeI18n] Skipping unsupported file: ${editor.document.languageId}`);
            return;
        }
        
        console.log(`[CodeI18n] Processing file: ${editor.document.fileName}`);
        
        try {
            // Scan
            const comments = await commentService.getComments(editor.document);
            console.log(`[CodeI18n] Got ${comments.length} comments from CLI`);
            
            // Decorate
            decorator.updateDecorations(editor, comments);
        } catch (error) {
            console.error('[CodeI18n] Error during update:', error);
        }
    };

    // Events
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        update(activeEditor);
    }

    const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(editor => {
        update(editor);
    }, null, context.subscriptions);

    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(debounce(async event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            update(editor);
        }
    }, 500), null, context.subscriptions);

    // Hover Provider
    const hoverProvider = vscode.languages.registerHoverProvider('go', new TranslationHoverProvider(commentService));
    context.subscriptions.push(hoverProvider);

    // Register Rust Hover Provider
    const rustHoverProvider = vscode.languages.registerHoverProvider('rust', new TranslationHoverProvider(commentService));
    context.subscriptions.push(rustHoverProvider);

    // Commands
    const toggleCmd = vscode.commands.registerCommand('codei18n.toggle', async () => {
        // Implementation for toggle logic (update config)
        const config = vscode.workspace.getConfiguration('codei18n');
        const current = config.get<boolean>('enable');
        await config.update('enable', !current, true);
        vscode.window.showInformationMessage(`CodeI18n: ${!current ? 'Enabled' : 'Disabled'}`);
    });

    context.subscriptions.push(toggleCmd);
}

/**
 * Deactivates the CodeI18n extension.
 * Called when the extension is deactivated by VSCode.
 */
export function deactivate() {}
