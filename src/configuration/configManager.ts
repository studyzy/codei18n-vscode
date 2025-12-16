import * as vscode from 'vscode';

export class ConfigManager {
    private static readonly CONFIG_SECTION = 'codei18n';

    public getCliPath(): string {
        const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
        return config.get<string>('cliPath') || 'codei18n';
    }

    public isEnabled(): boolean {
        const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
        return config.get<boolean>('enable') ?? true;
    }

    public onDidChangeConfiguration(callback: (e: vscode.ConfigurationChangeEvent) => void): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration(ConfigManager.CONFIG_SECTION)) {
                callback(e);
            }
        });
    }
}
