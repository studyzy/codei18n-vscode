import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { CommentService } from '../../services/commentService';
import { CliWrapper } from '../../services/cliWrapper';

suite('Rust Support Test Suite', () => {
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
        test('Should recognize .rs files as Rust language', async () => {
            // Create a mock Rust document
            const mockDoc = {
                languageId: 'rust',
                fileName: 'test.rs',
                getText: () => '// Test comment\nfn main() {}'
            } as vscode.TextDocument;

            assert.strictEqual(mockDoc.languageId, 'rust');
        });

        test('Should handle multiple Rust file extensions', async () => {
            const rustExtensions = ['.rs'];
            rustExtensions.forEach(ext => {
                const fileName = `test${ext}`;
                assert.ok(fileName.endsWith('.rs'), `${fileName} should be recognized as Rust`);
            });
        });
    });

    suite('Rust Comment Scanning', () => {
        test('Should scan Rust line comments (//)', async () => {
            const rustCode = `// This is a line comment
fn main() {
    println!("Hello");
}`;

            const mockDoc = {
                languageId: 'rust',
                fileName: 'test.rs',
                uri: { toString: () => 'file:///test.rs' },
                getText: () => rustCode
            } as vscode.TextDocument;

            // Mock CLI response with a Rust line comment
            const mockScanOutput = {
                file: 'test.rs',
                comments: [{
                    id: '1',
                    file: 'test.rs',
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

        test('Should scan Rust block comments (/* */)', async () => {
            const rustCode = `/* This is a block comment */
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
                    id: '2',
                    file: 'test.rs',
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

        test('Should scan Rust doc comments (///)', async () => {
            const rustCode = `/// This is a doc comment
fn add(a: i32, b: i32) -> i32 {
    a + b
}`;

            const mockDoc = {
                languageId: 'rust',
                fileName: 'test.rs',
                uri: { toString: () => 'file:///test.rs' },
                getText: () => rustCode
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'test.rs',
                comments: [{
                    id: '3',
                    file: 'test.rs',
                    range: {
                        startLine: 1,
                        startCol: 1,
                        endLine: 1,
                        endCol: 27
                    },
                    sourceText: 'This is a doc comment',
                    localizedText: '这是一个文档注释',
                    type: 'doc' as const
                }]
            };

            cliWrapperStub.scan.resolves(mockScanOutput);

            const comments = await commentService.getComments(mockDoc);
            
            assert.strictEqual(comments.length, 1);
            assert.strictEqual(comments[0].type, 'doc');
        });

        test('Should scan Rust inner doc comments (//!)', async () => {
            const rustCode = `//! This is an inner doc comment
mod test {}`;

            const mockDoc = {
                languageId: 'rust',
                fileName: 'test.rs',
                uri: { toString: () => 'file:///test.rs' },
                getText: () => rustCode
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'test.rs',
                comments: [{
                    id: '4',
                    file: 'test.rs',
                    range: {
                        startLine: 1,
                        startCol: 1,
                        endLine: 1,
                        endCol: 34
                    },
                    sourceText: 'This is an inner doc comment',
                    localizedText: '这是一个内部文档注释',
                    type: 'doc' as const
                }]
            };

            cliWrapperStub.scan.resolves(mockScanOutput);

            const comments = await commentService.getComments(mockDoc);
            
            assert.strictEqual(comments.length, 1);
        });

        test('Should handle multiple Rust comments in one file', async () => {
            const rustCode = `// Line comment
/// Doc comment
/* Block comment */
fn main() {}`;

            const mockDoc = {
                languageId: 'rust',
                fileName: 'test.rs',
                uri: { toString: () => 'file:///test.rs' },
                getText: () => rustCode
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'test.rs',
                comments: [
                    {
                        id: '5',
                        file: 'test.rs',
                        range: { startLine: 1, startCol: 1, endLine: 1, endCol: 17 },
                        sourceText: 'Line comment',
                        localizedText: '行注释',
                        type: 'line' as const
                    },
                    {
                        id: '6',
                        file: 'test.rs',
                        range: { startLine: 2, startCol: 1, endLine: 2, endCol: 17 },
                        sourceText: 'Doc comment',
                        localizedText: '文档注释',
                        type: 'doc' as const
                    },
                    {
                        id: '7',
                        file: 'test.rs',
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

        test('Should handle empty Rust files', async () => {
            const mockDoc = {
                languageId: 'rust',
                fileName: 'empty.rs',
                uri: { toString: () => 'file:///empty.rs' },
                getText: () => ''
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'empty.rs',
                comments: []
            };

            cliWrapperStub.scan.resolves(mockScanOutput);

            const comments = await commentService.getComments(mockDoc);
            
            assert.strictEqual(comments.length, 0);
        });

        test('Should handle Rust files with no comments', async () => {
            const rustCode = `fn main() {
    println!("No comments here");
}`;

            const mockDoc = {
                languageId: 'rust',
                fileName: 'nocomments.rs',
                uri: { toString: () => 'file:///nocomments.rs' },
                getText: () => rustCode
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'nocomments.rs',
                comments: []
            };

            cliWrapperStub.scan.resolves(mockScanOutput);

            const comments = await commentService.getComments(mockDoc);
            
            assert.strictEqual(comments.length, 0);
        });
    });

    suite('Rust Edge Cases', () => {
        test('Should handle Rust macros with comments', async () => {
            const rustCode = `// Macro comment
#[derive(Debug)]
struct Point { x: i32 }`;

            const mockDoc = {
                languageId: 'rust',
                fileName: 'macro.rs',
                uri: { toString: () => 'file:///macro.rs' },
                getText: () => rustCode
            } as vscode.TextDocument;

            const mockScanOutput = {
                file: 'macro.rs',
                comments: [{
                    id: '8',
                    file: 'macro.rs',
                    range: { startLine: 1, startCol: 1, endLine: 1, endCol: 18 },
                    sourceText: 'Macro comment',
                    localizedText: '宏注释',
                    type: 'line' as const
                }]
            };

            cliWrapperStub.scan.resolves(mockScanOutput);

            const comments = await commentService.getComments(mockDoc);
            
            assert.strictEqual(comments.length, 1);
        });

        test('Should handle Rust string literals with // inside', async () => {
            // Strings containing "//" should not be treated as comments
            const rustCode = `fn main() {
    let s = "This is not // a comment";
}`;

            const mockDoc = {
                languageId: 'rust',
                fileName: 'string.rs',
                uri: { toString: () => 'file:///string.rs' },
                getText: () => rustCode
            } as vscode.TextDocument;

            // CLI should not return comments for string content
            const mockScanOutput = {
                file: 'string.rs',
                comments: []
            };

            cliWrapperStub.scan.resolves(mockScanOutput);

            const comments = await commentService.getComments(mockDoc);
            
            assert.strictEqual(comments.length, 0);
        });
    });
});
