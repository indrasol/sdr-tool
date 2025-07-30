import os, time, select, psycopg2, psycopg2.extensions, threading, logging
from typing import Callable

LOG = logging.getLogger("taxonomy")

def start_taxonomy_listener(dsn: str, on_change: Callable[[], None], debounce_sec: float = 1.0):
    """
    Spawn a daemon thread that LISTENs on channel 'taxonomy_changed'
    and calls `on_change()` (e.g. reload_taxonomy) with debouncing.
    """
    def _run():
        while True:
            try:
                conn = psycopg2.connect(dsn, sslmode="require")
                conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
                cur = conn.cursor()
                cur.execute("LISTEN taxonomy_changed;")
                LOG.info("[taxonomy] LISTEN started")
                last_called = 0.0

                while True:
                    # block up to 60s; prevents busy-loop
                    if select.select([conn], [], [], 60) == ([], [], []):
                        continue
                    conn.poll()
                    while conn.notifies:
                        note = conn.notifies.pop(0)
                        LOG.debug("[taxonomy] NOTIFY payload=%s", note.payload[:200])
                        now = time.time()
                        if now - last_called >= debounce_sec:
                            try:
                                on_change()
                                LOG.info("[taxonomy] cache reloaded")
                            except Exception as exc:
                                LOG.exception("[taxonomy] reload failed: %s", exc)
                            last_called = now
            except Exception as exc:
                LOG.error("[taxonomy] listener crashed, retrying in 5s: %s", exc)
                time.sleep(5)

    t = threading.Thread(target=_run, daemon=True, name="taxonomy-listener")
    t.start()
