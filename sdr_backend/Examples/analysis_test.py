from transformers import BertTokenizer, BertForSequenceClassification
import torch

# Load the pre-trained model and tokenizer
tokenizer = BertTokenizer.from_pretrained('huggingface_username/SecBERT')
model = BertForSequenceClassification.from_pretrained('huggingface_username/SecBERT')

# Function to process input text and get predictions
def get_security_analysis(text):
    inputs = tokenizer(text, return_tensors='pt', truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    predictions = torch.argmax(outputs.logits, dim=-1)
    return predictions.item()


def analyze_security_text(text: str) -> dict:
    """
    Analyzes the security architecture text using a fine-tuned cybersecurity LLM.
    :param text: Extracted text from the document/image.
    :return: Structured JSON output with risk assessment.
    """
    if security_model is None:
        return {"error": "Security model not available. Ensure transformers library is installed."}
    
    prompt = f"""
    Analyze the following security architecture text for threats and vulnerabilities.
    Provide a structured JSON output with:
    - summary: Overview of the security posture.
    - risk: Identified risks and gaps.
    - recommendation: Suggested mitigations.
    - source: Relevant security frameworks (CVE, MITRE ATT&CK, etc.).

    Text:
    {text}
    """
    
    response = security_model(prompt, max_length=512, do_sample=True) if security_model else []
    output_text = response[0]["generated_text"] if response else "{}"
    
    try:
        structured_output = json.loads(output_text)
    except json.JSONDecodeError:
        structured_output = {"error": "Invalid JSON format from model output."}
    
    return structured_output
