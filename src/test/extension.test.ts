import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as extension from '../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Response parse test', () => {
		const test_text = `After removing all comments from the input, I've analyzed the remaining text for grammatical errors. Here are the findings:

1. 
<original>
Recent studies have made it possible to integrate learning techniques into database systems for practical utilization.
</original>

<reason>
"Practical utilization" is grammatically correct but stylistically awkward. "Practical use" would be more natural in academic writing.
</reason>

<corrected>
Recent studies have made it possible to integrate learning techniques into database systems for practical use.
</corrected>

2. 
<original>
Specifically, We achieve 1.75x, 1.95x, 5.69x, and 2.74x speedups over the vanilla PostgreSQL on the JOB, STATS-CEB, TPC-DS, and DSB benchmarks, respectively.
</original>

<reason>
"We" should not be capitalized in the middle of a sentence unless it's the first word.
</reason>

<corrected>
Specifically, we achieve 1.75x, 1.95x, 5.69x, and 2.74x speedups over the vanilla PostgreSQL on the JOB, STATS-CEB, TPC-DS, and DSB benchmarks, respectively.
</corrected>

3. 
<original>
\sysname{} is 1.74x, 1.87x, 1.66x, and 2.28x faster than the state-of-the-art competitor Lero on these benchmarks.
</original>

<reason>
"State-of-the-art" should be hyphenated when used as a compound adjective before a noun.
</reason>

<corrected>
\sysname{} is 1.74x, 1.87x, 1.66x, and 2.28x faster than the state-of-the-art competitor Lero on these benchmarks.
</corrected>

Note: The corrected version remains the same as the original in this case because the original was already correct. I included this example to show that the hyphenation was properly used in the original text.

The rest of the document appears to be grammatically correct. The abstract is well-written with proper sentence structure, verb tense consistency, and appropriate academic style. The author information and other metadata sections are also grammatically sound.
`;
		const test = extension.parseCorrections(test_text);
	});
});
