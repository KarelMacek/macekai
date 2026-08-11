import re

from django.conf import settings

# Azure App Service Linux's internal warm-up/health probes hit the container
# using the host's own link-local (APIPA, RFC 3927) address as the Host
# header, e.g. "169.254.130.2:8000" — this range is never routable from the
# public internet, so rewriting it to an allowed host here doesn't weaken
# ALLOWED_HOSTS' actual protection against attacker-supplied Host headers.
_APIPA_HOST_RE = re.compile(r"^169\.254\.\d{1,3}\.\d{1,3}(:\d+)?$")


class AzureInternalProbeHostMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.META.get("HTTP_HOST", "")
        if _APIPA_HOST_RE.match(host) and settings.ALLOWED_HOSTS:
            request.META["HTTP_HOST"] = settings.ALLOWED_HOSTS[0]
        return self.get_response(request)
