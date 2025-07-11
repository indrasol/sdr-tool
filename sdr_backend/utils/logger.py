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
    logger.error(f"--------------------------------")
    logger.error(f"{message}")
    logger.error(f"--------------------------------")

def log_debugger(message):
    logger.debug(f"--------------------------------")
    logger.debug(f"{message}")
    logger.debug(f"--------------------------------")

