import { headers } from 'next/headers'
import Link from 'next/link'
import { getWhopUser, fetchPayments, fetchAffiliates, fetchMembers } from '@/lib/whop'
import {
  getTopSpenders,
  getTopAffiliates,
  getMostActiveMembers,
  type DateRange,
} from '@/lib/leaderboard'
import LeaderboardWithWinner from '@/components/LeaderboardWithWinner'

type TabType = 'spenders' | 'affiliates' | 'active'

interface DashboardPageProps {
  searchParams: Promise<{ tab?: string; range?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const headersList = await headers()
  const whopUser = await getWhopUser(headersList)
  const params = await searchParams
  
  // If no Whop user token, show message instead of error
  if (!whopUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-100 mb-4">Crownboard</h1>
          <p className="text-gray-400">Please open this app inside Whop.</p>
        </div>
      </div>
    )
  }

  // Fetch data - use companyId if available, otherwise fall back to whopUserId
  const companyId = whopUser.companyId || whopUser.whopUserId
  const [payments, affiliates, memberships] = await Promise.all([
    fetchPayments(companyId),
    fetchAffiliates(companyId),
    fetchMembers(companyId),
  ])

  // Determine active tab and date range from search params
  const activeTab: TabType = (params.tab as TabType) || 'spenders'
  const dateRange: DateRange = (params.range as DateRange) || 'all'

  // Calculate leaderboards with date range filter
  const topSpenders = getTopSpenders(payments, dateRange)
  const topAffiliates = getTopAffiliates(payments, dateRange)
  const mostActive = getMostActiveMembers(memberships, dateRange)

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">
          Crownboard
        </h1>
        <p className="text-gray-400 text-lg mb-6 max-w-2xl">
          Crownboard helps creators rank their top supporters, affiliates, and most active members in real time.
        </p>

        {/* Date Range Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <DateRangeButton
            href={`/dashboard?tab=${activeTab}&range=today`}
            isActive={dateRange === 'today'}
            label="Today"
          />
          <DateRangeButton
            href={`/dashboard?tab=${activeTab}&range=7d`}
            isActive={dateRange === '7d'}
            label="Last 7 days"
          />
          <DateRangeButton
            href={`/dashboard?tab=${activeTab}&range=30d`}
            isActive={dateRange === '30d'}
            label="Last 30 days"
          />
          <DateRangeButton
            href={`/dashboard?tab=${activeTab}&range=all`}
            isActive={dateRange === 'all'}
            label="All time"
          />
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-700">
          <nav className="flex space-x-1">
            <TabButton
              href={`/dashboard?tab=spenders&range=${dateRange}`}
              isActive={activeTab === 'spenders'}
              label="Top Spenders"
            />
            <TabButton
              href={`/dashboard?tab=affiliates&range=${dateRange}`}
              isActive={activeTab === 'affiliates'}
              label="Top Affiliates"
            />
            <TabButton
              href={`/dashboard?tab=active&range=${dateRange}`}
              isActive={activeTab === 'active'}
              label="Most Active"
            />
          </nav>
        </div>

        {/* Leaderboard Content */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          {activeTab === 'spenders' && (
            <LeaderboardWithWinner
              entries={topSpenders}
              showAmount={true}
              amountLabel="Total Spent"
              countLabel="Purchases"
              tab={activeTab}
              range={dateRange}
            />
          )}
          {activeTab === 'affiliates' && (
            <LeaderboardWithWinner
              entries={topAffiliates}
              showAmount={true}
              amountLabel="Total Earnings"
              countLabel="Referrals"
              tab={activeTab}
              range={dateRange}
            />
          )}
          {activeTab === 'active' && (
            <LeaderboardWithWinner
              entries={mostActive}
              showAmount={false}
              countLabel="Activity Count"
              tab={activeTab}
              range={dateRange}
            />
          )}
        </div>
      </div>
    </div>
  )
}

interface TabButtonProps {
  href: string
  isActive: boolean
  label: string
}

function TabButton({ href, isActive, label }: TabButtonProps) {
  return (
    <Link
      href={href}
      className={`
        px-4 py-2 text-sm font-medium transition-colors
        ${
          isActive
            ? 'text-blue-400 border-b-2 border-blue-400'
            : 'text-gray-400 hover:text-gray-300'
        }
      `}
    >
      {label}
    </Link>
  )
}

interface DateRangeButtonProps {
  href: string
  isActive: boolean
  label: string
}

function DateRangeButton({ href, isActive, label }: DateRangeButtonProps) {
  return (
    <Link
      href={href}
      className={`
        px-4 py-2 text-sm font-medium rounded-md transition-colors
        ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }
      `}
    >
      {label}
    </Link>
  )
}

