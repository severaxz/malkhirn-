import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchMarket, fetchMe, Market as IMarket, User } from '../lib/api'
import PriceChart from '../components/PriceChart'
import TradePanel from '../components/TradePanel'
import { formatDistanceToNowStrict } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function Market() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [market, setMarket] = useState<IMarket | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([fetchMarket(Number(id)), fetchMe()])
      .then(([m, u]) => { setMarket(m); setUser(u) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  function handleTraded(priceYes: number, priceNo: number, newBalance: number) {
    if (market) setMarket({ ...market, price_yes: priceYes, price_no: priceNo })
    if (user)   setUser({ ...user, balance: newBalance })
  }

  if (loading) return <Skeleton />
  if (!market)  return (
    <div className="flex items-center justify-center h-full text-ink-3">Рынок не найден</div>
  )

  const yesP = Math.round(market.price_yes * 100)
  const noP  = 100 - yesP
  const isActive = market.status === 'active'

  const timeLeft = new Date(market.end_date) > new Date()
    ? formatDistanceToNowStrict(new Date(market.end_date), { locale: ru, addSuffix: true })
    : 'Завершён'

  const volumeStr = market.volume >= 1000
    ? `$${(market.volume / 1000).toFixed(1)}K`
    : `$${market.volume.toFixed(0)}`

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      {/* Sticky header */}
      <div className="flex-shrink-0 sticky top-0 z-10 glass border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-ink-2 active:scale-95 transition-all flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-sm text-ink-3 flex-1 truncate">{market.category}</span>
        <span className="text-xs text-ink-3 flex-shrink-0">{timeLeft}</span>
      </div>

      <div className="px-4 pb-8 space-y-4 pt-4">
        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-xl p-4"
        >
          <p className="text-md font-bold text-white leading-snug mb-4">{market.question}</p>
          {market.description && (
            <p className="text-sm text-ink-3 leading-relaxed mb-4">{market.description}</p>
          )}

          {/* YES / NO blocks */}
          <div className="flex gap-3 mb-4">
            <BigOutcome label="YES" pct={yesP} type="yes" />
            <BigOutcome label="NO"  pct={noP}  type="no"  />
          </div>

          {/* Probability bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden flex mb-4">
            <div className="h-full bg-yes transition-all duration-700" style={{ width: `${yesP}%` }} />
            <div className="h-full bg-no  transition-all duration-700" style={{ width: `${noP}%` }} />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 pt-3 border-t border-border">
            <Stat label="Объём"    value={volumeStr} />
            <div className="w-px h-4 bg-border" />
            <Stat label="Пул YES" value={`$${market.pool_yes.toFixed(0)}`} />
            <div className="w-px h-4 bg-border" />
            <Stat label="Пул NO"  value={`$${market.pool_no.toFixed(0)}`} />
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="bg-surface border border-border rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-ink-2">Вероятность YES</span>
            <span className="text-sm font-bold text-yes tabular">{yesP}%</span>
          </div>
          <PriceChart data={market.price_history ?? []} />
        </motion.div>

        {/* Resolution */}
        {market.status === 'resolved' && market.resolution && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className={`rounded-xl p-4 text-center border ${
              market.resolution === 'yes' ? 'bg-yes/10 border-yes/25' : 'bg-no/10 border-no/25'
            }`}
          >
            <p className="text-sm font-bold text-white">
              Исход:{' '}
              <span className={market.resolution === 'yes' ? 'text-yes' : 'text-no'}>
                {market.resolution.toUpperCase()}
              </span>
            </p>
            <p className="text-xs text-ink-3 mt-1">Рынок завершён. Выплаты произведены.</p>
          </motion.div>
        )}

        {/* Trade */}
        {isActive && user && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            <TradePanel market={market} onTraded={handleTraded} balance={user.balance} />
          </motion.div>
        )}
      </div>
    </div>
  )
}

function BigOutcome({ label, pct, type }: { label: string; pct: number; type: 'yes' | 'no' }) {
  return (
    <div className={`flex-1 rounded-xl p-3.5 ${
      type === 'yes' ? 'bg-yes/[0.07] border border-yes/[0.20]' : 'bg-no/[0.07] border border-no/[0.20]'
    }`}>
      <div className={`text-3xl font-bold tabular tracking-tight ${type === 'yes' ? 'text-yes' : 'text-no'}`}>
        {pct}%
      </div>
      <div className="text-xs text-ink-3 font-semibold mt-1">{label}</div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xs text-ink-3">{label}</p>
      <p className="text-xs font-semibold text-ink-2 tabular">{value}</p>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <div className="h-10 bg-surface border border-border rounded-xl animate-shimmer" />
      <div className="bg-surface border border-border rounded-xl p-4 space-y-3 animate-shimmer">
        <div className="h-6 bg-surface-2 rounded w-full" />
        <div className="h-5 bg-surface-2 rounded w-3/4" />
        <div className="flex gap-3">
          <div className="flex-1 h-16 bg-surface-2 rounded-xl" />
          <div className="flex-1 h-16 bg-surface-2 rounded-xl" />
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl p-4 h-40 animate-shimmer" />
      <div className="bg-surface border border-border rounded-xl p-4 h-52 animate-shimmer" />
    </div>
  )
}
