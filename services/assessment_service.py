
from config import SUPABASE_URL, SUPABASE_KEY
from supabase import create_client


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


def start_assessment(candidate_id):

    assessment = {
        "candidate_id": candidate_id,
        "aptitude_score": 0,
        "memory_score": 0,
        "cipher_score": 0,
        "total_score": 0,
        "classification": "IN PROGRESS",
        "total_time": 0
    }

    response = (
        supabase
        .table("assessments")
        .insert(assessment)
        .select("*")
        .execute()
    )

    if not response.data:
        raise Exception("Failed to create assessment.")

    return response.data[0]


def update_stage_score(
    assessment_id,
    stage,
    score
):

    # Validate score
    if not isinstance(score, (int, float)):
        raise ValueError("Score must be a number.")

    if score < 0 or score > 100:
        raise ValueError("Score must be between 0 and 100.")

    response = (
        supabase
        .table("assessments")
        .update({
            stage: score
        })
        .eq("id", assessment_id)
        .execute()
    )

    if not response.data:
        raise Exception("Assessment not found.")

    return response.data[0]


def finalize_assessment(
    assessment_id,
    total_time
):

    # Get the three stage scores
    response = (
        supabase
        .table("assessments")
        .select(
            "id, aptitude_score, memory_score, cipher_score"
        )
        .eq("id", assessment_id)
        .single()
        .execute()
    )

    if not response.data:
        raise Exception("Assessment not found.")

    assessment = response.data

    aptitude = assessment["aptitude_score"]
    memory = assessment["memory_score"]
    cipher = assessment["cipher_score"]

    # Calculate normalized score out of 100
    total_score = (
        aptitude +
        memory +
        cipher
    ) / 3

    # Round to 2 decimal places
    total_score = round(total_score, 2)

    # Classification
    if total_score >= 90:
        classification = "ELITE"

    elif total_score >= 75:
        classification = "STRONG"

    elif total_score >= 60:
        classification = "PROMISING"

    else:
        classification = "NEEDS REVIEW"

    # Save final assessment
    updated = (
        supabase
        .table("assessments")
        .update({
            "total_score": total_score,
            "classification": classification,
            "total_time": total_time
        })
        .eq("id", assessment_id)
        .execute()
    )

    if not updated.data:
        raise Exception("Failed to finalize assessment.")

    return updated.data[0]

