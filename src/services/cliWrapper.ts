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

        // 如果没有工作区（如测试环境或单文件模式），退化为使用文件所在目录作为工作目录，
        // 并直接使用传入的 filePath，这样既不依赖 VS Code 工作区，又能让 CLI 正常工作/被测试。
        const cwd = workspaceFolder ?? path.dirname(filePath);

        // 计算相对路径，CLI 期望相对于项目根目录的文件路径；如果没有工作区，则使用原始路径
        const relativePath = workspaceFolder ? path.relative(workspaceFolder, filePath) : filePath;
        
        const args = [
            'scan',
            '--file', relativePath,
            '--stdin',
            '--format', 'json',
            '--with-translations'
        ];

        return new Promise((resolve, reject) => {
            const child = cp.spawn(cliPath, args, {
                cwd  // 在工作区根目录或文件目录运行，以便找到 .codei18n 配置
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
