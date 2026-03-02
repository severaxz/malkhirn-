import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Market, executeTrade, previewTrade, TradePreview } from '../lib/api'
import { haptic, hapticNotify } from '../lib/telegram'

const QUICK = [10, 25, 50, 100]

interface Props {
  market: Market
  onTraded: (newPriceYes: number, newPriceNo: number, newBalance: number) => void
  balance: number
}

export default function TradePanel({ market, onTraded, balance }: Props) {
  const [outcome, setOutcome] = useState<'yes' | 'no'>('yes')
  const [amount, setAmount] = useState('10')
  const [preview, setPreview] = useState<TradePreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const amountNum = parseFloat(amount) || 0

  useEffect(() => {
    setPreview(null)
    if (amountNum < 1) return
    const t = setTimeout(() => {
      previewTrade(market.id, outcome, 'buy', amountNum)
        .then(setPreview)
        .catch(() => setPreview(null))
    }, 300)
    return () => clearTimeout(t)
  }, [outcome, amountNum, market.id])

  async function handleTrade() {
    if (amountNum < 1 || amountNum > balance) return
    haptic('medium')
    setLoading(true)
    setError(null)
    try {
      const r = await executeTrade(market.id, outcome, 'buy', amountNum)
      hapticNotify('success')
      setSuccess(true)
      onTraded(r.new_price_yes, r.new_price_no, r.new_balance)
      setTimeout(() => setSuccess(false), 2500)
    } catch (e: any) {
      hapticNotify('error')
      setError(e.response?.data?.detail ?? 'Ошибка сделки')
    } finally {
      setLoading(false)
    }
  }

  const isYes = outcome === 'yes'
  const yesP  = Math.round(market.price_yes * 100)
  const noP   = 100 - yesP

  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
      <p className="text-sm font-bold text-ink-2">Купить шеры</p>

      {/* YES / NO selector */}
      <div className="flex gap-2">
        {(['yes', 'no'] as const).map((o) => {
          const pct = o === 'yes' ? yesP : noP
          const active = outcome === o
          return (
            <motion.button
              key={o}
              whileTap={{ scale: 0.96 }}
              onClick={() => { setOutcome(o); haptic('light') }}
              className={`flex-1 py-3 rounded-lg border font-bold transition-all ${
                active
                  ? o === 'yes'
                    ? 'bg-yes/12 border-yes/40 text-yes'
                    : 'bg-no/12 border-no/40 text-no'
                  : 'bg-surface-2 border-border text-ink-3'
              }`}
            >
              <div className={`text-xl tabular block ${!active ? 'opacity-50' : ''}`}>{pct}%</div>
              <div className="text-xs font-semibold mt-0.5">{o.toUpperCase()}</div>
            </motion.button>
          )
        })}
      </div>

      {/* Amount */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-xs text-ink-3">Сумма</span>
          <span className="text-xs text-ink-3">
            Доступно: <span className="text-ink-2 font-semibold tabular">{balance.toFixed(0)}</span>
          </span>
        </div>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-accent transition-colors tabular pr-16"
            placeholder="0"
            min="1"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-3 font-medium">монет</span>
        </div>
        <div className="flex gap-2 mt-2">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => { setAmount(String(q)); haptic('light') }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                amountNum === q
                  ? 'bg-accent/10 border-accent/40 text-accent'
                  : 'bg-surface-2 border-border text-ink-3'
              }`}
            >
              {q}
            </button>
          ))}
          <button
            onClick={() => { setAmount(String(Math.floor(balance))); haptic('light') }}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold border bg-surface-2 border-border text-ink-3 transition-all"
          >
            Всё
          </button>
        </div>
      </div>

      {/* Preview */}
      <AnimatePresence>
        {preview && amountNum >= 1 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-bg border border-border rounded-lg p-3 space-y-2">
              <Row label="Получите шерсов"  value={preview.shares_out.toFixed(4)} />
              <Row label="Средняя цена"     value={`${Math.round(preview.price_avg * 100)}¢`} />
              <Row label="Проскальзывание"  value={`${preview.slippage.toFixed(1)}%`} warn={preview.slippage > 5} />
              <Row label="Комиссия (2%)"    value={`${preview.fee.toFixed(2)}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-no/10 border border-no/25 rounded-lg px-3 py-2 text-xs text-no"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleTrade}
        disabled={loading || amountNum < 1 || amountNum > balance || success}
        className={`w-full py-4 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
          success
            ? 'bg-yes/15 border border-yes/40 text-yes'
            : isYes
            ? 'bg-yes text-white shadow-yes'
            : 'bg-no  text-white shadow-no'
        }`}
      >
        {loading  ? <><Spinner /> Исполняется...</> :
         success  ? <>✓ Сделка совершена!</> :
         `Купить ${outcome.toUpperCase()} · ${amountNum > 0 ? amountNum : '—'} монет`}
      </motion.button>
    </div>
  )
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-ink-3">{label}</span>
      <span className={`text-xs font-semibold tabular ${warn ? 'text-warn' : 'text-ink-2'}`}>{value}</span>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}
