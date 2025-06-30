import { verifyClerkToken } from '@clerk/mcp-tools/next'
import { createMcpHandler, experimental_withMcpAuth as withMcpAuth } from '@vercel/mcp-adapter'
import { auth, clerkClient } from '@clerk/nextjs/server'

const clerk = await clerkClient()

const handler = createMcpHandler((server) => {
  server.tool(
    'get-clerk-user-data',
    'Gets data about the Clerk user that authorized this request',
    {},
    async (_, { authInfo }) => {
      const userId = authInfo!.extra!.userId! as string
      const userData = await clerk.users.getUser(userId)

      return {
        content: [{ type: 'text', text: JSON.stringify(userData) }],
      }
    },
  )

  server.tool(
    'getUserCount',
    'Retrieves the total count of users in your Clerk instance',
    {},
    async () => {
      const userCount = await clerk.users.getCount()
      return {
        content: [{ type: 'text', text: JSON.stringify({ count: userCount }) }],
      }
    },
  )
})

const authHandler = withMcpAuth(
  handler,
  async (_, token) => {
    const clerkAuth = await auth({ acceptsToken: 'oauth_token' })
    return verifyClerkToken(clerkAuth, token)
  },
  {
    required: true,
    resourceMetadataPath: '/.well-known/oauth-protected-resource/mcp',
  },
)

export { authHandler as GET, authHandler as POST }
