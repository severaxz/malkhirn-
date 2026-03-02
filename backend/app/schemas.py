from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserOut(BaseModel):
    id: int
    telegram_id: int
    username: Optional[str]
    first_name: Optional[str]
    balance: float
    total_pnl: float
    ton_wallet_address: Optional[str]
    created_at: datetime
    is_admin: bool = False

    model_config = {"from_attributes": True}


class MarketOut(BaseModel):
    id: int
    question: str
    description: Optional[str]
    category: str
    end_date: datetime
    status: str
    resolution: Optional[str]
    pool_yes: float
    pool_no: float
    price_yes: float
    price_no: float
    volume: float
    created_at: datetime

    model_config = {"from_attributes": True}


class PriceHistoryPoint(BaseModel):
    price_yes: float
    volume: float
    timestamp: datetime

    model_config = {"from_attributes": True}


class MarketDetailOut(MarketOut):
    price_history: list[PriceHistoryPoint]


class TradePreview(BaseModel):
    shares_out: float
    price_avg: float
    price_before: float
    slippage: float
    fee: float


class TradeRequest(BaseModel):
    outcome: str   # yes | no
    action: str    # buy | sell
    amount: float  # TON to spend (buy) or shares to sell (sell)


class TradeOut(BaseModel):
    id: int
    outcome: str
    action: str
    shares: float
    price_avg: float
    amount_in: float
    fee: float
    created_at: datetime
    new_balance: float
    new_price_yes: float
    new_price_no: float

    model_config = {"from_attributes": True}


class PositionOut(BaseModel):
    market_id: int
    market_question: str
    market_status: str
    market_end_date: datetime
    market_resolution: Optional[str]
    price_yes: float
    shares_yes: float
    shares_no: float
    cost_basis: float
    current_value: float
    pnl: float

    model_config = {"from_attributes": True}


class LeaderboardEntry(BaseModel):
    rank: int
    telegram_id: int
    username: Optional[str]
    first_name: Optional[str]
    total_pnl: float
    balance: float


class MarketCreateRequest(BaseModel):
    question: str
    description: Optional[str] = None
    category: str = "Other"
    end_date: datetime
    initial_liquidity: float = 100.0  # TON на каждый пул


class MarketResolveRequest(BaseModel):
    resolution: str  # yes | no
