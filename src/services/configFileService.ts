import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigManager } from '../configuration/configManager';

interface TranslationConfig {
    baseUrl?: string;
    model: string;
    apiKey?: string;
}

interface CodeI18nConfig {
    sourceLanguage?: string;
    localLanguage: string;
    excludePatterns?: string[];
    translationProvider: string;
    translationConfig: TranslationConfig;
    commitLanguage?: string;
}

export class ConfigFileService {
    private configPath: string;

    constructor() {
        this.configPath = path.join(os.homedir(), '.codei18n', 'config.json');
    }

    public async syncConfig(configManager: ConfigManager): Promise<void> {
        try {
            let currentConfig: CodeI18nConfig = {
                localLanguage: 'zh-CN',
                translationProvider: 'openai',
                translationConfig: {
                    model: 'gpt-3.5-turbo'
                }
            };
            
            if (fs.existsSync(this.configPath)) {
                const content = fs.readFileSync(this.configPath, 'utf8');
                try {
                    currentConfig = JSON.parse(content);
                } catch (e) {
                    console.error('Failed to parse existing config file', e);
                }
            } else {
                // Ensure directory exists
                const dir = path.dirname(this.configPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
            }

            // Update with values from VSCode config
            currentConfig.localLanguage = configManager.getTargetLanguage();
            currentConfig.translationProvider = configManager.getTranslationProvider();
            currentConfig.commitLanguage = configManager.getGitCommitLanguage();
            
            if (!currentConfig.translationConfig) {
                currentConfig.translationConfig = {
                    model: configManager.getTranslationModel()
                };
            }
            
            currentConfig.translationConfig.model = configManager.getTranslationModel();
            
            const baseUrl = configManager.getTranslationBaseUrl();
            if (baseUrl) {
                currentConfig.translationConfig.baseUrl = baseUrl;
            }
            
            const apiKey = configManager.getTranslationApiKey();
            if (apiKey) {
                currentConfig.translationConfig.apiKey = apiKey;
            }

            fs.writeFileSync(this.configPath, JSON.stringify(currentConfig, null, 2), 'utf8');
            console.log('Config synced to ' + this.configPath);
        } catch (error) {
            console.error('Failed to sync config file:', error);
        }
    }
}
