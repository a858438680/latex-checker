// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import OpenAI from 'openai';
import * as path from 'path';
import * as fs from 'fs'; // Or preferably fs.promises
import { v4 as uuidv4 } from 'uuid';

class TempContentProvider implements vscode.TextDocumentContentProvider {
	temporaryContentStore: Map<string, string>;

	constructor() {
		this.temporaryContentStore = new Map<string, string>();
	}
	// Optional event emitter (useful if content can change dynamically)
	// private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	// readonly onDidChange = this._onDidChange.event;
	provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
		console.log(`Providing content for ID: ${uri.path}`);
		// Retrieve the content from our store
		const content = this.temporaryContentStore.get(uri.path);
		if (content !== undefined) {
			return content;
		} else {
			// Handle cases where the content isn't found (e.g., closed diff)
			console.log(this.temporaryContentStore);
			console.error(`Temporary content not found for ID: ${uri.path}`);
			return `Error: Content for temporary diff '${uri.path}' not found.`;
		}
	}

	set(uri: vscode.Uri, value: string) {
		console.log(`Setting content for ID: ${uri.path}`);
		this.temporaryContentStore.set(uri.path, value);
		console.log(this.temporaryContentStore);
	}
	// Optional: Method to signal that content has changed (if needed)
	// update(uri: vscode.Uri) {
	//     this._onDidChange.fire(uri);
	// }
}

interface Correction {
	original: string;
	reason: string;
	corrected: string;
}

export function parseCorrections(text: string): Correction[] {
	const results: Correction[] = [];
	let currentIndex = 0; // Position in the string to start searching from
	const originalStartTag = '<original>';
	const originalEndTag = '</original>';
	const reasonStartTag = '<reason>';
	const reasonEndTag = '</reason>';
	const correctedStartTag = '<corrected>';
	const correctedEndTag = '</corrected>';
	while (currentIndex < text.length) {
		// 1. Find the start of the <original> tag
		const originalTagStartIndex = text.indexOf(originalStartTag, currentIndex);
		if (originalTagStartIndex === -1) {
			// No more <original> tags found, we're done
			break;
		}
		// 2. Find the end of the <original> tag to get the content start position
		const originalContentStartIndex = originalTagStartIndex + originalStartTag.length;
		// 3. Find the start of the </original> tag
		const originalTagEndIndex = text.indexOf(originalEndTag, originalContentStartIndex);
		if (originalTagEndIndex === -1) {
			console.error("Malformed input: Missing </original> tag after index", originalContentStartIndex);
			break; // Stop parsing if structure is broken
		}
		// 4. Extract the original content
		const originalText = text.slice(originalContentStartIndex, originalTagEndIndex).trim();
		// 5. Find where to start searching for <reason> (after </original>)
		const reasonSearchStartIndex = originalTagEndIndex + originalEndTag.length;
		// 6. Find the start of the <reason> tag
		const reasonTagStartIndex = text.indexOf(reasonStartTag, reasonSearchStartIndex);
		if (reasonTagStartIndex === -1) {
			console.error("Malformed input: Missing <reason> tag after index", reasonSearchStartIndex);
			break;
		}
		// 7. Find the end of the <reason> tag
		const reasonContentStartIndex = reasonTagStartIndex + reasonStartTag.length;
		// 8. Find the start of the </reason> tag
		const reasonTagEndIndex = text.indexOf(reasonEndTag, reasonContentStartIndex);
		if (reasonTagEndIndex === -1) {
			console.error("Malformed input: Missing </reason> tag after index", reasonContentStartIndex);
			break;
		}
		// 9. Extract the reason content
		const reasonText = text.slice(reasonContentStartIndex, reasonTagEndIndex).trim();
		// 10. Find where to start searching for <corrected> (after </reason>)
		const correctedSearchStartIndex = reasonTagEndIndex + reasonEndTag.length;
		// 11. Find the start of the <corrected> tag
		const correctedTagStartIndex = text.indexOf(correctedStartTag, correctedSearchStartIndex);
		if (correctedTagStartIndex === -1) {
			console.error("Malformed input: Missing <corrected> tag after index", correctedSearchStartIndex);
			break;
		}
		// 12. Find the end of the <corrected> tag
		const correctedContentStartIndex = correctedTagStartIndex + correctedStartTag.length;
		// 13. Find the start of the </corrected> tag
		const correctedTagEndIndex = text.indexOf(correctedEndTag, correctedContentStartIndex);
		if (correctedTagEndIndex === -1) {
			console.error("Malformed input: Missing </corrected> tag after index", correctedContentStartIndex);
			break;
		}
		// 14. Extract the corrected content
		const correctedText = text.slice(correctedContentStartIndex, correctedTagEndIndex).trim();
		// 15. Add the extracted data to results
		results.push({
			original: originalText,
			reason: reasonText,
			corrected: correctedText,
		});
		// 16. Update the current index to search for the *next* <original> tag
		// Start searching after the current </corrected> tag
		currentIndex = correctedTagEndIndex + correctedEndTag.length;
	}
	return results;
}

function applyCorrections(originalText: string, corrections: Correction[]): string {
	// Start with the original text. We will modify this string iteratively.
	let modifiedText = originalText;
	// Loop through each correction object in the provided array
	for (const correction of corrections) {
		const originalSegment = correction.original;
		const correctedSegment = correction.corrected;
		// Use String.prototype.replace()
		// This method finds the *first* occurrence of 'originalSegment'
		// in the current 'modifiedText' and replaces it with 'correctedSegment'.
		// It returns a *new* string with the replacement made.
		// Importantly, it does NOT modify the string in place, hence the reassignment.
		const indexOfOriginal = modifiedText.indexOf(originalSegment);
		if (indexOfOriginal !== -1) {
			// Replace the first occurrence found
			modifiedText = modifiedText.replace(originalSegment, correctedSegment);
		} else {
			// Optional: Log a warning if a specific original segment wasn't found.
			// This might indicate an issue with the input data or expectations.
			console.warn(`Warning: Could not find the original segment to replace: "${originalSegment}"`);
			// Decide if you want to stop processing or just skip this correction.
			// Current implementation skips the correction.
		}
	}
	// Return the final text after all replacements have been attempted.
	return modifiedText;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration('latex-checker');
	let temperature = config.get<number>('temperature');
	if (!temperature) {
		temperature = 1;
	}
	let top_p = config.get<number>('top-p');
	if (!top_p) {
		top_p = 1;
	}
	let base_url = config.get<string>('openai.base_url');
	if (!base_url || base_url === "") {
		base_url = 'https://api.openai.com';
	}
	let api_key = config.get<string>('openai.api_key');
	if (!api_key || api_key === "") {
		api_key = undefined;
	}
	const model_name = config.get<string>('openai.model');
	if (!model_name || model_name === "") {
		vscode.window.showErrorMessage("Model name is not configured!");
		return;
	}
	console.log(temperature);
	console.log(top_p);
	console.log(base_url);
	console.log(api_key);
	console.log(model_name);

	const openai = new OpenAI({
		baseURL: base_url,
		apiKey: api_key,
	});


	const extensionPath = context.extensionPath;
	const promptFilePath = path.join(extensionPath, 'assets', 'system_prompt.txt');
	const provider = new TempContentProvider();
	// IMPORTANT: Add the registration to subscriptions for proper disposal on deactivation
	const scheme = 'latex-checker-temp'; // Your unique scheme
	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(scheme, provider)
	);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('latex-checker.checkGrammer', async () => {

		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showWarningMessage('No active editor found.');
			return;
		}
		const originalUri = editor.document.uri;
		const suggestedUuid = uuidv4();
		const suggestedUri = vscode.Uri.from({ scheme: scheme, path: suggestedUuid });
		console.log(suggestedUri);
		const originalText = editor.document.getText();

		const systemPrompt = await fs.promises.readFile(promptFilePath, 'utf8');
		console.log('Getting response from LLM');

		let completion = undefined;
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			title: "Checking LaTeX grammer...",
			cancellable: false
		}, async (progress) => {
			progress.report({ message: "Sending to LLM..." });
			completion = await openai.chat.completions.create({
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: originalText }
				],
				model: model_name,
				temperature: temperature,
				top_p: top_p
			}).catch(async (err) => {
				if (err instanceof OpenAI.APIError) {
					console.log(err.request_id);
					console.log(err.status); // 400
					console.log(err.name); // BadRequestError
					console.log(err.headers); // {server: 'nginx', ...}
				}
				throw err;
			});
	
			console.log('Got response from LLM');
			console.log(completion);
			const completion_any = completion as any;
			console.log(completion_any.error);
			if (completion_any.error !== undefined) {
				const err = completion_any.error;
				if (err.message === 'Provider returned error') {
					console.log(JSON.parse(err.metadata.raw));
					vscode.window.showErrorMessage(JSON.parse(err.metadata.raw).message);
				} else {
					vscode.window.showErrorMessage(err.message);
				}
				return;
			}
			const response = completion.choices[0].message.content;
			
			progress.report({ message: "Parsing results..." });
			if (response === null) {
				vscode.window.showWarningMessage('LLM did not response.');
				return;
			}
			const corrections = parseCorrections(response);
			const suggestedText = applyCorrections(originalText, corrections);
			provider.set(suggestedUri, suggestedText);
			vscode.commands.executeCommand('vscode.diff',
				suggestedUri,
				originalUri,
				`Grammar Suggestion ↔ Original`
			);
		});
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
