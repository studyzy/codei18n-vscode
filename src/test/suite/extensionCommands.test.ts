import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Commands Test Suite', () => {
    test('registers CodeI18n sidebar related commands', async function() {
        // Increase timeout for extension activation
        this.timeout(10000);
        
        const extension = vscode.extensions.getExtension('studyzy.codei18n-vscode');
        assert.ok(extension, 'Extension should be found');
        
        if (!extension.isActive) {
            await extension.activate();
        }
        
        // Wait a bit for commands to register
        await new Promise(resolve => setTimeout(resolve, 1000));

        const commands = await vscode.commands.getCommands(true);
        
        // Debug: print all codei18n commands
        const codei18nCommands = commands.filter(cmd => cmd.startsWith('codei18n'));
        console.log('Registered CodeI18n commands:', codei18nCommands);

        assert.ok(commands.includes('codei18n.initializeProject'), 'codei18n.initializeProject should be registered');
        assert.ok(commands.includes('codei18n.setLocalizationMode.display'), 'codei18n.setLocalizationMode.display should be registered');
        assert.ok(commands.includes('codei18n.setLocalizationMode.file'), 'codei18n.setLocalizationMode.file should be registered');
        assert.ok(commands.includes('codei18n.runFileLocalization'), 'codei18n.runFileLocalization should be registered');
        assert.ok(commands.includes('codei18n.runEnglishLocalization'), 'codei18n.runEnglishLocalization should be registered');
    });
});
