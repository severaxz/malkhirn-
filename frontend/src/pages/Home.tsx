import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fetchMarkets, Market } from '../lib/api'
import MarketCard from '../components/MarketCard'

const CATEGORIES = ['All', 'Crypto', 'Sports', 'Tech', 'Science', 'Politics']

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('active')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchMarkets(status, category === 'All' ? undefined : category)
      .then(setMarkets)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category, status])

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-0 flex-shrink-0">
        {[
          { key: 'active',   label: 'Активные' },
          { key: 'resolved', label: 'Завершённые' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              status === t.key ? 'text-white' : 'text-ink-3'
            }`}
          >
            {status === t.key && (
              <motion.div
                layoutId="status-tab"
                className="absolute inset-0 bg-surface-2 border border-border rounded-lg"
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 flex-shrink-0">
        {CATEGORIES.map((c) => (
          <motion.button
            key={c}
            whileTap={{ scale: 0.93 }}
            onClick={() => setCategory(c)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              category === c
                ? 'bg-accent border-accent/50 text-white shadow-accent'
                : 'bg-surface-2 border-border text-ink-3 hover:border-border-2'
            }`}
          >
            {c}
          </motion.button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 space-y-3">
        {loading ? (
          <SkeletonList />
        ) : markets.length === 0 ? (
          <EmptyState onReset={() => setCategory('All')} />
        ) : (
          markets.map((m, i) => <MarketCard key={m.id} market={m} index={i} />)
        )}
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-3 pt-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 bg-surface-2 rounded-full w-20 animate-shimmer" />
            <div className="h-4 bg-surface-2 rounded-full w-16 animate-shimmer" />
          </div>
          <div className="h-5 bg-surface-2 rounded w-full animate-shimmer" />
          <div className="h-4 bg-surface-2 rounded w-3/4 animate-shimmer" />
          <div className="flex gap-2">
            <div className="flex-1 h-14 bg-surface-2 rounded-lg animate-shimmer" />
            <div className="flex-1 h-14 bg-surface-2 rounded-lg animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center pt-20 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-3xl">
        🔮
      </div>
      <div className="text-center">
        <p className="text-ink-2 font-semibold text-base">Нет рынков</p>
        <p className="text-ink-3 text-sm mt-1">В этой категории пока нет событий</p>
      </div>
      <button
        onClick={onReset}
        className="px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg shadow-accent"
      >
        Показать все
      </button>
    </div>
  )
}
