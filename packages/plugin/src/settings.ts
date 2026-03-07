import { ApiConfig, ApiProviderType } from "../../core";

export interface ModelConfigData {
    defaultBaseUrl?: string;
    models?: Array<{ value: string; label: string }>;
    defaultModel?: string;
}

export interface PluginSettings {
    apiConfig: ApiConfig;
    targetLanguage: string;
    modelConfigs: {
        qwen: ModelConfigData;
        deepseek: ModelConfigData;
        'openai-format': ModelConfigData;
    };
}

export const DEFAULT_SETTINGS: PluginSettings = {
    apiConfig: {
        provider: 'qwen' as ApiProviderType,
        apiKey: '',
        model: '',
        baseUrl: ''
    },
    targetLanguage: '中文',
    modelConfigs: {
        qwen: {
            defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            models: [
                { value: 'qwen3.5-plus', label: 'qwen3.5-plus' },
                { value: 'qwen3-max', label: 'qwen3-max' },
                { value: 'qwen3.5-flash', label: 'qwen3.5-flash' }
            ],
            defaultModel: 'qwen3.5-flash'
        },
        deepseek: {
            defaultBaseUrl: 'https://api.deepseek.com/chat/completions',
            models: [
                { value: 'deepseek-chat', label: 'deepseek-chat' }
            ],
            defaultModel: 'deepseek-chat'
        },
        'openai-format': {
            defaultBaseUrl: '',
            models: [],
            defaultModel: ''
        }
    }
}