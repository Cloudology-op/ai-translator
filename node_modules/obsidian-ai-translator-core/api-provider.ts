import { ApiConfig, ChatMessage, IApiProvider }  from './index';
export type { ChatMessage, IApiProvider } from './index'

class QwenProvider implements IApiProvider{
    private endpoint: string;

    constructor(private config: ApiConfig) {
        this.endpoint = this.config.baseUrl;
    }

    async chatStream(messages: ChatMessage[], onChunk: (chunk: string) => void): Promise<void> 
    {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.config.model,
                messages,
                stream: true,
                enable_thinking: false
            })
        });

        if (!response.ok) {
            throw new Error(`Qwen API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('无法读取响应流')
        }

        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, {stream: true});
            
            const parts = buffer.split('\n');
            buffer = parts.pop() || '';

            for (const part of parts) {
                let trimmed = part.trim();
                if (!trimmed) continue;

                if (trimmed.startsWith('data: ')) {
                    trimmed = trimmed.slice(6);
                }

                try {
                    const data = JSON.parse(trimmed);
                    const content = data.choices?.[0]?.delta?.content || '';
                    if (content) {
                        onChunk(content);
                    }
                    const finish_reason = data.choice?.[0]?.finish_reason;
                    if (finish_reason != null){
                        return;
                    }
                } catch {
                    // 忽略解析错误
                }
            }
        }
    }
}

class DeepSeekProvider implements IApiProvider {
    private endpoint: string;

    constructor(private config: ApiConfig) {
        this.endpoint = this.config.baseUrl;
    }

    async chatStream(
        messages: ChatMessage[],
        onChunk: (chunk: string) => void
    ): Promise<void> {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.config.model,
                messages,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('无法读取响应流');
        }

        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                let trimmed = line.trim();
                if (!trimmed) continue;

                if (trimmed.startsWith('data: ')) {
                    trimmed = trimmed.slice(6);
                }

                try {
                    const data = JSON.parse(trimmed);
                    const content = data.choices?.[0]?.delta?.content || '';
                    if (content) {
                        onChunk(content);
                    }
                    const finishReason = data.choices?.[0]?.finish_reason;
                    if (finishReason != null) {
                        return;
                    }
                } catch {
                    // 忽略解析错误
                }
            }
        }
    }
}

class OllamaProvider implements IApiProvider {
    private endpoint: string;

    constructor(private config: ApiConfig) {
        this.endpoint = this.config.baseUrl;
    }

    async chatStream(
        messages: ChatMessage[],
        onChunk: (chunk: string) => void
    ): Promise<void> {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.apiKey || 'ollama'}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.config.model,
                messages,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('无法读取响应流');
        }

        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                let trimmed = line.trim();
                if (!trimmed) continue;

                if (trimmed.startsWith('data: ')) {
                    trimmed = trimmed.slice(6);
                }

                try {
                    const data = JSON.parse(trimmed);
                    const content = data.choices?.[0]?.delta?.content || '';
                    if (content) {
                        onChunk(content);
                    }
                    const finishReason = data.choices?.[0]?.finish_reason;
                    if (finishReason != null) {
                        return;
                    }
                } catch {
                    // 忽略解析错误
                }
            }
        }
    }
}

export class ApiProviderFactory {
    static create(config: ApiConfig): IApiProvider {
        switch (config.provider) {
            case 'qwen':
                return new QwenProvider(config);
            case 'deepseek':
                return new DeepSeekProvider(config);
            case 'ollama':
                return new OllamaProvider(config);
            default:
                throw new Error(`Unsupported provider: ${config.provider}`);
        }
    }
}