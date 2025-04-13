// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "latex-checker" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('latex-checker.checkGrammer', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from latex-checker!');

		const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found.');
            return;
        }
        const originalUri = editor.document.uri;
		const suggestedUri = vscode.Uri.parse(`untitled:${path.basename(originalUri.path)}.suggested.tex`);
		const originalText = editor.document.getText();
		const suggestedText = "hahahaha";

		// const suggestedDoc = await vscode.workspace.openTextDocument(suggestedUri);
		const edit = new vscode.WorkspaceEdit();
		edit.insert(suggestedUri, new vscode.Position(0, 0), suggestedText);
		await vscode.workspace.applyEdit(edit);
		await vscode.commands.executeCommand('vscode.diff',
			originalUri,
			suggestedUri,
			`Original ↔ Grammar Suggestion`
		);
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
