import random

from config import SUPABASE_URL, SUPABASE_KEY
from supabase import create_client


supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_random_messages():

    response = (
        supabase
        .table("encrypted_messages")
        .select("id, encrypted_message, hint")
        .execute()
    )

    messages = response.data

    if len(messages) < 3:
        raise ValueError("Not enough encrypted messages available.")

    return random.sample(messages, 3)


def get_correct_answers(message_ids):

    response = (
        supabase
        .table("encrypted_messages")
        .select("id, correct_answer")
        .in_("id", message_ids)
        .execute()
    )

    return {
        message["id"]: message["correct_answer"]
        for message in response.data
    }


def calculate_cipher_score(message_ids, answers, assessment_id):

    correct_answers = get_correct_answers(message_ids)

    correct_count = 0

    for message_id in message_ids:

        submitted_answer = answers.get(str(message_id), "").strip().upper()
        correct_answer = correct_answers.get(message_id, "").strip().upper()

        if submitted_answer == correct_answer:
            correct_count += 1

    score = round((correct_count / len(message_ids)) * 100)

    # Save the calculated score to the assessment
    response = (
        supabase
        .table("assessments")
        .update({
            "cipher_score": score
        })
        .eq("id", assessment_id)
        .execute()
    )

    if not response.data:
        raise ValueError("Assessment could not be updated.")

    return {
        "correct_count": correct_count,
        "total_messages": len(message_ids),
        "score": score
    }