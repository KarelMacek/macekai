SUPPORTED_LANGUAGES = ("en", "cs")
DEFAULT_LANGUAGE = "en"


def resolve_locale(value: dict, lang: str, fallback: str = DEFAULT_LANGUAGE) -> str:
    """Pick a locale's text out of a `{"en": ..., "cs": ...}` JSON field, falling
    back to `fallback` (then "") if the requested language is missing."""
    if not value:
        return ""
    return value.get(lang) or value.get(fallback) or ""


def get_lang(request, fallback: str = DEFAULT_LANGUAGE) -> str:
    """?lang= query param takes priority, then Accept-Language, then fallback."""
    lang = request.GET.get("lang")
    if lang in SUPPORTED_LANGUAGES:
        return lang

    accept_language = request.headers.get("Accept-Language", "")
    for part in accept_language.split(","):
        code = part.split(";")[0].strip().lower()[:2]
        if code in SUPPORTED_LANGUAGES:
            return code

    return fallback
