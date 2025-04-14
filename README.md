# LaTeX Grammar Checker (AI-Powered)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
A Visual Studio Code extension that leverages OpenAI-compatible Large Language Models (LLMs) to check the grammar and style of your LaTeX documents. It presents the suggestions in a clear diff view for easy review.
## Features
*   **AI-Powered Checking:** Sends the text content of your active LaTeX file to a configured LLM for grammar and style analysis.
*   **Diff View:** Displays suggested changes side-by-side with your original text, making it easy to compare and understand the proposed modifications.
*   **Configurable:** Allows you to specify the LLM provider (API endpoint), model name, API key, temperature, and top-p sampling parameters.
*   **Customizable Prompt:** Uses a system prompt file (`assets/system_prompt.txt`) to instruct the LLM, which can be potentially modified (requires rebuilding the extension).
*   **Focus on Correction Structure:** Expects the LLM to return corrections in a specific XML-like format (`<original>`, `<reason>`, `<corrected>`) for robust parsing.
## How it Works
1.  You invoke the `LaTeX Checker: Check Grammar` command.
2.  The extension reads the content of your currently active text editor.
3.  It reads the system prompt from `assets/system_prompt.txt`.
4.  It sends the system prompt and your document text to the configured LLM API endpoint using the specified model and parameters.
5.  It waits for the LLM to respond with suggested corrections formatted like:
    ```xml
    <original>The text segment with an error.</original>
    <reason>Explanation why it's an error.</reason>
    <corrected>The corrected text segment.</corrected>
    <!-- Potentially more correction blocks -->
    ```
6.  The extension parses this response to extract all correction details.
7.  It applies these corrections sequentially to a copy of your original text.
8.  Finally, it opens a diff view in VS Code showing the original text (right) and the AI-suggested text (left).
## Usage
1.  **Install the extension.**
2.  **Configure the extension settings** (see Configuration section below). You *must* provide at least the model name and usually an API key and potentially a base URL if not using the default OpenAI API.
3.  **Open a LaTeX file** (`.tex` or similar) in VS Code.
4.  **Open the Command Palette** (`Ctrl+Shift+P` or `Cmd+Shift+P`) and **Type and select** the command: `LaTeX Checker: Check Grammar`.
5.  Or **Click the button "Check Grammer"** on the top-right.
6.  **Wait** while the extension communicates with the LLM (a progress indicator will be shown in the status bar or notification area).
7.  **Review the suggestions** in the diff view that appears. The suggested text is on the left (temporary document), and your original document is on the right.
8.  Manually apply the changes you want to keep from the diff view to your original file. The suggested document on the left is read-only.

## Requirements
*   **Access to an OpenAI-compatible LLM:** This could be OpenAI's API or a self-hosted/alternative provider (like Ollama, LM Studio, Jan, etc.) that exposes a compatible API endpoint.
*   **API Key:** An API key for your chosen LLM provider (if required). Store this securely.
*   **Configured Model:** The specific LLM model you want to use must be specified in the settings.
*   **LLM Compatibility:** The chosen LLM must be capable of following the instructions in the `assets/system_prompt.txt` file and generating output in the required `<original>...</original><reason>...</reason><corrected>...</corrected>` format. Results may vary significantly depending on the LLM's capabilities.
## Configuration
Configure the extension via VS Code's `settings.json` file (`File > Preferences > Settings`, then search for "latex-checker").
*   **`latex-checker.openai.api_key`**:
    *   Your API key for the LLM service.
    *   Type: `string`
    *   Default: `undefined` (You usually need to set this)
    *   *Security Note:* Consider using VS Code's Secret Storage API or environment variables for storing sensitive keys, though this extension currently reads directly from settings.
*   **`latex-checker.openai.base_url`**:
    *   The base URL of the LLM API endpoint. Change this if you are using a local LLM or a different provider.
    *   Type: `string`
    *   Default: `"https://api.openai.com/v1"` (OpenAI default - `/v1` path is often automatically added by the `openai` library if not present, but check your provider's documentation)
*   **`latex-checker.openai.model`**:
    *   **Required.** The specific model identifier to use (e.g., `gpt-4o`, `gpt-3.5-turbo`, `llama3`, `mistral`).
    *   Type: `string`
    *   Default: `""` (Must be set by the user)
*   **`latex-checker.temperature`**:
    *   Controls the randomness of the LLM's output. Lower values (e.g., 0.2) make the output more deterministic, while higher values (e.g., 1.0) make it more creative/random.
    *   Type: `number`
    *   Default: `1`
*   **`latex-checker.top-p`**:
    *   Nucleus sampling parameter. An alternative to temperature that controls randomness by considering only the most probable tokens. `1` effectively disables it.
    *   Type: `number`
    *   Default: `1`
**Example `settings.json`:**
```json
{
    "latex-checker.openai.api_key": "sk-YOUR_API_KEY_HERE", // Or leave blank if your local server doesn't need one
    "latex-checker.openai.base_url": "http://localhost:11434/v1", // Example for Ollama OpenAI-compatible endpoint
    "latex-checker.openai.model": "llama3",
    "latex-checker.temperature": 0.7,
    "latex-checker.top-p": 1
}
```
## System Prompt (`assets/system_prompt.txt`)
This file, located within the extension's installation directory, contains the core instructions given to the LLM. It tells the model how to behave, what kind of checks to perform, and crucially, **the format in which to return the results** (using `<original>`, `<reason>`, and `<corrected>` tags).
If you find the LLM isn't providing good suggestions or fails to follow the format, you might need to adjust this prompt. Note that modifying this file currently requires manually editing it within the installed extension's folder, and changes might be overwritten on extension updates.
## Known Issues & Limitations
*   **LLM Dependency:** The quality of suggestions depends entirely on the capability of the configured LLM and the effectiveness of the system prompt.
*   **Strict Parsing:** The extension strictly expects the LLM response in the `<original>...<corrected>` format. If the LLM fails to adhere to this, parsing will likely fail, and no suggestions will be shown.
*   **Simple Correction Application:** Corrections are applied sequentially using simple string replacement (`replace` finds the *first* occurrence). This might lead to incorrect results if the `<original>` text appears multiple times in the document or if corrections overlap in complex ways.
*   **No Direct Application:** Changes suggested in the diff view are not automatically applied to your file. You need to review and apply them manually.
*   **API Costs & Rate Limits:** Using cloud-based LLMs (like OpenAI's API) may incur costs and be subject to rate limits.
*   **Data Privacy:** Your document text is sent to the configured LLM provider. Be mindful of the privacy implications, especially when using third-party services.
## Contributing
Contributions, issues, and feature requests are welcome! Please check the [Issues](https://github.com/YOUR_GITHUB_REPO/issues) page (replace with your actual repo link).
## License
[MIT License](https://github.com/a858438680/latex-checker/raw/master/LICENSE)