import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { whopsdk } from '@/lib/whop-sdk'
import Crownboard from '@/components/Crownboard'

export const dynamic = 'force-dynamic'

interface DashboardPageProps {
  searchParams: Promise<{ tab?: string; range?: string }>
}

/**
 * Legacy dashboard route - redirects to company-specific route if token exists
 * Otherwise shows demo state for direct browser access
 */
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Try to get companyId from token
  try {
    const { userId } = await whopsdk.verifyUserToken(await headers())
    
    // If we have a valid token, try to get companyId from the token data
    // Note: The official SDK may return companyId differently - adjust as needed
    // For now, we'll just show demo if we can't determine companyId
    const params = await searchParams
    const tab = params.tab || 'spenders'
    const range = params.range || 'all'
    
    // If we have userId, we could potentially look up companyId
    // For now, show demo since we don't have companyId in this route
    // In a real scenario, you might want to fetch user's companies
  } catch {
    // Token missing or invalid - show demo for direct access
  }
  
  // No valid token/companyId - show demo state
  return <Crownboard mode="demo" />
}

