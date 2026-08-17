"""External, unauthenticated webhook endpoints — kept separate from views.py
since these aren't part of the app's own authenticated API surface."""
import logging

from django.conf import settings
from django.db.models import Q
from django.utils.crypto import constant_time_compare
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .emailing import send_purchase_instructions_email
from .models import Diagnostics, Journey
from .services import open_diagnostics

logger = logging.getLogger(__name__)


class SimpleShopWebhookView(APIView):
    """Called by SimpleShop.cz's "webhook after payment" per-product setting.
    SimpleShop doesn't sign its webhook calls (confirmed against their own
    docs) or document an HTTP method, so: the URL itself carries a secret
    token nobody can guess, and both GET/POST are accepted identically.

    authentication_classes = [] overrides the global IsAuthenticated default
    from REST_FRAMEWORK settings — this has to be reachable with no session
    at all. DRF's APIView.as_view() always wraps the view in csrf_exempt
    regardless of auth classes, so no extra CSRF handling is needed either.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(exclude=True)
    def get(self, request, token):
        return self._handle(request.query_params, token)

    @extend_schema(exclude=True)
    def post(self, request, token):
        return self._handle(request.data, token)

    def _handle(self, params, token):
        secret = settings.SIMPLESHOP_WEBHOOK_SECRET
        if not secret or not constant_time_compare(token, secret):
            # 404, not 403 — doesn't confirm this endpoint even exists to a prober.
            return Response(status=404)

        product_id = params.get("id_product")
        journey = Journey.objects.filter(
            Q(simpleshop_product_id_cs=product_id) | Q(simpleshop_product_id_en=product_id),
            is_active=True,
        ).first() if product_id else None
        if not journey:
            # Not our diagnostics product (or an unmapped one) — ack without
            # side effects so SimpleShop doesn't retry-storm on it.
            return Response(status=200)

        email = params.get("mail")
        order_id = params.get("id")
        if not email or not order_id:
            logger.warning("SimpleShop webhook missing mail/id: %r", dict(params))
            return Response(status=200)

        # Which of the two product ids matched *is* the purchased language —
        # no separate signal needed from SimpleShop.
        language = "cs" if journey.simpleshop_product_id_cs == product_id else "en"

        # open_diagnostics() is idempotent (get_or_create on source_order_id) so
        # SimpleShop retrying this same call is safe — but the instructions email
        # below must only ever go out once per order, so check *before* calling it.
        is_new_order = not Diagnostics.objects.filter(source_order_id=str(order_id)).exists()

        diagnostics = open_diagnostics(
            email=email,
            journey=journey,
            source_order_id=str(order_id),
            source_order_number=str(params.get("number") or params.get("order_number") or ""),
            source_product_id=str(product_id),
            opened_via=Diagnostics.OPENED_VIA_WEBHOOK,
            raw_payload=dict(params),
            language=language,
        )

        if is_new_order:
            try:
                send_purchase_instructions_email(diagnostics)
            except Exception:
                # The Diagnostics row is the important side effect and it's already
                # saved — don't fail the webhook (and trigger a SimpleShop retry-storm)
                # just because the email failed to send.
                logger.exception(
                    "Failed to send purchase instructions email for order %s", order_id
                )

        return Response(status=200)
