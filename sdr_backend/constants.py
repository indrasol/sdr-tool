

# enums.py
from enum import Enum

class ProjectStatus(Enum):
    PLANNED = "Planned"
    ACTIVE = "Active"
    PENDING = "Pending"
    COMPLETED = "Completed"
    ON_HOLD = "On Hold"
    IN_PROGRESS = "In Progress"
    NOT_STARTED = "Not Started"
    STARTED = "Started"
    ALL = "ALL"

class ProjectPriority(Enum):
    ALL = "ALL"
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"