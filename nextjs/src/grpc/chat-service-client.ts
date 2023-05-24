import { chatClient } from './client';
import { ChatServiceClient as GrpcChatServiceClient } from './rpc/pb/ChatService'

export class ChatServiceClient {
    constructor(private chatClient: GrpcChatServiceClient) {}

    chatStream(data: { chat_id: string | null; user_id: string; message: string }) {
        const stream = this.chatClient.chatStream({
            chatId: data.chat_id!,
            userId: data.user_id,
            userMessage: data.message
        });
        return stream;
    }
}

export class ChatServiceClientFactory {
    static create() {
        return new ChatServiceClient(chatClient);
    }
}