# Using Python to generate a secure random key
import secrets
api_key = secrets.token_urlsafe(32)
print(api_key)
