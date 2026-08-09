from services.cipher_service import (
    get_random_messages,
    calculate_cipher_score
)


def start_cipher():

    messages = get_random_messages()

    return {
        "messages": messages,
        "total_messages": len(messages)
    }


def submit_cipher(message_ids, answers, assessment_id):

    return calculate_cipher_score(
        message_ids,
        answers,
        assessment_id
    )