import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import {
  fetchMe, fetchPortfolio, fetchPaymentInfo,
  saveWalletAddress, fetchDeposits, requestWithdrawal,
  User, Position, PaymentInfo, TonDeposit,
} from '../lib/api'
import { tg, hapticNotify } from '../lib/telegram'

const TON_NANOTON = 1_000_000_000

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [depositOpen, setDepositOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState('1')
  const [depositSending, setDepositSending] = useState(false)
  const [depositSent, setDepositSent] = useState(false)
  const [deposits, setDeposits] = useState<TonDeposit[]>([])
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)

  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('1')
  const [withdrawSending, setWithdrawSending] = useState(false)
  const [withdrawSent, setWithdrawSent] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)

  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()
  const navigate = useNavigate()

  // activeWallet = live TonConnect session; walletAddress = fallback from backend
  const activeWallet = wallet?.account.address ?? null
  const walletAddress = activeWallet ?? user?.ton_wallet_address ?? null
  const isConnected = !!walletAddress
  const canSend = !!activeWallet

  const tgUser = tg?.initDataUnsafe?.user

  const loadData = useCallback(async () => {
    const [u, p] = await Promise.all([fetchMe(), fetchPortfolio()])
    setUser(u)
    setPositions(p)
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([loadData(), fetchPaymentInfo().then(setPaymentInfo)])
      .catch((e) => setError(e?.message ?? 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [loadData])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!activeWallet) return
    saveWalletAddress(activeWallet).catch(console.error)
  }, [activeWallet])

  const handleOpenDeposit = () => {
    setDepositSent(false)
    setDepositOpen(true)
    fetchDeposits().then(setDeposits).catch(console.error)
  }

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount)
    const minDep = paymentInfo?.min_deposit ?? 0.1
    if (!amount || amount < minDep) return
    const appWallet = paymentInfo?.app_wallet
    if (!appWallet) return

    setDepositSending(true)
    try {
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{ address: appWallet, amount: String(Math.floor(amount * TON_NANOTON)) }],
      })
      hapticNotify('success')
      setDepositSent(true)
      setTimeout(() => {
        fetchMe().then(setUser).catch(console.error)
        fetchDeposits().then(setDeposits).catch(console.error)
      }, 35_000)
    } catch {
      hapticNotify('error')
    } finally {
      setDepositSending(false)
    }
  }

  const handleOpenWithdraw = () => {
    setWithdrawSent(false)
    setWithdrawError(null)
    setWithdrawAmount('1')
    setWithdrawOpen(true)
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount < 0.5) return
    if (!user?.ton_wallet_address) return

    setWithdrawSending(true)
    setWithdrawError(null)
    try {
      await requestWithdrawal(amount)
      hapticNotify('success')
      setWithdrawSent(true)
      setTimeout(() => fetchMe().then(setUser).catch(console.error), 1000)
    } catch (e: any) {
      hapticNotify('error')
      setWithdrawError(e?.response?.data?.detail ?? 'Ошибка при создании заявки')
    } finally {
      setWithdrawSending(false)
    }
  }

  if (loading) return <ProfileSkeleton />

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
      <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-2xl">⚠️</div>
      <div className="text-center">
        <p className="text-ink-2 font-semibold mb-1">Не удалось загрузить профиль</p>
        <p className="text-ink-3 text-sm">{error}</p>
      </div>
      <button
        onClick={load}
        className="px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl shadow-accent active:scale-95 transition-all"
      >
        Повторить
      </button>
    </div>
  )

  if (!user) return null

  const totalValue = positions.reduce((s, p) => s + p.current_value, 0)
  const pnlPositive = user.total_pnl >= 0
  const displayName = user.first_name ?? tgUser?.first_name ?? user.username ?? 'Пользователь'
  const depositAmountNum = parseFloat(depositAmount) || 0
  const withdrawAmountNum = parseFloat(withdrawAmount) || 0
  const minDep = paymentInfo?.min_deposit ?? 0.1

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      <div className="px-4 pt-6 pb-28 space-y-4">

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <TelegramAvatar user={user} tgUser={tgUser} size={64} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-bold text-white truncate">{displayName}</h1>
              {tgUser?.is_premium && (
                <span className="flex-shrink-0 text-2xs font-bold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30">Premium</span>
              )}
            </div>
            {(user.username || tgUser?.username) && (
              <p className="text-sm text-ink-3">@{user.username ?? tgUser?.username}</p>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3">
          <StatCard label="Баланс" value={formatTon(user.balance)} sub="TON" color="accent" />
          <StatCard label="Всего P&L" value={`${pnlPositive ? '+' : ''}${formatTon(user.total_pnl)}`} sub="TON" color={pnlPositive ? 'yes' : 'no'} />
          <StatCard label="Позиций" value={String(positions.length)} sub="открытых" color="blue" />
          <StatCard label="Стоимость" value={formatTon(totalValue)} sub="TON" color="ink" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="grid grid-cols-2 gap-3">
          <button
            onClick={handleOpenDeposit}
            className="py-3.5 bg-accent text-white font-semibold rounded-2xl shadow-accent active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Пополнить
          </button>
          <button
            onClick={handleOpenWithdraw}
            disabled={!isConnected || user.balance < 0.5}
            className="py-3.5 bg-surface-2 border border-border text-white font-semibold rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 19V5M5 12L12 5L19 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Вывести
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <TonIcon />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">TON Кошелёк</p>
              <p className="text-xs text-ink-3 font-mono">
                {walletAddress ? walletAddress.slice(0, 8) + '...' + walletAddress.slice(-6) : 'Не подключён'}
              </p>
            </div>
            <div className={`flex items-center gap-1.5 ${canSend ? 'text-yes' : isConnected ? 'text-warn' : 'text-ink-4'}`}>
              <div className={`w-2 h-2 rounded-full ${canSend ? 'bg-yes' : isConnected ? 'bg-warn' : 'bg-ink-4'}`} />
              <span className="text-xs font-semibold">{canSend ? 'Активен' : isConnected ? 'Сохранён' : 'Откл.'}</span>
            </div>
          </div>
          {!isConnected && (
            <p className="text-xs text-ink-3 leading-relaxed">Подключи TON-кошелёк через кнопку «Пополнить» для внесения средств.</p>
          )}
          {isConnected && !canSend && (
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-ink-3">Сессия истекла. Переподключи для пополнения.</p>
              <button onClick={() => tonConnectUI.openModal()} className="text-xs font-semibold text-accent ml-2 flex-shrink-0">Войти →</button>
            </div>
          )}
        </motion.div>

        {positions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
              <p className="text-sm font-semibold text-ink-2">Открытые позиции</p>
              <button onClick={() => navigate('/portfolio')} className="text-xs text-accent font-semibold">Все →</button>
            </div>
            <div className="divide-y divide-border">
              {positions.slice(0, 3).map((pos) => (
                <div key={pos.market_id} className="px-4 py-3 flex items-center gap-3 cursor-pointer active:bg-surface-2 transition-colors" onClick={() => navigate(`/market/${pos.market_id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{pos.market_question}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {pos.shares_yes > 0 && <span className="text-2xs font-semibold text-yes">YES {pos.shares_yes.toFixed(3)}</span>}
                      {pos.shares_no > 0 && <span className="text-2xs font-semibold text-no">NO {pos.shares_no.toFixed(3)}</span>}
                    </div>
                  </div>
                  <p className={`text-sm font-bold tabular ${pos.pnl >= 0 ? 'text-yes' : 'text-no'}`}>
                    {pos.pnl >= 0 ? '+' : ''}{formatTon(pos.pnl)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="bg-surface border border-border rounded-xl p-4 space-y-1">
          <InfoRow label="Версия" value="0.3.0" />
          <InfoRow label="Механика" value="CPMM AMM" />
          <InfoRow label="Валюта" value="TON" />
          <InfoRow label="Комиссия" value="2%" />
        </motion.div>
      </div>

      {/* Deposit modal */}
      {createPortal(
        <AnimatePresence>
          {depositOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40"
                onClick={() => setDepositOpen(false)}
              />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50 glass-sheet rounded-t-3xl px-4 pt-4 max-h-[90vh] overflow-y-auto"
                style={{ paddingBottom: 'max(40px, env(safe-area-inset-bottom, 40px))' }}
              >
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

                {depositSent ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                    <div className="text-4xl mb-3">✅</div>
                    <h2 className="text-lg font-bold text-white mb-1">Транзакция отправлена!</h2>
                    <p className="text-sm text-ink-3 mb-5">Средства появятся на балансе в течение ~30 секунд</p>
                    <button onClick={() => setDepositOpen(false)} className="w-full py-3 bg-accent text-white font-semibold rounded-2xl shadow-accent active:scale-95 transition-all">Закрыть</button>
                  </motion.div>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-white mb-1">Пополнить через TON</h2>
                    <p className="text-sm text-ink-3 mb-4">Отправь TON — баланс зачислится автоматически за ~30 сек</p>

                    {!isConnected ? (
                      <div className="mb-4">
                        <p className="text-xs text-ink-3 mb-2">Подключи кошелёк чтобы продолжить:</p>
                        <button
                          onClick={() => tonConnectUI.openModal()}
                          className="w-full py-3 bg-surface-2 border border-border text-white font-semibold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <TonIcon />
                          Подключить TON кошелёк
                        </button>
                      </div>
                    ) : !canSend ? (
                      <div className="mb-4">
                        <div className="bg-surface-2 border border-border rounded-xl p-3 mb-3 flex items-center gap-2">
                          <TonIcon />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-ink-3">Адрес сохранён, сессия истекла</p>
                            <p className="text-sm font-mono text-white truncate">{walletAddress!.slice(0, 10)}...{walletAddress!.slice(-8)}</p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-warn flex-shrink-0" />
                        </div>
                        <button
                          onClick={() => tonConnectUI.openModal()}
                          className="w-full py-3 bg-surface-2 border border-border text-white font-semibold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <TonIcon />
                          Переподключить кошелёк
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-surface-2 border border-border rounded-xl p-3 mb-4 flex items-center gap-2">
                          <TonIcon />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-ink-3">Кошелёк подключён</p>
                            <p className="text-sm font-mono text-white truncate">{walletAddress!.slice(0, 10)}...{walletAddress!.slice(-8)}</p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-yes flex-shrink-0" />
                        </div>

                        <div className="mb-4">
                          <label className="text-xs text-ink-3 mb-1.5 block">Сумма (мин. {minDep} TON)</label>
                          <div className="relative">
                            <input
                              type="number" value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              min={minDep} step="0.1"
                              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-accent transition-colors pr-16"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-3 font-semibold">TON</span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            {[0.5, 1, 5, 10].map((v) => (
                              <button
                                key={v}
                                onClick={() => setDepositAmount(String(v))}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 ${depositAmountNum === v ? 'bg-accent/15 border-accent/40 text-accent' : 'bg-surface-2 border-border text-ink-3'}`}
                              >{v}</button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleDeposit}
                          disabled={depositSending || depositAmountNum < minDep || !paymentInfo?.app_wallet}
                          className="w-full py-3.5 bg-accent text-white font-semibold rounded-2xl shadow-accent disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          {depositSending ? (
                            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Подтверди в кошельке...</>
                          ) : (
                            `Отправить ${depositAmountNum > 0 ? depositAmountNum : ''} TON`
                          )}
                        </button>

                        {!paymentInfo?.app_wallet && (
                          <p className="text-xs text-no text-center mt-2">Кошелёк приложения не настроен. Свяжитесь с поддержкой.</p>
                        )}
                      </>
                    )}

                    {deposits.length > 0 && (
                      <div className="mt-5">
                        <p className="text-xs text-ink-3 font-medium mb-2">Последние пополнения</p>
                        <div className="space-y-1">
                          {deposits.slice(0, 3).map((d) => (
                            <div key={d.tx_hash} className="flex items-center justify-between py-1.5 border-b border-border/40">
                              <span className="text-xs text-ink-3">{new Date(d.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}</span>
                              <span className="text-sm font-semibold text-yes">+{d.amount_ton.toFixed(2)} TON</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Withdrawal modal */}
      {createPortal(
        <AnimatePresence>
          {withdrawOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40"
                onClick={() => setWithdrawOpen(false)}
              />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50 glass-sheet rounded-t-3xl px-4 pt-4 max-h-[90vh] overflow-y-auto"
                style={{ paddingBottom: 'max(40px, env(safe-area-inset-bottom, 40px))' }}
              >
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

                {withdrawSent ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                    <div className="text-4xl mb-3">✅</div>
                    <h2 className="text-lg font-bold text-white mb-1">Заявка принята!</h2>
                    <p className="text-sm text-ink-3 mb-5">Вывод обрабатывается. Средства поступят в течение 24 часов.</p>
                    <button onClick={() => setWithdrawOpen(false)} className="w-full py-3 bg-accent text-white font-semibold rounded-2xl shadow-accent active:scale-95 transition-all">Закрыть</button>
                  </motion.div>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-white mb-1">Вывод TON</h2>
                    <p className="text-sm text-ink-3 mb-4">Заявка обрабатывается вручную в течение 24 часов</p>

                    {!user.ton_wallet_address ? (
                      <div className="bg-no/10 border border-no/20 rounded-xl p-4 text-center">
                        <p className="text-sm text-no font-semibold mb-1">Кошелёк не привязан</p>
                        <p className="text-xs text-ink-3">Подключи TON-кошелёк через «Пополнить» для вывода средств</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-surface-2 border border-border rounded-xl p-3 mb-3 flex items-center gap-2">
                          <TonIcon />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-ink-3">Вывод на кошелёк</p>
                            <p className="text-sm font-mono text-white truncate">{user.ton_wallet_address.slice(0, 10)}...{user.ton_wallet_address.slice(-8)}</p>
                          </div>
                        </div>

                        <div className="bg-surface-2 border border-border rounded-xl p-3 mb-4 flex justify-between items-center">
                          <span className="text-xs text-ink-3">Доступно</span>
                          <span className="text-sm font-bold text-white tabular">{formatTon(user.balance)} TON</span>
                        </div>

                        <div className="mb-4">
                          <label className="text-xs text-ink-3 mb-1.5 block">Сумма вывода (мин. 0.5 TON)</label>
                          <div className="relative">
                            <input
                              type="number" value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              min="0.5" step="0.1"
                              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-accent transition-colors pr-16"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-3 font-semibold">TON</span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            {[0.5, 1, 5].map((v) => (
                              <button
                                key={v}
                                onClick={() => setWithdrawAmount(String(Math.min(v, user.balance)))}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 ${withdrawAmountNum === v ? 'bg-accent/15 border-accent/40 text-accent' : 'bg-surface-2 border-border text-ink-3'}`}
                              >{v}</button>
                            ))}
                            <button
                              onClick={() => setWithdrawAmount(String(Math.max(0.5, user.balance - 0.05).toFixed(2)))}
                              className="flex-1 py-1.5 text-xs font-semibold rounded-lg border bg-surface-2 border-border text-ink-3 active:scale-95 transition-all"
                            >Макс.</button>
                          </div>
                        </div>

                        {withdrawError && (
                          <div className="bg-no/10 border border-no/20 rounded-xl p-3 mb-4 text-center">
                            <p className="text-sm text-no">{withdrawError}</p>
                          </div>
                        )}

                        <button
                          onClick={handleWithdraw}
                          disabled={withdrawSending || withdrawAmountNum < 0.5 || withdrawAmountNum > user.balance}
                          className="w-full py-3.5 bg-accent text-white font-semibold rounded-2xl shadow-accent disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          {withdrawSending ? (
                            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Отправка заявки...</>
                          ) : (
                            `Вывести ${withdrawAmountNum > 0 ? withdrawAmountNum : ''} TON`
                          )}
                        </button>
                      </>
                    )}
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

function formatTon(v: number): string {
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(2) + 'K'
  if (Math.abs(v) >= 1) return v.toFixed(2)
  return v.toFixed(4)
}

function TelegramAvatar({ user, tgUser, size }: { user: User; tgUser?: { photo_url?: string; first_name?: string }; size: number }) {
  const [imgError, setImgError] = useState(false)
  const initials = (user.first_name?.[0] ?? '?').toUpperCase()
  if (tgUser?.photo_url && !imgError) {
    return <img src={tgUser.photo_url} alt="avatar" style={{ width: size, height: size }} className="rounded-2xl object-cover flex-shrink-0 border border-border" onError={() => setImgError(true)} />
  }
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.4 }} className="rounded-2xl bg-accent-grad flex items-center justify-center text-white font-bold flex-shrink-0 shadow-accent">
      {initials}
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = { yes: 'text-yes', no: 'text-no', accent: 'text-accent', blue: 'text-blue-400', ink: 'text-ink-2' }
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-xs text-ink-3 mb-1">{label}</p>
      <p className={`text-xl font-bold tabular tracking-tight ${colorMap[color] ?? 'text-white'}`}>{value}</p>
      <p className="text-2xs text-ink-3 mt-0.5">{sub}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-ink-3">{label}</span>
      <span className="text-sm font-medium text-ink-2">{value}</span>
    </div>
  )
}

function TonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="28" fill="#0098EA"/>
      <path d="M37.56 15.63H18.44c-3.52 0-5.74 3.79-3.97 6.85l11.8 20.36c.77 1.35 2.7 1.35 3.47 0l11.8-20.36c1.77-3.06-.45-6.85-3.98-6.85zM25.5 35.86L22.77 30.05l-4.85-8.26c-.56-.96.13-2.2 1.25-2.2H25.5v16.27zm12.57-14.08L33.23 30.05l-2.74 5.81V19.59h6.34c1.12 0 1.81 1.24 1.24 2.19z" fill="white"/>
    </svg>
  )
}

function ProfileSkeleton() {
  return (
    <div className="px-4 pt-6 pb-8 space-y-4 animate-shimmer">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-2" />
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-surface-2 rounded w-32" />
          <div className="h-4 bg-surface-2 rounded w-20" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-surface border border-border rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 bg-surface-2 rounded-2xl" />
        <div className="h-12 bg-surface-2 rounded-2xl" />
      </div>
    </div>
  )
}
