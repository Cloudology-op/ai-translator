import {ApiConfig,  ChatMessage, IApiProvider} from './index';
import { ApiProviderFactory } from './api-provider';

export class Translator {
    private provider: IApiProvider;
    
    constructor(private config: ApiConfig) {
        this.provider = ApiProviderFactory.create(config);
    }

    public getProvider(): string {
        return this.config.provider;
    }

    private buildPrompt(targetLanguage: string): string
    {
        return `你是一个智能翻译机器，根据输入内容和判断规则自动判断输入类型并根据输出规则输出对应的格式。
                
##判断规则和输出规则
- 单词：单个单词，返回单词的音标、单词的各种意思和每种意思的示例用法、单词的词源学
- 短语：2-4个词组成的短语/习语，返回多种意思和用法
- 句子：完整句子或段落，返回简洁翻译
- 其他：翻译可翻译部分，不可翻译部分原样输出

## 翻译目标语言
${targetLanguage}`;
    }

    async translate(
        text: string,
        targetLanguage: string,
        onChunk: (content: string) => void
    ): Promise<void> {
        const systemPrompt = this.buildPrompt(targetLanguage);
        const messages: ChatMessage[] = [
            {role: 'system', content: systemPrompt},
            {role: 'user', content: text}
        ];

        await this.provider.chatStream(messages, (chunk: string) => {
            onChunk(chunk);
        });
    }
}