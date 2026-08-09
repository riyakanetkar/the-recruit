from flask import Blueprint, jsonify, request

from controllers.cipher_controller import (
    start_cipher,
    submit_cipher
)


cipher_bp = Blueprint("cipher", __name__)


@cipher_bp.route("/api/cipher/start", methods=["GET"])
def start():

    try:

        cipher_test = start_cipher()

        return jsonify({
            "success": True,
            "cipher_test": cipher_test
        }), 200

    except Exception as error:

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


@cipher_bp.route("/api/cipher/submit", methods=["POST"])
def submit():

    data = request.get_json()

    if not data:

        return jsonify({
            "success": False,
            "message": "Request body is required."
        }), 400

    message_ids = data.get("message_ids")
    answers = data.get("answers")
    assessment_id = data.get("assessment_id")

    if not message_ids or not answers or not assessment_id:
        return jsonify({
            "success": False,
            "message": "Message IDs, answers and assessment ID are required."
        }), 400

    try:

        result = submit_cipher(
            message_ids,
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