# utils/validate_prompt.py

# Validate if prompt is related to architecture
def validate_prompt(prompt: str) -> bool:
    keywords = ["architecture", "tech stack", "design", "data flow"]
    return any(keyword in prompt.lower() for keyword in keywords)