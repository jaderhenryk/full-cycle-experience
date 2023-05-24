import { JWT, getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from "next/server"

type Config = { params: any };

type RouteHandler = (req: NextRequest, token: JWT, config: Config) => Promise<NextResponse | Response> | NextResponse | Response;

export function checkAuthentication(routerHandler: RouteHandler) {
    return async (req: NextRequest, config: Config) => {
        const token = await getToken({ req });
        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        return routerHandler(req, token, config);
    }
}