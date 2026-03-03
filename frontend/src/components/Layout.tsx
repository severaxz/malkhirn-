import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { fetchMe, User } from '../lib/api'

export default function Layout() {
  const [user, setUser] = useState<User | null>(null)
  const location = useLocation()
  const isMarketPage = location.pathname.startsWith('/market/')

  useEffect(() => {
    fetchMe().then(setUser).catch(console.error)
  }, [])

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Top ambient glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-glow-top z-0" />

      {/* Header — скрывается на странице рынка */}
      {!isMarketPage && (
        <header className="relative z-20 flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-3 glass border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-grad flex items-center justify-center shadow-accent">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="white" />
              </svg>
            </div>
            <span className="text-md font-bold tracking-tight text-white">Malkhirn</span>
          </div>

          <div className="flex items-center gap-2">
            {user?.is_admin && (
              <NavLink
                to="/admin"
                className="w-8 h-8 flex items-center justify-center bg-surface-2 border border-border rounded-full hover:border-accent/50 active:scale-95 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#9898B4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </NavLink>
            )}
            {user && (
              <NavLink
                to="/profile"
                className="flex items-center gap-2 bg-surface-2 border border-border rounded-full pl-2.5 pr-3 py-1.5 hover:border-border-2 active:scale-95 transition-all"
              >
                <Avatar user={user} size={20} />
                <span className="text-sm font-semibold text-white tabular">
                  {user.balance >= 1000
                    ? `${(user.balance / 1000).toFixed(2)}K`
                    : user.balance.toFixed(2)} TON
                </span>
              </NavLink>
            )}
          </div>
        </header>
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto overscroll-none relative z-10">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="relative z-20 flex-shrink-0 glass border-t border-border">
        <div className="flex items-center justify-around px-2 pt-1 pb-safe">
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end ?? false}
              className="flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition-colors"
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    animate={isActive ? { scale: 1.1, y: -1 } : { scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                  >
                    <Icon active={isActive} />
                  </motion.div>
                  <span className={`text-2xs font-medium transition-colors ${isActive ? 'text-accent' : 'text-ink-3'}`}>
                    {label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-dot"
                      className="w-1 h-1 rounded-full bg-accent mt-0.5"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

// ─── Avatar helper ────────────────────────────────────────────────────────────

export function Avatar({ user, size = 32 }: { user: User; size?: number }) {
  const initials = (user.first_name?.[0] ?? '?').toUpperCase()
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-accent-grad flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden"
    >
      <span style={{ fontSize: size * 0.44 }}>{initials}</span>
    </div>
  )
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/',            label: 'Markets',   Icon: IconMarkets,     end: true },
  { to: '/portfolio',   label: 'Portfolio', Icon: IconPortfolio },
  { to: '/leaderboard', label: 'Top',       Icon: IconTop },
  { to: '/profile',     label: 'Profile',   Icon: IconProfile },
]

const A = '#C41E1E'
const I = '#606070'

function IconMarkets({ active }: { active: boolean }) {
  const c = active ? A : I
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 19L8.5 13L12.5 16.5L17 10.5L21 14" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 10.5H21V14" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPortfolio({ active }: { active: boolean }) {
  const c = active ? A : I
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="8" width="18" height="13" rx="2.5" stroke={c} strokeWidth="1.75" />
      <path d="M8 8V6C8 4.895 8.895 4 10 4H14C15.105 4 16 4.895 16 6V8" stroke={c} strokeWidth="1.75" strokeLinecap="round" />
      <path d="M12 12.5V15.5M10 14H14" stroke={c} strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function IconTop({ active }: { active: boolean }) {
  const c = active ? A : I
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M8 17V13" stroke={c} strokeWidth="1.75" strokeLinecap="round" />
      <path d="M12 17V9" stroke={c} strokeWidth="1.75" strokeLinecap="round" />
      <path d="M16 17V12" stroke={c} strokeWidth="1.75" strokeLinecap="round" />
      <path d="M3 20H21" stroke={c} strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function IconProfile({ active }: { active: boolean }) {
  const c = active ? A : I
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke={c} strokeWidth="1.75" />
      <path d="M5 20C5 17.239 8.134 15 12 15C15.866 15 19 17.239 19 20" stroke={c} strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}
