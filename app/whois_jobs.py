from datetime import datetime

from flask import current_app

from .ip_whois import lookup_ip_whois
from .models import IpAddress, IpWhoisCache, IpWhoisJob, db


def enqueue_ip_whois_jobs(ip_ids):
    if not ip_ids:
        return {"queued": 0, "skipped": 0}

    existing_jobs = {
        job.ip_id: job
        for job in IpWhoisJob.query.filter(IpWhoisJob.ip_id.in_(ip_ids)).all()
    }
    queued = 0
    skipped = 0
    now = datetime.utcnow()

    for ip_id in ip_ids:
        job = existing_jobs.get(ip_id)
        if job and job.status == "running":
            skipped += 1
            continue
        if not job:
            db.session.add(IpWhoisJob(ip_id=ip_id, status="pending"))
        else:
            job.status = "pending"
            job.attempts = 0
            job.error = None
            job.started_at = None
            job.finished_at = None
            job.updated_at = now
        queued += 1

    db.session.commit()
    return {"queued": queued, "skipped": skipped}


def load_whois_jobs_by_ip(ip_ids):
    if not ip_ids:
        return {}

    rows = IpWhoisJob.query.filter(IpWhoisJob.ip_id.in_(ip_ids)).all()
    return {row.ip_id: row for row in rows}


def load_whois_by_ip(ip_ids):
    if not ip_ids:
        return {}

    rows = IpWhoisCache.query.filter(IpWhoisCache.ip_id.in_(ip_ids)).all()
    return {row.ip_id: row for row in rows}


def refresh_ip_whois(address):
    data = lookup_ip_whois(
        address.address,
        timeout=int(current_app.config.get("WHOIS_LOOKUP_TIMEOUT_SECONDS", 8)),
    )
    cache = IpWhoisCache.query.filter_by(ip_id=address.id).first()
    if not cache:
        cache = IpWhoisCache(ip_id=address.id)
        db.session.add(cache)

    cache.asn = data.get("asn")
    cache.as_name = data.get("as_name")
    cache.bgp_prefix = data.get("bgp_prefix")
    cache.registry = data.get("registry")
    cache.country = data.get("country")
    cache.rdap_name = data.get("rdap_name")
    cache.rdap_handle = data.get("rdap_handle")
    cache.rdap_country = data.get("rdap_country")
    cache.error = data.get("error")
    db.session.commit()
    return cache


def claim_next_whois_job(max_attempts=3):
    now = datetime.utcnow()
    with db.session.begin():
        job = (
            IpWhoisJob.query.filter(
                IpWhoisJob.status.in_(["pending", "error"]),
                IpWhoisJob.attempts < max_attempts,
            )
            .order_by(IpWhoisJob.created_at.asc(), IpWhoisJob.id.asc())
            .with_for_update(skip_locked=True)
            .first()
        )
        if not job:
            return None

        job.status = "running"
        job.attempts += 1
        job.error = None
        job.started_at = now
        job.updated_at = now
        return job.id


def process_whois_job(job_id):
    job = IpWhoisJob.query.get(job_id)
    if not job:
        return False

    address = IpAddress.query.get(job.ip_id)
    if not address:
        mark_whois_job(job, "error", "IP nao encontrado")
        return False

    try:
        refresh_ip_whois(address)
    except Exception as exc:
        current_app.logger.exception("Falha ao processar WHOIS do IP %s", address.address)
        mark_whois_job(job, "error", str(exc)[:255])
        return False

    mark_whois_job(job, "done", None)
    return True


def mark_whois_job(job, status, error):
    now = datetime.utcnow()
    job.status = status
    job.error = error
    job.finished_at = now
    job.updated_at = now
    db.session.commit()
