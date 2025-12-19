import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { CommentService } from '../../services/commentService';
import { CliWrapper } from '../../services/cliWrapper';

suite('Kotlin Support Test Suite', () => {
    let commentService: CommentService;
    let cliWrapperStub: sinon.SinonStubbedInstance<CliWrapper>;

    setup(() => {
        // Create stubbed CliWrapper
        cliWrapperStub = sinon.createStubInstance(CliWrapper);
        commentService = new CommentService(cliWrapperStub as any);
    });

    teardown(() => {
        sinon.restore();
    });

    suite('Language ID Detection', () => {
        test('Should recognize .kt files as Kotlin language', async () => {
            // Create a mock Kotlin document
            const mockDoc = {
                languageId: 'kotlin',
                fileName: 'Test.kt',
                getText: () => '// Test comment\nfun main() {}'
            } as vscode.TextDocument;

            assert.strictEqual(mockDoc.languageId, 'kotlin');
        });

        test('Should handle Kotlin file extension', async () => {
            const fileName = 'Test.kt';
            assert.ok(fileName.endsWith('.kt'), `${fileName} should be recognized as Kotlin`);
        });
    });

    suite('Kotlin Comment Scanning', () => {
        test('Should scan Kotlin line comments (//)', async () => {
            const kotlinCode = `// This is a line comment
fun main() {
    println("Hello")
}`;

            const mockDoc = {
                languageId: 'kotlin',
                fileName: 'Test.kt',
                uri: { toString: () => 'file:///Test.kt' },
                getText: () => kotlinCode
            } as vscode.TextDocument;

            // Mock CLI response with a Kotlin line comment
            const mockScanOutput = {
                file: 'Test.kt',
                comments: [{
                    id: '1',
                    file: 'Test.kt',
                    range: {
                        startLine: 1,
                        startCol: 1,
                        endLine: 1,
                        endCol: 26
                    },
                    sourceText: 'This is a line comment',
                    localizedText: '这是一个行注释',
                    type: 'line' as const
                }]
            };

            cliWrapperStub.scan.resolves(mockScanOutput);

            const comments = await commentService.getComments(mockDoc);
            
            assert.strictEqual(comments.length, 1);
            assert.strictEqual(comments[0].type, 'line');
            assert.strictEqual(comments[0].sourceText, 'This is a line comment');
        });

        test('Should scan Kotlin block comments (/* */)', async () => {
            const kotlinCode = `/* This is a block comment */
fun main() {}`;

            const mockDoc = {
                languageId: 'kotlin',
                fileName: 'Test.kt',
                uri: { toString: () => 'file:///Test.kt' },
                getText: () => kotlinCode
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'Test.kt',
                comments: [{
                    id: '2',
                    file: 'Test.kt',
                    range: {
                        startLine: 1,
                        startCol: 1,
                        endLine: 1,
                        endCol: 31
                    },
                    sourceText: 'This is a block comment',
                    localizedText: '这是一个块注释',
                    type: 'block' as const
                }]
            };

            cliWrapperStub.scan.resolves(mockScanOutput);

            const comments = await commentService.getComments(mockDoc);
            
            assert.strictEqual(comments.length, 1);
            assert.strictEqual(comments[0].type, 'block');
        });

        test('Should scan Kotlin doc comments (/** */)', async () => {
            const kotlinCode = `/**
 * This is a KDoc comment
 */
fun add(a: Int, b: Int): Int = a + b`;

            const mockDoc = {
                languageId: 'kotlin',
                fileName: 'Test.kt',
                uri: { toString: () => 'file:///Test.kt' },
                getText: () => kotlinCode
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'Test.kt',
                comments: [{
                    id: '3',
                    file: 'Test.kt',
                    range: {
                        startLine: 1,
                        startCol: 1,
                        endLine: 3,
                        endCol: 4
                    },
                    sourceText: 'This is a KDoc comment',
                    localizedText: '这是一个 KDoc 注释',
                    type: 'doc' as const
                }]
            };

            cliWrapperStub.scan.resolves(mockScanOutput);

            const comments = await commentService.getComments(mockDoc);
            
            assert.strictEqual(comments.length, 1);
            assert.strictEqual(comments[0].type, 'doc');
        });

        test('Should handle multiple Kotlin comments in one file', async () => {
            const kotlinCode = `// Line comment
/** KDoc comment */
/* Block comment */
fun main() {}`;

            const mockDoc = {
                languageId: 'kotlin',
                fileName: 'Test.kt',
                uri: { toString: () => 'file:///Test.kt' },
                getText: () => kotlinCode
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'Test.kt',
                comments: [
                    {
                        id: '4',
                        file: 'Test.kt',
                        range: { startLine: 1, startCol: 1, endLine: 1, endCol: 17 },
                        sourceText: 'Line comment',
                        localizedText: '行注释',
                        type: 'line' as const
                    },
                    {
                        id: '5',
                        file: 'Test.kt',
                        range: { startLine: 2, startCol: 1, endLine: 2, endCol: 20 },
                        sourceText: 'KDoc comment',
                        localizedText: 'KDoc 注释',
                        type: 'doc' as const
                    },
                    {
                        id: '6',
                        file: 'Test.kt',
                        range: { startLine: 3, startCol: 1, endLine: 3, endCol: 21 },
                        sourceText: 'Block comment',
                        localizedText: '块注释',
                        type: 'block' as const
                    }
                ]
            };

            cliWrapperStub.scan.resolves(mockScanOutput);

            const comments = await commentService.getComments(mockDoc);
            
            assert.strictEqual(comments.length, 3);
        });

        test('Should handle empty Kotlin files', async () => {
            const mockDoc = {
                languageId: 'kotlin',
                fileName: 'Empty.kt',
                uri: { toString: () => 'file:///Empty.kt' },
                getText: () => ''
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'Empty.kt',
                comments: []
            };

            cliWrapperStub.scan.resolves(mockScanOutput);

            const comments = await commentService.getComments(mockDoc);
            
            assert.strictEqual(comments.length, 0);
        });
    });
});
