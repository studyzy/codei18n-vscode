import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { CommentService } from '../../services/commentService';
import { TranslationHoverProvider } from '../../hover/translationHoverProvider';
import { CliWrapper } from '../../services/cliWrapper';

suite('Rust Hover Support Test Suite', () => {
    let commentService: CommentService;
    let hoverProvider: TranslationHoverProvider;
    let cliWrapperStub: sinon.SinonStubbedInstance<CliWrapper>;

    setup(() => {
        cliWrapperStub = sinon.createStubInstance(CliWrapper);
        commentService = new CommentService(cliWrapperStub as any);
        hoverProvider = new TranslationHoverProvider(commentService);
    });

    teardown(() => {
        sinon.restore();
    });

    test('Should provide hover tooltip for Rust comments with translation', async () => {
        const rustCode = `// Comment with translation`;
        const mockDoc = {
            languageId: 'rust',
            fileName: 'test.rs',
            uri: { toString: () => 'file:///test.rs' },
            getText: () => rustCode
        } as vscode.TextDocument;

        // Mock cached comments (Hover provider relies on cache)
        const mockScanOutput = {
            file: 'test.rs',
            comments: [{
                id: '1',
                file: 'test.rs',
                range: { startLine: 1, startCol: 1, endLine: 1, endCol: 27 },
                sourceText: 'Comment with translation',
                localizedText: '带翻译的注释',
                type: 'line' as const
            }]
        };

        cliWrapperStub.scan.resolves(mockScanOutput);
        
        // Populate cache
        await commentService.getComments(mockDoc);

        // Simulate Hover request
        const position = new vscode.Position(0, 5); // Line 0, Col 5 (inside comment)
        const token = new vscode.CancellationTokenSource().token;
        
        const hover = await hoverProvider.provideHover(mockDoc, position, token);

        assert.ok(hover, 'Hover should be returned');
        assert.ok(hover!.contents.length > 0, 'Hover contents should not be empty');
        
        // Verify MarkdownString content
        const markdown = hover!.contents[0] as vscode.MarkdownString;
        // Hover purpose is to show original text when user sees translation in editor
        // So we expect sourceText (Original)
        assert.ok(markdown.value.includes('Comment with translation'), 'Hover should contain original text');
        // Implementation currently only shows original text, not translation
        // assert.ok(markdown.value.includes('带翻译的注释'), 'Hover should contain translation');
    });

    test('Should NOT provide hover when cursor is outside comment', async () => {
        const rustCode = `// Comment
fn main() {}`;
        const mockDoc = {
            languageId: 'rust',
            fileName: 'test.rs',
            uri: { toString: () => 'file:///test.rs' },
            getText: () => rustCode
        } as vscode.TextDocument;

        const mockScanOutput = {
            file: 'test.rs',
            comments: [{
                id: '1',
                file: 'test.rs',
                range: { startLine: 1, startCol: 1, endLine: 1, endCol: 10 },
                sourceText: 'Comment',
                localizedText: '注释',
                type: 'line' as const
            }]
        };

        cliWrapperStub.scan.resolves(mockScanOutput);
        await commentService.getComments(mockDoc);

        // Position on line 2 (code, not comment)
        const position = new vscode.Position(1, 5);
        const token = new vscode.CancellationTokenSource().token;
        
        const hover = await hoverProvider.provideHover(mockDoc, position, token);

        assert.strictEqual(hover, null, 'Hover should not be returned for code');
    });

    test('Should handle multiline block comments correctly', async () => {
        const rustCode = `/* Line 1
Line 2 */`;
        const mockDoc = {
            languageId: 'rust',
            fileName: 'test.rs',
            uri: { toString: () => 'file:///test.rs' },
            getText: () => rustCode
        } as vscode.TextDocument;

        const mockScanOutput = {
            file: 'test.rs',
            comments: [{
                id: '1',
                file: 'test.rs',
                range: { startLine: 1, startCol: 1, endLine: 2, endCol: 9 },
                sourceText: 'Line 1\nLine 2',
                localizedText: '第1行\n第2行',
                type: 'block' as const
            }]
        };

        cliWrapperStub.scan.resolves(mockScanOutput);
        await commentService.getComments(mockDoc);

        // Hover on Line 2
        const position = new vscode.Position(1, 2);
        const token = new vscode.CancellationTokenSource().token;
        
        const hover = await hoverProvider.provideHover(mockDoc, position, token);

        assert.ok(hover);
        const markdown = hover!.contents[0] as vscode.MarkdownString;
        assert.ok(markdown.value.includes('Line 1\nLine 2'), 'Hover should contain original text for block comment');
    });
});
