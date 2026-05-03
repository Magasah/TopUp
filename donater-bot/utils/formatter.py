import html


def escape_html(s: object) -> str:
    return html.escape(str(s), quote=True)


def format_wizard_product_label(raw: str, game_name: str) -> str:
    s = (raw or "").strip()
    if not s:
        return "💎 Товар"
    lower = s.lower()
    digits = "".join(ch for ch in s if ch.isdigit())
    is_pubg = "pubg" in (game_name or "").lower()
    if "vp" in lower and digits:
        return f"🎯 {digits} VP"
    if "uc" in lower or (is_pubg and any(c.isdigit() for c in s)):
        return f"🎮 {digits} UC" if digits else f"🎮 {s}"
    if "алм" in lower and digits:
        return f"💎 {digits} алмазов"
    if digits and is_pubg:
        return f"🎮 {digits} UC"
    if digits:
        return f"💎 {digits} алмазов"
    return f"💎 {s}"


def format_money_display(num: str) -> str:
    """Грубое форматирование номера телефона с пробелами."""
    s = "".join(ch for ch in str(num) if ch.isdigit() or ch == "+")
    if s.startswith("+992") and len(s) >= 6:
        rest = s[4:]
        parts = [rest[i : i + 3] for i in range(0, len(rest), 3)]
        return "+992 " + " ".join(parts)
    return str(num)
