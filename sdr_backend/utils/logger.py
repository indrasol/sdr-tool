import logging

logger = logging.getLogger("chat_api")
logging.basicConfig(level=logging.INFO)

def log_info(message):
    logger.info(f"--------------------------------")
    logger.info(f"{message}")
    logger.info(f"--------------------------------")

def log_error(message):
    logger.error(f"--------------------------------")
    logger.error(f"{message}")
    logger.error(f"--------------------------------")

