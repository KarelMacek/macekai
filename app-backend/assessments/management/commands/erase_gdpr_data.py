from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from assessments.gdpr import delete_identity


class Command(BaseCommand):
    help = (
        "Erase all data for a person by email (and their User row, if any) — "
        "the CLI equivalent of the admin GDPR-erasure action. Also the "
        "recommended way to reset a test/dev account between diagnostics runs."
    )

    def add_arguments(self, parser):
        parser.add_argument("email")
        parser.add_argument("--yes", action="store_true", help="Skip the confirmation prompt.")

    def handle(self, *args, **options):
        email = options["email"]
        user = get_user_model().objects.filter(email__iexact=email).first()

        if not options["yes"]:
            confirm = input(
                f"This will permanently delete ALL data for {email!r} "
                f"(user row: {'yes' if user else 'no'}). Type 'yes' to continue: "
            )
            if confirm.strip().lower() != "yes":
                raise CommandError("Aborted.")

        summary = delete_identity(user=user, email=email)
        self.stdout.write(
            self.style.SUCCESS(
                f"Erased {summary['email']}: {summary['diagnostics_count']} diagnostics, "
                f"{summary['submissions_count']} submissions, {summary['file_count']} file(s), "
                f"consent removed: {summary['has_consent']}, user row: "
                f"{'deleted' if user else 'none'}."
            )
        )
