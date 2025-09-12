import asyncio
from datetime import datetime
from services.user_session_tracker import UserSessionTracker
from utils.logger import log_info

class InactiveSessionChecker:
    """Periodically checks for inactive sessions and ends them"""
    
    def __init__(self, check_interval_minutes=5, inactive_threshold_minutes=30):
        """
        Args:
            check_interval_minutes: How often to check for inactive sessions
            inactive_threshold_minutes: How long a session can be inactive before ending
        """
        self.check_interval = check_interval_minutes * 60  # Convert to seconds
        self.inactive_threshold = inactive_threshold_minutes
        self.session_tracker = UserSessionTracker()
        self.running = False
    
    async def start(self):
        """Start the background task"""
        self.running = True
        log_info("Starting inactive session checker")
        
        while self.running:
            try:
                # Process inactive sessions
                ended_sessions = await self.session_tracker.check_inactive_sessions(self.inactive_threshold)
                if ended_sessions:
                    log_info(f"Ended {len(ended_sessions)} inactive sessions")
                
                # Wait for next check interval
                await asyncio.sleep(self.check_interval)
            except Exception as e:
                log_info(f"Error in inactive session checker: {str(e)}")
                await asyncio.sleep(60)  # Wait a minute before retrying on error
    
    def stop(self):
        """Stop the background task"""
        self.running = False
        log_info("Stopping inactive session checker")
