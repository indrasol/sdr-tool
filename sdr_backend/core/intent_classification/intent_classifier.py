import re
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from typing import Dict, List, Any
from utils.logger import log_info
import numpy as np
from config.settings import ML_MODELS_DIR
import os
from core.intent_classification.intent_dataset import train_intent_classifier
import asyncio

class IntentClassifier:
    """
    A hybrid intent classifier for classifying user queries into 'diagram_modification',
    'diagram_query', or 'expert_advice'. Combines efficient rule-based patterns with a
    context-aware DistilBERT model.
    """

    def __init__(self, model_path: str = ML_MODELS_DIR ):
        """
        Initialize the classifier with lazy-loaded model and compiled patterns.

        Args:
            model_path: Path to the fine-tuned DistilBERT model (default: './ml_models/intent_classifier')
        """

        self.model_path = model_path
        self._tokenizer = None
        self._model = None
        # Check if ml_models directory and model files exists
        if not self._model_files_exist(model_path):
            log_info("Model files not found, training model...")
            os.makedirs(model_path, exist_ok=True)
            # train_intent_classifier(ml_models_dir=model_path)

        #   Trigger lazy loading of tokenizer and model during initialization
        _ = self.tokenizer  # Loads the tokenizer if not already loaded
        _ = self.model     # Loads the model if not already loaded

        # Compile regex patterns for efficiency
        self.intent_patterns = {
            "expert_advice": [re.compile(p, re.IGNORECASE) for p in self._get_expert_patterns()],
            "diagram_modification": [re.compile(p, re.IGNORECASE) for p in self._get_modification_patterns()],
            "diagram_query": [re.compile(p, re.IGNORECASE) for p in self._get_query_patterns()]
        }

        # Heuristic term lists
        self.modification_terms = ["add", "remove", "connect", "move", "rename", "create", "delete", "insert"]
        self.query_terms = ["how", "what", "where", "show", "list", "explain", "describe"]
        self.advice_terms = ["best", "should", "recommend", "difference", "advantages", "why"]
        self.diagram_terms = ["diagram", "architecture", "node", "connection", "component", "setup"]

        # Label mapping for model output
        self.id_to_label = {0: "diagram_modification", 1: "diagram_query", 2: "expert_advice"}
        log_info("Intent classifier initialized")

    def _model_files_exist(self, path):
        # Check for key model files
        return os.path.exists(os.path.join(path, 'pytorch_model.bin')) or os.path.exists(os.path.join(path, 'model.safetensors'))
    
    @property
    def tokenizer(self):
        """Lazy load the tokenizer."""
        if self._tokenizer is None:
            try:
                self._tokenizer = DistilBertTokenizer.from_pretrained(self.model_path)
                log_info(f"Tokenizer loaded from {self.model_path}")
            except Exception as e:
                log_info(f"Error loading tokenizer: {str(e)}")
        return self._tokenizer

    @property
    def model(self):
        """Lazy load the model."""
        if self._model is None:
            try:
                self._model = DistilBertForSequenceClassification.from_pretrained(self.model_path)
                self._model.eval()
                log_info(f"Model loaded from {self.model_path}")
            except Exception as e:
                log_info(f"Error loading model: {str(e)}")
        return self._model

    def _get_expert_patterns(self) -> List[str]:
        """Regex patterns for expert advice intent."""
        return [
            r"(?i)best\s+practice",
            r"(?i)(?:wuts|what's|what is)\s+(?:the)?\s*best\s+(?:practice|security)?",  # Informal "Wuts the best security?"
            r"(?i)how\s+(?:should|do)\s+I\s+(?:optimize|\w+)",  # For "How do I optimize this?"
            r"(?i)help\s+me\s+(?:with\s+)?\w+",  # For "Help me with security"
            r"(?i)how\s+should\s+I",
            r"(?i)explain\s+(?:to me)?\s*(?:the|a)?\s*difference\s+between",
            r"(?i)recommend\s+(?:a|an|the)?\s*\w+",
            r"(?i)what(?:'s| is)\s+(?:the)?\s*best"
            r"(?i)(?:wuts|what's|what is)\s+(?:the)?\s*best\s+(?:security|practice|way|approach)"
        ]

    def _get_modification_patterns(self) -> List[str]:
        """Regex patterns for diagram modification intent."""
        return [
            r"(?i)add\s+(?:a|an|the)?\s*\w+",
            r"(?i)remove\s+(?:a|an|the)?\s*\w+",
            r"(?i)connect\s+(?:the)?\s*\w+",
            r"(?i)create\s+(?:a|an|the)?\s*\w+",
            r"(?i)move\s+(?:the)?\s*\w+",
            r"(?i)(?:can\s+you\s+)?make\s+(?:this|the|it)\s+better",
            r"(?i)(?:can\s+you\s+)?make\s+(?:this|the)?\s+\w+\s+better",
            r"(?i)(?:add|create|insert)\s+(?:a|an|the)?\s*[\w_]+"
        ]

    def _get_query_patterns(self) -> List[str]:
        """Regex patterns for diagram query intent."""
        return [
            r"(?i)how\s+is\s+(?:the)?\s*\w+\s+connected",
            r"(?i)what\s+is\s+connected\s+to",
            r"(?i)show\s+me\s+(?:the)?\s*\w+\s+(?:in|on)\s+(?:the|this)?\s*diagram",
            r"(?i)explain\s+(?:this|the)?\s*diagram",
            r"(?i)where\s+is\s+(?:the)?\s*\w+",
            r"(?i)how\??",  # Minimal match for "How?", but prioritize context
        ]

    async def classify_intent(self, query: str, conversation_history: List[str] = None) -> Dict:
        """
        Classify the intent of a user query using a hybrid approach.

        Args:
            query: The user’s query text
            conversation_history: Optional list of previous user queries (strings)

        Returns:
            Dict with keys: 'intent_type', 'confidence', 'query'
        """
        # Rule-based classification first for speed
        rule_result = self._rule_based_classification(query)
        if rule_result["confidence"] >= 0.8:
            log_info(f"Rule-based result: {rule_result}")
            return rule_result

        # Fall back to model if available and rule confidence is low
        if self.model and self.tokenizer:
            try:
                model_result = await asyncio.to_thread(
                    self._model_based_classification, query, conversation_history
                )
                log_info(f"Model-based result: {model_result}")
                if model_result["confidence"] > rule_result["confidence"]:
                    return model_result
            except Exception as e:
                log_info(f"Model classification failed: {str(e)}")

        return rule_result if rule_result["intent_type"] else {
            "intent_type": "expert_advice",
            "confidence": 0.3,
            "query": query
        }

    def _rule_based_classification(self, query: str) -> Dict:
        """Classify using regex patterns and heuristics."""
        query_lower = query.lower()


        # Negative patterns to reduce false positives
        if any(term in query_lower for term in self.advice_terms) and not any(term in query_lower for term in self.modification_terms):
            return {"intent_type": "expert_advice", "confidence": 0.85, "query": query}

        # Enhanced typo handling
        typos = {"ad": "add", "creaet": "create", "remov": "remove"}
        for typo, correct in typos.items():
            if typo in query_lower:
                query_lower = query_lower.replace(typo, correct)
        
        # Short modification commands
        if len(query.split()) <= 2 and any(term in query_lower for term in ["add", "remove", "create", "insert"]):
            return {"intent_type": "diagram_modification", "confidence": 0.8, "query": query}

        # Expert advice pattern
        if any(p.search(query_lower) for p in self.intent_patterns["expert_advice"]):
            return {"intent_type": "expert_advice", "confidence": 0.9, "query": query}
        
        # Diagram context boosts modification/query confidence
        has_diagram_context = any(term in query_lower for term in self.diagram_terms)
        if any(p.search(query_lower) for p in self.intent_patterns["diagram_modification"]):
            confidence = 0.85 if has_diagram_context else 0.75
            return {"intent_type": "diagram_modification", "confidence": confidence, "query": query}
        if any(p.search(query_lower) for p in self.intent_patterns["diagram_query"]):
            confidence = 0.85 if has_diagram_context else 0.75
            return {"intent_type": "diagram_query", "confidence": confidence, "query": query}
        

        # Heuristics for less clear cases
        mod_count = sum(term in query_lower for term in self.modification_terms)
        query_count = sum(term in query_lower for term in self.query_terms)
        advice_count = sum(term in query_lower for term in self.advice_terms)

        if mod_count > query_count and mod_count > advice_count and has_diagram_context:
            confidence = min(0.6 + 0.1 * mod_count, 0.85)
            return {"intent_type": "diagram_modification", "confidence": confidence, "query": query}
        elif query_count > mod_count and query_count > advice_count:
            intent = "diagram_query" if has_diagram_context else "expert_advice"
            confidence = min(0.6 + 0.1 * query_count, 0.85)
            return {"intent_type": intent, "confidence": confidence, "query": query}
        elif advice_count > 0 and len(query.split()) > 1:
            confidence = min(0.5 + 0.1 * advice_count, 0.85)
            return {"intent_type": "expert_advice", "confidence": confidence, "query": query}

        return {"intent_type": "expert_advice", "confidence": 0.7, "query": query}

    def _model_based_classification(self, query: str, conversation_history: List[str]) -> Dict:
        """Classify using DistilBERT with conversation context."""
        input_text = self._prepare_contextualized_input(query, conversation_history)
        inputs = self.tokenizer(input_text, return_tensors="pt", truncation=True, padding=True, max_length=128)
        with torch.no_grad():
            outputs = self.model(**inputs)
            probabilities = torch.nn.functional.softmax(outputs.logits, dim=1)[0]
            predicted_class = probabilities.argmax().item()
            confidence = probabilities[predicted_class].item()
        intent_type = self.id_to_label[predicted_class]
        return {"intent_type": intent_type, "confidence": confidence, "query": query}

    def _prepare_contextualized_input(self, query: str, conversation_history: List[str]) -> str:
        """Prepare input with up to two previous queries for context."""
        if not conversation_history or len(conversation_history) == 0:
            return query
        context = " [SEP] ".join(conversation_history[-2:]) + " [SEP] " + query
        return context
    
    async def batch_classify(self, queries: List[str]) -> List[Dict[str, Any]]:
        """
        Classify multiple queries at once (useful for testing or batch processing).
        
        Args:
            queries: List of query strings
            
        Returns:
            List of classification results
        """
        results = []
        for query in queries:
            result = await self.classify_intent(query)
            results.append(result)
        return results
    
    @staticmethod
    def get_fallback_classification() -> Dict[str, Any]:
        """
        Get a fallback classification when the classifier fails.
        
        Returns:
            Default classification dict
        """
        return {
            "intent_type": "expert_advice",
            "confidence": 0.0,
            "query": ""
        }
