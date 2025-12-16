import * as cp from 'child_process';
import * as vscode from 'vscode';
import { ConfigManager } from '../configuration/configManager';
import { ScanOutput } from '../types';

export class CliWrapper {
    constructor(private configManager: ConfigManager) {}

    public async scan(filePath: string, content: string): Promise<ScanOutput> {
        const cliPath = this.configManager.getCliPath();
        const args = [
            'scan',
            '--file', filePath,
            '--stdin',
            '--format', 'json',
            '--with-translations'
        ];

        return new Promise((resolve, reject) => {
            const child = cp.spawn(cliPath, args);
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
