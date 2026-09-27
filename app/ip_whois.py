from functools import lru_cache
from ipaddress import ip_address, ip_network
import json
import socket
from urllib.error import HTTPError, URLError
from urllib.request import urlopen


RDAP_BOOTSTRAP = {
    4: "https://data.iana.org/rdap/ipv4.json",
    6: "https://data.iana.org/rdap/ipv6.json",
}
DEFAULT_TIMEOUT = 8


def lookup_ip_whois(address, timeout=DEFAULT_TIMEOUT):
    ip_value = address.split("/", 1)[0]
    result = {"ip": ip_value, "errors": []}

    try:
        result.update(lookup_cymru_asn(ip_value, timeout=timeout))
    except Exception as exc:
        result["errors"].append(f"ASN: {exc}")

    try:
        result.update(lookup_rdap(ip_value, timeout=timeout))
    except Exception as exc:
        result["errors"].append(f"RDAP: {exc}")

    if result["errors"]:
        result["error"] = "; ".join(result["errors"])[:255]
    else:
        result["error"] = None
    result.pop("errors", None)
    return result


def lookup_cymru_asn(ip_value, timeout=DEFAULT_TIMEOUT):
    query = f"begin\nverbose\n{ip_value}\nend\n"
    with socket.create_connection(("whois.cymru.com", 43), timeout=timeout) as sock:
        sock.settimeout(timeout)
        sock.sendall(query.encode("ascii"))
        response = read_socket(sock).decode("utf-8", errors="replace")

    rows = [line.strip() for line in response.splitlines() if line.strip()]
    if len(rows) < 2:
        raise LookupError("resposta vazia")

    fields = [field.strip() for field in rows[1].split("|")]
    if len(fields) < 7:
        raise LookupError("resposta inesperada")

    asn = fields[0]
    return {
        "asn": int(asn) if asn.isdigit() else None,
        "bgp_prefix": empty_to_none(fields[2]),
        "country": empty_to_none(fields[3]),
        "registry": empty_to_none(fields[4]),
        "as_name": empty_to_none(fields[6]),
    }


def lookup_rdap(ip_value, timeout=DEFAULT_TIMEOUT):
    server = rdap_server_for_ip(ip_value, timeout=timeout)
    if not server:
        raise LookupError("servidor RDAP nao encontrado")

    url = server.rstrip("/") + "/ip/" + ip_value
    try:
        with urlopen(url, timeout=timeout) as response:
            payload = json.load(response)
    except HTTPError as exc:
        raise LookupError(f"HTTP {exc.code}") from exc
    except URLError as exc:
        raise LookupError(str(exc.reason)) from exc

    return {
        "rdap_name": empty_to_none(payload.get("name")),
        "rdap_handle": empty_to_none(payload.get("handle")),
        "rdap_country": empty_to_none(payload.get("country")),
    }


def rdap_server_for_ip(ip_value, timeout=DEFAULT_TIMEOUT):
    parsed = ip_address(ip_value)
    for service in rdap_bootstrap(parsed.version, timeout=timeout).get("services", []):
        ranges, urls = service
        if not urls:
            continue
        for range_value in ranges:
            if parsed in ip_network(range_value, strict=False):
                return urls[0]
    return None


@lru_cache(maxsize=2)
def rdap_bootstrap(version, timeout=DEFAULT_TIMEOUT):
    with urlopen(RDAP_BOOTSTRAP[version], timeout=timeout) as response:
        return json.load(response)


def read_socket(sock):
    chunks = []
    while True:
        chunk = sock.recv(4096)
        if not chunk:
            break
        chunks.append(chunk)
    return b"".join(chunks)


def empty_to_none(value):
    value = (value or "").strip()
    return value or None
