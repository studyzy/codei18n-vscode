import * as cp from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigManager } from '../configuration/configManager';
import { ScanOutput } from '../types';

export class CliWrapper {
    constructor(private configManager: ConfigManager) {}

    public async scan(filePath: string, content: string): Promise<ScanOutput> {
        const cliPath = this.configManager.getCliPath();
        
        // 获取工作区根目录，CLI 需要在项目根目录运行以找到 .codei18n/mappings.json
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            throw new Error('No workspace folder found. Please open a folder first.');
        }
        
        // 计算相对路径，CLI 期望相对于项目根目录的文件路径
        const relativePath = path.relative(workspaceFolder, filePath);
        
        const args = [
            'scan',
            '--file', relativePath,
            '--stdin',
            '--format', 'json',
            '--with-translations'
        ];

        return new Promise((resolve, reject) => {
            const child = cp.spawn(cliPath, args, {
                cwd: workspaceFolder  // 在工作区根目录运行，以便找到 .codei18n 配置
            });
            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.stdin.write(content);
            child.stdin.end();

            child.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`codei18n process exited with code ${code}: ${stderr}`));
                    return;
                }

                try {
                    const output = JSON.parse(stdout) as ScanOutput;
                    resolve(output);
                } catch (e) {
                    reject(new Error(`Failed to parse JSON output: ${e}. Stdout: ${stdout}`));
                }
            });

            child.on('error', (err) => {
                 reject(new Error(`Failed to spawn codei18n: ${err.message}`));
            });
        });
    }
}
