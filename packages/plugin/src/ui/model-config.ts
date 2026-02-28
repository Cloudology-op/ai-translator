export const MODEL_CONFIG = {
    qwen: {
        label: '千问通义',
        defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        models: [
            { value: 'qwen3.5-plus', label: 'qwen3.5-plus' },
            { value: 'qwen3-max', label: 'qwen3-max' },
            { value: 'qwen-plus', label: 'qwen-plus' },
            { value: 'qwen-flash', label: 'qwen-flash' }
        ],
        defaultModel: 'qwen-plus'
    },
    deepseek: {
        label: 'DeepSeek',
        defaultBaseUrl: 'https://api.deepseek.com/chat/completions',
        models: [
            { value: 'deepseek-chat', label: 'deepseek-chat' }
        ],
        defaultModel: 'deepseek-chat'
    },
    ollama: {
        label: 'Ollama',
        defaultBaseUrl: 'http://localhost:11434/v1',
        models: [ { value: "qwen3-32B", label: "qwen3-32B" }],
        defaultModel: 'qwen3-32B'
    }
} as const;

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

export function addModelForProvider(provider: ProviderType, modelValue: string, modelLabel: string): void {
    const existing = MODEL_CONFIG[provider].models.find(m => m.value === modelValue);
    if (!existing) {
        (MODEL_CONFIG as any)[provider].models.push({ value: modelValue, label: modelLabel });
    }
}
