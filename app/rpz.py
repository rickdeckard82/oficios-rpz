from datetime import datetime, timezone


def build_rpz_zone(domains):
    serial = datetime.now(timezone.utc).strftime("%Y%m%d%H")
    lines = [
        "$TTL 1H",
        "@       IN      SOA localhost. anycast1.neolink.com.br. (",
        f"                {serial}      ; Serial",
        "                1h              ; Refresh",
        "                15m             ; Retry",
        "                30d             ; Expire",
        "                2h              ; Negative Cache TTL",
        "        )",
        "        IN      NS      anycast1.neolink.com.br.",
        "",
        "$ORIGIN rpz.zone.",
        "",
    ]

    for domain in domains:
        name = domain["name"]
        target = fqdn(domain.get("redirect_target")) if domain.get("redirect_target") else "."
        lines.append(f"{name} CNAME {target}")
        lines.append(f"*.{name} CNAME {target}")

    return "\n".join(lines) + "\n"


def fqdn(value):
    return value if value.endswith(".") else f"{value}."
