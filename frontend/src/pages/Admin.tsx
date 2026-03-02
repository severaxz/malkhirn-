import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchMarkets, fetchMe, createMarket, resolveMarket, Market, MarketCreatePayload } from '../lib/api'

const CATEGORIES = ['Crypto', 'Sports', 'Tech', 'Science', 'Politics', 'Other']

type Confirming = { id: number; resolution: 'yes' | 'no' }

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [markets, setMarkets] = useState<Market[]>([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<MarketCreatePayload>({
    question: '',
    description: '',
    category: 'Crypto',
    end_date: '',
    initial_liquidity: 100,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState<Confirming | null>(null)
  const [resolveError, setResolveError] = useState<number | null>(null)

  useEffect(() => {
    fetchMe()
      .then((u) => {
        setIsAdmin(u.is_admin)
        if (u.is_admin) loadMarkets()
      })
      .catch(() => setIsAdmin(false))
  }, [])

  const loadMarkets = () => {
    fetchMarkets('active').then(setMarkets).catch(console.error)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.question.trim() || !form.end_date) {
      setError('Заполните вопрос и дату')
      return
    }
    const endDate = new Date(form.end_date)
    if (endDate <= new Date()) {
      setError('Дата окончания должна быть в будущем')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createMarket({ ...form, end_date: endDate.toISOString() })
      setForm({ question: '', description: '', category: 'Crypto', end_date: '', initial_liquidity: 100 })
      setCreating(false)
      loadMarkets()
    } catch {
      setError('Ошибка при создании рынка')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolveClick = (marketId: number, resolution: 'yes' | 'no') => {
    setResolveError(null)
    setConfirming({ id: marketId, resolution })
  }

  const handleResolveConfirm = async () => {
    if (!confirming) return
    try {
      await resolveMarket(confirming.id, confirming.resolution)
      setConfirming(null)
      loadMarkets()
    } catch {
      setResolveError(confirming.id)
      setConfirming(null)
    }
  }

  if (isAdmin === null) {
    return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
        <div className="text-4xl">🚫</div>
        <p className="text-white font-semibold">Нет доступа</p>
        <p className="text-ink-3 text-sm text-center">Только администраторы могут открыть эту страницу</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      <div className="px-4 pt-4 pb-3 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Админ-панель</h1>
          <p className="text-sm text-ink-3 mt-0.5">Управление рынками</p>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-xl shadow-accent active:scale-95 transition-all"
        >
          {creating ? 'Отмена' : '+ Новый'}
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 bg-surface border border-border rounded-2xl p-4"
        >
          <h2 className="text-sm font-semibold text-white mb-3">Новый рынок</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-xs text-ink-3 mb-1 block">Вопрос *</label>
              <textarea
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="Биткоин достигнет $200K в 2025?"
                rows={2}
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-ink-4 resize-none focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-ink-3 mb-1 block">Описание</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Дополнительные условия..."
                rows={2}
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-ink-4 resize-none focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink-3 mb-1 block">Категория</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-ink-3 mb-1 block">Ликвидность</label>
                <input
                  type="number"
                  value={form.initial_liquidity}
                  onChange={(e) => setForm({ ...form, initial_liquidity: +e.target.value })}
                  min={100}
                  step={100}
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-ink-3 mb-1 block">Дата окончания *</label>
              <input
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {error && (
              <p className="text-no text-xs bg-no/10 border border-no/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-accent text-white font-semibold rounded-xl shadow-accent disabled:opacity-50 active:scale-95 transition-all"
            >
              {submitting ? 'Создаём...' : 'Создать рынок'}
            </button>
          </form>
        </motion.div>
      )}

      {/* Active markets */}
      <div className="flex-1 px-4 pb-6 space-y-2">
        <p className="text-xs text-ink-3 font-medium mb-2">Активных рынков: {markets.length}</p>
        {markets.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12 gap-3">
            <div className="text-4xl">📭</div>
            <p className="text-ink-3 text-sm">Нет активных рынков</p>
            <p className="text-ink-4 text-xs">Нажмите «+ Новый» чтобы создать первый</p>
          </div>
        ) : (
          markets.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-surface border border-border rounded-xl p-3"
            >
              <p className="text-sm font-semibold text-white line-clamp-2 mb-2">{m.question}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded-lg bg-surface-2 text-ink-3">{m.category}</span>
                <span className="text-xs text-ink-3">YES {Math.round(m.price_yes * 100)}%</span>
                <span className="text-xs text-ink-3">Vol {m.volume.toFixed(0)}</span>
              </div>
              {resolveError === m.id && (
                <p className="text-no text-xs mb-2">Ошибка при завершении</p>
              )}
              <AnimatePresence mode="wait">
                {confirming?.id === m.id ? (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2"
                  >
                    <button
                      onClick={handleResolveConfirm}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg active:scale-95 transition-all ${
                        confirming.resolution === 'yes'
                          ? 'bg-yes text-white'
                          : 'bg-no text-white'
                      }`}
                    >
                      Подтвердить {confirming.resolution.toUpperCase()}
                    </button>
                    <button
                      onClick={() => setConfirming(null)}
                      className="px-3 py-2 text-xs font-bold text-ink-3 bg-surface-2 border border-border rounded-lg active:scale-95 transition-all"
                    >
                      Отмена
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2"
                  >
                    <button
                      onClick={() => handleResolveClick(m.id, 'yes')}
                      className="flex-1 py-2 text-xs font-bold text-yes bg-yes/10 border border-yes/25 rounded-lg active:scale-95 transition-all"
                    >
                      Завершить YES
                    </button>
                    <button
                      onClick={() => handleResolveClick(m.id, 'no')}
                      className="flex-1 py-2 text-xs font-bold text-no bg-no/10 border border-no/25 rounded-lg active:scale-95 transition-all"
                    >
                      Завершить NO
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
