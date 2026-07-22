import requests
from app.core.config import settings


def send_verification_email(to_email: str, verify_link: str):
    if not settings.BREVO_API_KEY or not settings.SENDER_EMAIL:
        print("Brevo not configured — skipping email send")
        return

    try:
        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "accept": "application/json",
                "api-key": settings.BREVO_API_KEY,
                "content-type": "application/json"
            },
            json={
                "sender": {
                    "name": "DocSense AI",
                    "email": settings.SENDER_EMAIL
                },
                "to": [{"email": to_email}],
                "subject": "Verify your DocSense AI account",
                "htmlContent": f"<p>Click the link below to verify your account:</p><p><a href='{verify_link}'>{verify_link}</a></p><p>This link expires in 24 hours.</p>"
            },
            timeout=10
        )
        if response.status_code >= 400:
            print(f"Brevo email failed: {response.status_code} {response.text}")
    except Exception as e:
        print(f"Error sending verification email: {e}")