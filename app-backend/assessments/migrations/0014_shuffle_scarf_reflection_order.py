"""Present the SCARF Relationship Reflection items in a fixed, deliberately
interleaved order instead of domain -> pair -> perspective blocks, so the
form has no visible "chapters" (same idea as the Snapshot test's
round-robin interleave). Only Question.order changes - wording, ids and
config (domain/pair/role, which scoring and results group by) are
untouched, so this is safe on the existing test version.

The order was generated once and is fixed here so every user sees the
same sequence. Constraints it satisfies: no domain repeats within any 3
consecutive items, no 3 consecutive items share a perspective, and each
item's experience/contribution twin is at least 8 positions away. It
starts with S1_experience as a gentle opener.
"""
from django.db import migrations

SLUG = "scarf-reflection"

ORDER = [
    "S1_experience", "F2_experience", "R2_contribution", "C1_experience", "F1_contribution", "A1_contribution",
    "C2_experience", "F3_experience", "S1_contribution", "R1_experience", "C3_experience", "F2_contribution",
    "A3_contribution", "S2_experience", "R2_experience", "F3_contribution", "C2_contribution", "A1_experience",
    "S3_experience", "R3_contribution", "A2_experience", "C3_contribution", "R1_contribution", "A3_experience",
    "F1_experience", "S2_contribution", "C1_contribution", "R3_experience", "S3_contribution", "A2_contribution",
]


def _reorder(apps, key):
    Question = apps.get_model("assessments", "Question")
    questions = list(Question.objects.filter(test__slug=SLUG))
    if not questions:
        return
    for question in questions:
        question.order = key(question.config["item_id"])
    Question.objects.bulk_update(questions, ["order"])


def shuffle(apps, schema_editor):
    _reorder(apps, ORDER.index)


def unshuffle(apps, schema_editor):
    # 0012's original domain -> pair -> experience/contribution order.
    blocks = [f"{d}{n}_{r}" for d in "SCARF" for n in (1, 2, 3) for r in ("experience", "contribution")]
    _reorder(apps, blocks.index)


class Migration(migrations.Migration):
    dependencies = [("assessments", "0013_scarf_reflection_comments")]

    operations = [migrations.RunPython(shuffle, unshuffle)]
