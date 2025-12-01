import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { verifyUserToken } from '@/lib/whop/sdk'
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
  const headersList = await headers()
  
  // Try to get companyId from token
  try {
    const tokenData = await verifyUserToken(headersList)
    
    // If we have a token with companyId, redirect to company route
    if (tokenData.companyId) {
      const params = await searchParams
      const tab = params.tab || 'spenders'
      const range = params.range || 'all'
      redirect(`/dashboard/${tokenData.companyId}?tab=${tab}&range=${range}`)
    }
  } catch {
    // Token missing or invalid - show demo for direct access
  }
  
  // No valid token/companyId - show demo state
  return <Crownboard mode="demo" />
}

