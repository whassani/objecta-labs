export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatParams {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  text: string;
  model: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatChunk {
  text: string;
  done: boolean;
}

export interface LLMProvider {
  chat(params: ChatParams): Promise<ChatResponse>;
  streamChat(params: ChatParams): AsyncIterator<ChatChunk>;
}
