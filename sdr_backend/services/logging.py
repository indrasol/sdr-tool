import logging
import sys
from pathlib import Path
import json
from datetime import datetime


class JSONFormatter(logging.Formatter):
    """
    Custom JSON formatter for structured logging.
    """
    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, "props"):
            log_record.update(record.props)
        
        return json.dumps(log_record)


def setup_logging(level=logging.INFO, log_file=None):
    """
    Configure application logging.
    
    Args:
        level: Logging level (default: INFO)
        log_file: Optional path to log file
    """
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(level)
    
    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(JSONFormatter())
    logger.addHandler(console_handler)
    
    # Create file handler if log file specified
    if log_file:
        log_path = Path(log_file)
        # Create directory if it doesn't exist
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(level)
        file_handler.setFormatter(JSONFormatter())
        logger.addHandler(file_handler)
    
    # Set lower log level for some noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    
    return logger