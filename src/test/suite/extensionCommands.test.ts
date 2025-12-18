import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Commands Test Suite', () => {
    test('registers CodeI18n sidebar related commands', async () => {
        const extension = vscode.extensions.getExtension('studyzy.codei18n-vscode');
        await extension?.activate();

        const commands = await vscode.commands.getCommands(true);

        assert.ok(commands.includes('codei18n.initializeProject'));
        assert.ok(commands.includes('codei18n.setLocalizationMode.display'));
        assert.ok(commands.includes('codei18n.setLocalizationMode.file'));
        assert.ok(commands.includes('codei18n.runFileLocalization'));
        assert.ok(commands.includes('codei18n.runEnglishLocalization'));
    });
});
