// Re-export from whop/sdk for compatibility
import { verifyUserToken as _verifyUserToken, whopsdk as _whopsdk } from './whop/sdk'
export type { WhopUserToken } from './whop/sdk'

// Export whopsdk with verifyUserToken method attached
export const whopsdk = Object.assign(_whopsdk, {
  verifyUserToken: _verifyUserToken,
})

// Also export verifyUserToken directly for convenience
export { _verifyUserToken as verifyUserToken }

