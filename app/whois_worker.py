import os
import signal
import time

from sqlalchemy import inspect

from . import create_app, wait_for_database
from .models import db
from .whois_jobs import claim_next_whois_job, process_whois_job

running = True


def stop_worker(signum, frame):
    global running
    running = False


def main():
    signal.signal(signal.SIGINT, stop_worker)
    signal.signal(signal.SIGTERM, stop_worker)

    app = create_app()

    interval = int(os.getenv("WHOIS_WORKER_INTERVAL_SECONDS", "5"))
    max_attempts = int(os.getenv("WHOIS_WORKER_MAX_ATTEMPTS", "3"))

    with app.app_context():
        wait_for_database()
        wait_for_schema(interval)
        app.logger.info("WHOIS worker iniciado")
        while running:
            try:
                job_id = claim_next_whois_job(max_attempts=max_attempts)
                if not job_id:
                    time.sleep(interval)
                    continue

                process_whois_job(job_id)
            except Exception:
                app.logger.exception("Falha no loop do WHOIS worker")
                db.session.rollback()
                time.sleep(interval)
            finally:
                db.session.remove()

        app.logger.info("WHOIS worker finalizado")


def wait_for_schema(interval):
    while running:
        if "ip_whois_job" in inspect(db.engine).get_table_names():
            return
        time.sleep(interval)


if __name__ == "__main__":
    main()
