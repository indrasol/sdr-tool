import jwt

token = "eyJhbGciOiJIUzI1NiIsImtpZCI6IkFuNm9vNW8wcG0yWGR2SFUiLCJ0eXAiOiJKV1QifQ..."
secret = "CA1KEENRvEXLTh9Ug/AFUS4p5by6hW1cRfTO4oU6ctOxS4PGgjzMLGQYN9CTehE1c6S5+nEpDxQcaCaGSvTwWw=="
try:
    payload = jwt.decode(token, secret, algorithms=["HS256"])
    print("Payload:", payload)
except Exception as e:
    print("Error:", e)