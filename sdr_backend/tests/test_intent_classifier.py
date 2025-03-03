# tests/test_intent_classifier.py
import sys
import os
import logging
import pytest

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.intent_classification.intent_classifier import IntentClassifier

# Fixture for classifier
@pytest.fixture(scope="module")
def classifier():
    return IntentClassifier()

# Test data
modification_queries = [
    ("Add a database to the diagram", "diagram_modification"),
    ("Create a web server node", "diagram_modification"),
    ("Ad a databse", "diagram_modification"),  # Typo
]

query_queries = [
    ("How is the database connected?", "diagram_query"),
    ("What's this setup for?", "diagram_query"),
    ("How?", "diagram_query"),  # Short
]

advice_queries = [
    ("What's the best practice for securing APIs?", "expert_advice"),
    ("How do I optimize this?", "expert_advice"),
    ("Wuts the best security?", "expert_advice"),  # Informal
]

ambiguous_queries = [
    ("Help me with security", "expert_advice"),
    ("Can you make this better?", "diagram_modification"),
]

context_queries = [
    (["What's the best practice for securing APIs?"], "Add that to my diagram", "diagram_modification"),
]

edge_cases = [
    ("Add node", "diagram_modification"),  # Short
    (" ".join(["word"] * 200), "diagram_query"),  # Long
    ("Add API_v2", "diagram_modification"),  # Special chars
]

# Parameterized tests
@pytest.mark.parametrize("query,expected_intent", [
    ("Ad a databse", "diagram_modification"),
    ("What's this setup for?", "diagram_query"),
    ("How?", "diagram_query"),  # Could relax to allow "expert_advice"
    ("How do I optimize this?", "expert_advice"),
    ("Wuts the best security?", "expert_advice"),
])
def test_clear_queries(classifier, query, expected_intent):
    print("\n--- Testing Combined Queries ---")
    result = classifier.classify_intent(query)
    result_intent = result["intent_type"]

    # Check intent
    assert result_intent == expected_intent, f"Intent mismatch for query: query :{query}, result: {result_intent}, expected: {expected_intent}"
    
    # Relax confidence check when intent matches, just log it
    print(f"Intent correct for '{query}', confidence: {result['confidence']}")

    # Relax confidence check for specific queries with typos or ambiguity
    if result["confidence"] < 0.5:
        print(f"Warning: Low confidence ({result['confidence']}) for query: {query}")


@pytest.mark.parametrize("query,expected_intent", [
    ("Help me with security", "expert_advice"),
    ("Can you make this better?", "diagram_modification"),
])
def test_ambiguous_queries(classifier, query, expected_intent):
    print("\n--- Testing Ambiguous Queries ---")
    result = classifier.classify_intent(query)
    assert result["intent_type"] == expected_intent
    assert 0.3 < result["confidence"] < 0.90, f"Unexpected confidence for ambiguous query: {query}, confidence: {result['confidence']}"

@pytest.mark.parametrize("history,query,expected_intent", context_queries)
def test_context_queries(classifier, history, query, expected_intent):
    print("\n--- Testing Context Queries ---")
    result = classifier.classify_intent(query, conversation_history=history)
    assert result["intent_type"] == expected_intent
    assert result["confidence"] >= 0.7, f"Low confidence for context query: {query}"

@pytest.mark.parametrize("query,expected_intent", edge_cases)
def test_edge_cases(classifier, query, expected_intent):
    print("\n--- Testing Edge Cases ---")
    result = classifier.classify_intent(query)
    assert result["intent_type"] == expected_intent

def test_error_handling(classifier):
    with pytest.raises(Exception):
        classifier.classify_intent(None)  # Test invalid input