from flask import Blueprint, request, jsonify

from controllers.memory_controller import (
    start_memory_test,
    evaluate_memory_test
)


memory_bp = Blueprint("memory", __name__)


@memory_bp.route("/api/memory/start", methods=["GET"])
def start():

    try:

        memory_test = start_memory_test()

        return jsonify({
            "success": True,
            "memory_test": memory_test
        }), 200

    except Exception as error:

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@memory_bp.route("/api/memory/submit", methods=["POST"])
def submit():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required."
        }), 400

    expected_sequence = data.get("expected_sequence")
    selected_cells = data.get("selected_cells")
    assessment_id = data.get("assessment_id")

    if not expected_sequence or selected_cells is None or not assessment_id:
        return jsonify({
            "success": False,
            "message": "Expected sequence, selected cells and assessment ID are required."
        }), 400

    try:

        result = evaluate_memory_test(
            expected_sequence,
            selected_cells,
            assessment_id
        )

        return jsonify({
            "success": True,
            "result": result
        }), 200

    except Exception as error:

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500