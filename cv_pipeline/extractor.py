import re


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
    patterns = [
        r"\d{2}/\d{2}/\d{4}",  # DD/MM/YYYY
        r"\d{2}-\d{2}-\d{4}",  # DD-MM-YYYY
        r"\d{4}/\d{2}/\d{2}",  # YYYY/MM/DD
        r"\d{2}\s\w+\s\d{4}",  # DD MONTH YYYY
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group()
    return ""


def extract_total(text: str) -> str:
    # Last monetary value on a receipt is often the total.
    matches = re.findall(r"\b\d+\.\d{2}\b", text)
    return matches[-1] if matches else ""


def extract_address(lines: list) -> str:
    address_lines = []
    for line in lines[1:4]:
        if re.search(r"\d+\.\d{2}", line):
            break
        address_lines.append(line)
    return ", ".join(address_lines)