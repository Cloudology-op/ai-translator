import { Plugin, Editor, Notice, Menu, WorkspaceLeaf } from 'obsidian';
import { Translator } from '../../core/translator';
import { PluginSettings, DEFAULT_SETTINGS } from './settings';
import { TranslationView, VIEW_TYPE_TRANSLATION } from './ui/translation-view';
import { TranslatorSettingTab } from './ui/setting-tab';
import { ProviderType } from './ui/model-config';

export default class TranslatorPlugin extends Plugin {
    private translator: Translator | null = null;
    private settings: PluginSettings = DEFAULT_SETTINGS;

    private async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    getView(): TranslationView | null {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_TRANSLATION);
        if (leaves.length > 0) {
            const leaf = leaves[0];
            if (!leaf || !leaf.view) return null;
            return leaf.view as TranslationView;
        }
        return null;
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_TRANSLATION);

        if (leaves.length > 0) {
            leaf = leaves[0] || null;
        } else {
            leaf = workspace.getRightLeaf(false);
            if (leaf) {
                await leaf.setViewState({type: VIEW_TYPE_TRANSLATION, active: true});
            }
        }

        if (leaf) {
            await workspace.revealLeaf(leaf);
        } 
    }

    private async executeTranslate(text: string): Promise<void> {
        const view = this.getView();
        if (!view) return;

        view.clear();
        view.showLoading();

        try {
            // 使用侧边栏当前选中的模型
            const apiConfig = {
                ...this.settings.apiConfig,
                model: view.getSelectedModel()
            };
            this.translator = new Translator(apiConfig);

            await this.translator.translate(text, this.settings.targetLanguage, (content) => {
                view.appendContent(content); 
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : '未知错误';
            new Notice(`翻译失败: ${message}`, 5000);
        }
    }

    private async handleContextMenu(menu: Menu, editor: Editor) {
        const selection = editor.getSelection();
        if (!selection || selection.trim().length === 0) {
            return;
        }

        menu.addItem(item => item.setTitle('AI 翻译').setIcon('languages').onClick(async () => {
            await this.activateView();
            await this.executeTranslate(selection);
        }))
    }

    private async handleTranslate(editor: Editor) {
        const selection = editor.getSelection();
        if (!selection || selection.trim().length === 0) {
            new Notice('请先选中要翻译的文本');
            return;
        }

        await this.activateView();
        await this.executeTranslate(selection);
    }

    async onload() {
        await this.loadSettings();

        this.translator = new Translator(this.settings.apiConfig);

        this.registerView(VIEW_TYPE_TRANSLATION, (leaf) => {
            const view = new TranslationView(leaf);
            view.setTranslateCallback(async (text: string) => {
                await this.activateView();
                await this.executeTranslate(text);
            });
            view.setProvider(this.settings.apiConfig.provider as ProviderType);
            view.setModel(this.settings.apiConfig.model);
            return view;
        });

        this.registerEvent(this.app.workspace.on('editor-menu', (menu, editor) => { this.handleContextMenu(menu, editor) }));

        this.addRibbonIcon('languages', 'AI 翻译', () => { this.activateView(); });

        this.addCommand({ id: 'translate-selection', name: '翻译选中内容', editorCallback: (editor) => this.handleTranslate(editor)});

        this.addSettingTab(new TranslatorSettingTab(this.app, this));
    }

    async onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_TRANSLATION);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}