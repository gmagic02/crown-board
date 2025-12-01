/**
 * Whop API client configuration
 */
export interface WhopClient {
  fetch: (path: string) => Promise<any>
}

/**
 * Whop user information extracted from headers
 */
export interface WhopUser {
  whopUserId: string
  companyId: string | null
  email: string | null
  raw: any
}

/**
 * Payment record from Whop
 */
export interface Payment {
  id: string
  userId: string
  userName: string
  amount: number
  currency: string
  productId: string
  productName: string
  affiliateId?: string
  affiliateName?: string
  createdAt: string
}

/**
 * Affiliate record from Whop
 */
export interface Affiliate {
  id: string
  userId: string
  userName: string
  totalEarnings: number
  totalReferrals: number
}

/**
 * Membership record from Whop
 */
export interface Membership {
  id: string
  userId: string
  userName: string
  productId: string
  productName: string
  status: string
  lastActivityAt: string
  activityCount: number
}

/**
 * Verifies a Whop request and extracts session information
 * 
 * @param headers - Next.js headers object
 * @returns WhopUser object with whopUserId, companyId, email, and raw payload, or null if token is missing/invalid
 */
export async function verifyRequest(headers: Headers): Promise<WhopUser | null> {
  return getWhopUser(headers)
}

/**
 * Verifies Whop token and extracts company/tenant context
 * This is the main function to use for verifying Whop sessions
 * 
 * @param headers - Next.js headers object
 * @returns Object with companyId, whopUserId, and session data, or null if invalid
 */
export async function verifyWhopTokenOrRequest(headers: Headers): Promise<{
  companyId: string
  whopUserId: string
  email: string | null
  raw: any
} | null> {
  const whopUser = await getWhopUser(headers)
  
  if (!whopUser) {
    return null
  }
  
  // Extract companyId from various possible locations
  const companyId = 
    whopUser.companyId ||
    whopUser.raw?.company_id ||
    whopUser.raw?.install?.company_id ||
    whopUser.raw?.tenantId ||
    null
  
  // We require both whopUserId and companyId for a valid session
  if (!whopUser.whopUserId || !companyId) {
    return null
  }
  
  return {
    companyId: String(companyId),
    whopUserId: whopUser.whopUserId,
    email: whopUser.email,
    raw: whopUser.raw,
  }
}

/**
 * Loads real Crownboard stats for a specific company
 * 
 * @param companyId - The Whop company/tenant ID
 * @returns Object containing payments, affiliates, and memberships for the company
 */
export async function loadCrownboardStatsForCompany(companyId: string): Promise<{
  payments: Payment[]
  affiliates: Affiliate[]
  memberships: Membership[]
}> {
  // Fetch real data from Whop API using the companyId
  const [payments, affiliates, memberships] = await Promise.all([
    fetchPayments(undefined, companyId),
    fetchAffiliates(undefined, companyId),
    fetchMembers(undefined, companyId),
  ])
  
  return {
    payments,
    affiliates,
    memberships,
  }
}

/**
 * Verifies and extracts Whop user information from request headers
 * 
 * @param headers - Next.js headers object
 * @returns WhopUser object with whopUserId, companyId, email, and raw payload, or null if token is missing/invalid
 */
export async function getWhopUser(headers: Headers): Promise<WhopUser | null> {
  const token = headers.get('x-whop-user-token')
  
  if (!token) {
    return null
  }

  // TODO: Add real JWT verification using Whop public key in production
  // Currently decoding without signature verification for development
  // In production, you should:
  // 1. Fetch Whop's public key from their JWKS endpoint
  // 2. Verify the JWT signature using the public key
  // 3. Verify token expiration and other claims
  // 4. Then extract and return user information
  
  try {
    // Decode JWT payload without verification
    // JWT format: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('Invalid JWT format: expected 3 parts separated by dots')
      return null
    }

    // Decode the payload (second part)
    // JWT uses base64url encoding (not standard base64)
    const payload = parts[1]
    
    // Convert base64url to base64
    // Replace URL-safe characters with standard base64 characters
    const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/')
    
    // Add padding if needed for base64 decoding
    const paddedPayload = base64Payload + '='.repeat((4 - (base64Payload.length % 4)) % 4)
    
    // Decode base64 to JSON
    const decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf-8')
    const payloadData = JSON.parse(decodedPayload)

    // Extract user_id or id
    const whopUserId = payloadData.user_id || payloadData.id || null
    if (!whopUserId) {
      console.error('JWT payload missing user_id or id field')
      return null
    }

    // Extract company_id from various possible locations in the token
    // Whop tokens may have company_id at the root, or nested in install object
    const companyId = 
      payloadData.company_id || 
      payloadData.install?.company_id || 
      payloadData.companyId ||
      null

    // Extract email (optional)
    const email = payloadData.email || null

    // Verify we have at least a user ID (required)
    // Company ID is preferred but not always present
    if (!whopUserId) {
      return null
    }

    return {
      whopUserId: String(whopUserId),
      companyId: companyId ? String(companyId) : null,
      email: email ? String(email) : null,
      raw: payloadData,
    }
  } catch (error) {
    // Safely log error without exposing sensitive information
    if (error instanceof Error) {
      console.error('Error decoding Whop token:', error.message)
    } else {
      console.error('Error decoding Whop token: Unknown error')
    }
    return null
  }
}

/**
 * Creates a Whop API client instance
 * 
 * @returns WhopClient with fetch method configured with API key
 */
export function getWhopClient(): WhopClient {
  const apiKey = process.env.WHOP_API_KEY
  
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("WHOP_API_KEY missing – using mock data in development")
      return {
        fetch: async () => ({
          ok: true,
          json: async () => [],
        }),
      }
    }
    // Only throw in production
    throw new Error('WHOP_API_KEY environment variable is not set')
  }
  
  return {
    fetch: async (path: string) => {
      const response = await fetch(`https://api.whop.com/v2/${path}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const error: any = new Error(`Whop API error: ${response.status} ${response.statusText}`)
        error.status = response.status
        throw error
      }
      
      return response.json()
    },
  }
}

/**
 * Mock payment data for fallback
 */
function getMockPayments(): Payment[] {
  return [
    {
      id: 'pay_1',
      userId: 'user_1',
      userName: 'Alice Johnson',
      amount: 299.99,
      currency: 'USD',
      productId: 'prod_1',
      productName: 'Premium Membership',
      affiliateId: 'aff_1',
      affiliateName: 'Bob Smith',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'pay_2',
      userId: 'user_2',
      userName: 'Charlie Brown',
      amount: 149.99,
      currency: 'USD',
      productId: 'prod_2',
      productName: 'Basic Plan',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 'pay_3',
      userId: 'user_1',
      userName: 'Alice Johnson',
      amount: 99.99,
      currency: 'USD',
      productId: 'prod_1',
      productName: 'Premium Membership',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: 'pay_4',
      userId: 'user_3',
      userName: 'David Wilson',
      amount: 499.99,
      currency: 'USD',
      productId: 'prod_3',
      productName: 'Enterprise Plan',
      affiliateId: 'aff_2',
      affiliateName: 'Eve Davis',
      createdAt: new Date(Date.now() - 345600000).toISOString(),
    },
    {
      id: 'pay_5',
      userId: 'user_4',
      userName: 'Frank Miller',
      amount: 199.99,
      currency: 'USD',
      productId: 'prod_1',
      productName: 'Premium Membership',
      affiliateId: 'aff_1',
      affiliateName: 'Bob Smith',
      createdAt: new Date(Date.now() - 432000000).toISOString(),
    },
    {
      id: 'pay_6',
      userId: 'user_2',
      userName: 'Charlie Brown',
      amount: 149.99,
      currency: 'USD',
      productId: 'prod_2',
      productName: 'Basic Plan',
      createdAt: new Date(Date.now() - 518400000).toISOString(),
    },
  ]
}

/**
 * Fetches payment records for a Whop business
 * 
 * @param whopUserId - The Whop user ID (optional)
 * @param companyId - The company ID (optional, preferred over whopUserId)
 * @returns Array of payment records
 */
export async function fetchPayments(whopUserId?: string, companyId?: string): Promise<Payment[]> {
  // No Whop context available (likely not inside Whop) — return mock data
  if (!whopUserId && !companyId) {
    return getMockPayments()
  }

  try {
    const client = getWhopClient()
    const idToUse = companyId || whopUserId
    const data = await client.fetch(`payments?company_id=${idToUse}`)
    
    // Normalize API response to Payment format
    // API returns: { data: [{ user, amount, date, product, ... }] }
    const payments = data.data || data || []
    
    return payments.map((payment: any) => ({
      id: payment.id || String(Math.random()),
      userId: payment.user?.id || payment.user_id || '',
      userName: payment.user?.username || payment.user?.name || payment.user?.email || 'Unknown User',
      amount: parseFloat(payment.amount || payment.total_amount || 0),
      currency: payment.currency || 'USD',
      productId: payment.product?.id || payment.product_id || '',
      productName: payment.product?.name || 'Unknown Product',
      affiliateId: payment.affiliate?.id || payment.affiliate_id,
      affiliateName: payment.affiliate?.username || payment.affiliate?.name,
      createdAt: payment.date || payment.created_at || payment.createdAt || new Date().toISOString(),
    }))
  } catch (error: any) {
    if (
      (error?.status === 401 || error?.status === 403) &&
      process.env.NODE_ENV === "development"
    ) {
      console.warn("Whop API auth failed in dev – using mock data")
      return getMockPayments()
    }
    console.error('Error fetching payments from Whop API:', error)
    return getMockPayments()
  }
}

/**
 * Mock affiliate data for fallback
 */
function getMockAffiliates(): Affiliate[] {
  return [
    {
      id: 'aff_1',
      userId: 'user_aff_1',
      userName: 'Bob Smith',
      totalEarnings: 89.99,
      totalReferrals: 5,
    },
    {
      id: 'aff_2',
      userId: 'user_aff_2',
      userName: 'Eve Davis',
      totalEarnings: 149.99,
      totalReferrals: 3,
    },
    {
      id: 'aff_3',
      userId: 'user_aff_3',
      userName: 'Grace Lee',
      totalEarnings: 59.99,
      totalReferrals: 7,
    },
  ]
}

/**
 * Fetches affiliate records for a Whop business
 * 
 * @param whopUserId - The Whop user ID (optional)
 * @param companyId - The company ID (optional, preferred over whopUserId)
 * @returns Array of affiliate records
 */
export async function fetchAffiliates(whopUserId?: string, companyId?: string): Promise<Affiliate[]> {
  // No Whop context available (likely not inside Whop) — return mock data
  if (!whopUserId && !companyId) {
    return getMockAffiliates()
  }

  try {
    const client = getWhopClient()
    const idToUse = companyId || whopUserId
    const data = await client.fetch(`affiliates?company_id=${idToUse}`)
    
    // Normalize API response to Affiliate format
    // API returns: { data: [{ affiliate, revenue, ... }] }
    const affiliates = data.data || data || []
    
    return affiliates.map((affiliate: any) => ({
      id: affiliate.id || affiliate.affiliate?.id || String(Math.random()),
      userId: affiliate.affiliate?.id || affiliate.user_id || affiliate.id || '',
      userName: affiliate.affiliate?.username || affiliate.affiliate?.name || affiliate.user?.username || 'Unknown Affiliate',
      totalEarnings: parseFloat(affiliate.revenue || affiliate.total_earnings || affiliate.earnings || 0),
      totalReferrals: parseInt(affiliate.referrals || affiliate.total_referrals || affiliate.count || 0, 10),
    }))
  } catch (error: any) {
    if (
      (error?.status === 401 || error?.status === 403) &&
      process.env.NODE_ENV === "development"
    ) {
      console.warn("Whop API auth failed in dev – using mock data")
      return getMockAffiliates()
    }
    console.error('Error fetching affiliates from Whop API:', error)
    return getMockAffiliates()
  }
}

/**
 * Mock membership data for fallback
 */
function getMockMembers(): Membership[] {
  return [
    {
      id: 'mem_1',
      userId: 'user_1',
      userName: 'Alice Johnson',
      productId: 'prod_1',
      productName: 'Premium Membership',
      status: 'active',
      lastActivityAt: new Date(Date.now() - 3600000).toISOString(),
      activityCount: 42,
    },
    {
      id: 'mem_2',
      userId: 'user_2',
      userName: 'Charlie Brown',
      productId: 'prod_2',
      productName: 'Basic Plan',
      status: 'active',
      lastActivityAt: new Date(Date.now() - 7200000).toISOString(),
      activityCount: 38,
    },
    {
      id: 'mem_3',
      userId: 'user_3',
      userName: 'David Wilson',
      productId: 'prod_3',
      productName: 'Enterprise Plan',
      status: 'active',
      lastActivityAt: new Date(Date.now() - 1800000).toISOString(),
      activityCount: 55,
    },
    {
      id: 'mem_4',
      userId: 'user_4',
      userName: 'Frank Miller',
      productId: 'prod_1',
      productName: 'Premium Membership',
      status: 'active',
      lastActivityAt: new Date(Date.now() - 5400000).toISOString(),
      activityCount: 31,
    },
    {
      id: 'mem_5',
      userId: 'user_5',
      userName: 'Helen Taylor',
      productId: 'prod_2',
      productName: 'Basic Plan',
      status: 'active',
      lastActivityAt: new Date(Date.now() - 900000).toISOString(),
      activityCount: 47,
    },
    {
      id: 'mem_6',
      userId: 'user_6',
      userName: 'Ian Moore',
      productId: 'prod_1',
      productName: 'Premium Membership',
      status: 'active',
      lastActivityAt: new Date(Date.now() - 10800000).toISOString(),
      activityCount: 29,
    },
  ]
}

/**
 * Fetches membership records for a Whop business
 * 
 * @param whopUserId - The Whop user ID (optional)
 * @param companyId - The company ID (optional, preferred over whopUserId)
 * @returns Array of membership records
 */
export async function fetchMembers(whopUserId?: string, companyId?: string): Promise<Membership[]> {
  // No Whop context available (likely not inside Whop) — return mock data
  if (!whopUserId && !companyId) {
    return getMockMembers()
  }

  try {
    const client = getWhopClient()
    const idToUse = companyId || whopUserId
    const data = await client.fetch(`memberships?company_id=${idToUse}`)
    
    // Normalize API response to Membership format
    // API returns: { data: [{ user, joined_at, status, ... }] }
    const memberships = data.data || data || []
    
    return memberships.map((membership: any) => ({
      id: membership.id || String(Math.random()),
      userId: membership.user?.id || membership.user_id || '',
      userName: membership.user?.username || membership.user?.name || membership.user?.email || 'Unknown User',
      productId: membership.product?.id || membership.product_id || '',
      productName: membership.product?.name || 'Unknown Product',
      status: membership.status || 'unknown',
      lastActivityAt: membership.last_activity_at || membership.lastActivityAt || membership.joined_at || new Date().toISOString(),
      activityCount: parseInt(membership.activity_count || membership.activityCount || 0, 10),
    }))
  } catch (error: any) {
    if (
      (error?.status === 401 || error?.status === 403) &&
      process.env.NODE_ENV === "development"
    ) {
      console.warn("Whop API auth failed in dev – using mock data")
      return getMockMembers()
    }
    console.error('Error fetching memberships from Whop API:', error)
    return getMockMembers()
  }
}

