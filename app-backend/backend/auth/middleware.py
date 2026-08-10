import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

from .easy_auth import AzureEasyAuthPrincipal, decode_client_principal

logger = logging.getLogger(__name__)


class AzureEasyAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        self._authenticate(request)
        return self.get_response(request)

    def _authenticate(self, request):
        header = request.META.get("HTTP_X_MS_CLIENT_PRINCIPAL")

        if header:
            principal = decode_client_principal(header)
            if principal.is_valid:
                request.azure_easy_auth = principal
                request.user = self._get_or_create_user(principal)
                return
            else:
                logger.warning("Received invalid X-MS-CLIENT-PRINCIPAL header")
            return

        # Dev-mode fake user — only when DEBUG and explicitly configured.
        dev_email = getattr(settings, "EASY_AUTH_DEV_USER_EMAIL", "")
        if settings.DEBUG and dev_email:
            principal = AzureEasyAuthPrincipal(
                object_id="dev-oid",
                tenant_id="dev-tid",
                email=dev_email,
                name="Dev User",
                idp="dev",
            )
            request.azure_easy_auth = principal
            request.user = self._get_or_create_user(principal)
            return

        logger.debug(
            "No X-MS-CLIENT-PRINCIPAL in request; user remains %s",
            getattr(request, "user", "unset"),
        )

    def _get_or_create_user(self, principal: AzureEasyAuthPrincipal):
        if not self._is_allowed(principal):
            logger.warning("Easy Auth: access denied for %s", principal.email or principal.object_id)
            return AnonymousUser()

        first_name, last_name = "", ""
        if principal.name:
            parts = principal.name.split(" ", 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ""

        admin_email = getattr(settings, "ADMIN_EMAIL", "") or ""
        is_staff = bool(admin_email) and principal.email.lower() == admin_email.lower()

        User = get_user_model()
        user, _ = User.objects.update_or_create(
            username=principal.username,
            defaults={
                "email": principal.email,
                "first_name": first_name,
                "last_name": last_name,
                "is_active": True,
                "is_staff": is_staff,
            },
        )
        # Required so Django's permission checks (e.g. admin) know which backend authenticated this user.
        user.backend = "django.contrib.auth.backends.ModelBackend"
        return user

    def _is_allowed(self, principal: AzureEasyAuthPrincipal) -> bool:
        allowed_emails: list[str] = getattr(settings, "EASY_AUTH_ALLOWED_EMAILS", [])
        allowed_groups: list[str] = getattr(settings, "EASY_AUTH_ALLOWED_GROUP_IDS", [])

        if allowed_emails and principal.email.lower() not in [e.lower() for e in allowed_emails]:
            return False
        if allowed_groups and not any(g in allowed_groups for g in principal.groups):
            return False
        return True
