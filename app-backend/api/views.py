from django.conf import settings
from django.contrib.auth import get_user_model, login, logout
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.views.decorators.http import require_GET

from assessments.services import current_diagnostics, has_any_diagnostics, has_recorded_consent


def healthz_view(request):
    return HttpResponse("ok")


def dev_login_view(request):
    if not settings.DEBUG:
        return JsonResponse({"error": "Not available in production."}, status=403)
    User = get_user_model()
    user, _ = User.objects.get_or_create(
        username="dev",
        defaults={"email": "dev@localhost", "is_staff": True, "is_superuser": True},
    )
    user.backend = "django.contrib.auth.backends.ModelBackend"
    login(request, user)
    return HttpResponseRedirect("/")


def logout_view(request):
    logout(request)
    if settings.EASY_AUTH_ENABLED:
        return HttpResponseRedirect("/signed-out")
    return HttpResponseRedirect("/")


@require_GET
def config_view(request):
    return JsonResponse({
        "dev_login": settings.DEBUG,
        "diagnostics_purchase_url": settings.DIAGNOSTICS_PURCHASE_URL,
    })


@require_GET
def whoami_view(request):
    if request.user.is_authenticated:
        diag = current_diagnostics(request.user)
        return JsonResponse({
            "is_authenticated": True,
            "username": request.user.username,
            "email": request.user.email,
            "has_diagnostics": request.user.is_staff or has_any_diagnostics(request.user),
            "consent_recorded": has_recorded_consent(request.user),
            "is_staff": request.user.is_staff,
            # Which language the most recent purchase was made under (see
            # Diagnostics.language) — used by app-frontend's LanguageGate to
            # pre-highlight a default, not to silently pick for the visitor.
            "purchased_language": diag.language if diag else "",
            # Scopes the frontend's "language asked once" lock to this
            # specific diagnostics rather than the browser forever — a new
            # diagnostics (re-purchase, admin re-grant) is a legitimate new
            # first-time ask, even on a browser that already answered for an
            # older one. See app-frontend's LangContext.
            "current_diagnostics_id": diag.id if diag else None,
        })
    return JsonResponse({"is_authenticated": False}, status=401)


@require_GET
def me_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False}, status=401)

    principal = getattr(request, "azure_easy_auth", None)
    data = {
        "authenticated": True,
        "username": request.user.username,
        "email": request.user.email,
        "name": principal.name if principal else "",
        "tenant_id": principal.tenant_id if principal else "",
        "object_id": principal.object_id if principal else "",
        "idp": principal.idp if principal else "",
    }

    if settings.DEBUG and principal:
        data["_debug_claims"] = {
            "object_id": principal.object_id,
            "tenant_id": principal.tenant_id,
            "email": principal.email,
            "name": principal.name,
        }

    return JsonResponse(data)
