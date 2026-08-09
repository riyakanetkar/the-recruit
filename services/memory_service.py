import random

from config import SUPABASE_URL, SUPABASE_KEY
from supabase import create_client


supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def generate_memory_sequence():
    """
    Generate a random 4x4 memory sequence.

    The sequence contains 6 to 8 unique cells.
    Each cell is represented by its row and column.
    """

    number_of_cells = random.randint(6, 8)

    all_cells = [
        {"row": row, "col": col}
        for row in range(4)
        for col in range(4)
    ]

    sequence = random.sample(all_cells, number_of_cells)

    return sequence


def calculate_memory_score(expected_sequence, selected_cells, assessment_id):

    expected = {
        (cell["row"], cell["col"])
        for cell in expected_sequence
    }

    selected = {
        (cell["row"], cell["col"])
        for cell in selected_cells
    }

    correctly_selected = len(
        expected.intersection(selected)
    )

    score = round(
        (correctly_selected / len(expected)) * 100
    )

    correct = expected == selected

    # Save the calculated score to the assessment
    response = (
        supabase
        .table("assessments")
        .update({
            "memory_score": score
        })
        .eq("id", assessment_id)
        .execute()
    )

    if not response.data:
        raise ValueError("Assessment could not be updated.")

    return {
        "correct": correct,
        "correctly_selected": correctly_selected,
        "total_cells": len(expected),
        "score": score
    }