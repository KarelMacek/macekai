"""Adds draft/submitted status to TestSubmission so answers can be
autosaved incrementally and resumed, and so "edit a submitted test" can
insert a new draft (seeded from the latest submission's answers) instead
of mutating history — see assessments/services.py's get_or_create_draft.

created_at is added nullable first, backfilled from submitted_at (every
pre-existing row was created-and-submitted atomically, so submitted_at is
each row's true, historically-accurate creation time), then tightened to
NOT NULL — deliberately not Django's default "backfill with migration-run
time" prompt, which would be less accurate for existing rows.
"""
from django.conf import settings
from django.db import migrations, models


def backfill_created_at(apps, schema_editor):
    TestSubmission = apps.get_model("assessments", "TestSubmission")
    TestSubmission.objects.update(created_at=models.F("submitted_at"))


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("assessments", "0003_seed_default_journey"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="testsubmission",
            options={"ordering": ["-created_at"]},
        ),
        migrations.RemoveIndex(
            model_name="testsubmission",
            name="assessments_user_id_682eea_idx",
        ),
        migrations.RemoveIndex(
            model_name="testsubmission",
            name="assessments_diagnos_c596d9_idx",
        ),
        migrations.AddField(
            model_name="testsubmission",
            name="status",
            field=models.CharField(
                choices=[("draft", "Draft"), ("submitted", "Submitted")],
                default="submitted",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="testsubmission",
            name="created_at",
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.RunPython(backfill_created_at, noop_reverse),
        migrations.AlterField(
            model_name="testsubmission",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name="testsubmission",
            name="submitted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddIndex(
            model_name="testsubmission",
            index=models.Index(
                fields=["user", "test", "status", "-created_at"],
                name="assessments_user_id_b9227b_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="testsubmission",
            index=models.Index(
                fields=["diagnostics", "test", "status"],
                name="assessments_diagnos_5790fb_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="testsubmission",
            constraint=models.UniqueConstraint(
                condition=models.Q(("status", "draft")),
                fields=("diagnostics", "test", "user"),
                name="unique_draft_per_test_per_diagnostics_per_user",
            ),
        ),
    ]
