from datetime import datetime
from sqlalchemy import BigInteger, Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    telegram_id = Column(BigInteger, unique=True, nullable=False, index=True)
    username = Column(String(64), nullable=True)
    first_name = Column(String(64), nullable=True)
    avatar_url = Column(String(256), nullable=True)
    balance = Column(Float, default=0.0, nullable=False)   # в TON
    total_pnl = Column(Float, default=0.0, nullable=False)
    ton_wallet_address = Column(String(128), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    positions = relationship("Position", back_populates="user")
    trades = relationship("Trade", back_populates="user")
    ton_deposits = relationship("TonDeposit", back_populates="user")


class Market(Base):
    __tablename__ = "markets"

    id = Column(Integer, primary_key=True)
    question = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(32), default="Other")
    end_date = Column(DateTime, nullable=False)
    status = Column(String(16), default="active", index=True)  # active | resolved | cancelled
    resolution = Column(String(4), nullable=True)  # yes | no

    # AMM pools (значения в TON)
    pool_yes = Column(Float, default=100.0)
    pool_no = Column(Float, default=100.0)
    k_constant = Column(Float, default=10_000.0)

    volume = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(BigInteger, nullable=True)

    positions = relationship("Position", back_populates="market")
    trades = relationship("Trade", back_populates="market")
    price_history = relationship("PriceHistory", back_populates="market")


class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False, index=True)
    shares_yes = Column(Float, default=0.0)
    shares_no = Column(Float, default=0.0)
    cost_basis = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="positions")
    market = relationship("Market", back_populates="positions")


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False, index=True)
    outcome = Column(String(4), nullable=False)   # yes | no
    action = Column(String(4), nullable=False)    # buy | sell
    shares = Column(Float, nullable=False)
    price_avg = Column(Float, nullable=False)
    amount_in = Column(Float, nullable=False)
    fee = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="trades")
    market = relationship("Market", back_populates="trades")


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False, index=True)
    price_yes = Column(Float, nullable=False)
    volume = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    market = relationship("Market", back_populates="price_history")


class TonDeposit(Base):
    """Обработанные TON-транзакции (для защиты от двойного зачисления)."""
    __tablename__ = "ton_deposits"

    id = Column(Integer, primary_key=True)
    tx_hash = Column(String(128), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount_ton = Column(Float, nullable=False)
    from_address = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="ton_deposits")
