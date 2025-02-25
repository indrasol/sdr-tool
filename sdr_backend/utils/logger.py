import logging

logger = logging.getLogger("chat_api")
logging.basicConfig(level=logging.INFO)
# logging.basicConfig(level=logging.DEBUG)
# logging.basicConfig(level=logging.ERROR)

def log_info(message):
    logger.info(f"--------------------------------")
    logger.info(f"{message}")
    logger.info(f"--------------------------------")

def log_error(message):
    logger.ERROR(f"--------------------------------")
    logger.ERROR(f"{message}")
    logger.ERROR(f"--------------------------------")

def log_debugger(message):
    logger.DEBUG(f"--------------------------------")
    logger.DEBUG(f"{message}")
    logger.DEBUG(f"--------------------------------")

