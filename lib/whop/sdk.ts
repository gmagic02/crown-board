import { headers } from 'next/headers'

/**
 * Whop SDK wrapper for token verification
 * In production, this would use the official @whop-apps/sdk package
 */
export interface WhopUserToken {
  userId: string
  companyId?: string
  email?: string
  raw?: any
}

/**
 * Verifies Whop user token from request headers
 * 
 * @param headersInstance - Headers instance from next/headers
 * @returns User token data or throws error if invalid
 */
export async function verifyUserToken(headersInstance: Headers): Promise<WhopUserToken> {
  // Development mode bypass
  if (process.env.NODE_ENV === 'development') {
    const token = headersInstance.get('x-whop-user-token')
    if (!token) {
      // In dev, return fake user if no token
      return {
        userId: 'dev_user',
        companyId: 'dev_company',
        email: 'dev@example.com',
      }
    }
  }

  const token = headersInstance.get('x-whop-user-token')
  
  if (!token) {
    throw new Error('Missing Whop user token')
  }

  try {
    // Decode JWT payload
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }

    const payload = parts[1]
    const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = base64Payload + '='.repeat((4 - (base64Payload.length % 4)) % 4)
    const decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf-8')
    const payloadData = JSON.parse(decodedPayload)

    const userId = payloadData.user_id || payloadData.id || payloadData.userId
    if (!userId) {
      throw new Error('Token missing user_id')
    }

    const companyId = 
      payloadData.company_id || 
      payloadData.install?.company_id ||
      payloadData.companyId ||
      undefined

    return {
      userId: String(userId),
      companyId: companyId ? String(companyId) : undefined,
      email: payloadData.email || undefined,
      raw: payloadData,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid Whop session: ${error.message}`)
    }
    throw new Error('Invalid Whop session')
  }
}

/**
 * Whop SDK client for API calls
 */
class WhopSDK {
  private apiKey: string

  constructor() {
    const apiKey = process.env.WHOP_API_KEY
    if (!apiKey && process.env.NODE_ENV === 'production') {
      throw new Error('WHOP_API_KEY environment variable is required')
    }
    this.apiKey = apiKey || ''
  }

  private async fetch(path: string, options: RequestInit = {}) {
    const response = await fetch(`https://api.whop.com/v2/${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error: any = new Error(`Whop API error: ${response.status} ${response.statusText}`)
      error.status = response.status
      throw error
    }

    return response.json()
  }

  async members() {
    return {
      list: async (params: { company_id: string }) => {
        const data = await this.fetch(`memberships?company_id=${params.company_id}`)
        return { data: data.data || data || [] }
      },
    }
  }

  async purchases() {
    return {
      list: async (params: { company_id: string }) => {
        const data = await this.fetch(`payments?company_id=${params.company_id}`)
        return { data: data.data || data || [] }
      },
    }
  }

  async affiliates() {
    return {
      list: async (params: { company_id: string }) => {
        const data = await this.fetch(`affiliates?company_id=${params.company_id}`)
        return { data: data.data || data || [] }
      },
    }
  }
}

// Export singleton instance
export const whopsdk = new WhopSDK()

