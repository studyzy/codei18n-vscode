import * as vscode from 'vscode';

export class DecorationTypes {
    // Style for the translated text (displayed after or overlaying)
    public static readonly translation = vscode.window.createTextEditorDecorationType({
        isWholeLine: false,
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        // Default style can be overridden by user settings later
    });

    // Style for hiding the original text (if we decide to use the 'overlay' strategy)
    // Currently, we'll stick to 'after' property for simplicity, or we can make the original text transparent
    // and overlay the translation.
    //
    // Strategy: Make original text transparent and show translation in 'before' or 'after' attachment?
    // Or just append translation? Spec says "visually replace".
    // Best way to visually replace:
    // 1. Color: transparent
    // 2. Before/After attachment with the translation content
    public static readonly hiddenText = vscode.window.createTextEditorDecorationType({
        color: 'transparent',
        textDecoration: 'none; display: inline-block; width: 0;', // Attempt to collapse width if possible, but transparent is safer
    });
}
