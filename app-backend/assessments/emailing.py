"""Transactional emails this app sends: post-purchase instructions, fired
once by the SimpleShop webhook right after a new Diagnostics is opened (see
webhooks.py); and the feedback-published notice, fired once when an admin
flips AdminFeedback.is_published (see views.AdminFeedbackWriteView).
SimpleShop's own post-payment browser redirect isn't reliable enough to be
the only channel telling a buyer where to go next, so the purchase email is
a durable fallback: an explicit login link/instructions and a walkthrough
of the rest of the journey, sent to the email address SimpleShop reported."""
from django.conf import settings
from django.utils.html import linebreaks

from backend import graph_mail

from .i18n import resolve_locale
from .models import AdminFeedback, Diagnostics

_COPY = {
    "subject": {
    "cs": '{journey_name} je k dispozici — co dál',
    "en": '{journey_name} is ready for you — what happens next',
    },

    "greeting": {
        "cs": "Dobrý den,",
        "en": "Hello,",
    },

    "intro": {
        "cs": "děkuji za objednání „{journey_name}“. Níže najdete, jak začít a co vás čeká dál.",
        "en": 'thank you for choosing "{journey_name}". Here’s how to get started and what happens next.',
    },

    "login_heading": {
        "cs": "1. Přihlaste se",
        "en": "1. Log in",
    },

    "login_body": {
        "cs": "Otevřete <a href=\"{app_url}\">{app_url}</a> a klikněte na „Přihlásit se přes Google“. "
            "Přihlaste se prosím stejnou e-mailovou adresou, kterou jste použili při nákupu: "
            "<strong>{email}</strong>.",
        "en": 'Open <a href="{app_url}">{app_url}</a> and click "Sign in with Google". '
            "Please use the same email address you used for your purchase: "
            "<strong>{email}</strong>.",
    },

    "next_heading": {
        "cs": "2. Co vás čeká",
        "en": "2. What happens next",
    },

    "next_consent": {
        "cs": "Nejprve potvrdíte souhlas se zpracováním dat.",
        "en": "First, you'll confirm your consent to data processing.",
    },

    "next_tests": {
        "cs": "Poté postupně projdete: {step_names}.",
        "en": "Then you'll work through: {step_names}.",
    },

    "next_feedback_request": {
        "cs": "Nakonec nahrajete své CV a/nebo vložíte odkaz na LinkedIn profil.",
        "en": "Finally, you'll upload your CV and/or add a link to your LinkedIn profile.",
    },

    "next_review": {
        "cs": "Vše si projdu a připravím vám písemnou zpětnou vazbu a krátké video. "
            "Jakmile budou hotové, dám vám vědět.",
        "en": "I'll review everything and prepare written feedback and a short video for you. "
            "I'll let you know as soon as they're ready.",
    },

    "support": {
        "cs": "Pokud narazíte na problém nebo budete mít otázku, jednoduše odpovězte na tento e-mail. "
            "Odpověď přijde přímo ke mně.",
        "en": "If you run into any trouble or have a question, simply reply to this email. "
            "Your reply will come directly to me.",
    },

    "sign_off": {
        "cs": "Karel",
        "en": "Karel",
    },
    "feedback_subject": {
        "cs": 'Vaše zpětná vazba k „{journey_name}“ je hotová',
        "en": 'Your feedback on "{journey_name}" is ready',
    },
    "feedback_intro": {
        "cs": "vaše zpětná vazba k „{journey_name}“ je hotová:",
        "en": 'your feedback on "{journey_name}" is ready:',
    },
    "feedback_link_body": {
        "cs": "Celou zpětnou vazbu (včetně dokumentu{video_note}) najdete po přihlášení na "
        '<a href="{link}">{link}</a>. Přihlaste se prosím <strong>stejnou e-mailovou '
        "adresou, na kterou proběhl nákup</strong>: <strong>{email}</strong>.",
        "en": "You'll find the full feedback (including the document{video_note}) after "
        'signing in at <a href="{link}">{link}</a>. Please use <strong>the same email '
        "address the purchase was made under</strong>: <strong>{email}</strong>.",
    },
    "feedback_video_note": {
        "cs": " a video",
        "en": " and video",
    },
}


def _copy(key: str, lang: str, **kwargs) -> str:
    return resolve_locale(_COPY[key], lang).format(**kwargs)


def _app_url() -> str:
    host = settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else ""
    return f"https://{host}/" if host and host != "*" else ""


def _step_names(diagnostics: Diagnostics, lang: str) -> str:
    steps = diagnostics.journey.steps.select_related("test").order_by("order")
    return ", ".join(resolve_locale(step.test.title, lang) for step in steps)


def send_purchase_instructions_email(diagnostics: Diagnostics) -> None:
    lang = diagnostics.language or "en"
    journey_name = resolve_locale(diagnostics.journey.name, lang) or diagnostics.journey.slug

    subject = _copy("subject", lang, journey_name=journey_name)
    body_parts = [
        f"<p>{_copy('greeting', lang)}</p>",
        f"<p>{_copy('intro', lang, journey_name=journey_name)}</p>",
        f"<h3>{_copy('login_heading', lang)}</h3>",
        f"<p>{_copy('login_body', lang, app_url=_app_url(), email=diagnostics.email)}</p>",
        f"<h3>{_copy('next_heading', lang)}</h3>",
        "<ul>"
        f"<li>{_copy('next_consent', lang)}</li>"
        f"<li>{_copy('next_tests', lang, step_names=_step_names(diagnostics, lang))}</li>"
        f"<li>{_copy('next_feedback_request', lang)}</li>"
        f"<li>{_copy('next_review', lang)}</li>"
        "</ul>",
        f"<p>{_copy('support', lang)}</p>",
        f"<p>{_copy('sign_off', lang)}</p>",
    ]

    graph_mail.send_mail(to=diagnostics.email, subject=subject, html_body="".join(body_parts))


def send_feedback_published_email(diagnostics: Diagnostics, feedback: AdminFeedback) -> None:
    """Fired once, when an admin flips AdminFeedback.is_published (see
    views.AdminFeedbackWriteView) — never on later edits of an already-
    published feedback. The email's substance is feedback.notes itself (the
    same text FeedbackViewPage shows the client), not a generic canned
    paragraph — only the greeting/link/sign-off around it are boilerplate."""
    lang = diagnostics.language or "en"
    journey_name = resolve_locale(diagnostics.journey.name, lang) or diagnostics.journey.slug

    subject = _copy("feedback_subject", lang, journey_name=journey_name)
    video_note = _copy("feedback_video_note", lang) if feedback.video_url else ""
    link = f"{_app_url()}feedback"

    body_parts = [
        f"<p>{_copy('greeting', lang)}</p>",
        f"<p>{_copy('feedback_intro', lang, journey_name=journey_name)}</p>",
    ]
    if feedback.notes:
        body_parts.append(linebreaks(feedback.notes))
    body_parts += [
        f"<p>{_copy('feedback_link_body', lang, link=link, email=diagnostics.email, video_note=video_note)}</p>",
        f"<p>{_copy('support', lang)}</p>",
        f"<p>{_copy('sign_off', lang)}</p>",
    ]

    graph_mail.send_mail(to=diagnostics.email, subject=subject, html_body="".join(body_parts))
