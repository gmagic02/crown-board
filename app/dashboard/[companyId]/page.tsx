import { headers } from 'next/headers'
import { verifyUserToken } from '@/lib/whop/sdk'
import { getCompanyAnalytics } from '@/lib/whop/data'
import {
  getTopSpenders,
  getTopAffiliates,
  getMostActiveMembers,
  type DateRange,
} from '@/lib/leaderboard'
import Crownboard from '@/components/Crownboard'

export const dynamic = 'force-dynamic'

interface CompanyDashboardPageProps {
  params: Promise<{ companyId: string }>
  searchParams: Promise<{ tab?: string; range?: string }>
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-100 mb-4">Crownboard</h1>
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-4">
          <p className="text-red-200 text-sm">{message}</p>
        </div>
        <p className="text-gray-400 text-sm">
          Please ensure you're opening Crownboard from within the Whop dashboard.
        </p>
      </div>
    </div>
  )
}

function DemoState() {
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

export default async function CompanyDashboardPage({
  params,
  searchParams,
}: CompanyDashboardPageProps) {
  // 1. Get companyId from route params (REQUIRED)
  const { companyId } = await params
  
  if (!companyId) {
    return <ErrorState message="Missing company context. Expected route /dashboard/[companyId]." />
  }

  const headersList = await headers()
  const searchParamsResolved = await searchParams

  // 2. Verify Whop user token
  let userId: string
  try {
    const tokenData = await verifyUserToken(headersList)
    userId = tokenData.userId
  } catch (error) {
    // If token is missing or invalid, show error (not demo)
    // Demo is ONLY for when there's no companyId param
    const errorMessage = error instanceof Error ? error.message : 'Invalid Whop session'
    if (process.env.NODE_ENV === 'development') {
      console.error('Whop token verification failed:', errorMessage)
    }
    return <ErrorState message="Invalid Whop session. Please open this app from within the Whop dashboard." />
  }

  // 3. Load real company analytics data from Whop API
  const analytics = await getCompanyAnalytics(companyId)

  // 4. Calculate leaderboards with real data
  const activeTab = (searchParamsResolved.tab as 'spenders' | 'affiliates' | 'active') || 'spenders'
  const dateRange: DateRange = (searchParamsResolved.range as DateRange) || 'all'

  const topSpenders = getTopSpenders(analytics.payments, dateRange)
  const topAffiliates = getTopAffiliates(analytics.payments, dateRange)
  const mostActive = getMostActiveMembers(analytics.memberships, dateRange)

  // 5. Render Crownboard with real data
  return (
    <Crownboard
      companyId={companyId}
      userId={userId}
      topSpenders={topSpenders}
      topAffiliates={topAffiliates}
      activeMembers={mostActive}
      activeTab={activeTab}
      dateRange={dateRange}
    />
  )
}

