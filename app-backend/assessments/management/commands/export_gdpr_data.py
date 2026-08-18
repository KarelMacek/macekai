import json

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from assessments.gdpr import export_identity


class Command(BaseCommand):
    help = "Export a person's full data record as JSON, by email — for admin-assisted GDPR requests."

    def add_arguments(self, parser):
        parser.add_argument("email")
        parser.add_argument("--out", help="Write to this file path instead of stdout.")

    def handle(self, *args, **options):
        email = options["email"]
        user = get_user_model().objects.filter(email__iexact=email).first()
        payload = export_identity(user=user, email=email)
        text = json.dumps(payload, indent=2, ensure_ascii=False)

        if options["out"]:
            with open(options["out"], "w") as f:
                f.write(text)
            self.stdout.write(self.style.SUCCESS(f"Wrote export to {options['out']}"))
        else:
            self.stdout.write(text)
