"""Seed the SCARF Relationship Reflection (issue #24): one reflection-type
Test with 5 domains x 3 pairs x 2 perspectives = 30 Likert questions on a
shared 1-7 scale, plus a one-step Journey (no coach-feedback stage).

Same conventions as 0003: plain literals via apps.get_model, a slug guard so
re-running is a no-op, and a reverse function. English wording is verbatim
from the issue; Czech uses informal tykani and gender-neutral "partner
(partnerka)". Never edit this version's wording in place once submissions
exist - add a new Test version instead (see Test.version).
"""
from django.db import migrations

SLUG = "scarf-reflection"

TITLE = {
    "en": "SCARF Relationship Reflection",
    "cs": "Reflexe vztahu podle modelu SCARF",
}

DESCRIPTION = {
    "en": (
        "What I experience. How I contribute.\n\n"
        "This questionnaire explores five aspects of your relationship: respect, predictability, "
        "autonomy, connection, and fairness.\n\n"
        "It is a reflection tool inspired by SCARF, not a validated psychological assessment. "
        "It does not determine who is right or provide an overall verdict on your relationship."
    ),
    "cs": (
        "Co zažívám. Čím přispívám.\n\n"
        "Tento dotazník zkoumá pět oblastí tvého vztahu: respekt, předvídatelnost, autonomii, "
        "propojení a férovost.\n\n"
        "Je to nástroj k zamyšlení inspirovaný modelem SCARF, nikoli ověřené psychologické "
        "posouzení. Neurčuje, kdo má pravdu, ani nehodnotí tvůj vztah jako celek."
    ),
}

INSTRUCTIONS = {
    "en": (
        "Think about your relationship with your current partner over the last four weeks.\n\n"
        "For each statement, consider: When relevant situations arose, how often was this true?\n\n"
        "Rate every statement separately. Base answers about your contribution on what you "
        "actually did, rather than what you intended.\n\n"
        "If you both participate, complete the questionnaire independently before choosing whether "
        "to share your answers. Sharing is optional."
    ),
    "cs": (
        "Mysli na svůj vztah se současným partnerem (partnerkou) za poslední čtyři týdny.\n\n"
        "U každého tvrzení zvaž: Když nastaly relevantní situace, jak často to platilo?\n\n"
        "Každé tvrzení ohodnoť zvlášť. U odpovědí o tom, čím přispíváš, vycházej z toho, co jsi "
        "skutečně udělal(a), ne z toho, co jsi měl(a) v úmyslu.\n\n"
        "Pokud se zúčastníte oba, vyplňte dotazník nezávisle na sobě a teprve potom se rozhodněte, "
        "zda si odpovědi sdílíte. Sdílení je dobrovolné."
    ),
}

SCALE = [
    (1, {"en": "Never or almost never", "cs": "Nikdy nebo téměř nikdy"}),
    (2, {"en": "Rarely", "cs": "Zřídka"}),
    (3, {"en": "Occasionally", "cs": "Občas"}),
    (4, {"en": "About half the time", "cs": "Zhruba v polovině případů"}),
    (5, {"en": "Often", "cs": "Často"}),
    (6, {"en": "Usually", "cs": "Obvykle"}),
    (7, {"en": "Always or almost always", "cs": "Vždy nebo téměř vždy"}),
]

# (key, name) - domain descriptions are UI copy in app-frontend/src/lib/i18n.ts.
DOMAINS = [
    ("S", {"en": "Status: respect and recognition", "cs": "Status: respekt a uznání"}),
    ("C", {"en": "Certainty: clarity and reliability", "cs": "Jistota: jasnost a spolehlivost"}),
    ("A", {"en": "Autonomy: choice and personal boundaries", "cs": "Autonomie: volba a osobní hranice"}),
    ("R", {"en": "Relatedness: care and connection", "cs": "Sounáležitost: péče a spojení"}),
    ("F", {"en": "Fairness: responsibilities and mutual consideration", "cs": "Férovost: odpovědnosti a vzájemná ohleduplnost"}),
]

# pair id -> (experience en, contribution en, experience cs, contribution cs)
PAIRS = {
    "S1": (
        "My partner takes my views seriously, even when we disagree.",
        "I take my partner’s views seriously, even when we disagree.",
        "Můj partner (moje partnerka) bere vážně mé názory, i když se neshodneme.",
        "Beru vážně názory svého partnera (své partnerky), i když se neshodneme.",
    ),
    "S2": (
        "My partner expresses appreciation for what I contribute to our life together.",
        "I express appreciation for what my partner contributes to our life together.",
        "Partner (partnerka) dává najevo uznání za to, čím přispívám do našeho společného života.",
        "Dávám partnerovi (partnerce) najevo uznání za to, čím přispívá do našeho společného života.",
    ),
    "S3": (
        "When raising a concern about my behaviour, my partner speaks to me respectfully.",
        "When raising a concern about my partner’s behaviour, I speak to them respectfully.",
        "Když partner (partnerka) řeší moje chování, mluví se mnou s respektem.",
        "Když řeším chování partnera (partnerky), mluvím s ním (s ní) s respektem.",
    ),
    "C1": (
        "My partner tells me clearly what they expect from me.",
        "I tell my partner clearly what I expect from them.",
        "Partner (partnerka) mi jasně říká, co ode mě očekává.",
        "Jasně říkám partnerovi (partnerce), co od něj (od ní) očekávám.",
    ),
    "C2": (
        "My partner keeps our agreements or lets me know when they need to change.",
        "I keep our agreements or let my partner know when they need to change.",
        "Partner (partnerka) dodržuje naše dohody, nebo mi dá vědět, že je potřeba je změnit.",
        "Dodržuji naše dohody, nebo dám partnerovi (partnerce) vědět, že je potřeba je změnit.",
    ),
    "C3": (
        "My partner keeps me informed about changes in their plans that affect me.",
        "I keep my partner informed about changes in my plans that affect them.",
        "Partner (partnerka) mě informuje o změnách svých plánů, které se mě týkají.",
        "Informuji partnera (partnerku) o změnách svých plánů, které se ho (jí) týkají.",
    ),
    "A1": (
        "My partner respects my decisions about matters that primarily concern me.",
        "I respect my partner’s decisions about matters that primarily concern them.",
        "Partner (partnerka) respektuje má rozhodnutí v záležitostech, které se týkají především mě.",
        "Respektuji rozhodnutí partnera (partnerky) v záležitostech, které se týkají především jeho (jí).",
    ),
    "A2": (
        "My partner respects my refusal when I say no to a request.",
        "I respect my partner’s refusal when they say no to a request.",
        "Partner (partnerka) respektuje moje odmítnutí, když na nějakou žádost odpovím ne.",
        "Respektuji odmítnutí partnera (partnerky), když na nějakou žádost odpoví ne.",
    ),
    "A3": (
        "My partner supports me in making time for interests of my own.",
        "I support my partner in making time for interests of their own.",
        "Partner (partnerka) mě podporuje v tom, abych si udělal(a) čas na vlastní zájmy.",
        "Podporuji partnera (partnerku) v tom, aby si udělal(a) čas na vlastní zájmy.",
    ),
    "R1": (
        "When I share something personally important, my partner gives me their attention.",
        "When my partner shares something personally important, I give them my attention.",
        "Když se svěřím s něčím osobně důležitým, partner (partnerka) mi věnuje pozornost.",
        "Když se mi partner (partnerka) svěří s něčím osobně důležitým, věnuji mu (jí) pozornost.",
    ),
    "R2": (
        "My partner shows warmth towards me in our everyday interactions.",
        "I show warmth towards my partner in our everyday interactions.",
        "Partner (partnerka) ke mně v každodenních situacích projevuje vřelost.",
        "K partnerovi (partnerce) v každodenních situacích projevuji vřelost.",
    ),
    "R3": (
        "After tension between us, my partner makes an effort to reconnect.",
        "After tension between us, I make an effort to reconnect.",
        "Po napětí mezi námi se partner (partnerka) snaží znovu navázat kontakt.",
        "Po napětí mezi námi se snažím znovu navázat kontakt.",
    ),
    "F1": (
        "My partner takes a fair share of our shared responsibilities, given our respective capacities and circumstances.",
        "I take a fair share of our shared responsibilities, given our respective capacities and circumstances.",
        "Partner (partnerka) přebírá spravedlivý podíl na společných povinnostech s ohledem na naše možnosti a okolnosti.",
        "Přebírám spravedlivý podíl na společných povinnostech s ohledem na naše možnosti a okolnosti.",
    ),
    "F2": (
        "When our needs compete, my partner gives my needs as much consideration as their own.",
        "When our needs compete, I give my partner’s needs as much consideration as my own.",
        "Když se naše potřeby střetnou, bere partner (partnerka) ohled na mé potřeby stejně jako na své.",
        "Když se naše potřeby střetnou, beru ohled na potřeby partnera (partnerky) stejně jako na své.",
    ),
    "F3": (
        "My partner holds themselves to the same standards they expect of me in comparable situations.",
        "I hold myself to the same standards I expect of my partner in comparable situations.",
        "Partner (partnerka) měří sobě stejnými měřítky jako mně ve srovnatelných situacích.",
        "Měřím sobě stejnými měřítky jako partnerovi (partnerce) ve srovnatelných situacích.",
    ),
}

JOURNEY_NAME = {
    "en": "SCARF Relationship Reflection",
    "cs": "Reflexe vztahu podle modelu SCARF",
}


def seed(apps, schema_editor):
    Test = apps.get_model("assessments", "Test")
    Category = apps.get_model("assessments", "Category")
    Question = apps.get_model("assessments", "Question")
    LikertOption = apps.get_model("assessments", "LikertOption")
    Journey = apps.get_model("assessments", "Journey")
    JourneyStep = apps.get_model("assessments", "JourneyStep")

    if Test.objects.filter(slug=SLUG).exists():
        return

    test = Test.objects.create(
        slug=SLUG,
        test_type="reflection",
        version=1,
        title=TITLE,
        description=DESCRIPTION,
        instructions=INSTRUCTIONS,
        is_active=True,
    )

    order = 0
    for domain_order, (domain, name) in enumerate(DOMAINS):
        category = Category.objects.create(test=test, key=domain, name=name, order=domain_order)
        for n in (1, 2, 3):
            pair = f"{domain}{n}"
            exp_en, con_en, exp_cs, con_cs = PAIRS[pair]
            for role, en, cs in (("experience", exp_en, exp_cs), ("contribution", con_en, con_cs)):
                question = Question.objects.create(
                    test=test,
                    category=category,
                    question_type="likert",
                    text={"en": en, "cs": cs},
                    order=order,
                    allow_comment=False,
                    config={"domain": domain, "pair": pair, "role": role, "item_id": f"{pair}_{role}"},
                )
                order += 1
                LikertOption.objects.bulk_create(
                    [
                        LikertOption(question=question, value=value, label=label, order=i)
                        for i, (value, label) in enumerate(SCALE)
                    ]
                )

    journey = Journey.objects.create(slug=SLUG, name=JOURNEY_NAME, is_active=True, requires_feedback=False)
    JourneyStep.objects.create(journey=journey, test=test, order=0)


def unseed(apps, schema_editor):
    Test = apps.get_model("assessments", "Test")
    Journey = apps.get_model("assessments", "Journey")
    JourneyStep = apps.get_model("assessments", "JourneyStep")
    # Test is PROTECTed by JourneyStep and by submissions, so a reverse after
    # anyone has answered fails loudly rather than destroying data.
    JourneyStep.objects.filter(journey__slug=SLUG).delete()
    Journey.objects.filter(slug=SLUG).delete()
    Test.objects.filter(slug=SLUG).delete()


class Migration(migrations.Migration):
    dependencies = [("assessments", "0011_reflection_support")]

    operations = [migrations.RunPython(seed, unseed)]
