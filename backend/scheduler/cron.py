from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import httpx
import logging

logger = logging.getLogger(__name__)

def _trigger_scan():
    try:
        resp = httpx.post("http://localhost:8000/api/niches/scan", timeout=5)
        logger.info(f"[Scheduler] Scan triggered: {resp.json()}")
    except Exception as e:
        logger.error(f"[Scheduler] Failed to trigger scan: {e}")

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run every day at 06:00 UTC
    scheduler.add_job(
        _trigger_scan,
        CronTrigger(hour=6, minute=0),
        id="daily_scan",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("[Scheduler] Daily scan scheduler started (06:00 UTC)")
    return scheduler
