import logging

from django.conf import settings
from django.contrib.auth import get_user_model

from .easy_auth import AzureEasyAuthPrincipal, decode_client_principal
from assessments.services import link_unlinked_diagnostics

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
        # Any valid Google login gets a real Django session — access to the
        # app itself is entirely database-driven from there (see
        # assessments.services.has_any_diagnostics / the frontend gate), not
        # a static allow-list. There used to be an EASY_AUTH_ALLOWED_EMAILS/
        # EASY_AUTH_ALLOWED_GROUP_IDS gate here from when this was a closed
        # testers-only skeleton; removed since it silently rejected real
        # accounts before Django ever got a chance to show the "you don't
        # have a diagnostics yet" message, making a legitimate no-access
        # case look like a broken login loop instead.
        first_name, last_name = "", ""
        if principal.name:
            parts = principal.name.split(" ", 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ""

        admin_email = getattr(settings, "ADMIN_EMAIL", "") or ""
        is_admin = bool(admin_email) and principal.email.lower() == admin_email.lower()

        User = get_user_model()
        user, _ = User.objects.update_or_create(
            username=principal.username,
            defaults={
                "email": principal.email,
                "first_name": first_name,
                "last_name": last_name,
                "is_active": True,
                # is_staff alone only lets you into /admin/, not see or edit
                # anything there — Django's permission system still checks
                # per-model permissions unless is_superuser is also set. This
                # is a single-admin system (just Karel), so there's no value
                # in granular per-model permissions — both flags track the
                # same ADMIN_EMAIL match.
                "is_staff": is_admin,
                "is_superuser": is_admin,
            },
        )
        # Required so Django's permission checks (e.g. admin) know which backend authenticated this user.
        user.backend = "django.contrib.auth.backends.ModelBackend"
        # Self-healing backfill for purchases made before the buyer ever logged
        # in (see assessments/services.py). Cheap indexed UPDATE, no-op if
        # nothing matches.
        link_unlinked_diagnostics(user)
        return user
