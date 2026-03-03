import axios from 'axios'
import { getInitData } from './telegram'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const initData = getInitData()
  if (initData) {
    config.headers['X-Init-Data'] = initData
  }
  return config
})

export default api

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Market {
  id: number
  question: string
  description: string | null
  category: string
  end_date: string
  status: string
  resolution: string | null
  pool_yes: number
  pool_no: number
  price_yes: number
  price_no: number
  volume: number
  created_at: string
  price_history?: PricePoint[]
}

export interface PricePoint {
  price_yes: number
  volume: number
  timestamp: string
}

export interface User {
  id: number
  telegram_id: number
  username: string | null
  first_name: string | null
  balance: number
  total_pnl: number
  ton_wallet_address: string | null
  created_at: string
  is_admin: boolean
}

export interface Position {
  market_id: number
  market_question: string
  market_status: string
  market_end_date: string
  market_resolution: string | null
  price_yes: number
  shares_yes: number
  shares_no: number
  cost_basis: number
  current_value: number
  pnl: number
}

export interface TradePreview {
  shares_out: number
  price_avg: number
  price_before: number
  slippage: number
  fee: number
}

export interface TradeResult {
  id: number
  outcome: string
  action: string
  shares: number
  price_avg: number
  amount_in: number
  fee: number
  created_at: string
  new_balance: number
  new_price_yes: number
  new_price_no: number
}

export interface LeaderEntry {
  rank: number
  telegram_id: number
  username: string | null
  first_name: string | null
  total_pnl: number
  balance: number
}

export interface PaymentInfo {
  ton_wallet_address: string | null
  app_wallet: string
  min_deposit: number
}

export interface TonDeposit {
  tx_hash: string
  amount_ton: number
  created_at: string
}

export interface WithdrawalRequest {
  id: number
  amount_ton: number
  to_address: string
  status: string
  created_at: string
  note: string | null
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const fetchMarkets = (status = 'active', category?: string) =>
  api.get<Market[]>('/markets', { params: { status, category } }).then((r) => r.data)

export const fetchMarket = (id: number) =>
  api.get<Market>(`/markets/${id}`).then((r) => r.data)

export const fetchMe = () => api.get<User>('/users/me').then((r) => r.data)

export const fetchPortfolio = () =>
  api.get<Position[]>('/users/me/portfolio').then((r) => r.data)

export const fetchLeaderboard = () =>
  api.get<LeaderEntry[]>('/leaderboard').then((r) => r.data)

export const previewTrade = (
  marketId: number,
  outcome: string,
  action: string,
  amount: number
) =>
  api
    .get<TradePreview>(`/markets/${marketId}/preview`, {
      params: { outcome, action, amount },
    })
    .then((r) => r.data)

export const executeTrade = (
  marketId: number,
  outcome: string,
  action: string,
  amount: number
) =>
  api
    .post<TradeResult>(`/markets/${marketId}/trade`, { outcome, action, amount })
    .then((r) => r.data)

export interface MarketCreatePayload {
  question: string
  description?: string
  category: string
  end_date: string
  initial_liquidity: number
}

export const createMarket = (data: MarketCreatePayload) =>
  api.post<Market>('/markets', data).then((r) => r.data)

export const resolveMarket = (marketId: number, resolution: 'yes' | 'no') =>
  api.post<Market>(`/markets/${marketId}/resolve`, { resolution }).then((r) => r.data)

// ─── TON Payments ──────────────────────────────────────────────────────────────

export const fetchPaymentInfo = () =>
  api.get<PaymentInfo>('/payments/info').then((r) => r.data)

export const saveWalletAddress = (address: string) =>
  api.post('/payments/wallet', { address }).then((r) => r.data)

export const fetchDeposits = () =>
  api.get<TonDeposit[]>('/payments/deposits').then((r) => r.data)

export const requestWithdrawal = (amount: number) =>
  api.post<WithdrawalRequest>('/payments/withdraw', { amount }).then((r) => r.data)

export const fetchWithdrawals = () =>
  api.get<WithdrawalRequest[]>('/payments/withdrawals').then((r) => r.data)
