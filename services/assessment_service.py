from config import SUPABASE_URL, SUPABASE_KEY
from supabase import create_client


supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


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

    return response.data[0]

def update_stage_score(
    assessment_id,
    stage,
    score
):

    response = (
        supabase
        .table("assessments")
        .update({
            stage: score
        })
        .eq("id", assessment_id)
        .execute()
    )

    return response.data[0]


def finalize_assessment(
    assessment_id,
    total_time
):

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

    assessment = response.data

    aptitude = assessment["aptitude_score"]
    memory = assessment["memory_score"]
    cipher = assessment["cipher_score"]

    total_score = aptitude + memory + cipher

    average_score = total_score / 3

    if average_score >= 90:
        classification = "ELITE"

    elif average_score >= 75:
        classification = "STRONG"

    elif average_score >= 60:
        classification = "PROMISING"

    else:
        classification = "NEEDS REVIEW"

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

    return updated.data[0]