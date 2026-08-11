import pytest

from assessments.models import Answer, Category, LikertOption, Question, ResultThreshold, Test
from assessments.scoring import compute_result, compute_snapshot_result


@pytest.mark.django_db
def test_compute_snapshot_result_averages_by_category():
    test = Test.objects.create(slug="t1", test_type=Test.TYPE_SNAPSHOT)
    category = Category.objects.create(test=test, key="growth")
    q1 = Question.objects.create(test=test, category=category, question_type=Question.QUESTION_TYPE_LIKERT)
    q2 = Question.objects.create(test=test, category=category, question_type=Question.QUESTION_TYPE_LIKERT)
    o1 = LikertOption.objects.create(question=q1, value=0.4)
    o2 = LikertOption.objects.create(question=q2, value=0.8)

    answers = [Answer(question=q1, selected_option=o1), Answer(question=q2, selected_option=o2)]

    result = compute_snapshot_result(test, answers)

    assert result["categories"]["growth"] == pytest.approx(0.6)


@pytest.mark.django_db
def test_compute_snapshot_result_matches_threshold():
    test = Test.objects.create(slug="t2", test_type=Test.TYPE_SNAPSHOT)
    category = Category.objects.create(test=test, key="growth")
    threshold = ResultThreshold.objects.create(category=category, min_score=0.5, max_score=1.0)
    question = Question.objects.create(test=test, category=category, question_type=Question.QUESTION_TYPE_LIKERT)
    option = LikertOption.objects.create(question=question, value=0.9)

    result = compute_snapshot_result(test, [Answer(question=question, selected_option=option)])

    assert result["matched_thresholds"]["growth"] == threshold.id


@pytest.mark.django_db
def test_compute_snapshot_result_ignores_uncategorized_answers():
    test = Test.objects.create(slug="t3", test_type=Test.TYPE_SNAPSHOT)
    question = Question.objects.create(test=test, question_type=Question.QUESTION_TYPE_LIKERT)
    option = LikertOption.objects.create(question=question, value=0.5)

    result = compute_snapshot_result(test, [Answer(question=question, selected_option=option)])

    assert result["categories"] == {}


@pytest.mark.django_db
def test_compute_result_mapping_type_returns_empty():
    test = Test.objects.create(slug="t4", test_type=Test.TYPE_MAPPING)
    question = Question.objects.create(test=test, question_type=Question.QUESTION_TYPE_OPEN_TEXT)

    result = compute_result(test, [Answer(question=question, text_value="hello")])

    assert result == {}


def test_compute_result_unknown_type_raises():
    test = Test(slug="t5", test_type="bogus")
    with pytest.raises(ValueError):
        compute_result(test, [])
