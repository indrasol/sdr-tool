# core/intent_classification/text_utils.py
from symspellpy import SymSpell, Verbosity
import re, pkg_resources, pathlib, functools

# One‑time  load (frequency dictionary shipped with symspell)
_dict_path = str(pathlib.Path(pkg_resources.resource_filename(
    "symspellpy", "frequency_dictionary_en_82_765.txt")))
_sym = SymSpell(max_dictionary_edit_distance=2, prefix_length=7)
_sym.load_dictionary(_dict_path, term_index=0, count_index=1)

_tokeniser = re.compile(r"[A-Za-z0-9]+")

# Tokens that should never be auto-corrected by SymSpell because they are
# domain-specific acronyms or product names that do *not* exist in the generic
# English frequency dictionary. Adding them here prevents situations where
# "aws" is incorrectly normalised to "as" which breaks downstream provider
# detection.
_DOMAIN_TERMS = {
    # Cloud provider acronyms
    "aws", "azure", "gcp",
    # Common cloud services / acronyms that appear frequently in queries
    "s3", "ec2", "eks", "iam", "rds", "vpc", "sns", "sqs", "lambda",
    "gke", "gcs", "pub", "sub", "aks", "vm", "vnet",
}

# Common cloud provider misspellings
_CLOUD_PROVIDER_CORRECTIONS = {
    # AWS misspellings
    "amazom": "amazon",
    "amozon": "amazon",
    "amamzon": "amazon",
    "aws": "aws",  # Keep as-is but include for normalization pass
    # Azure misspellings
    "azur": "azure",
    "azuer": "azure",
    "asure": "azure",
    "micorsoft": "microsoft",
    "microsft": "microsoft",
    # GCP misspellings
    "gogle": "google",
    "googel": "google",
    "gooogle": "google",
    "gcp": "gcp",  # Keep as-is but include for normalization pass
}

# Common misspellings in architecture terms
_ARCHITECTURE_MISSPELLINGS = {
    "dseign": "design",
    "desgin": "design",
    "archtiecture": "architecture",
    "architectuer": "architecture",
    "microservicse": "microservices",
    "microservice": "microservices",
    "kubernets": "kubernetes",
    "kubernete": "kubernetes",
    "kubenetes": "kubernetes",
    "serverles": "serverless",
    "containeres": "containers",
    "contaners": "containers",
    "dabase": "database",
    "databse": "database",
    "autoscaling": "autoscaling",  # Keep as-is but include for normalization pass
    "loadbalancer": "loadbalancer",  # Keep as-is but include for normalization pass
}

@functools.lru_cache(maxsize=10_000)
def normalise(text: str) -> str:
    text = text.lower()
    
    # Apply cloud provider and architecture specific corrections 
    # before general spell check to ensure domain-specific terms are handled correctly
    for misspelling, correction in {**_CLOUD_PROVIDER_CORRECTIONS, **_ARCHITECTURE_MISSPELLINGS}.items():
        text = re.sub(rf"\b{misspelling}\b", correction, text)
    
    # --- very cheap spell‑fix ---
    tokens = _tokeniser.findall(text)
    corrected = []
    for tok in tokens:
        # Preserve domain-specific tokens verbatim to avoid false corrections
        if tok in _DOMAIN_TERMS:
            corrected.append(tok)
            continue

        sug = _sym.lookup(tok, Verbosity.CLOSEST, max_edit_distance=2)
        corrected.append(sug[0].term if sug else tok)
    text_corr = " ".join(corrected)
    
    # --- canonical synonyms (you can expand) ---
    text_corr = re.sub(r"\b(designs?|creates?|builds?|makes?|develops?|constructs?)\b", "create", text_corr)

    text_corr = re.sub(r"\b(diagram(s)?|architectures?|blueprints?|schemas?|layouts?|plans?|structures?)\b", "architecture", text_corr)
    
    # Cloud-specific synonym normalization
    text_corr = re.sub(r"\b(lambda|function|serverless\s+function)\b", "lambda", text_corr)
    text_corr = re.sub(r"\b(s3|bucket|storage\s+bucket)\b", "s3", text_corr)
    text_corr = re.sub(r"\b(ec2|instance|vm|virtual\s+machine)\b", "ec2", text_corr)
    text_corr = re.sub(r"\b(rds|database|relational\s+database|sql)\b", "database", text_corr)
    text_corr = re.sub(r"\b(dynamodb|nosql|document\s+db|document\s+database)\b", "dynamodb", text_corr)
    text_corr = re.sub(r"\b(fargate|container|ecs)\b", "container", text_corr)
    
    # Query/ask synonyms: for intents like searching or inquiring
    text_corr = re.sub(r"\b(asks?|inquires?|queries?|searches?|finds?)\b", "query", text_corr)
    
    # Update/modify synonyms: for editing intents
    text_corr = re.sub(r"\b(updates?|edits?|modifys?|changes?|alters?|revises?)\b", "update", text_corr)
    
    # Delete/remove synonyms: for removal intents
    text_corr = re.sub(r"\b(deletes?|removes?|erases?|eliminates?|discards?)\b", "delete", text_corr)
    
    # View/show synonyms: for display intents
    text_corr = re.sub(r"\b(views?|shows?|displays?|sees?|examines?)\b", "view", text_corr)
    
    # Add/include synonyms: for addition intents
    text_corr = re.sub(r"\b(adds?|includes?|inserts?|appends?|incorporates?)\b", "add", text_corr)
    
    # User/auth synonyms: common in SaaS for login/logout intents
    text_corr = re.sub(r"\b(logins?|signins?|authenticates?|registers?)\b", "login", text_corr)
    text_corr = re.sub(r"\b(logouts?|signouts?|exits?)\b", "logout", text_corr)
    
    # Help/support synonyms: for assistance intents
    text_corr = re.sub(r"\b(helps?|supports?|assists?|guides?|tutorials?)\b", "help", text_corr)
    
    return text_corr
