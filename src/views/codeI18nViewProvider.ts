import * as vscode from 'vscode';
import { ConfigManager } from '../configuration/configManager';

export class CodeI18nViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();

    private readonly configManager: ConfigManager;

    constructor(configManager?: ConfigManager) {
        this.configManager = configManager ?? new ConfigManager();
    }

    public readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> =
        this.onDidChangeTreeDataEmitter.event;

    public refresh(): void {
        this.onDidChangeTreeDataEmitter.fire();
    }

    public getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    public getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (element) {
            return Promise.resolve([]);
        }

        const items: vscode.TreeItem[] = [];

        const localizationMode = this.configManager.getLocalizationMode();
        const displayLabel = localizationMode === 'display' ? '显示本地化（当前）' : '显示本地化';
        const fileLabel = localizationMode === 'file' ? '文件内容本地化（当前）' : '文件内容本地化';

        items.push(this.createCommandItem('初始化本项目', 'codei18n.initializeProject'));
        items.push(this.createCommandItem(displayLabel, 'codei18n.setLocalizationMode.display'));
        items.push(this.createCommandItem(fileLabel, 'codei18n.setLocalizationMode.file'));
        items.push(this.createCommandItem('执行文件内容本地化', 'codei18n.runFileLocalization'));
        items.push(this.createCommandItem('英文化（恢复英文注释）', 'codei18n.runEnglishLocalization'));

        return Promise.resolve(items);
    }

    private createCommandItem(label: string, commandId: string): vscode.TreeItem {
        const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
        item.command = {
            command: commandId,
            title: label
        };
        return item;
    }
}
