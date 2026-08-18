"""Applies the wording fixes from 978f458 ("Clarify ambiguous yes/no
diagnostic questions, add orientation framing") to the actual seeded data.

That commit only reworded app-backend/assessments/fixtures/default_journey.json,
which nothing loads (`loaddata default_journey` is a documented one-time
manual command — see docs/self-assessment-engine.md). The real seed source
that runs automatically on every deploy is 0003_seed_default_journey.py,
which has the questions hardcoded and was never updated, so the live
personal-snapshot test still asked the old ambiguous phrasing.

This is an in-place text update rather than a new Test version, by explicit
choice: Question.text isn't snapshotted onto past submissions (they just
reference the live Question row), so anyone who already answered under the
old phrasing will see these questions relabeled next time they view their
history. Accepted here because polarity (Yes=positive) and meaning are
preserved for all 12 — see models.py's Test.version docstring for the
general rule this deliberately deviates from.
"""
from django.db import migrations

# (old_en, old_cs, new_en, new_cs)
REWORDED_QUESTIONS = [
    (
        "My partner and I respect each other mutually and are equals",
        "S mým partnerem se vzájemně respektujeme a jsme rovnocenní",
        "My partner and I respect each other as equals",
        "S mým partnerem se respektujeme jako rovný s rovným",
    ),
    (
        "I easily reach agreement with people I have had conflicts with",
        "Snadno se dohodnu s lidmi, se kterými jsem měl(a) konflikty",
        "When conflicts come up, I'm able to resolve them without much difficulty",
        "Když nastanou konflikty, dokážu je vyřešit bez větších potíží",
    ),
    (
        "I have celebrated my birthday in the last 2 years",
        "V posledních 2 letech jsem slavil(a) své narozeniny",
        "I make a point of celebrating my own birthday and milestones",
        "Záleží mi na tom, abych slavil(a) své narozeniny a další milníky",
    ),
    (
        "I do not lie or exaggerate",
        "Nelžu ani nepřeháním",
        "I am honest and straightforward with people",
        "K lidem jsem upřímný(á) a otevřený(á)",
    ),
    (
        "People know they can count on me and that I do what I say",
        "Lidé vědí, že se mnou mohou počítat a že udělám, co řeknu",
        "People know they can count on me to do what I say",
        "Lidé vědí, že se na mě mohou spolehnout, že udělám, co řeknu",
    ),
    (
        "I do not clutter my space with 'dust catchers' (odds and ends)",
        "Nezanáším se „lapači prachu“ (věcmi a věcičkami)",
        "I keep my space free of clutter and things I don't use",
        "Svůj prostor udržuji bez nepořádku a věcí, které nepoužívám",
    ),
    (
        "My bed is always properly made",
        "Má postel je vždy řádně ustlaná",
        "I usually make my bed",
        "Svou postel si obvykle stelu",
    ),
    (
        "I do not smoke excessively or drink too much alcohol",
        "Přehnaně nekouřím a nepiji alkohol",
        "I'm comfortable with how much I smoke and drink",
        "Jsem v pohodě s tím, kolik kouřím a piju",
    ),
    (
        "I have suitable clothing for work and leisure",
        "Mám vhodné oblečení pro práci i volný čas",
        "I have appropriate clothing for the different parts of my life (work, leisure, etc.)",
        "Mám vhodné oblečení pro různé oblasti svého života (práci, volný čas atd.)",
    ),
    (
        "I do not worry about my stress level",
        "Nedělám si starosti s úrovní svého stresu",
        "My stress level currently feels manageable",
        "Moje aktuální úroveň stresu je pro mě zvládnutelná",
    ),
    (
        "I do not let paperwork pile up",
        "Nenechávám narůstat nevyřízené papírování",
        "I keep on top of my paperwork",
        "Papírování zvládám průběžně, nenechávám ho hromadit se",
    ),
    (
        "My wallet is not stuffed with unprocessed receipts",
        "Moje peněženka není zanesena nevyřízenými účtenkami",
        "I keep my receipts and financial paperwork organized",
        "Své účtenky a finanční doklady mám v pořádku",
    ),
]

OLD_INSTRUCTIONS = {
    "en": "For each statement, answer Yes or No — whichever currently feels true. There are no right answers.",
    "cs": "U každého tvrzení odpověz Ano nebo Ne — podle toho, co teď platí. Neexistují správné odpovědi.",
}
NEW_INSTRUCTIONS = {
    "en": (
        "This is a snapshot for your own orientation, not a verdict. Answer Yes or No — "
        "whichever feels true right now. If a question doesn't sit right or you want to "
        "add context, use the comment field — just keep it short."
    ),
    "cs": (
        "Toto je orientační přehled pro tebe, ne rozsudek. U každého tvrzení odpověz Ano "
        "nebo Ne — podle toho, co teď platí. Pokud ti nějaká otázka nesedí nebo chceš "
        "přidat kontext, použij pole pro komentář — stačí stručně."
    ),
}


def _apply(apps, schema_editor, pairs, instructions_from, instructions_to):
    Test = apps.get_model("assessments", "Test")
    Question = apps.get_model("assessments", "Question")

    Test.objects.filter(slug="personal-snapshot", instructions=instructions_from).update(
        instructions=instructions_to
    )

    for old_en, old_cs, new_en, new_cs in pairs:
        Question.objects.filter(
            test__slug="personal-snapshot",
            text={"en": old_en, "cs": old_cs},
        ).update(text={"en": new_en, "cs": new_cs})


def reword_forward(apps, schema_editor):
    _apply(apps, schema_editor, REWORDED_QUESTIONS, OLD_INSTRUCTIONS, NEW_INSTRUCTIONS)


def reword_reverse(apps, schema_editor):
    reversed_pairs = [(new_en, new_cs, old_en, old_cs) for old_en, old_cs, new_en, new_cs in REWORDED_QUESTIONS]
    _apply(apps, schema_editor, reversed_pairs, NEW_INSTRUCTIONS, OLD_INSTRUCTIONS)


class Migration(migrations.Migration):
    dependencies = [
        ("assessments", "0007_rename_default_journey_situation_review"),
    ]

    operations = [
        migrations.RunPython(reword_forward, reword_reverse),
    ]
