# Using Python to generate a secure random key
import secrets
import requests


api_key = secrets.token_urlsafe(32)
print(f"Generated API Key: {api_key}")

url = "http://localhost:8000/v1/routes/health"
headers = {"X-API-Key": str(api_key)}
response = requests.get(url, headers=headers)
print(response.json())