import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { fetchPortfolio, fetchMe, Position, User } from '../lib/api'

export default function Portfolio() {
  const [positions, setPositions] = useState<Position[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([fetchPortfolio(), fetchMe()])
      .then(([p, u]) => { setPositions(p); setUser(u) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalValue = positions.reduce((s, p) => s + p.current_value, 0)
  const totalPnl   = positions.reduce((s, p) => s + p.pnl, 0)

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <h1 className="text-xl font-bold text-white mb-4">Портфель</h1>

        {user && (
          <div className="grid grid-cols-3 gap-3 mb-1">
            <MiniStat label="Баланс" value={user.balance.toFixed(0)} color="accent" />
            <MiniStat label="Позиции" value={totalValue.toFixed(1)} color="blue" />
            <MiniStat
              label="P&L"
              value={`${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(1)}`}
              color={totalPnl >= 0 ? 'yes' : 'no'}
            />
          </div>
        )}
      </div>

      <div className="flex-1 px-4 pb-6 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-surface border border-border rounded-xl p-4 space-y-3 animate-shimmer">
                <div className="h-4 bg-surface-2 rounded w-3/4" />
                <div className="h-3 bg-surface-2 rounded w-full" />
                <div className="h-10 bg-surface-2 rounded" />
              </div>
            ))}
          </div>
        ) : positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-3xl">
              📊
            </div>
            <div className="text-center">
              <p className="text-ink-2 font-semibold">Нет позиций</p>
              <p className="text-ink-3 text-sm mt-1">Купите шеры на любом рынке</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg shadow-accent"
            >
              К рынкам
            </button>
          </div>
        ) : (
          positions.map((p, i) => (
            <PositionCard
              key={p.market_id}
              pos={p}
              index={i}
              onClick={() => navigate(`/market/${p.market_id}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string; color: 'yes' | 'no' | 'accent' | 'blue' }) {
  const colorMap = {
    yes: 'text-yes', no: 'text-no', accent: 'text-accent', blue: 'text-blue-400',
  }
  return (
    <div className="bg-surface border border-border rounded-xl p-3 text-center">
      <p className={`text-base font-bold tabular ${colorMap[color]}`}>{value}</p>
      <p className="text-2xs text-ink-3 mt-0.5">{label}</p>
    </div>
  )
}

function PositionCard({
  pos, index, onClick,
}: {
  pos: Position; index: number; onClick: () => void
}) {
  const pnlUp = pos.pnl >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="bg-surface border border-border rounded-xl p-4 cursor-pointer hover:border-border-2 transition-all"
    >
      <p className="text-base font-semibold text-white line-clamp-2 mb-3">{pos.market_question}</p>

      {/* Shares */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {pos.shares_yes > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-yes/10 text-yes border border-yes/20">
            YES {pos.shares_yes.toFixed(2)} шт
          </span>
        )}
        {pos.shares_no > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-no/10 text-no border border-no/20">
            NO {pos.shares_no.toFixed(2)} шт
          </span>
        )}
        <span className="text-xs px-2.5 py-1 rounded-lg bg-surface-2 text-ink-3 border border-border">
          YES {Math.round(pos.price_yes * 100)}¢
        </span>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div>
          <span className="text-xs text-ink-3">Стоимость: </span>
          <span className="text-xs font-semibold text-ink-2 tabular">{pos.current_value.toFixed(2)}</span>
        </div>
        <span className={`text-sm font-bold tabular ${pnlUp ? 'text-yes' : 'text-no'}`}>
          {pnlUp ? '+' : ''}{pos.pnl.toFixed(2)}
        </span>
      </div>

      {/* Resolution badge */}
      {pos.market_status === 'resolved' && pos.market_resolution && (
        <div className={`mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-lg ${
          pos.market_resolution === 'yes' ? 'bg-yes/10 text-yes' : 'bg-no/10 text-no'
        }`}>
          Итог: {pos.market_resolution.toUpperCase()}
        </div>
      )}
    </motion.div>
  )
}
