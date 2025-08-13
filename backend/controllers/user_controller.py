from flask import Blueprint, request, jsonify
from services.user_service import create_user, login_user, update_user_profile

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

@user_bp.route("/api/login", methods=["POST"])
def sign_in():
    data = request.get_json()

    result = login_user(data.get("email"), data.get("password"))

    # Success
    if result["success"]:
        return jsonify(result), 200

    # There was an error, what is the code
    code = result.get("error", {}).get("code")
    if code == "BAD_REQUEST":
        return jsonify(result), 400
    if code == "INVALID_CREDENTIALS":
        return jsonify(result), 401
    if code == "USER_NOT_FOUND":
        return jsonify(result), 404
    # outlier error
    return jsonify(result), 500

@user_bp.route("/api/users/<email>", methods=["PATCH"])
def patch_user(email):

    # Get the items that need updated from the user
    payload = request.get_json(silent=True) or {}
    print(payload)
    print(email)
    # Call the service layer
    result = update_user_profile(email, payload)

    if result["success"]:
        return jsonify(result), 200

    code = result.get("error", {}).get("code")
    if code == "NOT_FOUND":
        return jsonify(result), 404
    if code == "BAD_REQUEST":
        return jsonify(result), 400
    return jsonify(result), 500