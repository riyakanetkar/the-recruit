from flask import Blueprint, request, jsonify
from controllers.candidate_controller import start_candidate


candidate_bp = Blueprint("candidate", __name__)


@candidate_bp.route("/api/candidate/start", methods=["POST"])
def start():
    data = request.get_json()

    if not data or "name" not in data:
        return jsonify({
            "success": False,
            "message": "Name is required."
        }), 400

    candidate = start_candidate(data["name"])

    if not candidate:
        return jsonify({
            "success": False,
            "message": "Please enter a valid name."
        }), 400

    return jsonify({
        "success": True,
        "candidate": candidate
    }), 201