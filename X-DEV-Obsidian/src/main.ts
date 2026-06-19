import { Chat, LMStudioClient } from "@lmstudio/sdk";
import { App, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";

interface XDevLlmSettings {
	lmStudioBaseUrl: string;
	modelName: string;
	systemPrompt: string;
	temperature: number;
	maxTokens: number;
	autoConnect: boolean;
}

const DEFAULT_SETTINGS: XDevLlmSettings = {
	lmStudioBaseUrl: "ws://127.0.0.1:1234",
	modelName: "",
	systemPrompt: "You are a concise Obsidian assistant that helps write, summarize, and refine notes.",
	temperature: 0.4,
	maxTokens: 512,
	autoConnect: true,
};

class LmStudioService {
	private client: LMStudioClient | null = null;
	private readonly baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = normalizeBaseUrl(baseUrl);
	}

	async respond(prompt: string, settings: Pick<XDevLlmSettings, "modelName" | "systemPrompt" | "temperature" | "maxTokens">): Promise<string> {
		const client = this.getClient();
		const model = settings.modelName ? await client.llm.model(settings.modelName) : await client.llm.model();
		const chat = Chat.from([
			{ role: "system", content: settings.systemPrompt },
			{ role: "user", content: prompt },
		]);

		const result = await model.respond(chat, {
			temperature: settings.temperature,
			maxTokens: settings.maxTokens > 0 ? settings.maxTokens : false,
		});

		return result.content;
	}

	private getClient(): LMStudioClient {
		if (this.client === null) {
			this.client = new LMStudioClient({ baseUrl: this.baseUrl });
		}

		return this.client;
	}
}

function normalizeBaseUrl(raw: string): string {
	const trimmed = raw.trim().replace(/\/+$/, "");

	if (trimmed.startsWith("http://")) {
		return `ws://${trimmed.slice("http://".length)}`;
	}

	if (trimmed.startsWith("https://")) {
		return `wss://${trimmed.slice("https://".length)}`;
	}

	return trimmed;
}

function getMarkdownText(view: MarkdownView): string {
	const editor = view.editor;
	const selection = editor.getSelection().trim();

	if (selection.length > 0) {
		return selection;
	}

	return editor.getValue().trim();
}

class PromptModal extends Modal {
	private readonly titleText: string;
	private readonly placeholder: string;
	private readonly onSubmit: (value: string) => void;
	private textarea!: HTMLTextAreaElement;

	constructor(app: App, titleText: string, placeholder: string, onSubmit: (value: string) => void) {
		super(app);
		this.titleText = titleText;
		this.placeholder = placeholder;
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: this.titleText });

		this.textarea = contentEl.createEl("textarea", {
			attr: {
				placeholder: this.placeholder,
				rows: "8",
			},
		});
		this.textarea.style.width = "100%";
		this.textarea.style.resize = "vertical";

		new Setting(contentEl)
			.addButton((button) =>
				button.setButtonText("Cancel").onClick(() => this.close())
			)
			.addButton((button) =>
				button.setCta().setButtonText("Run").onClick(() => {
					const value = this.textarea.value.trim();
					if (value.length === 0) {
						new Notice("Enter a prompt first.");
						return;
					}

					this.onSubmit(value);
					this.close();
				})
			);

		this.textarea.focus();
	}
}

export default class XDevLlmPlugin extends Plugin {
	settings: XDevLlmSettings;
	private service: LmStudioService | null = null;

	async onload() {
		await this.loadSettings();
		this.service = new LmStudioService(this.settings.lmStudioBaseUrl);

		this.addRibbonIcon("sparkles", "Ask LM Studio", () => {
			void this.openPromptModal();
		});

		this.addCommand({
			id: "xdev-connect-lm-studio",
			name: "Connect to LM Studio",
			callback: () => {
				this.service = new LmStudioService(this.settings.lmStudioBaseUrl);
				new Notice("LM Studio client ready.");
			},
		});

		this.addCommand({
			id: "xdev-ask-lm-studio",
			name: "Ask LM Studio",
			callback: () => {
				void this.openPromptModal();
			},
		});

		this.addCommand({
			id: "xdev-summarize-active-note",
			name: "Summarize active note with LM Studio",
			callback: () => {
				void this.summarizeActiveNote();
			},
		});

		this.addSettingTab(new XDevLlmSettingTab(this.app, this));

		if (this.settings.autoConnect) {
			new Notice("LM Studio client ready.");
		}
	}

	onunload() {
		this.service = null;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.service = new LmStudioService(this.settings.lmStudioBaseUrl);
	}

	private async openPromptModal() {
		new PromptModal(this.app, "Ask LM Studio", "Write your prompt...", async (prompt) => {
			try {
				const answer = await this.getService().respond(prompt, this.settings);
				new Notice(answer.slice(0, 250));
			} catch (error) {
				new Notice(error instanceof Error ? error.message : "LM Studio request failed.");
			}
		}).open();
	}

	private async summarizeActiveNote() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice("Open a markdown note first.");
			return;
		}

		const noteText = getMarkdownText(view);
		if (noteText.length === 0) {
			new Notice("The active note is empty.");
			return;
		}

		try {
			const answer = await this.getService().respond(
				`Summarize the following Obsidian note in 5 bullet points and keep it concise:\n\n${noteText}`,
				this.settings
			);
			new Notice(answer.slice(0, 250));
		} catch (error) {
			new Notice(error instanceof Error ? error.message : "LM Studio request failed.");
		}
	}

	private getService(): LmStudioService {
		if (this.service === null) {
			this.service = new LmStudioService(this.settings.lmStudioBaseUrl);
		}

		return this.service;
	}
}

class XDevLlmSettingTab extends PluginSettingTab {
	plugin: XDevLlmPlugin;

	constructor(app: App, plugin: XDevLlmPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "X-DEV LM Studio Settings" });

		new Setting(containerEl)
			.setName("LM Studio base URL")
			.setDesc("Use the WebSocket endpoint, for example ws://127.0.0.1:1234. http:// values are converted automatically.")
			.addText((text) =>
				text
					.setPlaceholder("ws://127.0.0.1:1234")
					.setValue(this.plugin.settings.lmStudioBaseUrl)
					.onChange(async (value) => {
						this.plugin.settings.lmStudioBaseUrl = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Model name")
			.setDesc("Leave blank to use the active LM Studio model.")
			.addText((text) =>
				text
					.setPlaceholder("llama-3.2-1b-instruct")
					.setValue(this.plugin.settings.modelName)
					.onChange(async (value) => {
						this.plugin.settings.modelName = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("System prompt")
			.setDesc("Instructions for the assistant.")
			.addTextArea((text) =>
				text
					.setValue(this.plugin.settings.systemPrompt)
					.onChange(async (value) => {
						this.plugin.settings.systemPrompt = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Temperature")
			.setDesc("Lower values are more deterministic.")
			.addSlider((slider) =>
				slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.temperature)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.temperature = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Max tokens")
			.setDesc("Maximum number of tokens to generate.")
			.addText((text) =>
				text
					.setPlaceholder("512")
					.setValue(String(this.plugin.settings.maxTokens))
					.onChange(async (value) => {
						const parsed = Number.parseInt(value, 10);
						if (!Number.isNaN(parsed) && parsed >= 0) {
							this.plugin.settings.maxTokens = parsed;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Auto connect")
			.setDesc("Prepare the LM Studio client on startup.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.autoConnect).onChange(async (value) => {
					this.plugin.settings.autoConnect = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
