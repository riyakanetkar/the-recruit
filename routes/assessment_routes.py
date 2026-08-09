
from flask import Blueprint, jsonify, request

from controllers.assessment_controller import (
    begin_assessment,
    save_stage_score,
    complete_assessment
)


assessment_bp = Blueprint(
    "assessment",
    __name__
)


@assessment_bp.route(
    "/api/assessment/start",
    methods=["POST"]
)
def start():

    data = request.get_json()

    if not data or "candidate_id" not in data:
        return jsonify({
            "success": False,
            "message": "candidate_id is required."
        }), 400

    try:

        assessment = begin_assessment(
            data["candidate_id"]
        )

        return jsonify({
            "success": True,
            "assessment": assessment
        }), 201

    except Exception as error:

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@assessment_bp.route(
    "/api/assessment/stage-score",
    methods=["PATCH"]
)
def stage_score():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required."
        }), 400

    required = [
        "assessment_id",
        "stage",
        "score"
    ]

    for field in required:

        if field not in data:
            return jsonify({
                "success": False,
                "message": f"{field} is required."
            }), 400

    allowed_stages = {
        "aptitude_score",
        "memory_score",
        "cipher_score"
    }

    if data["stage"] not in allowed_stages:

        return jsonify({
            "success": False,
            "message": "Invalid stage."
        }), 400

    score = data["score"]

    if not isinstance(score, (int, float)):

        return jsonify({
            "success": False,
            "message": "Score must be a number."
        }), 400

    if score < 0 or score > 100:

        return jsonify({
            "success": False,
            "message": "Score must be between 0 and 100."
        }), 400

    try:

        assessment = save_stage_score(
            data["assessment_id"],
            data["stage"],
            score
        )

        return jsonify({
            "success": True,
            "assessment": assessment
        }), 200

    except Exception as error:

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@assessment_bp.route(
    "/api/assessment/finalize",
    methods=["PATCH"]
)
def finalize():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required."
        }), 400

    if "assessment_id" not in data:

        return jsonify({
            "success": False,
            "message": "assessment_id is required."
        }), 400

    if "total_time" not in data:

        return jsonify({
            "success": False,
            "message": "total_time is required."
        }), 400

    total_time = data["total_time"]

    if not isinstance(total_time, (int, float)):

        return jsonify({
            "success": False,
            "message": "total_time must be a number."
        }), 400

    if total_time < 0:

        return jsonify({
            "success": False,
            "message": "total_time cannot be negative."
        }), 400

    try:

        assessment = complete_assessment(
            data["assessment_id"],
            total_time
        )

        return jsonify({
            "success": True,
            "assessment": assessment
        }), 200

    except Exception as error:

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500

