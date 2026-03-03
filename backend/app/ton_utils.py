"""Утилиты для работы с TON-адресами.

TON-адреса существуют в двух форматах:
- Raw:           0:abcdef1234...  (workchain:hex_hash)
- User-friendly: EQDabc...       (base64url с CRC16)

TonConnect возвращает raw, TonCenter API — user-friendly.
Нормализуем всё к raw для единообразного сравнения.
"""

import base64
import struct


def _crc16(data: bytes) -> int:
    """CRC16-CCITT (XModem)."""
    crc = 0
    for byte in data:
        crc ^= byte << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ 0x1021
            else:
                crc <<= 1
            crc &= 0xFFFF
    return crc


def userfriendly_to_raw(addr: str) -> str:
    """EQDabc... → 0:abcdef1234..."""
    try:
        # base64url → bytes
        padded = addr.replace("-", "+").replace("_", "/")
        padded += "=" * (4 - len(padded) % 4) if len(padded) % 4 else ""
        data = base64.b64decode(padded)
        if len(data) != 36:
            return addr
        workchain = struct.unpack("b", data[1:2])[0]
        hash_hex = data[2:34].hex()
        return f"{workchain}:{hash_hex}"
    except Exception:
        return addr


def raw_to_userfriendly(raw: str, bounceable: bool = True) -> str:
    """0:abcdef1234... → EQDabc..."""
    try:
        parts = raw.split(":")
        workchain = int(parts[0])
        hash_bytes = bytes.fromhex(parts[1])
        tag = 0x11 if bounceable else 0x51
        addr_bytes = bytes([tag, workchain & 0xFF]) + hash_bytes
        crc = _crc16(addr_bytes)
        full = addr_bytes + struct.pack(">H", crc)
        return base64.urlsafe_b64encode(full).decode().rstrip("=")
    except Exception:
        return raw


def normalize_address(addr: str) -> str:
    """Приводит любой TON-адрес к raw формату (0:hex)."""
    if not addr:
        return addr
    addr = addr.strip()
    # Уже raw формат
    if ":" in addr and len(addr) > 40:
        return addr.lower()
    # User-friendly (base64)
    return userfriendly_to_raw(addr).lower()
