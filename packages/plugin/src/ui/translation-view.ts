import { ItemView, WorkspaceLeaf, IconName, MarkdownRenderer, TextAreaComponent, ButtonComponent, DropdownComponent } from 'obsidian';
import { ProviderType, getModelsForProvider } from './model-config';

export const VIEW_TYPE_TRANSLATION = 'translation-view';

export class TranslationView extends ItemView {
    private contentContainer: HTMLElement | null = null;
    private loadingEl: HTMLElement | null = null;
    private contentBuffer: string = '';
    private inputComponent: TextAreaComponent | null = null;
    private translateCallback: ((text: string) => Promise<void>) | null = null;
    private resultContainer: HTMLElement | null = null;
    private modelDropdown: DropdownComponent | null = null;
    private currentProvider: ProviderType = 'qwen';

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        this.navigation = true;
    }

    getViewType(): string {
        return VIEW_TYPE_TRANSLATION;
    }

    getDisplayText(): string {
        return 'AI 翻译';
    }

    getIcon(): IconName {
        return 'languages';
    }

    setTranslateCallback(callback: (text: string) => Promise<void>): void {
        this.translateCallback = callback;
    }

    getSelectedModel(): string {
        return this.modelDropdown?.getValue() || '';
    }

    setProvider(provider: ProviderType): void {
        this.currentProvider = provider;
        this.updateModelOptions();
    }

    setModel(model: string): void {
        this.modelDropdown?.setValue(model);
    }

    private updateModelOptions(): void {
        if (!this.modelDropdown) return;
        this.modelDropdown.selectEl.empty();
        const models = getModelsForProvider(this.currentProvider);
        models.forEach(m => this.modelDropdown!.addOption(m.value, m.label));
    }

    getInputText(): string {
        return this.inputComponent?.getValue() || '';
    }

    clearInput(): void {
        this.inputComponent?.setValue('');
    }

    async onOpen(): Promise<void> {
        this.contentContainer = this.contentEl.createDiv({cls: 'translation-content'});
        this.display();
    }

    async onClose(): Promise<void> {
        this.contentContainer = null;
    }

    display(): void {
        // ===== 外层容器 =====
        const container = this.contentEl;
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.height = '100%';

        // ===== 翻译结果区域 (顶部，可滚动) =====
        // 位置: 顶部
        // flex: 1 表示占据剩余空间
        // minHeight: 0 配合 flex 防止内容溢出
        this.resultContainer = container.createDiv({cls: 'translation-result'});
        this.resultContainer.style.flex = '1';
        this.resultContainer.style.overflowY = 'auto';
        this.resultContainer.style.minHeight = '0';
        this.contentContainer = this.resultContainer;

        // ===== 输入区域 (底部固定) =====
        // 位置: 底部
        // flexShrink: 0 防止被压缩
        const inputSection = container.createDiv({cls: 'translation-input-section'});
        inputSection.style.flexShrink = '0';
        inputSection.style.padding = '8px';
        inputSection.style.borderTop = '1px solid var(--background-modifier-border)';
        inputSection.style.marginTop = '20px';

        // ===== 输入框包装器 =====
        // 用于定位内部的控制按钮行
        const inputWrapper = inputSection.createDiv({cls: 'translation-input-wrapper'});
        inputWrapper.style.position = 'relative';

        // ===== 文本输入框 =====
        // 高度: 80px (minHeight)
        // 快捷键: Ctrl+Enter 触发翻译
        this.inputComponent = new TextAreaComponent(inputWrapper);
        this.inputComponent.setPlaceholder('请输入要翻译的内容...');
        this.inputComponent.inputEl.style.width = '100%';
        this.inputComponent.inputEl.style.minHeight = '100px';
        this.inputComponent.inputEl.style.resize = 'none';
        this.inputComponent.inputEl.style.paddingRight = '8px';
        this.inputComponent.inputEl.style.paddingBottom = '32px';  // 为底部按钮留空间
        this.inputComponent.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.handleTranslate();
            }
        });

        // ===== 控制按钮行 (位于输入框内左下角) =====
        // 绝对定位在 inputWrapper 内
        // 包含: 模型选择下拉框、翻译按钮
        const controlsRow = inputWrapper.createDiv({cls: 'translation-controls-row'});
        controlsRow.style.position = 'absolute';
        controlsRow.style.left = '8px';
        controlsRow.style.bottom = '8px';
        controlsRow.style.right = '8px';
        controlsRow.style.display = 'flex';
        controlsRow.style.alignItems = 'center';
        controlsRow.style.gap = '8px';
        controlsRow.style.justifyContent = 'flex-end';

        // ===== 模型选择下拉框 =====
        // 位于翻译按钮左侧
        // 可选模型根据当前提供商动态更新
        this.modelDropdown = new DropdownComponent(controlsRow);
        this.modelDropdown.selectEl.style.padding = '2px 6px';
        this.modelDropdown.selectEl.style.height = '24px';
        this.modelDropdown.selectEl.style.minWidth = '120px';
        this.updateModelOptions();

        // ===== 翻译按钮 =====
        // 位于控制按钮行右侧
        // 点击或 Ctrl+Enter 触发翻译
        const translateBtn = controlsRow.createEl('button', {cls: 'translation-inline-btn'});
        translateBtn.setText('翻译');
        translateBtn.style.padding = '2px 10px';
        translateBtn.style.border = 'none';
        translateBtn.style.borderRadius = '4px';
        translateBtn.style.background = 'var(--interactive-accent)';
        translateBtn.style.color = 'var(--text-on-accent)';
        translateBtn.style.cursor = 'pointer';
        translateBtn.style.height = '24px';
        translateBtn.onclick = () => this.handleTranslate();

        // ===== 初始化状态 =====
        this.resultContainer.setText('等待翻译...');
        this.contentBuffer = '';
        this.loadingEl?.remove();
        this.loadingEl = null;
    }

    private async handleTranslate(): Promise<void> {
        const text = this.inputComponent?.getValue();
        if (!text || text.trim().length === 0) {
            return;
        }
        if (this.translateCallback) {
            await this.translateCallback(text);
        }
    }

    private async renderMarkdown(): Promise<void> {
        if (!this.contentContainer || !this.contentBuffer) return;
        this.contentContainer.empty();
        await MarkdownRenderer.render(
            this.app,
            this.contentBuffer,
            this.contentContainer,
            '',
            this
        );
    }

    appendContent(content: string): void {
        if (this.loadingEl) {
            this.loadingEl.remove();
            this.loadingEl = null;
        }
        if (!this.contentContainer) return;

        this.contentBuffer += content;

        if (this.contentContainer.getText() === '等待翻译...') {
            this.contentContainer.empty();
        }
        this.renderMarkdown();
        this.scrollToBottom();
    }

    showLoading(): void {
        if (!this.resultContainer) return;
        this.loadingEl = this.resultContainer.createDiv({cls: 'translation-loading'});
        this.loadingEl.setText('翻译中...');
    }

    private scrollToBottom(): void {
        this.resultContainer?.scrollTo(0, this.resultContainer.scrollHeight);
    }

    clear(): void {
        this.contentBuffer = '';
        this.contentContainer?.setText('');
        this.loadingEl?.remove();
        this.loadingEl = null;
    }
}