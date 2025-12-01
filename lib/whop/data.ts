import { whopsdk } from './sdk'
import type { Payment, Affiliate, Membership } from '../whop'

/**
 * Company analytics data structure
 */
export interface CompanyAnalytics {
  payments: Payment[]
  affiliates: Affiliate[]
  memberships: Membership[]
}

/**
 * Loads all analytics data for a specific company from Whop API
 * 
 * @param companyId - The Whop company ID
 * @returns Company analytics including payments, affiliates, and memberships
 */
export async function getCompanyAnalytics(companyId: string): Promise<CompanyAnalytics> {
  try {
    // Fetch all data in parallel from Whop API
    const [membersResponse, purchasesResponse, affiliatesResponse] = await Promise.all([
      whopsdk.members().list({ company_id: companyId }),
      whopsdk.purchases().list({ company_id: companyId }),
      whopsdk.affiliates().list({ company_id: companyId }),
    ])

    // Normalize memberships data
    const memberships: Membership[] = (membersResponse.data || []).map((member: any) => ({
      id: member.id || String(Math.random()),
      userId: member.user?.id || member.user_id || '',
      userName: member.user?.username || member.user?.name || member.user?.email || 'Unknown User',
      productId: member.product?.id || member.product_id || '',
      productName: member.product?.name || 'Unknown Product',
      status: member.status || 'unknown',
      lastActivityAt: member.last_activity_at || member.lastActivityAt || member.joined_at || new Date().toISOString(),
      activityCount: parseInt(member.activity_count || member.activityCount || 0, 10),
    }))

    // Normalize payments data
    const payments: Payment[] = (purchasesResponse.data || []).map((payment: any) => ({
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

    // Normalize affiliates data
    const affiliates: Affiliate[] = (affiliatesResponse.data || []).map((affiliate: any) => ({
      id: affiliate.id || affiliate.affiliate?.id || String(Math.random()),
      userId: affiliate.affiliate?.id || affiliate.user_id || affiliate.id || '',
      userName: affiliate.affiliate?.username || affiliate.affiliate?.name || affiliate.user?.username || 'Unknown Affiliate',
      totalEarnings: parseFloat(affiliate.revenue || affiliate.total_earnings || affiliate.earnings || 0),
      totalReferrals: parseInt(affiliate.referrals || affiliate.total_referrals || affiliate.count || 0, 10),
    }))

    return {
      payments,
      affiliates,
      memberships,
    }
  } catch (error: any) {
    // Log error but don't expose sensitive info
    if (process.env.NODE_ENV === 'development') {
      console.error('Error loading company analytics:', error.message)
    }
    
    // If API fails, return empty arrays (not demo data)
    // This ensures we don't show fake data when API is down
    return {
      payments: [],
      affiliates: [],
      memberships: [],
    }
  }
}

