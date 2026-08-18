"""Corrects the default Journey's name to match the landing page's actual
terminology for this product ("Pohled na situaci" / "Situation review") —
0003's original seed used a placeholder name ("Výchozí cesta" / "Default
Journey") that was never updated to match.
"""
from django.db import migrations


def rename_journey(apps, schema_editor):
    Journey = apps.get_model("assessments", "Journey")
    Journey.objects.filter(slug="default").update(
        name={"en": "Situation review", "cs": "Pohled na situaci"}
    )


def rename_journey_reverse(apps, schema_editor):
    Journey = apps.get_model("assessments", "Journey")
    Journey.objects.filter(slug="default").update(
        name={"en": "Default Journey", "cs": "Výchozí cesta"}
    )


class Migration(migrations.Migration):
    dependencies = [
        ("assessments", "0006_journey_simpleshop_product_id_per_language"),
    ]

    operations = [
        migrations.RunPython(rename_journey, rename_journey_reverse),
    ]
