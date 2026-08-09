
from services.assessment_service import (
    start_assessment,
    update_stage_score,
    finalize_assessment
)


def begin_assessment(candidate_id):

    return start_assessment(candidate_id)


def save_stage_score(
    assessment_id,
    stage,
    score
):

    return update_stage_score(
        assessment_id,
        stage,
        score
    )


def complete_assessment(
    assessment_id,
    total_time
):

    return finalize_assessment(
        assessment_id,
        total_time
    )

