from typing import Dict, Any, Tuple, List, Optional, Counter
import re
import numpy as np
import json
import os
import time
from datetime import datetime
import faiss
from sentence_transformers import SentenceTransformer
from models.response_models import ResponseType
from core.llm.llm_gateway_v1 import LLMService
from utils.logger import log_info


class IntentClassifier:
    """
    Enhanced intent classification service using a three-stage approach:
    1. High-precision pattern matching for common queries
    2. Vector similarity search for semantic understanding
    3. LLM fallback for edge cases
    
    Features:
    - Continuous learning from successful classifications
    - Contextual awareness using diagram state
    - Performance monitoring for optimization
    - Fast classification for most queries
    """
    def __init__(self, llm_service: LLMService, model_name: str = 'all-MiniLM-L6-v2', 
                 data_path: str = './data/intent_examples.json', 
                 metrics_path: str = './data/intent_metrics.json'):
        self.llm_service = llm_service
        self.model_name = model_name
        self.data_path = data_path
        self.metrics_path = metrics_path
        
        # Initialize metrics tracking
        self.metrics = self._load_metrics()
        
        # Load sentence transformer model for embeddings
        log_info(f"Loading sentence transformer model: {model_name}")
        self.embedding_model = SentenceTransformer(model_name)
        
        # High-precision patterns (reduced set focused on quality)
        self.architecture_patterns = [
            r"add\s+(?:a\s+)?(\w+)",
            r"create\s+(?:a\s+)?(\w+)",
            r"connect\s+(\w+)\s+to\s+(\w+)",
            r"remove\s+(?:the\s+)?(\w+)",
            r"change\s+(?:the\s+)?(\w+)",
            r"update\s+(?:the\s+)?(\w+)",
            r"architecture",
            r"diagram",
        ]
        
        self.expert_patterns = [
            r"explain\s+(?:the\s+)?(\w+)",
            r"what\s+is\s+(?:a\s+)?(\w+)",
            r"how\s+does\s+(?:a\s+)?(\w+)\s+work",
            r"best\s+practices",
            r"security\s+implications",
        ]
        
        self.clarification_patterns = [
            r"^(?:what|how|when|where|who|why)\s+",
            r"clarify",
            r"not\s+sure",
            r"confused",
        ]
        
        self.out_of_context_patterns = [
            r"weather",
            r"sports",
            r"movies",
            r"hello",
            r"hi there",
            r"how are you",
            r"thanks",
            r"thank you",
        ]
        
        # Load example queries and build vector index
        self.examples = self._load_examples()
        self._build_index()
        
        log_info(f"Enhanced intent classifier initialized with {self.get_example_count()} examples")

    def _load_metrics(self) -> Dict:
        """Load performance metrics or create new metrics structure"""
        if os.path.exists(self.metrics_path):
            try:
                with open(self.metrics_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                log_info(f"Error loading metrics: {e}. Creating new metrics tracking.")
        
        return {
            "classifications": 0,
            "pattern_matches": 0,
            "vector_matches": 0,
            "llm_fallbacks": 0,
            "confidence_distribution": {
                "0.0-0.2": 0,
                "0.2-0.4": 0,
                "0.4-0.6": 0,
                "0.6-0.8": 0,
                "0.8-1.0": 0
            },
            "intent_distribution": {
                ResponseType.ARCHITECTURE.value: 0,
                ResponseType.EXPERT.value: 0,
                ResponseType.CLARIFICATION.value: 0,
                ResponseType.OUT_OF_CONTEXT.value: 0
            },
            "avg_classification_time": 0,
            "total_classification_time": 0,
            "last_updated": datetime.now().isoformat()
        }
    
    def _save_metrics(self):
        """Save performance metrics to file"""
        self.metrics["last_updated"] = datetime.now().isoformat()
        os.makedirs(os.path.dirname(self.metrics_path), exist_ok=True)
        
        try:
            with open(self.metrics_path, 'w') as f:
                json.dump(self.metrics, f, indent=2)
        except Exception as e:
            log_info(f"Error saving metrics: {e}")
    
    def _update_metrics(self, intent: ResponseType, confidence: float, 
                      classification_time: float, source: str):
        """Update performance metrics"""
        self.metrics["classifications"] += 1
        
        # Update classification source
        if source == "pattern":
            self.metrics["pattern_matches"] += 1
        elif source == "vector":
            self.metrics["vector_matches"] += 1
        elif source == "llm":
            self.metrics["llm_fallbacks"] += 1
        
        # Update confidence distribution
        confidence_range = min(int(confidence * 5), 4) * 0.2
        range_key = f"{confidence_range:.1f}-{confidence_range+0.2:.1f}"
        self.metrics["confidence_distribution"][range_key] += 1
        
        # Update intent distribution
        self.metrics["intent_distribution"][intent.value] += 1
        
        # Update time metrics
        total_time = self.metrics["total_classification_time"] + classification_time
        self.metrics["total_classification_time"] = total_time
        self.metrics["avg_classification_time"] = total_time / self.metrics["classifications"]
        
        # Save metrics periodically (every 10 classifications)
        if self.metrics["classifications"] % 10 == 0:
            self._save_metrics()
    
    def _load_examples(self) -> Dict[ResponseType, List[str]]:
        """Load example queries from file or return defaults"""
        default_examples = {
            ResponseType.ARCHITECTURE: [
                "Add a firewall to the network",
                "Create a new database server",
                "Connect the web server to the application server",
                "Remove the old firewall",
                "Update the network diagram",
                "Can you add a load balancer?",
                "Draw a connection between the API and database",
                "I need to add encryption to my architecture",
                "Design a secure network perimeter",
                "Show me the network topology",
                "Add security groups to the diagram",
                "Create a new VPC for this architecture",
                "Set up a DMZ in the network",
                "Draw a redundant architecture"
            ],
            
            ResponseType.EXPERT: [
                "What is a WAF?",
                "Explain zero trust architecture",
                "How does TLS work?",
                "What are the best practices for API security?",
                "Why is defense in depth important?",
                "Tell me about cloud security architecture",
                "Describe the OWASP Top 10",
                "What's the difference between SIEM and SOAR?",
                "How does mutual TLS authentication work?",
                "Explain the security benefits of microsegmentation",
                "What is the principle of least privilege?",
                "How does a security control matrix work?",
                "Tell me about compliance requirements for healthcare",
                "What is the CAP theorem?"
            ],
            
            ResponseType.CLARIFICATION: [
                "What should I do next?",
                "How do I improve this?",
                "Can you help me with this?",
                "I'm not sure what to do",
                "What do you think?",
                "Is this secure enough?",
                "Does this make sense?",
                "What would you recommend?",
                "Is there a better approach?",
                "What's missing from my architecture?",
                "How can I make this more secure?",
                "What are my options here?",
                "I need your input on this design"
            ],
            
            ResponseType.OUT_OF_CONTEXT: [
                "What's the weather like today?",
                "Tell me a joke",
                "How are you doing?",
                "Who won the game yesterday?",
                "Thanks for your help",
                "Good morning",
                "What's for lunch?",
                "Hello there",
                "What's your favorite color?",
                "Do you like movies?",
                "How old are you?",
                "What's your name?"
            ]
        }
        
        # Check if examples file exists
        if os.path.exists(self.data_path):
            try:
                with open(self.data_path, 'r') as f:
                    loaded_examples = json.load(f)
                    
                # Convert string keys back to ResponseType enum
                return {ResponseType(k): v for k, v in loaded_examples.items()}
            except Exception as e:
                log_info(f"Error loading examples: {e}. Using default examples.")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(self.data_path), exist_ok=True)
        
        # Save default examples
        self._save_examples(default_examples)
        return default_examples
    
    def _save_examples(self, examples=None):
        """Save example queries to file"""
        if examples is None:
            examples = self.examples
            
        # Convert ResponseType enum keys to strings for JSON serialization
        serializable_examples = {k.value: v for k, v in examples.items()}
        
        try:
            with open(self.data_path, 'w') as f:
                json.dump(serializable_examples, f, indent=2)
            log_info(f"Examples saved to {self.data_path}")
        except Exception as e:
            log_info(f"Error saving examples: {e}")
    
    def get_example_count(self) -> int:
        """Return the total number of examples across all intents"""
        return sum(len(examples) for examples in self.examples.values())
    
    def _build_index(self):
        """Build FAISS index from example queries"""
        # Collect all examples and their intents
        all_examples = []
        self.intent_mapping = []
        
        for intent, examples in self.examples.items():
            all_examples.extend(examples)
            self.intent_mapping.extend([intent] * len(examples))
        
        if not all_examples:
            log_info("No examples to build index from")
            # Create empty index
            self.index = faiss.IndexFlatIP(self.embedding_model.get_sentence_embedding_dimension())
            self.embeddings = np.array([]).reshape(0, self.embedding_model.get_sentence_embedding_dimension())
            return
            
        # Create embeddings
        log_info(f"Creating embeddings for {len(all_examples)} examples")
        self.embeddings = self.embedding_model.encode(all_examples)
        
        # Create FAISS index (using inner product, which is equivalent to cosine similarity for normalized vectors)
        self.index = faiss.IndexFlatIP(self.embeddings.shape[1])
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(self.embeddings)
        
        # Add embeddings to index
        self.index.add(self.embeddings)
        log_info(f"FAISS index built with {self.index.ntotal} vectors")
    
    async def classify(self, query: str, diagram_state: Optional[Dict[str, Any]] = None,
                     k: int = 3, pattern_threshold: float = 0.7, 
                     vector_threshold: float = 0.65) -> Tuple[ResponseType, float, str]:
        """
        Classify user query using the enhanced three-stage approach.
        
        Args:
            query: The user's natural language query
            diagram_state: Optional current state of the architecture diagram
            k: Number of nearest neighbors to retrieve for vector search
            pattern_threshold: Confidence threshold for pattern matching
            vector_threshold: Confidence threshold for vector similarity
            
        Returns:
            A tuple of (response_type, confidence_score, classification_source)
        """
        start_time = time.time()
        
        log_info(f"Classifying query: {query}")
        
        # STAGE 1: Pattern matching (fast, high-precision)
        pattern_intent, pattern_confidence = self._pattern_classify(query)
        if pattern_confidence >= pattern_threshold:
            log_info(f"Pattern matched with confidence {pattern_confidence:.2f}: {pattern_intent}")
            classification_time = time.time() - start_time
            self._update_metrics(pattern_intent, pattern_confidence, classification_time, "pattern")
            return pattern_intent, pattern_confidence, "pattern"
            
        # STAGE 2: Vector similarity (semantic understanding)
        vector_intent, vector_confidence = self._vector_classify(query, k)
        if vector_confidence >= vector_threshold:
            log_info(f"Vector matched with confidence {vector_confidence:.2f}: {vector_intent}")
            classification_time = time.time() - start_time
            self._update_metrics(vector_intent, vector_confidence, classification_time, "vector")
            return vector_intent, vector_confidence, "vector"
            
        # STAGE 3: LLM fallback (for edge cases)
        log_info("Using LLM fallback for classification")
        llm_intent, llm_confidence = await self._llm_classify(query, diagram_state)
        
        classification_time = time.time() - start_time
        self._update_metrics(llm_intent, llm_confidence, classification_time, "llm")
        
        log_info(f"LLM classified with confidence {llm_confidence:.2f}: {llm_intent}")
        return llm_intent, llm_confidence, "llm"
    
    def _pattern_classify(self, query: str) -> Tuple[ResponseType, float]:
        """
        Pattern-based classification using regex.
        
        Args:
            query: The user's query
            
        Returns:
            A tuple of (response_type, confidence_score)
        """
        query = query.lower()
        
        # Check each pattern set
        architecture_score = self._match_patterns(query, self.architecture_patterns)
        expert_score = self._match_patterns(query, self.expert_patterns)
        clarification_score = self._match_patterns(query, self.clarification_patterns)
        out_of_context_score = self._match_patterns(query, self.out_of_context_patterns)
        
        scores = {
            ResponseType.ARCHITECTURE: architecture_score,
            ResponseType.EXPERT: expert_score,
            ResponseType.CLARIFICATION: clarification_score,
            ResponseType.OUT_OF_CONTEXT: out_of_context_score
        }
        
        # Get highest scoring intent
        intent, confidence = max(scores.items(), key=lambda x: x[1])
        return intent, confidence
    
    def _match_patterns(self, query: str, patterns: List[str]) -> float:
        """
        Match query against patterns and return a confidence score.
        
        Args:
            query: The user's query
            patterns: List of regex patterns to match against
            
        Returns:
            A confidence score between 0 and 1
        """
        if not patterns:
            return 0.0
            
        matches = 0
        for pattern in patterns:
            if re.search(pattern, query, re.IGNORECASE):
                matches += 1
        
        # Calculate confidence - higher weight per match compared to original
        confidence = min(1.0, matches / (len(patterns) * 0.1))
        return confidence
    
    def _vector_classify(self, query: str, k: int = 3) -> Tuple[ResponseType, float]:
        """
        Vector-based classification using semantic similarity.
        
        Args:
            query: The user's query
            k: Number of nearest neighbors to retrieve
            
        Returns:
            A tuple of (response_type, confidence_score)
        """
        if self.index.ntotal == 0:
            return ResponseType.CLARIFICATION, 0.0
            
        # Encode query
        query_embedding = self.embedding_model.encode([query])
        
        # Normalize for cosine similarity
        faiss.normalize_L2(query_embedding)
        
        # Search index for similar examples
        similarities, indices = self.index.search(query_embedding, min(k, self.index.ntotal))
        
        # Calculate weighted scores for each intent
        intent_scores = {}
        for i, idx in enumerate(indices[0]):
            if idx >= len(self.intent_mapping):
                continue  # Skip if index is out of bounds
                
            intent = self.intent_mapping[idx]
            similarity = similarities[0][i]
            
            if similarity <= 0:
                continue  # Skip negative or zero similarities
                
            if intent not in intent_scores:
                intent_scores[intent] = 0
                
            # Weight by similarity score
            intent_scores[intent] += similarity
        
        if not intent_scores:
            return ResponseType.CLARIFICATION, 0.0
            
        # Get highest scoring intent
        top_intent = max(intent_scores.items(), key=lambda x: x[1])
        
        # Calculate normalized confidence score
        total_similarity = sum(intent_scores.values())
        confidence = min(1.0, float(top_intent[1] / total_similarity))
        
        return top_intent[0], confidence
    
    async def _llm_classify(self, query: str, diagram_state: Optional[Dict[str, Any]]) -> Tuple[ResponseType, float]:
        """
        LLM-based classification for edge cases.
        
        Args:
            query: The user's query
            diagram_state: Optional current state of the architecture diagram
            
        Returns:
            A tuple of (response_type, confidence_score)
        """
        # Prepare diagram context
        diagram_context = self._extract_diagram_context(diagram_state)
        
        # Prepare comprehensive prompt
        prompt = f"""
        You are an AI assistant specialized in cybersecurity architecture design. 
        You need to classify the following user query into one of these categories:
        
        1. ArchitectureResponse: Queries related to diagram/architecture modifications, additions, or creations
        2. ExpertResponse: Questions about cybersecurity concepts, best practices, or technical explanations
        3. ClarificationResponse: Queries needing more details to provide a proper response
        4. OutOfContextResponse: Queries unrelated to cybersecurity or software architecture
        
        {diagram_context}
        
        User query: "{query}"
        
        Think carefully about the intent behind this query in the context of a cybersecurity and secure software architecture.
        Respond with only the category name followed by a confidence score between 0 and 1.
        Example: "ExpertResponse 0.85"
        """
        
        response = await self.llm_service.generate_response(prompt, temperature=0.3)
        log_info(f"LLM classification response: {response}")
        
        # Parse LLM response to extract intent and confidence
        try:
            parts = response.strip().split()
            intent_str = parts[0]
            confidence = float(parts[1])
            
            # Map string to enum
            intent_map = {
                "ArchitectureResponse": ResponseType.ARCHITECTURE,
                "ExpertResponse": ResponseType.EXPERT,
                "ClarificationResponse": ResponseType.CLARIFICATION,
                "OutOfContextResponse": ResponseType.OUT_OF_CONTEXT
            }
            
            intent = intent_map.get(intent_str, ResponseType.CLARIFICATION)
            return intent, confidence
        except (ValueError, IndexError):
            log_info(f"Failed to parse LLM response: {response}")
            return ResponseType.CLARIFICATION, 0.5
    
    def _extract_diagram_context(self, diagram_state: Optional[Dict[str, Any]]) -> str:
        """
        Extract context information from diagram state.
        
        Args:
            diagram_state: The current state of the architecture diagram
            
        Returns:
            A string with context information
        """
        if not diagram_state or not diagram_state.get("nodes"):
            return "Current diagram: No diagram exists yet or it's empty."
        
        node_count = len(diagram_state.get("nodes", []))
        edge_count = len(diagram_state.get("edges", []))
        
        # Extract node types and their counts
        node_types = {}
        for node in diagram_state.get("nodes", []):
            node_type = node.get("type", "unknown")
            node_types[node_type] = node_types.get(node_type, 0) + 1
        
        # Format node type information
        type_info = ", ".join([f"{count} {node_type}(s)" for node_type, count in node_types.items()])
        
        return f"""
        Current diagram context:
        - Contains {node_count} nodes and {edge_count} connections
        - Node types: {type_info}
        - This appears to be a {self._infer_diagram_type(node_types)} diagram
        """
    
    def _infer_diagram_type(self, node_types: Dict[str, int]) -> str:
        """Infer the type of diagram based on node types"""
        # This is a simple heuristic and should be expanded based on your specific node types
        if not node_types:
            return "empty"
            
        # Common diagram types based on node type keywords
        if any(keyword in type_name.lower() for type_name in node_types.keys() 
               for keyword in ["network", "router", "firewall", "switch"]):
            return "network architecture"
        elif any(keyword in type_name.lower() for type_name in node_types.keys() 
                for keyword in ["server", "database", "api", "service"]):
            return "system architecture"
        elif any(keyword in type_name.lower() for type_name in node_types.keys() 
                for keyword in ["user", "auth", "identity"]):
            return "identity and access management"
        else:
            return "security architecture"
    
    async def add_example(self, query: str, intent: ResponseType, rebuild_index: bool = True):
        """
        Add a new example query to improve future classifications.
        
        Args:
            query: The query to add as an example
            intent: The correct intent for this query
            rebuild_index: Whether to rebuild the vector index immediately
        """
        log_info(f"Adding new example: '{query}' with intent {intent}")
        
        # Add to examples
        if intent not in self.examples:
            self.examples[intent] = []
        
        # Avoid duplicates
        if query not in self.examples[intent]:
            self.examples[intent].append(query)
            
            # Save examples
            self._save_examples()
            
            # Rebuild index if requested
            if rebuild_index:
                self._build_index()
                
            log_info(f"Example added successfully, total examples: {self.get_example_count()}")
            return True
        else:
            log_info(f"Example already exists, skipping")
            return False
    
    async def add_feedback(self, query: str, predicted_intent: ResponseType, 
                         correct_intent: ResponseType, confidence: float):
        """
        Process feedback on a classification to improve the system.
        
        Args:
            query: The original query
            predicted_intent: The intent predicted by the classifier
            correct_intent: The correct intent identified by feedback
            confidence: The confidence of the original prediction
        """
        if predicted_intent != correct_intent:
            log_info(f"Classification error: predicted {predicted_intent}, actual {correct_intent}")
            
            # Add as new example to improve future classifications
            await self.add_example(query, correct_intent)
            
            # If confidence was high but prediction was wrong, review patterns
            if confidence > 0.8:
                log_info(f"High confidence error, consider reviewing patterns")
        else:
            # If it was a correct classification with low confidence, add as example
            if confidence < 0.6:
                log_info(f"Correct classification with low confidence, adding as example")
                await self.add_example(query, correct_intent)
    
    def get_metrics(self) -> Dict:
        """Get current performance metrics"""
        return self.metrics
    
    def get_examples_for_intent(self, intent: ResponseType) -> List[str]:
        """Get all examples for a specific intent"""
        return self.examples.get(intent, [])
    
    def reset_metrics(self):
        """Reset performance metrics"""
        self.metrics = {
            "classifications": 0,
            "pattern_matches": 0,
            "vector_matches": 0,
            "llm_fallbacks": 0,
            "confidence_distribution": {
                "0.0-0.2": 0,
                "0.2-0.4": 0,
                "0.4-0.6": 0,
                "0.6-0.8": 0,
                "0.8-1.0": 0
            },
            "intent_distribution": {
                ResponseType.ARCHITECTURE.value: 0,
                ResponseType.EXPERT.value: 0,
                ResponseType.CLARIFICATION.value: 0,
                ResponseType.OUT_OF_CONTEXT.value: 0
            },
            "avg_classification_time": 0,
            "total_classification_time": 0,
            "last_updated": datetime.now().isoformat()
        }
        self._save_metrics()