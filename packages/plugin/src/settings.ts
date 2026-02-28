import { ApiConfig, ApiProviderType } from "../../core";
import { getDefaultBaseUrlForProvider } from "./ui/model-config";

export interface PluginSettings {
    apiConfig: ApiConfig;
    targetLanguage: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    apiConfig: {
        provider: 'qwen' as ApiProviderType,
        apiKey: '',
        model: 'qwen-plus',
        baseUrl: getDefaultBaseUrlForProvider('qwen')
    },
    targetLanguage: '中文'
}