from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import TemplateView

from api.views import whoami_view, config_view, logout_view, dev_login_view, me_view, healthz_view

# ensure_csrf_cookie guarantees the SPA always has a csrftoken cookie to send back
# as X-CSRFToken on mutating fetch() calls, once there are any.
spa_view = ensure_csrf_cookie(TemplateView.as_view(template_name='index.html'))

urlpatterns = [
    path('healthz/', healthz_view, name='healthz'),
    path('api/me/', me_view, name='api-me'),
    path('api/config/', config_view, name='api-config'),
    path('api/whoami/', whoami_view, name='api-whoami'),
    path('logout/', logout_view, name='logout'),

    # Mounted for the assessments admin/authoring workflow — gated by
    # is_staff, set in AzureEasyAuthMiddleware from settings.ADMIN_EMAIL.
    path('admin/', admin.site.urls),
    path('api/assessments/', include('assessments.urls')),

    # Catch-all: serve the React SPA for root and all unmatched paths (e.g. /signed-out)
    path('', spa_view, name='home'),
    re_path(r'^.*$', spa_view),
]

if settings.DEBUG:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

    urlpatterns = [
        path('dev-login/', dev_login_view, name='dev-login'),
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='api-docs'),
    ] + urlpatterns
