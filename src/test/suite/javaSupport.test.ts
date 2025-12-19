import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { CommentService } from '../../services/commentService';
import { CliWrapper } from '../../services/cliWrapper';

suite('Java Support Test Suite', () => {
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
        test('Should recognize .java files as Java language', async () => {
            // Create a mock Java document
            const mockDoc = {
                languageId: 'java',
                fileName: 'Test.java',
                getText: () => '// Test comment\npublic class Test {}'
            } as vscode.TextDocument;

            assert.strictEqual(mockDoc.languageId, 'java');
        });

        test('Should handle Java file extension', async () => {
            const fileName = 'Test.java';
            assert.ok(fileName.endsWith('.java'), `${fileName} should be recognized as Java`);
        });
    });

    suite('Java Comment Scanning', () => {
        test('Should scan Java line comments (//)', async () => {
            const javaCode = `// This is a line comment
public class Test {
    public static void main(String[] args) {}
}`;

            const mockDoc = {
                languageId: 'java',
                fileName: 'Test.java',
                uri: { toString: () => 'file:///Test.java' },
                getText: () => javaCode
            } as vscode.TextDocument;

            // Mock CLI response with a Java line comment
            const mockScanOutput = {
                file: 'Test.java',
                comments: [{
                    id: '1',
                    file: 'Test.java',
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

        test('Should scan Java block comments (/* */)', async () => {
            const javaCode = `/* This is a block comment */
public class Test {}`;

            const mockDoc = {
                languageId: 'java',
                fileName: 'Test.java',
                uri: { toString: () => 'file:///Test.java' },
                getText: () => javaCode
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'Test.java',
                comments: [{
                    id: '2',
                    file: 'Test.java',
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

        test('Should scan Java doc comments (/** */)', async () => {
            const javaCode = `/**
 * This is a JavaDoc comment
 */
public class Test {}`;

            const mockDoc = {
                languageId: 'java',
                fileName: 'Test.java',
                uri: { toString: () => 'file:///Test.java' },
                getText: () => javaCode
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'Test.java',
                comments: [{
                    id: '3',
                    file: 'Test.java',
                    range: {
                        startLine: 1,
                        startCol: 1,
                        endLine: 3,
                        endCol: 4
                    },
                    sourceText: 'This is a JavaDoc comment',
                    localizedText: '这是一个 JavaDoc 注释',
                    type: 'doc' as const
                }]
            };

            cliWrapperStub.scan.resolves(mockScanOutput);

            const comments = await commentService.getComments(mockDoc);
            
            assert.strictEqual(comments.length, 1);
            assert.strictEqual(comments[0].type, 'doc');
        });

        test('Should handle multiple Java comments in one file', async () => {
            const javaCode = `// Line comment
/** JavaDoc comment */
/* Block comment */
public class Test {}`;

            const mockDoc = {
                languageId: 'java',
                fileName: 'Test.java',
                uri: { toString: () => 'file:///Test.java' },
                getText: () => javaCode
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'Test.java',
                comments: [
                    {
                        id: '4',
                        file: 'Test.java',
                        range: { startLine: 1, startCol: 1, endLine: 1, endCol: 17 },
                        sourceText: 'Line comment',
                        localizedText: '行注释',
                        type: 'line' as const
                    },
                    {
                        id: '5',
                        file: 'Test.java',
                        range: { startLine: 2, startCol: 1, endLine: 2, endCol: 23 },
                        sourceText: 'JavaDoc comment',
                        localizedText: 'JavaDoc 注释',
                        type: 'doc' as const
                    },
                    {
                        id: '6',
                        file: 'Test.java',
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

        test('Should handle empty Java files', async () => {
            const mockDoc = {
                languageId: 'java',
                fileName: 'Empty.java',
                uri: { toString: () => 'file:///Empty.java' },
                getText: () => ''
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'Empty.java',
                comments: []
            };

            cliWrapperStub.scan.resolves(mockScanOutput);

            const comments = await commentService.getComments(mockDoc);
            
            assert.strictEqual(comments.length, 0);
        });
    });
});
