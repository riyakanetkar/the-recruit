from flask import Blueprint, jsonify, request

from controllers.aptitude_controller import (
    start_aptitude,
    submit_aptitude
)


aptitude_bp = Blueprint("aptitude", __name__)


@aptitude_bp.route("/api/aptitude/start", methods=["GET"])
def start():

    try:

        assessment = start_aptitude()

        return jsonify({
            "success": True,
            "assessment": assessment
        }), 200

    except Exception as error:

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@aptitude_bp.route("/api/aptitude/submit", methods=["POST"])
def submit():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required."
        }), 400

    question_ids = data.get("question_ids")
    answers = data.get("answers")
    assessment_id = data.get("assessment_id")

    if not question_ids or not answers or not assessment_id:

        return jsonify({
            "success": False,
            "message": "Question IDs, answers and assessment ID are required."
        }), 400

    try:

        result = submit_aptitude(
            question_ids,
            answers,
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