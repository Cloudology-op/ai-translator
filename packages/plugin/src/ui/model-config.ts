interface ModelConfig {
    label: string;
    defaultBaseUrl: string;
    models: Array<{ value: string; label: string }>;
    defaultModel: string;
}

export const MODEL_CONFIG: Record<string, ModelConfig> = {
    qwen: {
        label: '千问通义',
        defaultBaseUrl: '',
        models: [],
        defaultModel: ''
    },
    deepseek: {
        label: 'DeepSeek',
        defaultBaseUrl: '',
        models: [],
        defaultModel: ''
    },
    'openai-format': {
        label: 'OpenAI Format',
        defaultBaseUrl: '',
        models: [],
        defaultModel: ''
    }
};

export type ProviderType = keyof typeof MODEL_CONFIG;

export function getModelsForProvider(provider: ProviderType) {
    return MODEL_CONFIG[provider]?.models || [];
}

export function getDefaultModelForProvider(provider: ProviderType) {
    return MODEL_CONFIG[provider]?.defaultModel || '';
}

export function getDefaultBaseUrlForProvider(provider: ProviderType) {
    return MODEL_CONFIG[provider]?.defaultBaseUrl || '';
}

export function addModelForProvider(provider: ProviderType, modelValue: string, modelLabel: string): boolean {
    const existing = MODEL_CONFIG[provider]!.models.find(m => m.value === modelValue);
    if (!existing) {
        MODEL_CONFIG[provider]!.models.push({ value: modelValue, label: modelLabel });
        return true;
    } else {
        if (window.confirm(`ID为 ${modelValue} 的模型已经存在，是否要替换已有模型？`)) {
            const index = MODEL_CONFIG[provider]!.models.findIndex(m => m.value === modelValue);
            MODEL_CONFIG[provider]!.models[index]!.label = modelLabel;
            return true;
        } else {
            return false;
        }
    }
}

export function deleteModelsForProvider(provider: ProviderType, modelValues: string[]): void {
    MODEL_CONFIG[provider]!.models = MODEL_CONFIG[provider]!.models.filter(
        m => !modelValues.includes(m.value)
    );
}

export interface ModelConfigData {
    defaultBaseUrl?: string;
    models?: Array<{ value: string; label: string }>;
    defaultModel?: string;
}

export function loadModelConfigFromSettings(modelConfigs: Record<string, ModelConfigData>): void {
    for (const provider of Object.keys(MODEL_CONFIG) as ProviderType[]) {
        const config = modelConfigs[provider];
        if (config) {
            MODEL_CONFIG[provider]!.defaultBaseUrl = config.defaultBaseUrl || '';
            MODEL_CONFIG[provider]!.models = config.models || [];
            MODEL_CONFIG[provider]!.defaultModel = config.defaultModel || '';
        }
    }
}
