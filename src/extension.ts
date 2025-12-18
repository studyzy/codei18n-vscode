import * as vscode from 'vscode';
import { ConfigManager } from './configuration/configManager';
import { CliWrapper } from './services/cliWrapper';
import { CommentService } from './services/commentService';
import { Decorator } from './decoration/decorator';
import { debounce } from './utils/debounce';
import { TranslationHoverProvider } from './hover/translationHoverProvider';
import { ConfigFileService } from './services/configFileService';
import { CodeI18nViewProvider } from './views/codeI18nViewProvider';

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
    const configFileService = new ConfigFileService();
    
    // Sync configuration to ~/.codei18n/config.json
    configFileService.syncConfig(configManager);
    
    // Listen for configuration changes
    context.subscriptions.push(configManager.onDidChangeConfiguration(() => {
        configFileService.syncConfig(configManager);
    }));

    const cliWrapper = new CliWrapper(configManager);
    const commentService = new CommentService(cliWrapper);
    const decorator = new Decorator();

    const codeI18nViewProvider = new CodeI18nViewProvider();
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('codei18n.sidebar', codeI18nViewProvider)
    );
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
        const config = vscode.workspace.getConfiguration('codei18n');
        const current = config.get<boolean>('enable');
        await config.update('enable', !current, true);
        vscode.window.showInformationMessage(`CodeI18n: ${!current ? 'Enabled' : 'Disabled'}`);
    });

    const initializeProjectCmd = vscode.commands.registerCommand('codei18n.initializeProject', async () => {
        try {
            await cliWrapper.initializeProject();
            vscode.window.showInformationMessage('CodeI18n: 项目初始化完成');
        } catch (error: any) {
            vscode.window.showErrorMessage(`CodeI18n: 项目初始化失败: ${error.message ?? String(error)}`);
        }
    });

    const setDisplayModeCmd = vscode.commands.registerCommand('codei18n.setLocalizationMode.display', async () => {
        const config = vscode.workspace.getConfiguration('codei18n');
        await config.update('localizationMode', 'display', true);
        vscode.window.showInformationMessage('CodeI18n: 已切换为显示本地化模式（仅装饰，不修改文件）');
        codeI18nViewProvider.refresh();
    });

    const setFileModeCmd = vscode.commands.registerCommand('codei18n.setLocalizationMode.file', async () => {
        const config = vscode.workspace.getConfiguration('codei18n');
        await config.update('localizationMode', 'file', true);
        vscode.window.showInformationMessage('CodeI18n: 已切换为文件内容本地化模式（将修改源码注释）');
        codeI18nViewProvider.refresh();
    });

    const runFileLocalizationCmd = vscode.commands.registerCommand('codei18n.runFileLocalization', async () => {
        const confirmation = await vscode.window.showWarningMessage(
            '此操作将批量修改当前工作区中的注释文本为目标语言，建议先在 Git 中创建提交。是否继续？',
            { modal: true },
            '继续'
        );
        if (confirmation !== '继续') {
            return;
        }

        try {
            const targetLanguage = configManager.getTargetLanguage();
            await cliWrapper.convertDirectory({ toLanguage: targetLanguage });
            vscode.window.showInformationMessage(`CodeI18n: 文件内容本地化完成（目标语言：${targetLanguage}）`);
        } catch (error: any) {
            vscode.window.showErrorMessage(`CodeI18n: 文件内容本地化失败: ${error.message ?? String(error)}`);
        }
    });

    const runEnglishLocalizationCmd = vscode.commands.registerCommand('codei18n.runEnglishLocalization', async () => {
        const confirmation = await vscode.window.showWarningMessage(
            '此操作将尝试将当前工作区中的注释恢复为英文，建议先在 Git 中创建提交。是否继续？',
            { modal: true },
            '继续'
        );
        if (confirmation !== '继续') {
            return;
        }

        try {
            await cliWrapper.convertDirectory({ toLanguage: 'en' });
            vscode.window.showInformationMessage('CodeI18n: 英文化完成（已尝试恢复英文注释）');
        } catch (error: any) {
            vscode.window.showErrorMessage(`CodeI18n: 英文化失败: ${error.message ?? String(error)}`);
        }
    });

    context.subscriptions.push(
        toggleCmd,
        initializeProjectCmd,
        setDisplayModeCmd,
        setFileModeCmd,
        runFileLocalizationCmd,
        runEnglishLocalizationCmd
    );
}

/**
 * Deactivates the CodeI18n extension.
 * Called when the extension is deactivated by VSCode.
 */
export function deactivate() {}
