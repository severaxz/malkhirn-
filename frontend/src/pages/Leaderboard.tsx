import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchLeaderboard, fetchMe, LeaderEntry, User } from '../lib/api'

const MEDALS = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([])
  const [me, setMe] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchLeaderboard(), fetchMe()])
      .then(([l, u]) => { setLeaders(l); setMe(u) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const myEntry = me ? leaders.find(l => l.telegram_id === me.telegram_id) : null

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <h1 className="text-xl font-bold text-white">Лидерборд</h1>
        <p className="text-sm text-ink-3 mt-0.5">Топ трейдеров по прибыли</p>
      </div>

      {/* My rank highlight */}
      {myEntry && (
        <div className="px-4 mb-4 flex-shrink-0">
          <div className="bg-accent/8 border border-accent/25 rounded-xl p-3 flex items-center gap-3">
            <span className="text-sm font-bold text-accent w-8 text-center">#{myEntry.rank}</span>
            <div className="w-8 h-8 rounded-full bg-accent-grad flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {(myEntry.first_name?.[0] ?? '?').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {myEntry.first_name ?? myEntry.username ?? 'Вы'}
              </p>
              <p className="text-2xs text-ink-3">Вы</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-bold tabular ${myEntry.total_pnl >= 0 ? 'text-yes' : 'text-no'}`}>
                {myEntry.total_pnl >= 0 ? '+' : ''}{myEntry.total_pnl.toFixed(1)}
              </p>
              <p className="text-2xs text-ink-3">P&L</p>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 px-4 pb-6 space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="bg-surface border border-border rounded-xl p-3 flex items-center gap-3 animate-shimmer">
                <div className="w-8 h-8 bg-surface-2 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-surface-2 rounded w-28" />
                  <div className="h-2.5 bg-surface-2 rounded w-16" />
                </div>
                <div className="h-4 bg-surface-2 rounded w-12" />
              </div>
            ))}
          </div>
        ) : (
          leaders.map((entry, i) => (
            <LeaderRow
              key={entry.telegram_id}
              entry={entry}
              index={i}
              isMe={me?.telegram_id === entry.telegram_id}
            />
          ))
        )}
      </div>
    </div>
  )
}

function LeaderRow({
  entry, index, isMe,
}: {
  entry: LeaderEntry; index: number; isMe: boolean
}) {
  const pnlUp    = entry.total_pnl >= 0
  const initial  = (entry.first_name?.[0] ?? entry.username?.[0] ?? '?').toUpperCase()
  const hasMedal = entry.rank <= 3

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        isMe
          ? 'bg-accent/8 border-accent/25'
          : 'bg-surface border-border'
      }`}
    >
      {/* Rank */}
      <div className="w-8 text-center flex-shrink-0">
        {hasMedal
          ? <span className="text-lg leading-none">{MEDALS[entry.rank - 1]}</span>
          : <span className="text-xs font-bold text-ink-3">#{entry.rank}</span>
        }
      </div>

      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        isMe
          ? 'bg-accent-grad text-white'
          : 'bg-surface-3 text-ink-2 border border-border'
      }`}>
        {initial}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {entry.first_name ?? entry.username ?? `#${entry.telegram_id}`}
        </p>
        {entry.username && entry.first_name && (
          <p className="text-2xs text-ink-3">@{entry.username}</p>
        )}
      </div>

      {/* P&L + balance */}
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold tabular ${pnlUp ? 'text-yes' : 'text-no'}`}>
          {pnlUp ? '+' : ''}{entry.total_pnl.toFixed(1)}
        </p>
        <p className="text-2xs text-ink-3 tabular">{entry.balance.toFixed(0)} м.</p>
      </div>
    </motion.div>
  )
}
