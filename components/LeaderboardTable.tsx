import type { LeaderboardEntry } from '@/lib/whop/data'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  showAmount?: boolean
  amountLabel?: string
  countLabel?: string
  winnerId?: string
}

export default function LeaderboardTable({
  entries,
  showAmount = false,
  amountLabel = 'Total Spent',
  countLabel = 'Count',
  winnerId,
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No data available</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Rank</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Name</th>
            {showAmount && (
              <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">
                {amountLabel}
              </th>
            )}
            <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">
              {countLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const rank = index + 1
            const isWinner = winnerId === entry.id
            return (
              <tr
                key={entry.id}
                className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                  isWinner
                    ? 'bg-yellow-500/10 border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                    : ''
                }`}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 font-medium">
                      {isWinner ? '👑' : rank === 1 ? '🏆' : `#${rank}`}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`font-medium ${isWinner ? 'text-yellow-400' : 'text-gray-100'}`}>
                    {entry.name}
                  </span>
                </td>
              {showAmount && (
                <td className="py-4 px-4 text-right">
                  <span className={isWinner ? 'text-yellow-400 font-bold text-lg' : 'text-gray-100 font-semibold'}>
                    ${entry.totalSpend?.toFixed(2) || '0.00'}
                  </span>
                </td>
              )}
              <td className="py-4 px-4 text-right">
                <span className={isWinner ? 'text-yellow-400 font-semibold' : 'text-gray-300'}>
                  {entry.purchasesCount || 0}
                </span>
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

