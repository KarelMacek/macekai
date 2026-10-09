"""Let every SCARF Relationship Reflection item carry an optional free-text
comment. Only flips Question.allow_comment - no wording change, so this is
safe to apply in place on the existing test version (see 0012's note)."""
from django.db import migrations

SLUG = "scarf-reflection"


def set_allow_comment(value):
    def apply(apps, schema_editor):
        Question = apps.get_model("assessments", "Question")
        Question.objects.filter(test__slug=SLUG).update(allow_comment=value)

    return apply


class Migration(migrations.Migration):
    dependencies = [("assessments", "0012_seed_scarf_reflection")]

    operations = [migrations.RunPython(set_allow_comment(True), set_allow_comment(False))]
