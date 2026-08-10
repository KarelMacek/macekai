from django.conf import settings
from django.urls import path, re_path
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import TemplateView

from api.views import whoami_view, config_view, logout_view, dev_login_view, me_view, healthz_view

# ensure_csrf_cookie guarantees the SPA always has a csrftoken cookie to send back
# as X-CSRFToken on mutating fetch() calls, once there are any.
spa_view = ensure_csrf_cookie(TemplateView.as_view(template_name='index.html'))

# Django admin is deliberately not mounted — no feature here needs it yet, and
# mounting it is easy to add later once there's an actual reason to (see
# asistentka's reasoning in its own urls.py for why this is the default, not
# an oversight).

urlpatterns = [
    path('healthz/', healthz_view, name='healthz'),
    path('api/me/', me_view, name='api-me'),
    path('api/config/', config_view, name='api-config'),
    path('api/whoami/', whoami_view, name='api-whoami'),
    path('logout/', logout_view, name='logout'),

    # Catch-all: serve the React SPA for root and all unmatched paths (e.g. /signed-out)
    path('', spa_view, name='home'),
    re_path(r'^.*$', spa_view),
]

if settings.DEBUG:
    urlpatterns = [path('dev-login/', dev_login_view, name='dev-login')] + urlpatterns
