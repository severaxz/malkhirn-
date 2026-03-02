/** Клиентский расчёт AMM — для превью без запроса к API */

const FEE = 0.02

export function calcBuyPreview(
  outcome: 'yes' | 'no',
  amount: number,
  poolYes: number,
  poolNo: number
) {
  const fee = amount * FEE
  const amountIn = amount - fee
  const k = poolYes * poolNo

  let sharesOut: number
  let priceAvg: number

  if (outcome === 'yes') {
    const newPoolNo = poolNo + amountIn
    const newPoolYes = k / newPoolNo
    sharesOut = poolYes - newPoolYes
  } else {
    const newPoolYes = poolYes + amountIn
    const newPoolNo = k / newPoolYes
    sharesOut = poolNo - newPoolNo
  }

  priceAvg = amount / sharesOut
  const priceBefore = outcome === 'yes' ? poolNo / (poolYes + poolNo) : poolYes / (poolYes + poolNo)
  const slippage = Math.abs(priceAvg - priceBefore) / priceBefore * 100

  return {
    sharesOut: Math.max(0, sharesOut),
    priceAvg,
    priceBefore,
    slippage,
    fee,
  }
}

export function formatPrice(p: number) {
  return `${(p * 100).toFixed(1)}¢`
}

export function formatPercent(p: number) {
  return `${(p * 100).toFixed(1)}%`
}
