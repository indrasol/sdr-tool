# LLM Gateway

The LLM Gateway provides a unified interface for interacting with multiple LLM providers and models.

## Features

- Support for multiple LLM providers:
  - Anthropic (Claude models)
  - OpenAI (GPT models)
  - Grok (xAI models)
- Dynamic provider and model selection
- Retry mechanism for API failures
- Performance metrics tracking
- Consistent response format across providers

## Setup

Ensure you have the necessary API keys in your environment:

```
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
GROK_API_KEY=your_grok_key
```

The gateway will initialize clients for which API keys are available and skip those that are missing.

## Usage

Basic usage with default provider:

```python
from sdr_backend.core.llm.llm_gateway_v1 import LLMGateway

# Initialize with a default provider
llm_gateway = LLMGateway(default_provider="anthropic")

# Generate a response using the default provider and model
response = await llm_gateway.generate_response(
    prompt="What is machine learning?",
    system_prompt="You are a helpful AI assistant.",
    max_tokens=300,
    temperature=0.7
)
```

Specifying a provider and model:

```python
response = await llm_gateway.generate_response(
    prompt="Explain quantum computing",
    system_prompt="You are a helpful AI assistant.",
    max_tokens=500,
    temperature=0.7,
    provider="openai",
    model="gpt-4o"
)
```

## Available Models

Each provider supports various models, which are automatically detected during initialization:

- Anthropic: claude-3-opus, claude-3-sonnet, claude-3-haiku, etc.
- OpenAI: gpt-4o, gpt-4, gpt-3.5-turbo, etc.
- Grok: grok-3, grok-3-mini, etc.

## Error Handling

The gateway includes a retry mechanism for API failures. By default, it will retry 3 times with exponential backoff.

## See Also

Check out the example script at `sdr_backend/examples/llm_gateway_example.py` for a working demonstration. 