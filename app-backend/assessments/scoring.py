"""Isolated scoring/result-computation logic, decoupled from views so it's
unit-testable without any HTTP/DB request involvement beyond the passed-in
objects. Called once per submission; the return value is frozen into
TestSubmission.computed_result and never recomputed on read.
"""
from collections import defaultdict

from .models import Test


def compute_result(test: Test, answers) -> dict:
    """Dispatch on test_type — the one seam through which a new test type
    plugs in scoring without touching the submission view/serializer."""
    if test.test_type == Test.TYPE_SNAPSHOT:
        return compute_snapshot_result(test, answers)
    if test.test_type == Test.TYPE_MAPPING:
        return {}
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
