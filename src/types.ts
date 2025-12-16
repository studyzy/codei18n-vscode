export interface CommentRange {
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
}

export interface Comment {
    id: string;
    file: string;
    range: CommentRange;
    sourceText: string;
    localizedText?: string;
    type: 'line' | 'block' | 'doc';
}

export interface ScanOutput {
    file: string;
    comments: Comment[];
}
