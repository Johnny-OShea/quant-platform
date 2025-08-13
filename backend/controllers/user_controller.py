from flask import Blueprint, request, jsonify
from services.user_service import create_user, get_user_info

user_bp = Blueprint("user_bp", __name__)

@user_bp.route("/api/users", methods=["POST"])
def register_user():
    data = request.get_json()
    try:
        result = create_user(data.get("username"), data.get("email"), data.get("password"))

        if (result["success"]):

            response = jsonify(result)
            response.status_code = 200
            return response

        if (result["error"].get("code") == "Duplicate account"):

            response = jsonify(result)
            response.status_code = 409
            return response
        else:

            response = jsonify(result)
            response.status_code = 400
            return response

    # outlier errors
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route("/api/users/<username>", methods=["GET"])
def fetch_user(username):
    user = get_user_info(username)
    if user:
        return jsonify(user)
    else:
        return jsonify({"error": "User not found"}), 404