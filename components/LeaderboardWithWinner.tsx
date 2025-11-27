'use client'

import { useState } from 'react'
import type { LeaderboardEntry } from '@/lib/leaderboard'
import LeaderboardTable from './LeaderboardTable'

interface LeaderboardWithWinnerProps {
  entries: LeaderboardEntry[]
  showAmount?: boolean
  amountLabel?: string
  countLabel?: string
  tab?: string
  range?: string
}

export default function LeaderboardWithWinner({
  entries,
  showAmount = false,
  amountLabel = 'Total Spent',
  countLabel = 'Count',
  tab = 'spenders',
  range = 'all',
}: LeaderboardWithWinnerProps) {
  const [winner, setWinner] = useState<LeaderboardEntry | null>(null)
  const [showModal, setShowModal] = useState(false)

  const pickRandomWinner = () => {
    if (entries.length === 0) return

    const randomIndex = Math.floor(Math.random() * entries.length)
    const selectedWinner = entries[randomIndex]
    setWinner(selectedWinner)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
  }

  const exportToCSV = () => {
    if (entries.length === 0) return

    // Create CSV headers
    const headers = ['Rank', 'Name', 'Amount', 'Count']
    
    // Create CSV rows
    const rows = entries.map((entry) => {
      const amount = showAmount && entry.amount !== undefined 
        ? entry.amount.toFixed(2) 
        : ''
      return [
        entry.rank.toString(),
        entry.name,
        amount,
        entry.count.toString(),
      ]
    })

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // Create Blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `whop-leaderboard-${tab}-${range}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No data available</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex gap-3 flex-wrap">
        <button
          onClick={pickRandomWinner}
          className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
        >
          🎲 Pick Random Winner
        </button>
        <button
          onClick={exportToCSV}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg shadow-md transition-colors"
        >
          📥 Export CSV
        </button>
      </div>

      <LeaderboardTable
        entries={entries}
        showAmount={showAmount}
        amountLabel={amountLabel}
        countLabel={countLabel}
        winnerRank={winner?.rank}
      />

      {showModal && winner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-2xl border-2 border-yellow-500">
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-white mb-6">Winner!</h2>
              <div className="space-y-3 text-left bg-gray-900 rounded-lg p-4">
                <div>
                  <span className="text-gray-400">Name:</span>
                  <span className="ml-2 text-white font-semibold text-lg">{winner.name}</span>
                </div>
                {showAmount && winner.amount !== undefined && (
                  <div>
                    <span className="text-gray-400">{amountLabel}:</span>
                    <span className="ml-2 text-yellow-400 font-bold text-lg">
                      ${winner.amount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">{countLabel}:</span>
                  <span className="ml-2 text-white font-semibold">{winner.count}</span>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

