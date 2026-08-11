from django.core.management.base import BaseCommand, CommandError

from assessments.models import Journey
from assessments.services import open_diagnostics


class Command(BaseCommand):
    help = (
        "Manually open a diagnostics for an email — the local-dev/support "
        "alternative to a real SimpleShop webhook call."
    )

    def add_arguments(self, parser):
        parser.add_argument("email")
        parser.add_argument("--journey", default="default", help="Journey slug (default: 'default')")

    def handle(self, *args, **options):
        journey = Journey.objects.filter(slug=options["journey"]).first()
        if not journey:
            raise CommandError(f"No journey with slug {options['journey']!r}")

        diagnostics = open_diagnostics(email=options["email"], journey=journey)
        self.stdout.write(self.style.SUCCESS(f"Opened diagnostics #{diagnostics.id} for {diagnostics.email}"))
