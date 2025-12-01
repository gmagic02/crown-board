import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { verifyUserToken } from '@/lib/whop/sdk'

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
  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">
          Crownboard
        </h1>
        <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
          You're viewing demo data. Install and open Crownboard inside Whop to see your real community stats.
        </div>
        <p className="text-gray-400 text-lg mb-6 max-w-2xl">
          Crownboard helps creators rank their top supporters, affiliates, and most active members in real time.
        </p>
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="text-center py-12 text-gray-400">
            <p>Install Crownboard in your Whop business to get started.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

