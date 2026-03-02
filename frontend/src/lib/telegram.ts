declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            username?: string
            first_name?: string
            last_name?: string
            photo_url?: string
            is_premium?: boolean
            language_code?: string
          }
        }
        ready: () => void
        expand: () => void
        close: () => void
        themeParams: Record<string, string>
        colorScheme: 'light' | 'dark'
        MainButton: {
          text: string
          color: string
          show: () => void
          hide: () => void
          onClick: (fn: () => void) => void
        }
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
        }
        BackButton: {
          show: () => void
          hide: () => void
          onClick: (fn: () => void) => void
        }
        openInvoice: (
          url: string,
          callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void
        ) => void
      }
    }
  }
}

export const tg = window.Telegram?.WebApp

export function initTelegram() {
  if (tg) {
    tg.ready()
    tg.expand()
  }
}

export function getInitData(): string {
  return tg?.initData ?? ''
}

export function haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  tg?.HapticFeedback?.impactOccurred(type)
}

export function hapticNotify(type: 'error' | 'success' | 'warning') {
  tg?.HapticFeedback?.notificationOccurred(type)
}
