"""Isolated scoring/result-computation logic, decoupled from views so it's
unit-testable without any HTTP/DB request involvement beyond the passed-in
objects. Called once per submission; the return value is frozen into
TestSubmission.computed_result and never recomputed on read.
"""
from collections import defaultdict

from .models import Answer, Test

# Reporting convention for the reflection instrument, not a validated
# threshold: a mean is shown only when at least this many of a domain's three
# items (per perspective) have numerical answers.
REFLECTION_MIN_RATED = 2
REFLECTION_ITEMS_PER_CELL = 3


def compute_result(test: Test, answers) -> dict:
    """Dispatch on test_type — the one seam through which a new test type
    plugs in scoring without touching the submission view/serializer."""
    if test.test_type == Test.TYPE_SNAPSHOT:
        return compute_snapshot_result(test, answers)
    if test.test_type == Test.TYPE_MAPPING:
        return {}
    if test.test_type == Test.TYPE_REFLECTION:
        return compute_reflection_result(test, answers)
    raise ValueError(f"No scoring strategy for test_type={test.test_type!r}")


def compute_snapshot_result(test: Test, answers) -> dict:
    """Group answers by their question's category, average the selected
    option's value per category, then match each category's score against
    its ResultThreshold rows. Mirrors a join-then-groupby-mean shape."""
    by_category: dict[str, list[float]] = defaultdict(list)
    for answer in answers:
        question = answer.question
        if question.category_id and answer.selected_option_id:
            by_category[question.category.key].append(answer.selected_option.value)

    category_scores = {
        key: sum(values) / len(values) for key, values in by_category.items() if values
    }

    matched_thresholds: dict[str, int] = {}
    for category in test.categories.all():
        score = category_scores.get(category.key)
        if score is None:
            continue
        threshold = category.thresholds.filter(min_score__lte=score, max_score__gte=score).first()
        if threshold:
            matched_thresholds[category.key] = threshold.id

    return {"categories": category_scores, "matched_thresholds": matched_thresholds}


def compute_reflection_result(test: Test, answers) -> dict:
    """One mean per (domain, perspective) cell, computed independently.
    Questions declare their cell in config {"domain", "role"}. N/A and
    skipped answers (and questions with no answer row) are excluded rather
    than counted as zero or a midpoint. A cell with fewer than
    REFLECTION_MIN_RATED numerical answers reports mean=None. Deliberately
    no totals, balance, ranking or thresholds."""
    values: dict[tuple[str, str], list[float]] = defaultdict(list)
    for answer in answers:
        if answer.response_state != Answer.STATE_ANSWERED or not answer.selected_option_id:
            continue
        config = answer.question.config or {}
        domain, role = config.get("domain"), config.get("role")
        if domain and role:
            values[(domain, role)].append(answer.selected_option.value)

    # Domains follow the categories' own order (S, C, A, R, F), not the
    # question order, which is deliberately shuffled for presentation.
    present = {(q.config or {}).get("domain") for q in test.questions.all() if (q.config or {}).get("role")}
    domains = {c.key: {} for c in test.categories.order_by("order") if c.key in present}

    for domain, roles in domains.items():
        for role in ("experience", "contribution"):
            rated = values.get((domain, role), [])
            mean = None
            if len(rated) >= REFLECTION_MIN_RATED:
                mean = round(sum(rated) / len(rated), 1)
            roles[role] = {"mean": mean, "rated": len(rated), "total": REFLECTION_ITEMS_PER_CELL}
    return {"reflection": domains}
