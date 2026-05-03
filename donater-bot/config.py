import os
from pathlib import Path
from typing import FrozenSet, Set

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent


def _parse_admin_ids(raw: str) -> FrozenSet[int]:
    out: Set[int] = set()
    for part in (raw or "").split(","):
        part = part.strip()
        if part.isdigit():
            out.add(int(part))
    return frozenset(out)


class Config:
    bot_token: str = os.getenv("BOT_TOKEN", "")
    admin_ids: FrozenSet[int] = _parse_admin_ids(os.getenv("ADMIN_IDS", ""))
    channel_id: str = (
        os.getenv("CHANNEL_ID")
        or os.getenv("CHANNEL_CHAT_ID")
        or os.getenv("CHANNEL_USERNAME")
        or ""
    ).strip()
    reviews_channel: str = os.getenv(
        "REVIEWS_CHANNEL", os.getenv("PUBLIC_CHANNEL", "")
    )
    database_path: Path = BASE_DIR / os.getenv("DATABASE_PATH", "database/bot.db")
    dc_city_number: str = os.getenv("DC_CITY_NUMBER", "")
    alif_number: str = os.getenv("ALIF_NUMBER", "+992888788181")
    mastercard_number: str = os.getenv("MASTERCARD_NUMBER", "5413525250170749")
    milli_number: str = os.getenv("MILLI_NUMBER", "")
    support_url: str = os.getenv("SUPPORT_URL", "https://t.me/vvewrix")
    support_manager_id: str = os.getenv("SUPPORT_MANAGER_ID", "7679557111")
    fsm_ttl_minutes: int = int(os.getenv("FSM_TTL_MINUTES", "30"))
    anti_spam_per_minute: int = int(os.getenv("ANTI_SPAM_PER_MINUTE", "5"))


config = Config()
