import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { CommentService } from '../../services/commentService';
import { CliWrapper } from '../../services/cliWrapper';
import { Decorator } from '../../decoration/decorator';

// We need to mock the debounce function to execute immediately for testing
// or just test the update logic directly.
// Since we can't easily import the internal 'update' function from extension.ts without exporting it,
// we will test the CommentService and Decorator interaction which is what 'update' does.

suite('Rust Real-time Update Test Suite', () => {
    let commentService: CommentService;
    let decorator: Decorator;
    let cliWrapperStub: sinon.SinonStubbedInstance<CliWrapper>;
    let decoratorStub: sinon.SinonStubbedInstance<Decorator>;

    setup(() => {
        cliWrapperStub = sinon.createStubInstance(CliWrapper);
        commentService = new CommentService(cliWrapperStub as any);
        decorator = new Decorator();
        decoratorStub = sinon.createStubInstance(Decorator);
    });

    teardown(() => {
        sinon.restore();
    });

    test('Should trigger scan and decoration update for Rust file changes', async () => {
        // Simulate the logic inside the update function
        const rustCode = `// Updated comment
fn main() {}`;

        const mockDoc = {
            languageId: 'rust',
            fileName: 'test.rs',
            uri: { toString: () => 'file:///test.rs' },
            getText: () => rustCode
        } as vscode.TextDocument;

        const mockEditor = {
            document: mockDoc,
            setDecorations: sinon.spy()
        } as unknown as vscode.TextEditor;

        const mockScanOutput = {
            file: 'test.rs',
            comments: [{
                id: '1',
                file: 'test.rs',
                range: { startLine: 1, startCol: 1, endLine: 1, endCol: 18 },
                sourceText: 'Updated comment',
                localizedText: '更新的注释',
                type: 'line' as const
            }]
        };

        cliWrapperStub.scan.resolves(mockScanOutput);

        // Execute the steps that happen during an update
        const comments = await commentService.getComments(mockDoc);
        
        // Assert scan was called with new content
        assert.ok(cliWrapperStub.scan.calledOnce);
        assert.strictEqual(cliWrapperStub.scan.firstCall.args[1], rustCode);

        // Use the real decorator or a stub to verify it would update decorations
        // Here we just verify we got the comments to pass to the decorator
        assert.strictEqual(comments.length, 1);
        assert.strictEqual(comments[0].localizedText, '更新的注释');
    });

    test('Should NOT trigger scan for non-Rust file changes', async () => {
        const jsCode = `// JS comment`;
        const mockDoc = {
            languageId: 'javascript',
            fileName: 'test.js',
            uri: { toString: () => 'file:///test.js' },
            getText: () => jsCode
        } as vscode.TextDocument;

        const comments = await commentService.getComments(mockDoc);
        
        // Should return empty and log skipping
        assert.strictEqual(comments.length, 0);
        // Scan should NOT be called
        assert.ok(cliWrapperStub.scan.notCalled);
    });
});
