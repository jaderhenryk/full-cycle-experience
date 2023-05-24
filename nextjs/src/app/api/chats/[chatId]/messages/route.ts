import { checkAuthentication } from "@/app/api/check-authentication";
import { prisma } from "@/app/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

export const POST = checkAuthentication(async (request: NextRequest, token, { params }: { params: { chatId: string } }) => {
    const chat = await prisma.chat.findFirstOrThrow({
        where: {
            id: params.chatId
        }
    });
    if (chat.user_id !== token.sub) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const body = await request.json();
    const messageCreated = await prisma.message.create({
        data: {
            chat_id: chat.id,
            content: body.message
        }
    });
    return NextResponse.json(messageCreated);
});

export const GET = checkAuthentication(async (_request: NextRequest, token, { params }: { params: { chatId: string } }) => {
    const chat = await prisma.chat.findFirstOrThrow({
        where: {
            id: params.chatId
        }
    });
    if (chat.user_id !== token.sub) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const messages = await prisma.message.findMany({
        where: {
            chat_id: params.chatId
        },
        orderBy: {
            created_at: 'asc'
        }
    });
    return NextResponse.json(messages)
});