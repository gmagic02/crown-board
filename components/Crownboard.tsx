'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import LeaderboardWithWinner from './LeaderboardWithWinner'
import type { CompanyAnalytics } from '@/lib/whop/data'

type TabType = 'spenders' | 'affiliates' | 'active'

interface CrownboardProps {
  companyId: string
  userId: string
  topSpenders: CompanyAnalytics['topSpenders']
  topAffiliates: CompanyAnalytics['topAffiliates']
  mostActiveMembers: CompanyAnalytics['mostActiveMembers']
  randomWinnerPool: CompanyAnalytics['randomWinnerPool']
}

export default function Crownboard({
  companyId,
  userId,
  topSpenders,
  topAffiliates,
  mostActiveMembers,
  randomWinnerPool,
}: CrownboardProps) {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get('tab') as TabType) || 'spenders'
  const dateRange = (searchParams.get('range') || 'all') as string
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
            href={`/dashboard/${companyId}?tab=${activeTab}&range=today`}
            isActive={dateRange === 'today'}
            label="Today"
          />
          <DateRangeButton
            href={`/dashboard/${companyId}?tab=${activeTab}&range=7d`}
            isActive={dateRange === '7d'}
            label="Last 7 days"
          />
          <DateRangeButton
            href={`/dashboard/${companyId}?tab=${activeTab}&range=30d`}
            isActive={dateRange === '30d'}
            label="Last 30 days"
          />
          <DateRangeButton
            href={`/dashboard/${companyId}?tab=${activeTab}&range=all`}
            isActive={dateRange === 'all'}
            label="All time"
          />
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-700">
          <nav className="flex space-x-1">
            <TabButton
              href={`/dashboard/${companyId}?tab=spenders&range=${dateRange}`}
              isActive={activeTab === 'spenders'}
              label="Top Spenders"
            />
            <TabButton
              href={`/dashboard/${companyId}?tab=affiliates&range=${dateRange}`}
              isActive={activeTab === 'affiliates'}
              label="Top Affiliates"
            />
            <TabButton
              href={`/dashboard/${companyId}?tab=active&range=${dateRange}`}
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
              companyId={companyId}
              randomWinnerPool={randomWinnerPool}
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
              companyId={companyId}
              randomWinnerPool={randomWinnerPool}
            />
          )}
          {activeTab === 'active' && (
            <LeaderboardWithWinner
              entries={mostActiveMembers}
              showAmount={false}
              countLabel="Activity Count"
              tab={activeTab}
              range={dateRange}
              companyId={companyId}
              randomWinnerPool={randomWinnerPool}
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

