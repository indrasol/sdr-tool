# Add these methods to your ResponseLearningService class
from utils.logger import log_info
from models.response_models import ResponseType
from models.feedback_models import ResponseExample, FeedbackRating
from datetime import datetime
from typing import Optional, Union


import json
import os
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
import re

from models.response_models import ResponseType
from models.feedback_models import (
    ResponseFeedback, 
    ResponseExample, 
    ResponseMetrics,
    FeedbackRating
)
from core.prompt_engineering.prompt_builder import PromptBuilder
from core.cache.session_manager import SessionManager
from core.intent_classification.intent_classifier_v1 import IntentClassifier
from utils.logger import log_info


class ResponseLearningService:
    """
    Service for implementing response learning and continuous improvement.
    
    This service:
    1. Processes feedback on complete responses
    2. Stores high-quality examples for each intent type
    3. Improves prompts based on user feedback
    4. Tracks response quality metrics
    5. Implements self-improvement for the response pipeline
    """
    
    def __init__(
        self, 
        examples_path: str = './data/response_examples.json',
        metrics_path: str = './data/response_metrics.json',
        prompt_builder: Optional[PromptBuilder] = None,
        session_manager: Optional[SessionManager] = None,
        intent_classifier: Optional[IntentClassifier] = None,
        max_examples_per_intent: int = 25
    ):
        self.examples_path = examples_path
        self.metrics_path = metrics_path
        self.prompt_builder = prompt_builder
        self.session_manager = session_manager
        self.intent_classifier = intent_classifier
        self.max_examples_per_intent = max_examples_per_intent
        
        # Load existing examples and metrics
        self.examples = self._load_examples()
        self.metrics = self._load_metrics()
        
        # Initialize prompt improvements
        self.prompt_improvements = {}
        
        log_info(f"Response Learning Service initialized with {self._count_examples()} examples")
    
    def _load_examples(self) -> Dict[ResponseType, List[ResponseExample]]:
        """Load response examples from file or initialize empty dict"""
        if os.path.exists(self.examples_path):
            try:
                with open(self.examples_path, 'r') as f:
                    data = json.load(f)
                
                # Convert the loaded data to ResponseExample objects
                examples = {}
                for intent_str, intent_examples in data.items():
                    try:
                        intent = ResponseType(intent_str)
                        examples[intent] = [ResponseExample(**example) for example in intent_examples]
                    except (ValueError, TypeError) as e:
                        log_info(f"Error loading examples for intent {intent_str}: {str(e)}")
                
                return examples
            except Exception as e:
                log_info(f"Error loading response examples: {str(e)}. Initializing empty examples.")
        
        # Initialize empty examples for all intent types
        return {intent: [] for intent in ResponseType}
    
    def _load_metrics(self) -> ResponseMetrics:
        """Load response metrics from file or initialize new metrics"""
        if os.path.exists(self.metrics_path):
            try:
                with open(self.metrics_path, 'r') as f:
                    data = json.load(f)
                
                return ResponseMetrics(**data)
            except Exception as e:
                log_info(f"Error loading response metrics: {str(e)}. Initializing new metrics.")
        
        return ResponseMetrics()
    
    def _save_examples(self):
        """Save response examples to file"""
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(self.examples_path), exist_ok=True)
        
        # Convert examples to serializable format
        serializable_examples = {}
        for intent, examples in self.examples.items():
            serializable_examples[intent.value] = [example.dict() for example in examples]
        
        try:
            with open(self.examples_path, 'w') as f:
                json.dump(serializable_examples, f, indent=2)
        except Exception as e:
            log_info(f"Error saving response examples: {str(e)}")
    
    def _save_metrics(self):
        """Save response metrics to file"""
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(self.metrics_path), exist_ok=True)
        
        try:
            with open(self.metrics_path, 'w') as f:
                json.dump(self.metrics.dict(), f, indent=2)
        except Exception as e:
            log_info(f"Error saving response metrics: {str(e)}")
    
    def _count_examples(self) -> int:
        """Count total number of stored examples"""
        return sum(len(examples) for examples in self.examples.values())
    

    async def apply_prompt_improvements(self, query: str, intent: ResponseType, prompt: str) -> str:
        """
        Apply learned improvements to prompts based on similar queries.
        
        Args:
            query: The user's query
            intent: The classified intent
            prompt: The original prompt
            
        Returns:
            str: The improved prompt
        """
        try:
            # Find matching improvements based on query similarity
            improvement_key = self._find_matching_improvement(query)
            if not improvement_key or improvement_key not in self.prompt_improvements:
                return prompt  # No matching improvements, return original prompt
            
            improvement = self.prompt_improvements[improvement_key]
            
            # Add the improvement as context to the prompt
            improved_prompt = f"""
            {prompt}
            
            NOTE: Previous similar queries have received feedback for improvement:
            - Similar query: "{improvement['query']}"
            - Improvement feedback: "{improvement['improvement']}"
            - Consider this feedback carefully in your response.
            """
            
            # If there's a corrected response, include it as an example
            if 'corrected_response' in improvement and improvement['corrected_response']:
                improved_prompt += f"""
            - Example of better response: "{improvement['corrected_response']}"
            """
            
            log_info(f"Applied prompt improvement for query: {query[:50]}...")
            return improved_prompt
        except Exception as e:
            log_info(f"Error applying prompt improvements: {str(e)}")
            return prompt  # Return original prompt in case of error
    
    def _find_matching_improvement(self, query: str) -> Optional[str]:
        """Find a matching improvement key for the query"""
        try:
            # Extract key terms from the query (words with 3+ chars)
            query_terms = set(re.findall(r'\b\w{3,}\b', query.lower()))
            if not query_terms:
                return None
            
            # Check each improvement key for term overlap
            best_match = None
            best_score = 0
            
            for key in self.prompt_improvements:
                # Convert improvement key to set of terms
                key_terms = set(key.split('_'))
                # Calculate overlap between query terms and key terms
                overlap = len(query_terms.intersection(key_terms))
                
                # If better match than current best, update
                if overlap > best_score:
                    best_score = overlap
                    best_match = key
            
            # Only return a match if we have meaningful overlap (at least 2 terms)
            if best_score >= 2:
                return best_match
            
            return None
        except Exception as e:
            log_info(f"Error finding matching improvement: {str(e)}")
            return None
    
    def _get_improvement_key(self, query_or_feedback: Union[str, Dict]) -> Optional[str]:
        """
        Generate a key for storing prompt improvements based on query patterns.
        
        Args:
            query_or_feedback: Either a query string or a feedback object containing a query
            
        Returns:
            A string key or None if no key could be generated
        """
        try:
            # Get the query text
            if isinstance(query_or_feedback, dict) and 'query' in query_or_feedback:
                query = query_or_feedback['query'].lower()
            elif isinstance(query_or_feedback, str):
                query = query_or_feedback.lower()
            else:
                return None
            
            # Extract key terms from the query
            terms = re.findall(r'\b\w{3,}\b', query)  # Words with 3+ chars
            if not terms or len(terms) < 2:
                return None
            
            # Use the most specific/unique terms (up to 3)
            # Sort by length to prioritize longer, more specific terms
            sorted_terms = sorted(terms, key=len, reverse=True)[:3]
            
            # Create a key by joining sorted terms
            return "_".join(sorted(sorted_terms[:3]))
        except Exception as e:
            log_info(f"Error generating improvement key: {str(e)}")
            return None
    
    # async def process_response_feedback(self, feedback: ResponseFeedback) -> bool:
    #     """
    #     Process feedback on a complete response.
        
    #     Args:
    #         feedback: The user feedback on the response
            
    #     Returns:
    #         bool: True if processed successfully
    #     """
    #     try:
    #         # Update metrics based on feedback
    #         self._update_metrics(feedback)
            
    #         # Process intent classification feedback if provided
    #         if feedback.intent_was_correct is False and feedback.correct_intent:
    #             await self._process_intent_feedback(feedback)
            
    #         # Process response quality feedback
    #         rating = feedback.overall_rating
    #         if rating in [FeedbackRating.EXCELLENT, FeedbackRating.GOOD]:
    #             # Store high-quality responses as examples
    #             await self._store_positive_example(feedback)
    #         elif rating in [FeedbackRating.POOR, FeedbackRating.INCORRECT]:
    #             # Learn from negative feedback
    #             await self._process_negative_feedback(feedback)
            
    #         # Save updated metrics
    #         self._save_metrics()
            
    #         return True
    #     except Exception as e:
    #         log_info(f"Error processing response feedback: {str(e)}")
    #         return False
    
    async def _process_intent_feedback(self, feedback: ResponseFeedback):
        """Process feedback on intent classification"""
        if not feedback.correct_intent:
            return
        
        # Get the original session to extract query details
        if self.session_manager:
            try:
                session_data = await self.session_manager.get_session(feedback.session_id)
                
                # Find the specific query/response in conversation history
                for entry in session_data.get("conversation_history", []):
                    if entry.get("query") == feedback.query:
                        # Extract the original intent
                        response_data = entry.get("response", {})
                        if "response_type" in response_data:
                            original_intent = ResponseType(response_data["response_type"])
                            confidence = response_data.get("confidence", 0.5)
                            
                            # If we have an enhanced intent classifier, add feedback
                            try:
                                await self.intent_classifier.add_feedback(
                                    query=feedback.query,
                                    predicted_intent=original_intent,
                                    correct_intent=feedback.correct_intent,
                                    confidence=confidence
                                )
                                log_info(f"Added intent feedback for query: {feedback.query}")
                            except Exception as e:
                                log_info(f"Error getting intent classifier: {str(e)}")
                            break
            except Exception as e:
                log_info(f"Error processing intent feedback: {str(e)}")
    
    async def _store_positive_example(self, feedback: ResponseFeedback):
        """Store positive feedback as an example for future learning"""
        if not self.session_manager:
            return
        
        try:
            # Get the original session to extract response details
            session_data = await self.session_manager.get_session(feedback.session_id)
            
            # Find the specific query/response in conversation history
            for entry in session_data.get("conversation_history", []):
                if entry.get("query") == feedback.query:
                    # Extract response data
                    response_data = entry.get("response", {})
                    if "response_type" in response_data:
                        intent = ResponseType(response_data["response_type"])
                        
                        # Check if we already have this query as an example
                        existing_example = next(
                            (ex for ex in self.examples.get(intent, []) if ex.query == feedback.query),
                            None
                        )
                        
                        if existing_example:
                            # Update existing example
                            existing_example.rating = feedback.overall_rating
                            existing_example.feedback_count += 1
                        else:
                            # Create new example
                            new_example = ResponseExample(
                                query=feedback.query,
                                intent=intent,
                                response=response_data,
                                rating=feedback.overall_rating,
                                tags=feedback.tags or [],
                                created_at=datetime.now().isoformat()
                            )
                            
                            # Initialize intent in examples dict if needed
                            if intent not in self.examples:
                                self.examples[intent] = []
                            
                            # Add example and ensure we don't exceed max examples
                            self.examples[intent].append(new_example)
                            if len(self.examples[intent]) > self.max_examples_per_intent:
                                # Remove the oldest, least-used example
                                self.examples[intent].sort(
                                    key=lambda ex: (ex.feedback_count, ex.created_at)
                                )
                                self.examples[intent] = self.examples[intent][1:]
                        
                        # Save updated examples
                        self._save_examples()
                        log_info(f"Stored positive example for intent: {intent}")
                        break
        except Exception as e:
            log_info(f"Error storing positive example: {str(e)}")
    
    # async def _process_negative_feedback(self, feedback: ResponseFeedback):
    #     """Learn from negative feedback to improve future responses"""
    #     if not feedback.improvement_needed:
    #         return
        
    #     try:
    #         # If corrected response is provided, this is especially valuable
    #         if feedback.corrected_response:
    #             # Add this to our prompt improvement database
    #             improvement_key = self._get_improvement_key(feedback)
    #             if improvement_key:
    #                 self.prompt_improvements[improvement_key] = {
    #                     "query": feedback.query,
    #                     "improvement": feedback.improvement_needed,
    #                     "corrected_response": feedback.corrected_response,
    #                     "created_at": datetime.now().isoformat()
    #                 }
            
    #         # Store improvement tags for analysis
    #         if feedback.tags:
    #             for tag in feedback.tags:
    #                 self.metrics.common_improvement_tags[tag] = \
    #                     self.metrics.common_improvement_tags.get(tag, 0) + 1
            
    #         log_info(f"Processed negative feedback for query: {feedback.query[:50]}...")
    #     except Exception as e:
    #         log_info(f"Error processing negative feedback: {str(e)}")
    
    def _update_metrics(self, feedback: ResponseFeedback):
        """Update response quality metrics based on feedback"""
        # Increment total feedback count
        self.metrics.feedback_received += 1
        
        # Update rating distribution
        self.metrics.rating_distribution[feedback.overall_rating] += 1
        
        # Update category ratings if provided
        if feedback.category_ratings:
            for category, rating in feedback.category_ratings.items():
                self.metrics.category_ratings[category][rating] += 1
    
    
    def get_response_metrics(self) -> Dict[str, Any]:
        """
        Get response quality metrics.
        
        Returns:
            Dict of response metrics
        """
        return self.metrics.dict()
    
    def get_improvement_suggestions(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Get improvement suggestions for a query based on previous feedback.
        
        Args:
            query: The user's query
            
        Returns:
            Dict containing improvement suggestions or None
        """
        improvement_key = self._find_matching_improvement(query)
        if improvement_key and improvement_key in self.prompt_improvements:
            return self.prompt_improvements[improvement_key]
        
        return None
    
    async def handle_positive_feedback(self, session_id: str, query: str, response_id: str) -> bool:
        """
        Handle thumbs up (positive) feedback.
        
        Args:
            session_id: The unique session identifier
            query: The user's query
            response_id: ID of the response that received positive feedback
            
        Returns:
            bool: True if processed successfully
        """
        if not self.session_manager:
            return False
        
        try:
            # Get the session data
            session_data = await self.session_manager.get_session(session_id)
            
            # Find the specific response in the conversation history
            for entry in session_data.get("conversation_history", []):
                if entry.get("response", {}).get("response_id") == response_id:
                    # Extract the response data
                    response_data = entry.get("response", {})
                    if "response_type" in response_data:
                        intent = ResponseType(response_data["response_type"])
                        
                        # Store as a good example
                        new_example = ResponseExample(
                            query=query,
                            intent=intent,
                            response=response_data,
                            rating=FeedbackRating.GOOD,  # Use GOOD for thumbs up
                            created_at=datetime.now().isoformat()
                        )
                        
                        # Initialize intent in examples dict if needed
                        if intent not in self.examples:
                            self.examples[intent] = []
                        
                        # Check if we already have this query
                        existing = next(
                            (ex for ex in self.examples[intent] if ex.query == query),
                            None
                        )
                        
                        if existing:
                            # Update existing example
                            existing.feedback_count += 1
                        else:
                            # Add new example
                            self.examples[intent].append(new_example)
                            
                            # Trim examples if we have too many
                            if len(self.examples[intent]) > self.max_examples_per_intent:
                                self.examples[intent].sort(
                                    key=lambda ex: (ex.feedback_count, ex.created_at)
                                )
                                self.examples[intent] = self.examples[intent][1:]
                        
                        # Update metrics
                        self.metrics.feedback_received += 1
                        self.metrics.rating_distribution[FeedbackRating.GOOD] += 1
                        
                        # Save updates
                        self._save_examples()
                        self._save_metrics()
                        
                        log_info(f"Processed positive feedback for query: {query}")
                        return True
            
            log_info(f"Response {response_id} not found in session {session_id}")
            return False
        except Exception as e:
            log_info(f"Error processing positive feedback: {str(e)}")
            return False

    async def handle_negative_feedback(
        self, 
        session_id: str, 
        query: str, 
        response_id: str,
        reason: Optional[str] = None
    ) -> bool:
        """
        Handle thumbs down (negative) feedback.
        
        Args:
            session_id: The unique session identifier
            query: The user's query
            response_id: ID of the response that received negative feedback
            reason: Optional reason for the negative feedback
            
        Returns:
            bool: True if processed successfully
        """
        if not self.session_manager:
            return False
        
        try:
            # Get the session data
            session_data = await self.session_manager.get_session(session_id)
            
            # Find the specific response in the conversation history
            for entry in session_data.get("conversation_history", []):
                if entry.get("response", {}).get("response_id") == response_id:
                    # Extract the response data
                    response_data = entry.get("response", {})
                    
                    # Store the reason for improvement if provided
                    if reason:
                        # Create a key for this improvement
                        improvement_key = self._get_improvement_key(query)
                        if improvement_key:
                            self.prompt_improvements[improvement_key] = {
                                "query": query,
                                "improvement": reason,
                                "created_at": datetime.now().isoformat()
                            }
                    
                    # Update metrics
                    self.metrics.feedback_received += 1
                    self.metrics.rating_distribution[FeedbackRating.POOR] += 1
                    
                    # Save updates
                    self._save_metrics()
                    
                    log_info(f"Processed negative feedback for query: {query}")
                    return True
            
            log_info(f"Response {response_id} not found in session {session_id}")
            return False
        except Exception as e:
            log_info(f"Error processing negative feedback: {str(e)}")
            return False

    async def record_retry(self, session_id: str, query: str, response_id: str) -> bool:
        """
        Record that a response needed to be retried.
        
        Args:
            session_id: The unique session identifier
            query: The user's query
            response_id: ID of the original response that's being retried
            
        Returns:
            bool: True if recorded successfully
        """
        try:
            # Record this as a form of negative feedback
            await self.handle_negative_feedback(
                session_id, 
                query, 
                response_id,
                reason="User requested retry"
            )
            
            # Update specific retry metrics
            self.metrics.common_improvement_tags["needed_retry"] = \
                self.metrics.common_improvement_tags.get("needed_retry", 0) + 1
                
            # Save metrics
            self._save_metrics()
            
            log_info(f"Recorded retry for query: {query}")
            return True
        except Exception as e:
            log_info(f"Error recording retry: {str(e)}")
            return False