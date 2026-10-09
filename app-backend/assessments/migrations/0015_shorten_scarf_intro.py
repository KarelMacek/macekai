"""Cut the SCARF Relationship Reflection intro down to two short lines:
the original multi-paragraph description and instructions (from 0012) read
as a wall of text before the test even starts. Only intro copy changes;
questions, options and scoring are untouched. The reverse restores 0012's
wording."""
import importlib

from django.db import migrations

SLUG = "scarf-reflection"

DESCRIPTION = {
    "en": "What you experience and what you contribute, across five areas of your relationship.",
    "cs": "Co ve vztahu zažíváš a čím přispíváš, v pěti oblastech.",
}

INSTRUCTIONS = {
    "en": (
        "Think of the last four weeks with your current partner. For each statement, "
        "choose how often it was true: 1 = never, 7 = always."
    ),
    "cs": (
        "Mysli na poslední čtyři týdny se svým současným partnerem (partnerkou). U každého "
        "tvrzení vyber, jak často platilo: 1 = nikdy, 7 = vždy."
    ),
}


def _set(apps, description, instructions):
    Test = apps.get_model("assessments", "Test")
    Test.objects.filter(slug=SLUG).update(description=description, instructions=instructions)


def shorten(apps, schema_editor):
    _set(apps, DESCRIPTION, INSTRUCTIONS)


def restore(apps, schema_editor):
    seed = importlib.import_module("assessments.migrations.0012_seed_scarf_reflection")
    _set(apps, seed.DESCRIPTION, seed.INSTRUCTIONS)


class Migration(migrations.Migration):
    dependencies = [("assessments", "0014_shuffle_scarf_reflection_order")]

    operations = [migrations.RunPython(shorten, restore)]
