from typing import Optional, Dict, Any
from werkzeug.security import generate_password_hash, check_password_hash
from mysql.connector import errorcode, IntegrityError
from repositories.user_repository import insert_user, find_user_by_email, update_user_fields, replace_liked_strategies

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

def update_user_profile(email, payload):
    """
    Updates the user's profile to include things like income
    preferred currency, location, and liked strategies
    """

    # Make sure we got an email
    if not email or not payload:
        return _response(
            False,
            "Missing email",
            error = {"code": "BAD_REQUEST"}
        )

    # try to get the user
    user = None
    user = find_user_by_email(email)

    # Check that we found a user
    if not user:
        return _response(
            False,
            "User not found",
            error = {"code": "NOT_FOUND"}
        )

    # Validate the payload
    p = dict(payload or {})
    err = _validate_profile_payload(p)

    # If the payload is invalid return why
    if err:
        return _response(
            False,
            err,
            error={"code": "BAD_REQUEST"}
        )

    # Update the values, income, location, preferred_currency
    scalars = {k: p[k] for k in ("income","location","preferred_currency") if k in p}
    if scalars:
        print(scalars)
        update_user_fields(user["id"], scalars)

    # Replace strategies if provided
    strategies = None
    if "liked_strategies" in p:
        strategies = replace_liked_strategies(user["id"], p["liked_strategies"])

    # Create the data to return
    data = {
        "id": user["id"],
        "username": user["username"],
        "updated": list(scalars.keys())
    }
    if strategies is not None:
        data["liked_strategies_count"] = strategies
        data["updated"] = "strategies"

    return _response(
        True,
        "Profile Updated",
        data = data,
    )

def _validate_profile_payload(p: Dict[str, Any]) -> Optional[str]:
    # Basic field checks; keep it simple for now
    if "income" in p:
        try:
            inc = float(p["income"])
            if inc < 0:
                return "income must be >= 0"
        except (TypeError, ValueError):
            return "income must be numeric"
    if "preferred_currency" in p:
        cur = str(p["preferred_currency"]).strip().upper()
        if len(cur) != 3 or not cur.isalpha():
            return "preferred_currency must be a 3-letter code"
        p["preferred_currency"] = cur
    if "location" in p:
        if p["location"] is not None and len(str(p["location"])) > 100:
            return "location too long"
    if "liked_strategies" in p:
        if not isinstance(p["liked_strategies"], list):
            return "liked_strategies must be a list"

    return None