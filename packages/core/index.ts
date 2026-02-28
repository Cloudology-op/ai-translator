export type ResultType = 'word' | 'phrase' | 'sentence';
export type ApiProviderType = 'qwen' | 'deepseek' | 'ollama';

export interface ApiConfig {
    provider: ApiProviderType;
    apiKey: string;
    model: string;
    baseUrl: string;
}

export interface ChatMessage {
    role: 'user' | 'system';
    content: string;
}

export interface WordResult {
    type: 'word';
    content: string;
}

export interface PhraseResult {
    type: 'phrase';
    content: string;
}

export interface TextResult {
    type: 'sentence';
    content: string;
}

export type TranslationResult = WordResult | PhraseResult | TextResult;

export interface IApiProvider {
    chatStream(
        messages: ChatMessage[],
        onChunk: (chunk: string) => void
    ): Promise<void>;
}

export { Translator } from './translator';
export { ApiProviderFactory } from './api-provider';