import requests
import os
import json
from config.settings import CVE_API_URL, CVE_DATA_PATH

# Function to fetch CVE data from NVD API
def fetch_cve_data():
    response = requests.get(CVE_API_URL)
    if response.status_code == 200:
        data = response.json()
        os.makedirs(os.path.dirname(CVE_DATA_PATH), exist_ok=True)  # Ensure directory exists
        with open(CVE_DATA_PATH, "w") as f:
            json.dump(data, f, indent=4)
        print("CVE Data Fetched and Stored!")
    else:
        print("Failed to fetch CVE data")


# Load security data (CVE, MITRE, OWASP, STRIDE/PASTA)
def load_security_data():
    base_path = "knowledge_base"
    dataset_files = []
    for root, _, files in os.walk(base_path):
        for file in files:
            if file.endswith(".json"):
                dataset_files.append(os.path.join(root, file))
    docs = []
    for file in dataset_files:
        if os.path.exists(file):
            with open(file, "r") as f:
                try:
                    data = json.load(f)
                    
                    # Check for CVE data structure
                    if "vulnerabilities" in data:
                        for v in data["vulnerabilities"]:
                            if "cve" in v:
                                docs.append(v["cve"])  # Ensure cve is present
                            else:
                                print(f"Skipping CVE entry in {file} due to missing 'cve'.")
                    else:
                        # Handle other data structures (e.g., MITRE, OWASP, etc.)
                        if isinstance(data, list):
                            for entry in data:
                                if isinstance(entry, dict) and 'description' in entry:  # Check for 'description' or similar fields
                                    docs.append(entry)
                                else:
                                    print(f"Skipping entry in {file} due to missing 'description'.")
                except json.JSONDecodeError:
                    print(f"Error decoding JSON in file: {file}")
    return docs