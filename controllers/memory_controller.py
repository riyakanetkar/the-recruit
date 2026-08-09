from services.memory_service import (
    generate_memory_sequence,
    calculate_memory_score
)


def start_memory_test():

    sequence = generate_memory_sequence()

    return {
        "grid_size": 4,
        "sequence": sequence,
        "number_of_cells": len(sequence)
    }


def evaluate_memory_test(expected_sequence, selected_cells, assessment_id):

    return calculate_memory_score(
        expected_sequence,
        selected_cells,
        assessment_id
    )