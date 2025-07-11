"""
Test suite for enhanced PromptBuilderV2 with complex architecture scenarios.
Tests robustness across traditional to AI-based architecture requests.
"""

import pytest
import asyncio
from datetime import datetime
from typing import Dict, List, Any

# Import the enhanced prompt builder
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from core.prompt_engineering.prompt_builder_v2 import PromptBuilderV2, STYLE_PACK
from models.response_models_v2 import IntentV2


class TestPromptBuilderV2Enhanced:
    """Test suite for enhanced PromptBuilderV2 with complex scenarios."""
    
    def setup_method(self):
        """Setup test environment."""
        self.builder = PromptBuilderV2()
        self.sample_conversation = [
            {
                "role": "user",
                "content": "I need a secure web application",
                "timestamp": "2024-01-01T10:00:00Z"
            },
            {
                "role": "assistant", 
                "content": "I'll create a secure web application architecture",
                "timestamp": "2024-01-01T10:01:00Z"
            }
        ]
        
    # ------------------------------------------------------------------
    #  Style Pack Tests
    # ------------------------------------------------------------------
    
    def test_style_pack_constants(self):
        """Test that style pack contains all required elements."""
        assert "SECURETRACK 2" in STYLE_PACK
        assert "GLOBAL" in STYLE_PACK
        assert "COLOURS" in STYLE_PACK
        assert "ICONIFY MAP" in STYLE_PACK
        assert "COMPLEX AI PATTERNS" in STYLE_PACK
        assert "snake_case" in STYLE_PACK
        assert "mdi:monitor-shimmer" in STYLE_PACK
        
    def test_style_pack_access(self):
        """Test style pack access method."""
        style_info = self.builder.get_style_pack_info()
        assert style_info == STYLE_PACK
        assert len(style_info) > 0
        
    def test_node_id_validation(self):
        """Test node ID validation against style pack rules."""
        # Valid IDs
        assert self.builder.validate_node_id("web_server")
        assert self.builder.validate_node_id("auth_service")
        assert self.builder.validate_node_id("db")
        assert self.builder.validate_node_id("api_gateway_v2")
        
        # Invalid IDs
        assert not self.builder.validate_node_id("Web-Server")  # no dashes
        assert not self.builder.validate_node_id("WebServer")   # no camelCase
        assert not self.builder.validate_node_id("web server") # no spaces
        assert not self.builder.validate_node_id("a" * 31)     # too long
        assert not self.builder.validate_node_id("web_server!") # special chars
        
    def test_label_length_validation(self):
        """Test label length validation."""
        # Valid labels
        assert self.builder.validate_label_length("Web Server")
        assert self.builder.validate_label_length("Authentication Service")
        assert self.builder.validate_label_length("API Gateway with Load Balancer")
        
        # Invalid labels
        assert not self.builder.validate_label_length("A" * 61)  # too long
        
    # ------------------------------------------------------------------
    #  Traditional Architecture Tests
    # ------------------------------------------------------------------
    
    @pytest.mark.asyncio
    async def test_traditional_web_app_create(self):
        """Test creating a traditional 3-tier web application."""
        query = "Create a secure 3-tier web application with database, authentication, and load balancer"
        
        prompt = await self.builder.build_dsl_create_prompt(query, self.sample_conversation)
        
        # Verify style pack is included
        assert STYLE_PACK in prompt
        assert "USER REQUEST" in prompt
        assert "CONTEXT" in prompt
        assert "D2 code only" in prompt
        assert query in prompt
        
    @pytest.mark.asyncio
    async def test_traditional_microservices_create(self):
        """Test creating a traditional microservices architecture."""
        query = "Design a microservices architecture with API gateway, user service, order service, and message queue"
        
        prompt = await self.builder.build_dsl_create_prompt(query, [])
        
        assert "microservices" in prompt.lower()
        assert "api gateway" in prompt.lower()
        assert STYLE_PACK in prompt
        
    @pytest.mark.asyncio
    async def test_traditional_ecommerce_create(self):
        """Test creating a traditional e-commerce platform."""
        query = "Build an e-commerce platform with payment gateway, inventory management, and CDN"
        
        prompt = await self.builder.build_dsl_create_prompt(query, self.sample_conversation)
        
        assert "e-commerce" in prompt.lower()
        assert "payment gateway" in prompt.lower()
        assert "inventory" in prompt.lower()
        assert "CDN" in prompt.upper()
        
    # ------------------------------------------------------------------
    #  AI-Based Architecture Tests
    # ------------------------------------------------------------------
    
    @pytest.mark.asyncio
    async def test_ai_rag_pipeline_create(self):
        """Test creating an AI RAG pipeline architecture."""
        query = "Create a RAG (Retrieval-Augmented Generation) system with vector database, embedding service, and LLM"
        
        prompt = await self.builder.build_dsl_create_prompt(query, [])
        
        # Should contain AI patterns from style pack
        assert "RAG" in prompt.upper()
        assert "vector" in prompt.lower()
        assert "rag_pipeline" in prompt.lower()
        assert "vector_store" in prompt.lower()
        assert "retriever" in prompt.lower()
        assert "llm" in prompt.lower()
        
    @pytest.mark.asyncio
    async def test_ai_chatbot_create(self):
        """Test creating an AI chatbot architecture."""
        query = "Design an AI chatbot system with NLP processing, intent classification, and response generation"
        
        prompt = await self.builder.build_dsl_create_prompt(query, self.sample_conversation)
        
        assert "chatbot" in prompt.lower()
        assert "NLP" in prompt.upper()
        assert "intent" in prompt.lower()
        assert STYLE_PACK in prompt
        
    @pytest.mark.asyncio
    async def test_ai_ml_pipeline_create(self):
        """Test creating an ML pipeline architecture."""
        query = "Build a machine learning pipeline with data ingestion, feature engineering, model training, and inference API"
        
        prompt = await self.builder.build_dsl_create_prompt(query, [])
        
        assert "machine learning" in prompt.lower()
        assert "data ingestion" in prompt.lower()
        assert "feature engineering" in prompt.lower()
        assert "model training" in prompt.lower()
        assert "inference" in prompt.lower()
        
    @pytest.mark.asyncio
    async def test_ai_recommendation_engine_create(self):
        """Test creating an AI recommendation engine."""
        query = "Create a recommendation engine with collaborative filtering, content-based filtering, and real-time scoring"
        
        prompt = await self.builder.build_dsl_create_prompt(query, self.sample_conversation)
        
        assert "recommendation" in prompt.lower()
        assert "collaborative filtering" in prompt.lower()
        assert "content-based" in prompt.lower()
        assert "real-time" in prompt.lower()
        
    # ------------------------------------------------------------------
    #  Complex Hybrid Architecture Tests
    # ------------------------------------------------------------------
    
    @pytest.mark.asyncio
    async def test_hybrid_ai_ecommerce_create(self):
        """Test creating a hybrid AI-powered e-commerce platform."""
        query = """Create an AI-powered e-commerce platform with:
        - Product recommendation engine using collaborative filtering
        - Intelligent search with vector embeddings
        - Fraud detection ML models
        - Chatbot for customer support
        - Traditional payment and inventory systems"""
        
        prompt = await self.builder.build_dsl_create_prompt(query, [])
        
        assert "e-commerce" in prompt.lower()
        assert "recommendation" in prompt.lower()
        assert "vector embeddings" in prompt.lower()
        assert "fraud detection" in prompt.lower()
        assert "chatbot" in prompt.lower()
        assert "payment" in prompt.lower()
        assert "inventory" in prompt.lower()
        
    @pytest.mark.asyncio
    async def test_hybrid_fintech_ai_create(self):
        """Test creating a hybrid fintech platform with AI components."""
        query = """Design a fintech platform with:
        - Real-time fraud detection using ML
        - Robo-advisor with portfolio optimization
        - KYC automation with document processing
        - Traditional banking APIs and compliance
        - Risk assessment models"""
        
        prompt = await self.builder.build_dsl_create_prompt(query, self.sample_conversation)
        
        assert "fintech" in prompt.lower()
        assert "fraud detection" in prompt.lower()
        assert "robo-advisor" in prompt.lower()
        assert "KYC" in prompt.upper()
        assert "banking" in prompt.lower()
        assert "risk assessment" in prompt.lower()
        
    # ------------------------------------------------------------------
    #  Update Prompt Tests
    # ------------------------------------------------------------------
    
    @pytest.mark.asyncio
    async def test_traditional_to_ai_update(self):
        """Test updating traditional architecture to include AI components."""
        current_dsl = """
        user: "User"
        web_app: "Web Application"
        database: "Database"
        user -> web_app
        web_app -> database
        """
        
        query = "Add AI-powered product recommendations and search functionality"
        
        prompt = await self.builder.build_dsl_update_prompt(query, [], current_dsl)
        
        assert "CURRENT DIAGRAM" in prompt
        assert current_dsl in prompt
        assert "recommendations" in prompt.lower()
        assert "search" in prompt.lower()
        assert "Keep existing node ids stable" in prompt
        
    @pytest.mark.asyncio
    async def test_ai_architecture_enhancement(self):
        """Test enhancing existing AI architecture."""
        current_dsl = """
        user: "User"
        api_gateway: "API Gateway"
        ml_service: "ML Service"
        vector_db: "Vector Database"
        
        user -> api_gateway
        api_gateway -> ml_service
        ml_service -> vector_db
        """
        
        query = "Add real-time monitoring, A/B testing, and model versioning"
        
        prompt = await self.builder.build_dsl_update_prompt(query, self.sample_conversation, current_dsl)
        
        assert current_dsl in prompt
        assert "monitoring" in prompt.lower()
        assert "A/B testing" in prompt
        assert "model versioning" in prompt.lower()
        
    # ------------------------------------------------------------------
    #  Expert QA Tests
    # ------------------------------------------------------------------
    
    @pytest.mark.asyncio
    async def test_expert_qa_security_traditional(self):
        """Test expert QA for traditional security questions."""
        query = "What are the best practices for securing a REST API?"
        
        prompt = await self.builder.build_expert_prompt(query, [])
        
        assert "Guardian AI" in prompt
        assert "secure cloud architecture" in prompt
        assert "OWASP" in prompt
        assert "NIST" in prompt
        assert "ISO 27001" in prompt
        assert query in prompt
        
    @pytest.mark.asyncio
    async def test_expert_qa_ai_security(self):
        """Test expert QA for AI security questions."""
        query = "How do you secure ML models against adversarial attacks and data poisoning?"
        
        prompt = await self.builder.build_expert_prompt(query, self.sample_conversation)
        
        assert "adversarial attacks" in prompt.lower()
        assert "data poisoning" in prompt.lower()
        assert "Guardian AI" in prompt
        assert len(self.sample_conversation) > 0  # conversation included
        
    # ------------------------------------------------------------------
    #  Edge Case Tests
    # ------------------------------------------------------------------
    
    @pytest.mark.asyncio
    async def test_empty_conversation_history(self):
        """Test handling of empty conversation history."""
        query = "Create a simple web application"
        
        prompt = await self.builder.build_dsl_create_prompt(query, [])
        
        assert "- none -" in prompt
        assert query in prompt
        
    @pytest.mark.asyncio
    async def test_long_conversation_history(self):
        """Test handling of long conversation history (should limit to 5)."""
        long_history = [
            {"role": "user", "content": f"Message {i}", "timestamp": f"2024-01-01T10:0{i}:00Z"}
            for i in range(10)
        ]
        
        query = "Create a complex system"
        prompt = await self.builder.build_dsl_create_prompt(query, long_history)
        
        # Should only include last 5 messages
        assert "Message 5" in prompt
        assert "Message 9" in prompt
        assert "Message 0" not in prompt  # Should be excluded
        
    @pytest.mark.asyncio
    async def test_malformed_conversation_history(self):
        """Test handling of malformed conversation history."""
        malformed_history = [
            {"role": "user"},  # missing content
            {"content": "Test message"},  # missing role
            {"role": "assistant", "content": "Response", "timestamp": "invalid-date"}
        ]
        
        query = "Create a system"
        prompt = await self.builder.build_dsl_create_prompt(query, malformed_history)
        
        # Should handle gracefully without crashing
        assert query in prompt
        assert "Test message" in prompt
        assert "Response" in prompt
        
    # ------------------------------------------------------------------
    #  Performance and Robustness Tests
    # ------------------------------------------------------------------
    
    @pytest.mark.asyncio
    async def test_very_long_query(self):
        """Test handling of very long queries."""
        long_query = "Create a system with " + "very complex requirements " * 100
        
        prompt = await self.builder.build_dsl_create_prompt(long_query, [])
        
        # Should handle without crashing
        assert long_query in prompt
        assert STYLE_PACK in prompt
        
    @pytest.mark.asyncio
    async def test_special_characters_in_query(self):
        """Test handling of special characters in queries."""
        special_query = "Create a system with €100 cost, 50% efficiency, and <script>alert('test')</script>"
        
        prompt = await self.builder.build_dsl_create_prompt(special_query, [])
        
        # Should handle special characters gracefully
        assert special_query in prompt
        assert "€100" in prompt
        assert "50%" in prompt
        
    @pytest.mark.asyncio
    async def test_unicode_characters(self):
        """Test handling of unicode characters."""
        unicode_query = "Create a system for 日本語 users with émojis 🚀 and spëcial characters"
        
        prompt = await self.builder.build_dsl_create_prompt(unicode_query, [])
        
        # Should handle unicode gracefully
        assert unicode_query in prompt
        assert "日本語" in prompt
        assert "🚀" in prompt
        
    # ------------------------------------------------------------------
    #  Integration Tests
    # ------------------------------------------------------------------
    
    @pytest.mark.asyncio
    async def test_build_prompt_by_intent_create(self):
        """Test the main entry point for CREATE intent."""
        query = "Create an AI-powered system"
        
        prompt = await self.builder.build_prompt_by_intent(
            IntentV2.DSL_CREATE, query, self.sample_conversation
        )
        
        assert prompt  # Should not be empty
        assert STYLE_PACK in prompt
        assert query in prompt
        
    @pytest.mark.asyncio
    async def test_build_prompt_by_intent_update(self):
        """Test the main entry point for UPDATE intent."""
        query = "Add AI components"
        current_dsl = "user: \"User\"\napp: \"App\"\nuser -> app"
        
        prompt = await self.builder.build_prompt_by_intent(
            IntentV2.DSL_UPDATE, query, [], current_dsl
        )
        
        assert prompt  # Should not be empty
        assert STYLE_PACK in prompt
        assert current_dsl in prompt
        assert query in prompt
        
    @pytest.mark.asyncio
    async def test_build_prompt_by_intent_expert_qa(self):
        """Test the main entry point for EXPERT_QA intent."""
        query = "How do you secure AI systems?"
        
        prompt = await self.builder.build_prompt_by_intent(
            IntentV2.EXPERT_QA, query, self.sample_conversation
        )
        
        assert prompt  # Should not be empty
        assert "Guardian AI" in prompt
        assert query in prompt
        
    @pytest.mark.asyncio
    async def test_build_prompt_by_intent_clarify(self):
        """Test the main entry point for CLARIFY intent (should return empty)."""
        query = "What do you mean?"
        
        prompt = await self.builder.build_prompt_by_intent(
            IntentV2.CLARIFY, query, []
        )
        
        assert prompt == ""  # Should be empty for CLARIFY
        
    @pytest.mark.asyncio
    async def test_build_prompt_by_intent_out_of_scope(self):
        """Test the main entry point for OUT_OF_SCOPE intent (should return empty)."""
        query = "What's the weather like?"
        
        prompt = await self.builder.build_prompt_by_intent(
            IntentV2.OUT_OF_SCOPE, query, []
        )
        
        assert prompt == ""  # Should be empty for OUT_OF_SCOPE


# ------------------------------------------------------------------
#  Test Scenarios for Manual Validation
# ------------------------------------------------------------------

class TestComplexScenarios:
    """
    Test scenarios for manual validation of prompt quality.
    These generate prompts that can be reviewed for quality.
    """
    
    def setup_method(self):
        self.builder = PromptBuilderV2()
    
    @pytest.mark.asyncio
    async def test_scenario_1_traditional_bank(self):
        """Scenario 1: Traditional banking system."""
        query = "Create a secure online banking system with multi-factor authentication, transaction processing, and fraud detection"
        
        prompt = await self.builder.build_dsl_create_prompt(query, [])
        print("\n=== SCENARIO 1: Traditional Banking ===")
        print(f"Query: {query}")
        print(f"Prompt length: {len(prompt)} characters")
        print(f"Contains style pack: {STYLE_PACK in prompt}")
        print(f"Contains security colors: {'#F43F5E' in prompt}")
        
    @pytest.mark.asyncio
    async def test_scenario_2_ai_healthcare(self):
        """Scenario 2: AI-powered healthcare platform."""
        query = """Create an AI-powered healthcare platform with:
        - Medical image analysis using deep learning
        - Patient data processing with privacy protection
        - Drug discovery pipeline with ML models
        - Telemedicine platform with video streaming
        - HIPAA-compliant data storage"""
        
        prompt = await self.builder.build_dsl_create_prompt(query, [])
        print("\n=== SCENARIO 2: AI Healthcare ===")
        print(f"Query: {query}")
        print(f"Prompt length: {len(prompt)} characters")
        print(f"Contains AI patterns: {'rag_pipeline' in prompt}")
        print(f"Contains medical terms: {'medical' in prompt.lower()}")
        
    @pytest.mark.asyncio
    async def test_scenario_3_hybrid_retail(self):
        """Scenario 3: Hybrid retail platform with AI."""
        query = """Design a modern retail platform that combines:
        - Traditional e-commerce with product catalog and shopping cart
        - AI-powered personalization engine
        - Computer vision for visual search
        - IoT sensors for inventory management
        - Real-time analytics dashboard"""
        
        prompt = await self.builder.build_dsl_create_prompt(query, [])
        print("\n=== SCENARIO 3: Hybrid Retail ===")
        print(f"Query: {query}")
        print(f"Prompt length: {len(prompt)} characters")
        print(f"Contains retail terms: {'e-commerce' in prompt.lower()}")
        print(f"Contains AI terms: {'personalization' in prompt.lower()}")


if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"]) 