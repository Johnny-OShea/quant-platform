from typing import Optional, Dict, Any
from werkzeug.security import generate_password_hash, check_password_hash
from mysql.connector import errorcode, IntegrityError
from repositories.user_repository import insert_user, find_user_by_email

def _response(success: bool, message: str, data = None, error = None):
    """
    The standard format for a response. It will contain:
    success - indication of success
    message - associated message
    data - information about the user
    error - if anything went wrong, then a description of it
    """
    return {
        "success": success,
        "message": message,
        "data": data or {},
        "error": error or {}
    }

def create_user(username: str, email: str, password: str) -> Dict[str, Any]:
    """
    Create a new user for the system. Take their username,
    email, and password to create an individualized experience.

    Parameters
    ----------
    username - the display name the user wants to go by
    email - the email of the user
    password - the password the user wants, will be hashed
    """
    # Check that all the fields are present
    if not username or not email or not password:
        return _response(
            False,
            "Missing required fields",
            error={"code": "BAD_REQUEST"}
        )

    # hash the password
    hashed_pw = generate_password_hash(password)

    # Try to insert a user into the database (in the repository class)
    try:
        # Create a user
        user_id = insert_user(username, email, hashed_pw)

        # Create a response
        return _response(
            True,
            "User created successfully",
            data={"id": user_id, "username": username, "email": email}
        )
    except IntegrityError as e:

        # MySQL duplicate key
        if getattr(e, "errno", None) == errorcode.ER_DUP_ENTRY:
            return _response(
                False,
                "username or email already exists",
                error={"code": "Duplicate account"}
            )

        # Unknown DB error
        return _response(False, "Database error", error={"code": "DB_ERROR"})

def login_user(email: str, password: str) -> Dict[str, Any]:
    # If there is no email/password, return error
    if not password or not email:
        return _response(
            False,
            "Missing credentials",
            error={"code": "BAD_REQUEST"}
        )

    # Create a null user
    user = None
    # Get the user in the database
    user = find_user_by_email(email)

    # Check if a user was found
    if not user:
        return _response(
            False,
            "User not found",
            error = {"code": "USER_NOT_FOUND"}
        )

    # For security, respond the same on not-found or wrong password
    if not check_password_hash(user["password"], password):
        return _response(
            False,
            "Invalid credentials",
            error = {"code": "INVALID_CREDENTIALS"}
        )

    # Return the user
    user_safe = {k: user[k] for k in ("id", "username", "email")}
    return _response(
        True,
        "Logged in",
        data = user_safe
    )