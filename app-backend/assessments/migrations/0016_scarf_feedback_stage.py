"""Give the SCARF Relationship Reflection a coach-feedback stage: after the
results the person can send their answers (and comments) to Karel, who
replies with written feedback and a video, exactly like the entry
diagnostic. Unlike that one it needs no CV/LinkedIn - the request is a
single button (Journey.feedback_needs_cv = False)."""
from django.db import migrations, models

SLUG = "scarf-reflection"


def enable(apps, schema_editor):
    apps.get_model("assessments", "Journey").objects.filter(slug=SLUG).update(
        requires_feedback=True, feedback_needs_cv=False
    )


def disable(apps, schema_editor):
    apps.get_model("assessments", "Journey").objects.filter(slug=SLUG).update(
        requires_feedback=False, feedback_needs_cv=True
    )


class Migration(migrations.Migration):
    dependencies = [("assessments", "0015_shorten_scarf_intro")]

    operations = [
        migrations.AddField(
            model_name="journey",
            name="feedback_needs_cv",
            field=models.BooleanField(default=True),
        ),
        migrations.RunPython(enable, disable),
    ]
