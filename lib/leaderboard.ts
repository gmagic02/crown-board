import type { Payment, Affiliate, Membership } from './whop'

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number
  name: string
  amount?: number
  count: number
}

/**
 * Date range filter type
 */
export type DateRange = 'today' | '7d' | '30d' | 'all'

/**
 * Filters data by date range
 */
function filterByDateRange<T extends { createdAt?: string; lastActivityAt?: string }>(
  data: T[],
  range: DateRange
): T[] {
  if (range === 'all') {
    return data
  }

  const now = new Date()
  const cutoffDate = new Date()

  switch (range) {
    case 'today':
      cutoffDate.setHours(0, 0, 0, 0)
      break
    case '7d':
      cutoffDate.setDate(now.getDate() - 7)
      cutoffDate.setHours(0, 0, 0, 0)
      break
    case '30d':
      cutoffDate.setDate(now.getDate() - 30)
      cutoffDate.setHours(0, 0, 0, 0)
      break
  }

  return data.filter((item) => {
    const dateStr = item.createdAt || item.lastActivityAt
    if (!dateStr) return false
    const itemDate = new Date(dateStr)
    return itemDate >= cutoffDate
  })
}

/**
 * Calculates top spenders from payment records
 * 
 * @param payments - Array of payment records
 * @param range - Date range filter (default: 'all')
 * @returns Sorted array of leaderboard entries by total amount spent
 */
export function getTopSpenders(payments: Payment[], range: DateRange = 'all'): LeaderboardEntry[] {
  // Filter by date range
  const filteredPayments = filterByDateRange(payments, range)
  
  // Group payments by user and sum amounts
  const userTotals = new Map<string, { name: string; total: number }>()
  
  for (const payment of filteredPayments) {
    const existing = userTotals.get(payment.userId)
    if (existing) {
      existing.total += payment.amount
    } else {
      userTotals.set(payment.userId, {
        name: payment.userName,
        total: payment.amount,
      })
    }
  }
  
  // Convert to array and sort by total (descending)
  const entries: LeaderboardEntry[] = Array.from(userTotals.entries())
    .map(([userId, data]) => ({
      rank: 0, // Will be set after sorting
      name: data.name,
      amount: data.total,
      count: filteredPayments.filter(p => p.userId === userId).length,
    }))
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
  
  return entries
}

/**
 * Calculates top affiliates from payment records
 * 
 * @param payments - Array of payment records (must include affiliate information)
 * @param range - Date range filter (default: 'all')
 * @returns Sorted array of leaderboard entries by total affiliate earnings
 */
export function getTopAffiliates(payments: Payment[], range: DateRange = 'all'): LeaderboardEntry[] {
  // Filter by date range
  const filteredPayments = filterByDateRange(payments, range)
  
  // Group payments by affiliate and sum amounts
  const affiliateTotals = new Map<string, { name: string; total: number; count: number }>()
  
  for (const payment of filteredPayments) {
    if (payment.affiliateId && payment.affiliateName) {
      const existing = affiliateTotals.get(payment.affiliateId)
      if (existing) {
        existing.total += payment.amount
        existing.count += 1
      } else {
        affiliateTotals.set(payment.affiliateId, {
          name: payment.affiliateName,
          total: payment.amount,
          count: 1,
        })
      }
    }
  }
  
  // Convert to array and sort by total (descending)
  const entries: LeaderboardEntry[] = Array.from(affiliateTotals.entries())
    .map(([affiliateId, data]) => ({
      rank: 0, // Will be set after sorting
      name: data.name,
      amount: data.total,
      count: data.count,
    }))
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
  
  return entries
}

/**
 * Calculates most active members from membership records
 * 
 * @param memberships - Array of membership records
 * @param range - Date range filter (default: 'all')
 * @returns Sorted array of leaderboard entries by activity count
 */
export function getMostActiveMembers(memberships: Membership[], range: DateRange = 'all'): LeaderboardEntry[] {
  // Filter by date range
  const filteredMemberships = filterByDateRange(memberships, range)
  
  // Group memberships by user and sum activity counts
  const userActivity = new Map<string, { name: string; totalActivity: number }>()
  
  for (const membership of filteredMemberships) {
    if (membership.status === 'active') {
      const existing = userActivity.get(membership.userId)
      if (existing) {
        existing.totalActivity += membership.activityCount
      } else {
        userActivity.set(membership.userId, {
          name: membership.userName,
          totalActivity: membership.activityCount,
        })
      }
    }
  }
  
  // Convert to array and sort by activity count (descending)
  const entries: LeaderboardEntry[] = Array.from(userActivity.entries())
    .map(([userId, data]) => ({
      rank: 0, // Will be set after sorting
      name: data.name,
      count: data.totalActivity,
    }))
    .sort((a, b) => b.count - a.count)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
  
  return entries
}

