import smtplib
import ssl
from email.message import EmailMessage
import os

# === CONFIG ===
SENDER_EMAIL = "service.trubit@gmail.com"
SENDER_PASSWORD = "xidp ebtf ehkw nayk"  # Gmail App Password


def send_code_email(
    to_email: str,
    code: str,
    subject: str = "Your Verification Code",
    expires_in_minutes: int = 10
) -> bool:
    """
    Sends a verification code to the user's email using Gmail SMTP.
    Includes security notice and expiry time in the message.
    Returns True if sent successfully, False otherwise.
    """

    # Use environment variables if set, otherwise use config above
    gmail_user = os.getenv("GMAIL_USER", SENDER_EMAIL)
    gmail_pass = os.getenv("GMAIL_PASS", SENDER_PASSWORD)
    if not gmail_user or not gmail_pass:
        raise RuntimeError("GMAIL_USER and GMAIL_PASS environment variables must be set or provided in config.")


    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"ZirabAfrica <{gmail_user}>"
    msg["To"] = to_email
    msg.set_content(
        f"""
Hello,

Your verification code is: {code}

This code will expire in {expires_in_minutes} minutes.

For your security, do not share this code with anyone. If you did not request this code, please ignore this email.

Thank you,
ZirabAfrica Team
"""
    )

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(gmail_user, gmail_pass)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False