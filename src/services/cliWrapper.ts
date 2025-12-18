import * as cp from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigManager } from '../configuration/configManager';
import { ScanOutput } from '../types';

export class CliWrapper {
    constructor(private configManager: ConfigManager) {}

    public async scan(filePath: string, content: string): Promise<ScanOutput> {
        const cliPath = this.configManager.getCliPath();
        
        const workspaceFolder = this.getWorkspaceFolder();
        // Calculate relative path, CLI expects file paths relative to project root directory
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
                cwd: workspaceFolder
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

    public async convertDirectory(options: { toLanguage: string; directory?: string }): Promise<void> {
        const cliPath = this.configManager.getCliPath();
        const workspaceFolder = this.getWorkspaceFolder();
        const targetDirectory = options.directory ?? workspaceFolder;

        const args = [
            'convert',
            '-to',
            options.toLanguage,
            '-d',
            targetDirectory
        ];

        await this.spawnAndWait(cliPath, args, workspaceFolder);
    }

    public async initializeProject(): Promise<void> {
        const cliPath = this.configManager.getCliPath();
        const workspaceFolder = this.getWorkspaceFolder();

        const args = ['init'];

        await this.spawnAndWait(cliPath, args, workspaceFolder);
    }

    private getWorkspaceFolder(): string {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            throw new Error('No workspace folder found. Please open a folder first.');
        }
        return workspaceFolder;
    }

    private async spawnAndWait(cliPath: string, args: string[], cwd: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const child = cp.spawn(cliPath, args, { cwd });
            let stderr = '';

            if (child.stderr) {
                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            }

            child.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`codei18n process exited with code ${code}: ${stderr}`));
                    return;
                }
                resolve();
            });

            child.on('error', (err) => {
                reject(new Error(`Failed to spawn codei18n: ${err.message}`));
            });
        });
    }
}
