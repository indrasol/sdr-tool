import pytest
from models.response_models import ResponseType
from unittest.mock import AsyncMock, patch
from core.intent_classification.intent_classifier_v1 import IntentClassifier

@pytest.mark.asyncio
async def test_enhanced_classifier():
    # Mock LLM service
    mock_llm = AsyncMock()
    mock_llm.generate_response.return_value = "ExpertResponse 0.85"
    
    # Initialize classifier with mock
    classifier = IntentClassifier(mock_llm, 
                                         data_path="./tests/data/test_examples.json", 
                                         metrics_path="./tests/data/test_metrics.json")
    
    # Test clear architecture query (should be caught by pattern matching)
    intent, confidence, source = await classifier.classify("Add a firewall to the network")
    assert intent == ResponseType.ARCHITECTURE
    assert confidence > 0.7
    assert source == "pattern"
    
    # Test expert knowledge query (might use vector similarity)
    intent, confidence, source = await classifier.classify("What are the security implications of zero trust?")
    assert intent == ResponseType.EXPERT
    assert confidence > 0.6
    
    # Test out of context query (should fall back to LLM for ambiguous cases)
    intent, confidence, source = await classifier.classify("How's the weather today?")
    assert intent == ResponseType.OUT_OF_CONTEXT
    assert source == "llm" or source == "vector"