from services.aptitude_service import (
    get_random_questions,
    calculate_aptitude_score
)


def start_aptitude():

    questions = get_random_questions()

    return {
        "questions": questions,
        "total_questions": len(questions)
    }


def submit_aptitude(question_ids, answers, assessment_id):

    return calculate_aptitude_score(
        question_ids,
        answers,
        assessment_id
    )