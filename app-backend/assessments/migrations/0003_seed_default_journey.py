"""Data migration seeding the real default journey content (Personal
Wellbeing Snapshot + Personal Operating Map). Ships through the normal
migrate --noinput on container boot (start.sh) rather than requiring direct
DB access or a management command run against each environment by hand —
the same mechanism that already reliably applies schema migrations there.

Uses apps.get_model() (historical models) per Django's data-migration
convention, so this keeps working even if assessments/models.py changes
shape later — historical models only have the fields as of this migration,
not any custom methods/constants, hence the plain string literals for
choices below instead of Test.TYPE_SNAPSHOT etc.

Guarded by a slug existence check so re-running (e.g. a rolled-back-then-
reapplied migration) doesn't create duplicates.
"""
from django.db import migrations

YES_NO = [
    (0.0, {"en": "No", "cs": "Ne"}),
    (1.0, {"en": "Yes", "cs": "Ano"}),
]

CATEGORIES = [
    (
        "relationships", "Relationships", "Vztahy",
        [
            ("I am satisfied with the level of intimacy in my life",
             "Jsem spokojen(a) s úrovní intimity ve svém životě"),
            ("My partner and I respect each other mutually and are equals",
             "S mým partnerem se vzájemně respektujeme a jsme rovnocenní"),
            ("I get along well with colleagues at work",
             "S kolegy v práci vycházím dobře"),
            ("I easily reach agreement with people I have had conflicts with",
             "Snadno se dohodnu s lidmi, se kterými jsem měl(a) konflikty"),
            ("I trust the people who are important in my life",
             "Lidem, kteří jsou pro mne v životě důležití, důvěřuji"),
            ("I get along well with my neighbors and talk with them",
             "Dobře vycházím se svými sousedy a mluvím s nimi"),
            ("I consider myself a good friend",
             "Považuji se za dobrého přítele (přítelkyni)"),
            ("I see the people who are important to me regularly",
             "S lidmi, kteří jsou pro mne důležití, se vídám pravidelně"),
            ("My family and friends know how important they are to me",
             "Má rodina a mí přátelé vědí, jak moc jsou pro mne důležití"),
            ("I am satisfied with my social life",
             "Jsem spokojený(á) se svým společenským životem"),
        ],
        (
            "Relationships may need attention", "Vztahy možná potřebují pozornost",
            "Fewer of these statements felt true right now — this could be a good area to bring into a coaching conversation.",
            "Méně těchto tvrzení teď platí — tohle může být dobrá oblast, kterou probrat v koučinku.",
            "A solid foundation, with room to grow", "Solidní základ, se kterým je stále prostor pracovat",
            "You have real strengths in your relationships, alongside a few areas worth developing further.",
            "Máš ve vztazích reálné silné stránky, spolu s několika oblastmi, které stojí za další rozvoj.",
            "A real strength for you", "Skutečná silná stránka",
            "Relationships look like a solid part of your foundation right now.",
            "Vztahy teď vypadají jako pevná součást tvého základu.",
        ),
    ),
    (
        "personal", "Personal", "Osobní",
        [
            ("I like myself", "Mám se rád(a)"),
            ("I have celebrated my birthday in the last 2 years",
             "V posledních 2 letech jsem slavil(a) své narozeniny"),
            ("I lead an active life outside of work",
             "Vedu aktivní mimopracovní život"),
            ("I have enough self-confidence to do what I want in life",
             "Mám dost sebedůvěry dělat v životě, co chci"),
            ("I take a reasonable vacation every year",
             "Mám každý rok přiměřenou dovolenou"),
            ("I do not lie or exaggerate", "Nelžu ani nepřeháním"),
            ("I can comfortably say no when I need to",
             "V pohodě řeknu ne, když to potřebuji"),
            ("People know they can count on me and that I do what I say",
             "Lidé vědí, že se mnou mohou počítat a že udělám, co řeknu"),
            ("I can easily remember the last time I really laughed",
             "Snadno si vzpomenu, kdy jsem se naposled opravdu nasmál(a)"),
            ("I can express my creativity", "Umím vyjadřovat svou tvořivost"),
        ],
        (
            "Personal life may need attention", "Osobní oblast možná potřebuje pozornost",
            "A few of these day-to-day personal habits might be worth revisiting.",
            "Několik z těchto každodenních osobních návyků možná stojí za to si znovu projít.",
            "A solid foundation, with room to grow", "Solidní základ, se kterým je stále prostor pracovat",
            "You've got good personal habits in place, with a few more to build on.",
            "Máš zavedené dobré osobní návyky, a je na čem dál stavět.",
            "A real strength for you", "Skutečná silná stránka",
            "Your personal life looks like a solid part of your foundation right now.",
            "Tvůj osobní život teď vypadá jako pevná součást tvého základu.",
        ),
    ),
    (
        "home-environment", "Home Environment", "Domácí prostředí",
        [
            ("I am happy with my home", "Jsem šťastný(á) se svým domovem"),
            ("My home is usually tidy and clean", "Doma mám obvykle uklizeno a čisto"),
            ("I surround myself with things I love", "Obklopuji se věcmi, které mám rád"),
            ("I do not clutter my space with 'dust catchers' (odds and ends)",
             "Nezanáším se „lapači prachu“ (věcmi a věcičkami)"),
            ("I sort waste at home", "Doma třídím odpad"),
            ("My personal files are sorted and organized",
             "Mé osobní složky jsou vytříděné a uklizené"),
            ("My bed supports me in getting good sleep",
             "Má postel mne podporuje v dobrém spánku"),
            ("My bed is always properly made", "Má postel je vždy řádně ustlaná"),
            ("I display photos of my loved ones",
             "Mám vystavené fotografie svých milovaných blízkých"),
            ("I am satisfied with my means of transportation",
             "Jsem spokojený(á) se svým způsobem přepravy"),
        ],
        (
            "Your home environment may need attention", "Domácí prostředí možná potřebuje pozornost",
            "A few things about your physical space might be worth sorting out.",
            "Několik věcí v tvém prostoru možná stojí za to si urovnat.",
            "A solid foundation, with room to grow", "Solidní základ, se kterým je stále prostor pracovat",
            "Your home mostly supports you, with a few things still worth tidying up.",
            "Tvůj domov tě většinou podporuje, a pár věcí ještě stojí za uklizení.",
            "A real strength for you", "Skutečná silná stránka",
            "Your home environment looks like a solid part of your foundation right now.",
            "Tvé domácí prostředí teď vypadá jako pevná součást tvého základu.",
        ),
    ),
    (
        "health-and-body", "Health and Body", "Zdraví a tělo",
        [
            ("I am satisfied with my current weight",
             "Jsem spokojený(á) se svou současnou váhou"),
            ("I exercise at least three times a week", "Cvičím alespoň třikrát týdně"),
            ("I eat a balanced diet with plenty of fresh foods",
             "Jím vyváženou stravu se spoustou čerstvých potravin"),
            ("I do not smoke excessively or drink too much alcohol",
             "Přehnaně nekouřím a nepiji alkohol"),
            ("I drink at least 2 liters of water every day",
             "Denně vypiji alespoň 2 litry vody"),
            ("I regularly go for preventive medical and dental checkups",
             "Pravidelně chodím na lékařské a zubařské preventivní prohlídky"),
            ("I am satisfied with the amount of sleep I get",
             "Jsem spokojený(á) s množstvím svého spánku"),
            ("I have suitable clothing for work and leisure",
             "Mám vhodné oblečení pro práci i volný čas"),
            ("I do not worry about my stress level",
             "Nedělám si starosti s úrovní svého stresu"),
            ("Overall, I feel good", "Celkově se cítím dobře"),
        ],
        (
            "Health and body may need attention", "Zdraví a tělo možná potřebují pozornost",
            "A few health and body basics might be worth revisiting.",
            "Několik základních věcí ohledně zdraví a těla možná stojí za to si znovu projít.",
            "A solid foundation, with room to grow", "Solidní základ, se kterým je stále prostor pracovat",
            "You've got good habits in place, with a few more worth building.",
            "Máš zavedené dobré návyky, a je na čem dál stavět.",
            "A real strength for you", "Skutečná silná stránka",
            "Your health and body look like a solid part of your foundation right now.",
            "Tvé zdraví a tělo teď vypadají jako pevná součást tvého základu.",
        ),
    ),
    (
        "work", "Work", "Práce",
        [
            ("My work stimulates me", "Moje práce mne stimuluje"),
            ("I am proud of what I do in my work",
             "Jsem hrdý(á) na to, co dělám ve své práci"),
            ("I feel appreciated at work", "Cítím se v práci oceňovaný(á)"),
            ("I respect the people I work with", "Respektuji lidi, se kterými pracuji"),
            ("I know where my career is headed", "Vím, kam směřuje moje kariéra"),
            ("I respond to phone calls and e-mails within 48 hours",
             "Odpovídám na telefony a e-maily do 48 hodin"),
            ("I do not let paperwork pile up",
             "Nenechávám narůstat nevyřízené papírování"),
            ("I complete my work in a reasonable amount of time",
             "Dokončuji svou práci v rozumné době"),
            ("I manage planning my time well", "Dobře zvládám plánování svého času"),
            ("I delegate without feeling guilty", "Deleguji bez pocitu viny"),
        ],
        (
            "Work may need attention", "Práce možná potřebuje pozornost",
            "A few things about your work life might be worth bringing into a coaching conversation.",
            "Několik věcí ohledně tvé práce možná stojí za to probrat v koučinku.",
            "A solid foundation, with room to grow", "Solidní základ, se kterým je stále prostor pracovat",
            "Work looks mostly solid, with a few areas still worth developing.",
            "Práce vypadá vesměs solidně, a pár oblastí ještě stojí za rozvoj.",
            "A real strength for you", "Skutečná silná stránka",
            "Work looks like a solid part of your foundation right now.",
            "Práce teď vypadá jako pevná součást tvého základu.",
        ),
    ),
    (
        "finances", "Finances", "Finance",
        [
            ("I am satisfied with my income", "Jsem spokojený(á) se svým příjmem"),
            ("I have a budget that I use", "Mám rozpočet, který využívám"),
            ("I pay my bills on time", "Platím své účty včas"),
            ("I know how much I owe and when I will repay it",
             "Vím, kolik dlužím a kdy to splatím"),
            ("I have a long-term financial plan", "Mám dlouhodobý finanční plán"),
            ("I am able to reward myself without feeling guilty",
             "Jsem schopen (schopna) se odměnit bez pocitu viny"),
            ("I use my credit card responsibly",
             "Svou kreditní kartu používám rozumně"),
            ("I have a last will and testament", "Mám poslední vůli"),
            ("My wallet is not stuffed with unprocessed receipts",
             "Moje peněženka není zanesena nevyřízenými účtenkami"),
            ("I fulfill my tax obligations on time",
             "Své daňové povinnosti plním včas"),
        ],
        (
            "Finances may need attention", "Finance možná potřebují pozornost",
            "A few financial basics might be worth revisiting.",
            "Několik finančních základů možná stojí za to si znovu projít.",
            "A solid foundation, with room to grow", "Solidní základ, se kterým je stále prostor pracovat",
            "Your finances look mostly solid, with a few habits still worth building.",
            "Tvé finance vypadají vesměs solidně, a pár návyků ještě stojí za vybudování.",
            "A real strength for you", "Skutečná silná stránka",
            "Finances look like a solid part of your foundation right now.",
            "Finance teď vypadají jako pevná součást tvého základu.",
        ),
    ),
]

MAPPING_QUESTIONS = [
    ("What currently motivates you the most?", "Co vás aktuálně nejvíc motivuje?"),
    ("What most often holds you back?", "Co vás naopak nejčastěji brzdí?"),
    ("In what ways do you tend to sabotage yourself?", "Jaké máte tendence podkopávat sám sebe?"),
    ("In what situations do you make worse decisions than you would like?",
     "V jakých situacích děláte horší rozhodnutí než byste chtěl/a?"),
    ("How do you know when you are “in flow”?", "Jak poznáte, že jste „ve flow“?"),
    ("How do you learn best? What does not work for you?", "Jak se nejlépe učíte? Co vám naopak nefunguje?"),
    ("How do you react under pressure?", "Jak reagujete pod tlakem?"),
    ("How do you relieve stress?", "Jak uvolňujete stres?"),
    ("What gives you energy in the long term?", "Co vám dlouhodobě dodává energii?"),
    ("What systematically drains your energy?", "Co vám energii systematicky bere?"),
    ("How do you have fun (really, not how you “should”)?", "Jak se bavíte (opravdu, ne „mělo by se“)?"),
    ("What do you do to take regular care of yourself?", "Co děláte, abyste o sebe pravidelně pečoval/a?"),
    ("What are your strengths?", "Jaká jsou vaše silná místa?"),
    ("Where do you see your weaknesses?", "Kde vidíte svá slabá místa?"),
    ("What have you given up on in life (consciously or unconsciously)?",
     "Co jste v životě vzdal/a (vědomě či nevědomě)?"),
    ("When were you happiest in life? Why?", "Kdy jste byl/a v životě nejvíc spokojený/á? Proč?"),
    ("And when were you least happy? What was happening then?", "Kdy naopak nejméně? Co se tam dělo?"),
    ("What kind of environment brings out the best in you?", "Jaké prostředí z vás dostává to nejlepší?"),
    ("What kind of environment destroys or suppresses you?", "Jaké prostředí vás ničí nebo tlumí?"),
    ("What do people often say about you that you do not fully see yourself?",
     "Co o vás lidé často říkají, co vy sám/a úplně nevidíte?"),
]

# Placeholder — replace with the real SimpleShop product id once the
# product is actually set up there, via a follow-up migration or admin edit.
DEFAULT_JOURNEY_PRODUCT_ID = "DIAGNOSTICS-DEFAULT"


def seed_default_journey(apps, schema_editor):
    Test = apps.get_model("assessments", "Test")
    Category = apps.get_model("assessments", "Category")
    Question = apps.get_model("assessments", "Question")
    LikertOption = apps.get_model("assessments", "LikertOption")
    ResultThreshold = apps.get_model("assessments", "ResultThreshold")
    Journey = apps.get_model("assessments", "Journey")
    JourneyStep = apps.get_model("assessments", "JourneyStep")

    if Journey.objects.filter(slug="default").exists():
        return

    snapshot = Test.objects.create(
        slug="personal-snapshot",
        test_type="snapshot",
        title={"en": "Personal Wellbeing Snapshot", "cs": "Osobní kontrolní přehled"},
        description={
            "en": "A checklist across six areas of your life — mark what's currently true for you.",
            "cs": "Kontrolní seznam napříč šesti oblastmi tvého života — označ, co je pro tebe teď pravda.",
        },
        instructions={
            "en": "For each statement, answer Yes or No — whichever currently feels true. There are no right answers.",
            "cs": "U každého tvrzení odpověz Ano nebo Ne — podle toho, co teď platí. Neexistují správné odpovědi.",
        },
    )

    for order, (key, name_en, name_cs, questions, thresholds) in enumerate(CATEGORIES):
        category = Category.objects.create(
            test=snapshot, key=key, order=order, name={"en": name_en, "cs": name_cs}
        )
        for q_order, (text_en, text_cs) in enumerate(questions):
            question = Question.objects.create(
                test=snapshot, category=category, question_type="likert",
                order=q_order, allow_comment=True,
                text={"en": text_en, "cs": text_cs},
            )
            for opt_order, (value, label) in enumerate(YES_NO):
                LikertOption.objects.create(
                    question=question, value=value, label=label, order=opt_order
                )

        (low_t_en, low_t_cs, low_d_en, low_d_cs,
         mid_t_en, mid_t_cs, mid_d_en, mid_d_cs,
         high_t_en, high_t_cs, high_d_en, high_d_cs) = thresholds

        ResultThreshold.objects.create(
            category=category, min_score=0.0, max_score=0.4, order=0,
            title={"en": low_t_en, "cs": low_t_cs}, description={"en": low_d_en, "cs": low_d_cs},
        )
        ResultThreshold.objects.create(
            category=category, min_score=0.4, max_score=0.7, order=1,
            title={"en": mid_t_en, "cs": mid_t_cs}, description={"en": mid_d_en, "cs": mid_d_cs},
        )
        ResultThreshold.objects.create(
            category=category, min_score=0.7, max_score=1.0, order=2,
            title={"en": high_t_en, "cs": high_t_cs}, description={"en": high_d_en, "cs": high_d_cs},
        )

    mapping = Test.objects.create(
        slug="operating-map",
        test_type="mapping",
        title={"en": "Personal Operating Map", "cs": "Osobní mapa fungování"},
        description={"en": "", "cs": ""},
        instructions={
            "en": "Please answer the following questions honestly.",
            "cs": "Prosím, odpovězte upřímně na následující otázky.",
        },
    )
    for i, (text_en, text_cs) in enumerate(MAPPING_QUESTIONS):
        Question.objects.create(
            test=mapping, question_type="open_text",
            order=i, text={"en": text_en, "cs": text_cs},
        )

    journey = Journey.objects.create(
        slug="default",
        name={"en": "Default Journey", "cs": "Výchozí cesta"},
        simpleshop_product_id=DEFAULT_JOURNEY_PRODUCT_ID,
    )
    JourneyStep.objects.create(journey=journey, test=snapshot, order=0)
    JourneyStep.objects.create(journey=journey, test=mapping, order=1)


def unseed_default_journey(apps, schema_editor):
    Journey = apps.get_model("assessments", "Journey")
    Test = apps.get_model("assessments", "Test")
    Journey.objects.filter(slug="default").delete()
    Test.objects.filter(slug__in=["personal-snapshot", "operating-map"]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("assessments", "0002_remove_feedbackrequest_journey_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_default_journey, unseed_default_journey),
    ]
