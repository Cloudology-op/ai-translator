import { App, PluginSettingTab, Setting, Notice, Modal } from 'obsidian'
import { ApiProviderFactory } from '../../../core/api-provider'
import { MODEL_CONFIG, ProviderType, getModelsForProvider, getDefaultModelForProvider, getDefaultBaseUrlForProvider, addModelForProvider, deleteModelsForProvider, loadModelConfigFromSettings } from './model-config'

export class TranslatorSettingTab extends PluginSettingTab {
    private modelDropdown: any;
    private baseUrlInput: any;
    private currentProvider: ProviderType = 'qwen';
    constructor(app: App, private plugin: any) {
        super(app, plugin);
    }

    private getSelectedDefultModel():string {
        return this.modelDropdown?.getValue() || '';
    }

    private updateViewProvider(): void {
        const view = this.plugin.getView() as any;
        if (view && view.setProvider) {
            view.setProvider(this.plugin.settings.apiConfig.provider as ProviderType);
            const selectedDefaultModel = this.getSelectedDefultModel();
            view.setModel(selectedDefaultModel);
        }
    }

    private updateModelOption(provider: ProviderType): void {
        if (!this.modelDropdown) return;

        this.modelDropdown.selectEl.empty();

        const models = getModelsForProvider(provider);
        models.forEach(m => this.modelDropdown.addOption(m.value, m.label));

        const defaultModel = getDefaultModelForProvider(provider);
        this.plugin.settings.apiConfig.model = defaultModel;
        this.modelDropdown.setValue(defaultModel);

        const defaultBaseUrl = getDefaultBaseUrlForProvider(provider);
        this.plugin.settings.apiConfig.baseUrl = defaultBaseUrl;
        if (this.baseUrlInput) {
            this.baseUrlInput.setValue(defaultBaseUrl);
        }
    }

    private async testApiKey(): Promise<void>
    {
        const {apiConfig} = this.plugin.settings;

        if (!apiConfig.apiKey) {
            new Notice('请先输入 API Key');
            return;
        }

        new Notice('正在测试 API Key...', 1000);

        try {
            const provider = ApiProviderFactory.create(apiConfig);
            await provider.chatStream([{role: 'user', content: '你好'}], () => {});
            new Notice('API Key 验证成功', 2000);
        } catch (error: any) {
            new Notice(`API Key 验证失败: ${error.message}`, 5000);
        }
    }

    private saveModelConfigToSettings(): void {
        for (const provider of Object.keys(MODEL_CONFIG) as ProviderType[]) {
            this.plugin.settings.modelConfigs[provider] = {
                defaultBaseUrl: MODEL_CONFIG[provider]!.defaultBaseUrl,
                models: MODEL_CONFIG[provider]!.models,
                defaultModel: MODEL_CONFIG[provider]!.defaultModel
            };
        }
    }

    display(): void
    {
        const {containerEl} = this;
        containerEl.empty();
        
        loadModelConfigFromSettings(this.plugin.settings.modelConfigs);
        
        this.currentProvider = this.plugin.settings.apiConfig.provider;

        containerEl.createEl('h2', {text: 'AI翻译插件设置'});

        new Setting(containerEl)
            .setName('API提供商')
            .setDesc('选择大语言模型服务提供商')
            .addDropdown(dropdown => {
                Object.entries(MODEL_CONFIG).forEach(([key, config]) => {
                    dropdown.addOption(key, config.label);
                });
                dropdown
                    .setValue(this.plugin.settings.apiConfig.provider)
                    .onChange(async (value: string) => {
                        this.plugin.settings.apiConfig.provider = value as ProviderType;
                        this.currentProvider = value as ProviderType;
                        this.updateModelOption(value as ProviderType);
                        await this.plugin.saveSettings();
                        this.updateViewProvider();
                    });
            });

        new Setting(containerEl)
            .setName('Base URL')
            .setDesc('API 服务器地址')
            .addText(text => {
                this.baseUrlInput = text;
                text
                    .setValue(this.plugin.settings.apiConfig.baseUrl)
                    .onChange(async (value: string) => {
                        this.plugin.settings.apiConfig.baseUrl = value;
                        MODEL_CONFIG[this.currentProvider]!.defaultBaseUrl = value;
                        this.saveModelConfigToSettings();
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName('Api Key')
            .setDesc('输入 API 密钥')
            .addText(text => {
                text
                    .setPlaceholder('sk - ...')
                    .setValue(this.plugin.settings.apiConfig.apiKey)
                    .onChange(async (value: string) => {
                        this.plugin.settings.apiConfig.apiKey = value;
                        await this.plugin.saveSettings();
                    }).inputEl.type = 'password';
            })
            .addButton(button => {
                button
                    .setButtonText('测试')
                    .setCta().onClick(() => this.testApiKey());
            });

        new Setting(containerEl)
            .setName('默认模型')
            .setDesc('选择默认使用的模型，实际调用的模型为聊天框中选择的模型')
            .addDropdown(dropdown => {
                this.modelDropdown = dropdown;
                this.updateModelOption(this.currentProvider as ProviderType);
                dropdown.onChange(async (value: string) => {
                    this.plugin.settings.apiConfig.model = value;
                    MODEL_CONFIG[this.currentProvider]!.defaultModel = value;
                    this.saveModelConfigToSettings();
                    await this.plugin.saveSettings();
                });
            })
            .addButton(button => {
                button
                    .setButtonText('添加模型')
                    .onClick(() => {
                        new AddModelModal(this.app, this.currentProvider, () => {
                            this.updateModelOption(this.currentProvider);
                            this.updateViewProvider();
                            this.saveModelConfigToSettings();
                            this.plugin.saveSettings();
                        }).open();
                    });
            })
            .addButton(button => {
                button
                    .setButtonText('删除模型')
                    .onClick(() => {
                        new DeleteModelsModal(this.app, this.currentProvider, () => {
                            this.updateModelOption(this.currentProvider);
                            this.updateViewProvider();
                            this.saveModelConfigToSettings();
                            this.plugin.saveSettings();
                        }).open();
                    });
            })        

         new Setting(containerEl)
            .setName('目标语言')
            .setDesc('翻译结果的目标语言')
            .addText(Text => {
                Text
                    .setPlaceholder('中文')
                    .setValue(this.plugin.settings.targetLanguage)
                    .onChange(async (value: string) => {
                        this.plugin.settings.targetLanguage = value;
                        await this.plugin.saveSettings();
                    });
            });   
    }
}

class AddModelModal extends Modal {
    private onSave: () => void;
    private provider: ProviderType;

    constructor(app: any, provider: ProviderType, onSave: () => void) {
        super(app);
        this.provider = provider;
        this.onSave = onSave;
    }

    onOpen() {
        const { contentEl } = this;

        let labelInput: any;
        let valueInput: any;

        new Setting(contentEl)
            .setName('模型名称')
            .setDesc('显示名称')
            .addText(text => {
                labelInput = text;
            });

        new Setting(contentEl)
            .setName('模型 ID')
            .setDesc('模型标识符')
            .addText(text => {
                valueInput = text;
            });

        new Setting(contentEl)
            .addButton(button => {
                button
                    .setButtonText('保存')
                    .onClick(() => {
                        const label = labelInput.getValue().trim();
                        const value = valueInput.getValue().trim();
                        if (!label || !value) {
                            new Notice('请填写完整的模型信息', 2000);
                            return;
                        }
                        if (addModelForProvider(this.provider, value, label))
                            this.onSave();
                        this.close();
                        new Notice('模型添加成功', 2000);
                    });
            });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class DeleteModelsModal extends Modal {
    private onSave: () => void;
    private provider: ProviderType;
    private selectedModels: Set<string> = new Set();

    constructor(app: any, provider: ProviderType, onSave: () => void) {
        super(app);
        this.provider = provider;
        this.onSave = onSave;
    }

    onOpen() {
        const { contentEl } = this;
        const models = getModelsForProvider(this.provider);
        
        if (models.length === 0) {
            contentEl.createEl('p', { text: '当前提供商没有可删除的模型' });
        } 
        else {
            models.forEach(model => {
                const setting = new Setting(contentEl)
                    .setName(model.label)
                    .setDesc(model.value);
                
                const checkbox = setting.controlEl.createEl('input', { type: 'checkbox' });
                checkbox.style.width = '18px';
                checkbox.style.height = '18px';
                checkbox.style.cursor = 'pointer';
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        this.selectedModels.add(model.value);
                    } else {
                        this.selectedModels.delete(model.value);
                    }
                });
            });

            new Setting(contentEl)
                .addButton(button => {
                    button
                        .setButtonText('删除')
                        .setCta()
                        .setWarning()
                        .onClick(() => {
                            if (this.selectedModels.size === 0) {
                                new Notice('请选择要删除的模型', 2000);
                                return;
                            }
                            const deletedCount = this.selectedModels.size;
                            deleteModelsForProvider(this.provider, Array.from(this.selectedModels));
                            this.onSave();
                            this.close();
                            new Notice(`已删除 ${deletedCount} 个模型`, 2000);
                        });
                });
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        this.selectedModels.clear();
    }
}