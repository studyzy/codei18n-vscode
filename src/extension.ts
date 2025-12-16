import * as vscode from 'vscode';
import { ConfigManager } from './configuration/configManager';
import { CliWrapper } from './services/cliWrapper';
import { CommentService } from './services/commentService';
import { Decorator } from './decoration/decorator';
import { debounce } from './utils/debounce';
import { TranslationHoverProvider } from './hover/translationHoverProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('CodeI18n active');

    const configManager = new ConfigManager();
    const cliWrapper = new CliWrapper(configManager);
    const commentService = new CommentService(cliWrapper);
    const decorator = new Decorator();

    if (!configManager.isEnabled()) {
        console.log('CodeI18n disabled via config');
        return;
    }

    // Core update logic
    const update = async (editor: vscode.TextEditor | undefined) => {
        if (!editor || editor.document.languageId !== 'go') {
            return;
        }
        
        // Scan
        const comments = await commentService.getComments(editor.document);
        
        // Decorate
        decorator.updateDecorations(editor, comments);
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

export function deactivate() {}
