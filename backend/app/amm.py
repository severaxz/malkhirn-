"""
CPMM (Constant Product Market Maker) — как на Polymarket.

k = pool_yes * pool_no

price_yes = pool_no / (pool_yes + pool_no)
price_no  = pool_yes / (pool_yes + pool_no)
"""

FEE_RATE = 0.02  # 2%


def get_prices(pool_yes: float, pool_no: float) -> dict:
    total = pool_yes + pool_no
    return {
        "yes": round(pool_no / total, 4),
        "no": round(pool_yes / total, 4),
    }


def calc_buy(outcome: str, amount: float, pool_yes: float, pool_no: float) -> dict:
    """
    Рассчитать покупку shares.
    Возвращает: shares_out, new_pool_yes, new_pool_no, price_avg, slippage, fee
    """
    fee = amount * FEE_RATE
    amount_after_fee = amount - fee
    k = pool_yes * pool_no

    if outcome == "yes":
        new_pool_no = pool_no + amount_after_fee
        new_pool_yes = k / new_pool_no
        shares_out = pool_yes - new_pool_yes
    else:
        new_pool_yes = pool_yes + amount_after_fee
        new_pool_no = k / new_pool_yes
        shares_out = pool_no - new_pool_no

    if shares_out <= 0:
        raise ValueError("Недостаточно ликвидности")

    price_avg = amount / shares_out
    prices_before = get_prices(pool_yes, pool_no)
    price_before = prices_before[outcome]
    slippage = abs(price_avg - price_before) / price_before * 100

    return {
        "shares_out": round(shares_out, 6),
        "new_pool_yes": new_pool_yes,
        "new_pool_no": new_pool_no,
        "price_avg": round(price_avg, 4),
        "price_before": round(price_before, 4),
        "slippage": round(slippage, 2),
        "fee": round(fee, 4),
    }


def calc_sell(outcome: str, shares: float, pool_yes: float, pool_no: float) -> dict:
    """
    Рассчитать продажу shares обратно в коины.
    """
    k = pool_yes * pool_no

    if outcome == "yes":
        new_pool_yes = pool_yes + shares
        new_pool_no = k / new_pool_yes
        amount_out_gross = pool_no - new_pool_no
    else:
        new_pool_no = pool_no + shares
        new_pool_yes = k / new_pool_no
        amount_out_gross = pool_yes - new_pool_yes

    if amount_out_gross <= 0:
        raise ValueError("Недостаточно ликвидности")

    fee = amount_out_gross * FEE_RATE
    amount_out = amount_out_gross - fee

    return {
        "amount_out": round(amount_out, 4),
        "new_pool_yes": new_pool_yes,
        "new_pool_no": new_pool_no,
        "fee": round(fee, 4),
    }


def calc_resolution_payout(shares: float, resolution: str, outcome: str) -> float:
    """Выплата при разрезолве — 1 коин за winning share."""
    if resolution == outcome:
        return shares
    return 0.0
