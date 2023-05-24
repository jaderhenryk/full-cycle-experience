import { ChatServiceClientFactory } from "./chat-service-client"

describe('ChatServiceClient', () => {
    test('create grpc client', (done) => {
        const chatService = ChatServiceClientFactory.create();
        const stream = chatService.chatStream({
            user_id: "1",
            message: "Hello World",
            chat_id: "999"
        });
        stream.on('end', () => { done() });
    })
})