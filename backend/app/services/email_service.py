import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, List, Dict
from app.core.config import settings

logger = logging.getLogger("kage.email")


class EmailService:
    """Production-grade transactional email service supporting SMTP and Mock modes."""

    # In-memory mailbox for automated test verification
    sent_emails: List[Dict[str, str]] = []

    @classmethod
    def mask_email(cls, email: str) -> str:
        """Mask email address for privacy in application logs (e.g. j***@example.com)."""
        if "@" not in email:
            return "***"
        user, domain = email.split("@", 1)
        masked_user = user[0] + "***" if len(user) > 0 else "***"
        return f"{masked_user}@{domain}"

    @classmethod
    def sanitize_header(cls, text: str) -> str:
        """Strip CRLF characters to prevent SMTP header injection attacks."""
        return text.replace("\r", "").replace("\n", "").strip()

    @classmethod
    def send_password_reset_email(
        cls,
        to_email: str,
        token: str,
        display_name: Optional[str] = None
    ) -> bool:
        """
        Send single-use, expiring password reset link via configured email provider.
        Crucial security guarantee: raw token is NEVER written to logs.
        """
        clean_email = cls.sanitize_header(to_email)
        clean_name = cls.sanitize_header(display_name or "KAGE Collector")
        reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"

        subject = f"[{settings.PROJECT_NAME}] Password Reset Instructions"

        # Plaintext body
        text_content = f"""Hello {clean_name},

We received a request to reset your password for your {settings.PROJECT_NAME} personal anime library account.

To choose a new password, open the following link in your browser:
{reset_url}

This link is valid for {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes and can only be used once.

If you did not request this password reset, please ignore this message. Your existing password and private records remain safe.

— The {settings.PROJECT_NAME} Team
"""

        # HTML body matching KAGE monochrome aesthetic
        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
  <style>
    body {{
      background-color: #050505;
      color: #E6E6E6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
    }}
    .container {{
      max-width: 540px;
      margin: 0 auto;
      background-color: #0D0D0D;
      border: 1px solid #262626;
      padding: 36px;
    }}
    .header {{
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #262626;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }}
    .logo-box {{
      width: 32px;
      height: 32px;
      background: #FFFFFF;
      color: #000000;
      font-weight: 900;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      line-height: 32px;
      text-align: center;
    }}
    .brand {{
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #FFFFFF;
    }}
    h1 {{
      font-size: 20px;
      font-weight: 700;
      margin-top: 0;
      color: #FFFFFF;
      letter-spacing: -0.01em;
    }}
    p {{
      font-size: 15px;
      line-height: 1.6;
      color: #A3A3A3;
      margin: 16px 0;
    }}
    .cta-btn {{
      display: inline-block;
      background-color: #FFFFFF;
      color: #000000 !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 14px 28px;
      margin: 20px 0;
      border-radius: 0;
    }}
    .link-fallback {{
      font-family: monospace;
      font-size: 12px;
      color: #737373;
      word-break: break-all;
      background: #171717;
      padding: 12px;
      border: 1px solid #262626;
      margin-top: 20px;
    }}
    .footer {{
      margin-top: 32px;
      border-top: 1px solid #262626;
      padding-top: 20px;
      font-size: 12px;
      color: #525252;
      font-family: monospace;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="logo-box">影</span>
      <span class="brand">{settings.PROJECT_NAME}</span>
    </div>
    <h1>Password Reset Request</h1>
    <p>Hello {clean_name},</p>
    <p>We received a request to reset the password for your {settings.PROJECT_NAME} personal anime library account.</p>
    <p>Click the button below to choose a new password. This single-use link is valid for <strong>{settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes</strong>.</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="{reset_url}" class="cta-btn">Reset My Password</a>
    </div>
    <p style="font-size: 13px;">If the button does not work, copy and paste this URL into your browser:</p>
    <div class="link-fallback">{reset_url}</div>
    <div class="footer">
      If you did not request this reset, your account is safe and no action is required.<br>
      © {settings.PROJECT_NAME} // Personal Anime Library
    </div>
  </div>
</body>
</html>
"""

        # Dispatch based on provider
        if settings.EMAIL_PROVIDER == "mock":
            cls.sent_emails.append({
                "to": clean_email,
                "subject": subject,
                "token": token,
                "url": reset_url,
            })
            logger.info(f"Mock email dispatched to {cls.mask_email(clean_email)}")
            return True

        elif settings.EMAIL_PROVIDER == "smtp" and settings.SMTP_HOST:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
                msg["To"] = clean_email

                part1 = MIMEText(text_content, "plain")
                part2 = MIMEText(html_content, "html")
                msg.attach(part1)
                msg.attach(part2)

                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
                if settings.SMTP_TLS:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAILS_FROM_EMAIL, clean_email, msg.as_string())
                server.quit()

                logger.info(f"Password reset email sent via SMTP to {cls.mask_email(clean_email)}")
                return True
            except Exception as e:
                logger.error(f"Failed to send password reset email via SMTP: {type(e).__name__}")
                return False

        else:
            # Console logger fallback for development / local testing
            logger.info(
                f"[CONSOLE EMAIL] Password reset requested for {cls.mask_email(clean_email)}. "
                f"Link generated (token hidden for security)."
            )
            return True
