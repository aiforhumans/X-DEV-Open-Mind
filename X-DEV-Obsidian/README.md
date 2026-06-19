# X-DEV Obsidian LLM Plugin

Local LLM integration plugin for Obsidian, powered by LM Studio.

## Features

- **Local LLM Integration**: Use local language models directly in Obsidian
- **LM Studio Support**: Connect to LM Studio over the WebSocket API
- **Prompt Commands**: Ask LM Studio or summarize the active note
- **Settings Panel**: Configure endpoint, model, temperature, and system prompt
- **Type-Safe**: Built with TypeScript for reliability

## Installation

1. Clone or download this repository into your Obsidian plugins directory:
   ```
   ~/.obsidian/plugins/x-dev-obsidian-llm/
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. Enable the plugin in Obsidian settings

## Development

```bash
npm run dev    # Watch mode for development
npm run build  # Build for production
npm run lint   # Lint code
```

## Usage

1. **Connect to LM Studio**: Use the command palette to run "Connect to LM Studio"
2. **Ask the model**: Run "Ask LM Studio" or click the ribbon icon
3. **Summarize the note**: Run "Summarize active note with LM Studio"
4. **Configure Settings**: Open plugin settings to set:
   - LM Studio base URL (default: `ws://127.0.0.1:1234`)
   - Model name (optional)
   - System prompt
   - Temperature
   - Max tokens
   - Auto-connect on startup

## Configuration

Settings are stored in Obsidian's plugin data storage with the following options:

- **lmStudioBaseUrl**: WebSocket URL where LM Studio is running
- **modelName**: Optional explicit model name
- **systemPrompt**: System instructions for the assistant
- **temperature**: Response randomness
- **maxTokens**: Maximum generation length
- **autoConnect**: Automatically connect on Obsidian startup

## Requirements

- Obsidian v0.15.0+
- LM Studio running locally with the client API enabled

## License

MIT
