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

    public getTranslationProvider(): string {
        const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
        return config.get<string>('translation.provider') || 'openai';
    }

    public getTranslationBaseUrl(): string | undefined {
        const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
        return config.get<string>('translation.baseUrl');
    }

    public getTranslationModel(): string {
        const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
        return config.get<string>('translation.model') || 'gpt-3.5-turbo';
    }

    public getTranslationApiKey(): string | undefined {
        const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
        return config.get<string>('translation.apiKey');
    }

    public getTargetLanguage(): string {
        const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
        return config.get<string>('targetLanguage') || 'zh-CN';
    }

    public getGitCommitLanguage(): string {
        const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
        return config.get<string>('git.commitLanguage') || 'en';
    }

    public getLocalizationMode(): 'display' | 'file' {
        const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
        const mode = config.get<string>('localizationMode') || 'display';
        return mode === 'file' ? 'file' : 'display';
    }

    public onDidChangeConfiguration(callback: (e: vscode.ConfigurationChangeEvent) => void): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration(ConfigManager.CONFIG_SECTION)) {
                callback(e);
            }
        });
    }
}
