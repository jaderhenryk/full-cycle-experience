import { prisma } from "@/app/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkAuthentication } from "../check-authentication";

export const POST = checkAuthentication(async (request: NextRequest, token) => {
    const body = await request.json();
    const chatCreated = await prisma.chat.create({
        data: {
            user_id: token.sub!,
            messages: {
                create: {
                    content: body.message,
                }
            }
        },
        select: {
            id: true,
            messages: true
        }
    });
    return NextResponse.json(chatCreated)
});

export const GET = checkAuthentication(async (_request:  NextRequest, token) => {
    const chats = await prisma.chat.findMany({
        where: {
            user_id: token.sub
        },
        select: {
            id: true,
            messages: {
                orderBy: {
                    created_at: 'asc'
                },
                take: 1
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });
    return NextResponse.json(chats)
});