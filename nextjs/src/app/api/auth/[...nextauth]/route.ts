import NextAuth from 'next-auth/next'
import KeycloakProviders from 'next-auth/providers/keycloak'

export const authConfig = {
    providers: [
        KeycloakProviders({
            clientId: process.env.KEYCLOAK_CLIENT_ID as string,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET as string,
            issuer: process.env.KEYCLOAK_ISSUER
        })
    ]
}

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };