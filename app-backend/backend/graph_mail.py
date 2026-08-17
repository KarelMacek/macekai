"""Thin Microsoft Graph `sendMail` client — app-only (client-credentials)
auth against the macek.ai Entra ID tenant. No SMTP, no third-party email
vendor: reuses the tenant already backing this project's own Azure identity.
See docs/post-purchase-email.md for the app registration/permissions setup
this depends on."""
import requests
from django.conf import settings

TOKEN_URL_TEMPLATE = "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
GRAPH_SEND_MAIL_URL_TEMPLATE = "https://graph.microsoft.com/v1.0/users/{from_address}/sendMail"


def _get_access_token() -> str:
    response = requests.post(
        TOKEN_URL_TEMPLATE.format(tenant_id=settings.MS_GRAPH_TENANT_ID),
        data={
            "client_id": settings.MS_GRAPH_CLIENT_ID,
            "client_secret": settings.MS_GRAPH_CLIENT_SECRET,
            "scope": "https://graph.microsoft.com/.default",
            "grant_type": "client_credentials",
        },
        timeout=10,
    )
    response.raise_for_status()
    return response.json()["access_token"]


def send_mail(*, to: str, subject: str, html_body: str) -> None:
    """Sends one HTML email as settings.EMAIL_FROM_ADDRESS. Raises on any
    failure (auth, network, non-2xx from Graph) — callers decide whether/how
    to swallow that, this module doesn't hide send failures."""
    token = _get_access_token()
    response = requests.post(
        GRAPH_SEND_MAIL_URL_TEMPLATE.format(from_address=settings.EMAIL_FROM_ADDRESS),
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message": {
                "subject": subject,
                "body": {"contentType": "HTML", "content": html_body},
                "toRecipients": [{"emailAddress": {"address": to}}],
            },
            "saveToSentItems": "false",
        },
        timeout=10,
    )
    response.raise_for_status()
