import random

from config import SUPABASE_URL, SUPABASE_KEY
from supabase import create_client


supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_random_questions():

    response = (
        supabase
        .table("aptitude_questions")
        .select(
            "id, question, option_a, option_b, option_c, option_d"
        )
        .execute()
    )

    questions = response.data

    if len(questions) < 3:
        raise ValueError("Not enough aptitude questions available.")

    selected_questions = random.sample(questions, 3)

    return selected_questions


def get_correct_answers(question_ids):

    response = (
        supabase
        .table("aptitude_questions")
        .select("id, correct_answer")
        .in_("id", question_ids)
        .execute()
    )

    return {
        question["id"]: question["correct_answer"]
        for question in response.data
    }


def calculate_aptitude_score(question_ids, answers, assessment_id):

    correct_answers = get_correct_answers(question_ids)

    correct_count = 0

    for question_id in question_ids:

        submitted_answer = answers.get(str(question_id), "")
        correct_answer = correct_answers.get(question_id, "")

        if submitted_answer.strip().upper() == correct_answer.strip().upper():
            correct_count += 1

    score = round((correct_count / len(question_ids)) * 100)

    # Save the calculated score to the assessment
    response = (
        supabase
        .table("assessments")
        .update({
            "aptitude_score": score
        })
        .eq("id", assessment_id)
        .execute()
    )

    if not response.data:
        raise ValueError("Assessment could not be updated.")

    return {
        "correct_count": correct_count,
        "total_questions": len(question_ids),
        "score": score,
        "passed": correct_count == len(question_ids)
    }