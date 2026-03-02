import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Market } from '../lib/api'
import { formatDistanceToNowStrict } from 'date-fns'
import { ru } from 'date-fns/locale'

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  Crypto:   { emoji: '₿',  color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  Sports:   { emoji: '⚽', color: '#00C076', bg: 'rgba(0,192,118,0.10)' },
  Tech:     { emoji: '💻', color: '#7C5CF6', bg: 'rgba(124,92,246,0.10)' },
  Science:  { emoji: '🔬', color: '#60A5FA', bg: 'rgba(96,165,250,0.10)' },
  Politics: { emoji: '🏛', color: '#FF4D4D', bg: 'rgba(255,77,77,0.10)' },
  Other:    { emoji: '🎯', color: '#9898B4', bg: 'rgba(152,152,180,0.08)' },
}

interface Props {
  market: Market
  index?: number
}

export default function MarketCard({ market, index = 0 }: Props) {
  const navigate = useNavigate()
  const meta = CATEGORY_META[market.category] ?? CATEGORY_META.Other
  const yesP = Math.round(market.price_yes * 100)
  const noP  = 100 - yesP

  const isEnded = new Date(market.end_date) <= new Date()
  const timeLeft = isEnded
    ? 'Завершён'
    : formatDistanceToNowStrict(new Date(market.end_date), { locale: ru, addSuffix: true })

  const volumeStr = market.volume >= 1_000_000
    ? `$${(market.volume / 1_000_000).toFixed(1)}M`
    : market.volume >= 1000
    ? `$${(market.volume / 1000).toFixed(1)}K`
    : `$${market.volume.toFixed(0)}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.985 }}
      onClick={() => navigate(`/market/${market.id}`)}
      className="relative bg-surface rounded-xl border border-border shadow-card hover:shadow-card-hover hover:border-border-2 transition-all cursor-pointer overflow-hidden"
    >
      {/* Shine */}
      <div className="absolute inset-0 bg-shine pointer-events-none" />

      <div className="relative p-4">
        {/* Category + time */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded-full"
            style={{ color: meta.color, background: meta.bg }}
          >
            <span>{meta.emoji}</span>
            {market.category}
          </span>
          <span className="text-2xs text-ink-3">{timeLeft}</span>
        </div>

        {/* Question */}
        <p className="text-base font-semibold text-white leading-snug line-clamp-2 mb-4">
          {market.question}
        </p>

        {/* YES / NO blocks — большие проценты как у Polymarket */}
        <div className="flex items-stretch gap-2 mb-3">
          <OutcomeBlock label="YES" pct={yesP} type="yes" />
          <OutcomeBlock label="NO"  pct={noP}  type="no"  />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-3">
            Объём: <span className="text-ink-2 font-medium">{volumeStr}</span>
          </span>
          {/* Probability bar */}
          <div className="w-20 h-1 rounded-full bg-surface-3 overflow-hidden flex">
            <div
              className="h-full bg-yes rounded-l-full transition-all duration-700"
              style={{ width: `${yesP}%` }}
            />
            <div
              className="h-full bg-no rounded-r-full transition-all duration-700"
              style={{ width: `${noP}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function OutcomeBlock({ label, pct, type }: { label: string; pct: number; type: 'yes' | 'no' }) {
  return (
    <div className={`flex-1 rounded-lg p-3 transition-colors ${
      type === 'yes'
        ? 'bg-yes/[0.07] border border-yes/[0.18]'
        : 'bg-no/[0.07]  border border-no/[0.18]'
    }`}>
      <div className={`text-2xl font-bold tabular tracking-tight ${type === 'yes' ? 'text-yes' : 'text-no'}`}>
        {pct}%
      </div>
      <div className="text-xs text-ink-3 font-medium mt-0.5">{label}</div>
    </div>
  )
}
