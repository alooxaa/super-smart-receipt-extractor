import re

_DATE_RES = (
    re.compile(r"\d{2}/\d{2}/\d{4}"),
    re.compile(r"\d{2}-\d{2}-\d{4}"),
    re.compile(r"\d{4}/\d{2}/\d{2}"),
    re.compile(r"\d{2}\s\w+\s\d{4}"),
)
_ADDRESS_MONEY = re.compile(r"\d+\.\d{2}")

# Amount after keywords (RM/MYR optional). Group 1 = numeric part.
_MONEY_TAIL = r"(?:RM|MYR|\$)?\s*([0-9]+(?:[.,][0-9]+)*)"

_TOTAL_PRIORITY = (
    # 1) Grand / invoice total (avoid matching "SUBTOTAL" via \bTOTAL\b)
    re.compile(rf"(?i)(?<!\w)TOTAL(?!\w)(?:\s*\([^)]*\))?\s*[:\-]?\s*{_MONEY_TAIL}"),
    re.compile(rf"(?i)\bAMOUNT\s+DUE\b\s*[:\-]?\s*{_MONEY_TAIL}"),
    re.compile(rf"(?i)\bBALANCE\s+DUE\b\s*[:\-]?\s*{_MONEY_TAIL}"),
    re.compile(rf"(?i)\bAMOUNT\s+PAYABLE\b\s*[:\-]?\s*{_MONEY_TAIL}"),
    # 2) Subtotal only if nothing above matched (caller tries in order)
    re.compile(rf"(?i)\bSUBTOTAL\b\s*[:\-]?\s*{_MONEY_TAIL}"),
)
_CASH_CHANGE = (
    re.compile(rf"(?i)\bCASH\b\s*[:\-]?\s*{_MONEY_TAIL}"),
    re.compile(rf"(?i)\bCHANGE\b\s*[:\-]?\s*{_MONEY_TAIL}"),
)
_RM_AMOUNTS = re.compile(rf"(?i)RM\s*([0-9]+(?:[.,][0-9]+)*)")
_GENERIC_DECIMALS = re.compile(r"\b\d+\.\d{2}\b")


def extract_fields(full_text: str) -> dict:
    lines = [line.strip() for line in full_text.split("\n") if line.strip()]

    company = extract_company(lines)
    date = extract_date(full_text)
    total = extract_total(full_text)
    address = extract_address(lines)

    return {
        "company": company,
        "date": date,
        "total": total,
        "address": address,
    }


def extract_company(lines: list) -> str:
    # First non-empty line is usually the company name.
    return lines[0] if lines else ""


def extract_date(text: str) -> str:
    for cre in _DATE_RES:
        match = cre.search(text)
        if match:
            return match.group()
    return ""


def _amount_to_float(s: str) -> float:
    """Parse receipt amount strings (e.g. 1,234.56 or 99,06 or 105.00)."""
    s = (s or "").strip().replace(" ", "")
    if not s:
        return 0.0
    if re.match(r"^\d{1,3}(,\d{3})+(\.\d+)?$", s):
        s = s.replace(",", "")
    elif s.count(",") == 1 and s.count(".") == 0:
        s = s.replace(",", ".")
    else:
        s = s.replace(",", "")
    return float(s)


def _format_amount(val: float) -> str:
    return f"{val:.2f}"


def extract_total(text: str) -> str:
    """Rule-based total: keyword lines first, then cash−change, then largest RM, last resort last decimal."""
    if not text or not text.strip():
        return ""

    for cre in _TOTAL_PRIORITY:
        m = cre.search(text)
        if m:
            raw = m.group(1)
            try:
                return _format_amount(_amount_to_float(raw))
            except ValueError:
                continue

    cash_m = _CASH_CHANGE[0].search(text)
    chg_m = _CASH_CHANGE[1].search(text)
    if cash_m and chg_m:
        try:
            net = _amount_to_float(cash_m.group(1)) - _amount_to_float(chg_m.group(1))
            if net >= 0:
                return _format_amount(net)
        except ValueError:
            pass

    amounts = _RM_AMOUNTS.findall(text)
    if amounts:
        try:
            best = max(amounts, key=lambda x: _amount_to_float(x))
            return _format_amount(_amount_to_float(best))
        except ValueError:
            pass

    matches = _GENERIC_DECIMALS.findall(text)
    return matches[-1] if matches else ""


def extract_address(lines: list) -> str:
    address_lines = []
    for line in lines[1:4]:
        if _ADDRESS_MONEY.search(line):
            break
        address_lines.append(line)
    return ", ".join(address_lines)