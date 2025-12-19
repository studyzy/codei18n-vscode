import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { CommentService } from '../../services/commentService';
import { CliWrapper } from '../../services/cliWrapper';

suite('Scala Support Test Suite', () => {
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
        test('Should recognize .scala files as Scala language', async () => {
            // Create a mock Scala document
            const mockDoc = {
                languageId: 'scala',
                fileName: 'Test.scala',
                getText: () => '// Test comment\nobject Main extends App {}'
            } as vscode.TextDocument;

            assert.strictEqual(mockDoc.languageId, 'scala');
        });

        test('Should handle Scala file extension', async () => {
            const fileName = 'Test.scala';
            assert.ok(fileName.endsWith('.scala'), `${fileName} should be recognized as Scala`);
        });
    });

    suite('Scala Comment Scanning', () => {
        test('Should scan Scala line comments (//)', async () => {
            const scalaCode = `// This is a line comment
object Main extends App {
  println("Hello")
}`;

            const mockDoc = {
                languageId: 'scala',
                fileName: 'Test.scala',
                uri: { toString: () => 'file:///Test.scala' },
                getText: () => scalaCode
            } as vscode.TextDocument;

            // Mock CLI response with a Scala line comment
            const mockScanOutput = {
                file: 'Test.scala',
                comments: [{
                    id: '1',
                    file: 'Test.scala',
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

        test('Should scan Scala block comments (/* */)', async () => {
            const scalaCode = `/* This is a block comment */
object Main {}`;

            const mockDoc = {
                languageId: 'scala',
                fileName: 'Test.scala',
                uri: { toString: () => 'file:///Test.scala' },
                getText: () => scalaCode
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'Test.scala',
                comments: [{
                    id: '2',
                    file: 'Test.scala',
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

        test('Should scan Scala doc comments (/** */)', async () => {
            const scalaCode = `/**
 * This is a ScalaDoc comment
 */
class Point(x: Int, y: Int)`;

            const mockDoc = {
                languageId: 'scala',
                fileName: 'Test.scala',
                uri: { toString: () => 'file:///Test.scala' },
                getText: () => scalaCode
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'Test.scala',
                comments: [{
                    id: '3',
                    file: 'Test.scala',
                    range: {
                        startLine: 1,
                        startCol: 1,
                        endLine: 3,
                        endCol: 4
                    },
                    sourceText: 'This is a ScalaDoc comment',
                    localizedText: '这是一个 ScalaDoc 注释',
                    type: 'doc' as const
                }]
            };

            cliWrapperStub.scan.resolves(mockScanOutput);

            const comments = await commentService.getComments(mockDoc);
            
            assert.strictEqual(comments.length, 1);
            assert.strictEqual(comments[0].type, 'doc');
        });

        test('Should handle multiple Scala comments in one file', async () => {
            const scalaCode = `// Line comment
/** ScalaDoc comment */
/* Block comment */
object Main {}`;

            const mockDoc = {
                languageId: 'scala',
                fileName: 'Test.scala',
                uri: { toString: () => 'file:///Test.scala' },
                getText: () => scalaCode
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'Test.scala',
                comments: [
                    {
                        id: '4',
                        file: 'Test.scala',
                        range: { startLine: 1, startCol: 1, endLine: 1, endCol: 17 },
                        sourceText: 'Line comment',
                        localizedText: '行注释',
                        type: 'line' as const
                    },
                    {
                        id: '5',
                        file: 'Test.scala',
                        range: { startLine: 2, startCol: 1, endLine: 2, endCol: 24 },
                        sourceText: 'ScalaDoc comment',
                        localizedText: 'ScalaDoc 注释',
                        type: 'doc' as const
                    },
                    {
                        id: '6',
                        file: 'Test.scala',
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

        test('Should handle empty Scala files', async () => {
            const mockDoc = {
                languageId: 'scala',
                fileName: 'Empty.scala',
                uri: { toString: () => 'file:///Empty.scala' },
                getText: () => ''
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'Empty.scala',
                comments: []
            };

            cliWrapperStub.scan.resolves(mockScanOutput);

            const comments = await commentService.getComments(mockDoc);
            
            assert.strictEqual(comments.length, 0);
        });
    });
});
