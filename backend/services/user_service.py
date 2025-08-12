from werkzeug.security import generate_password_hash
from repositories.user_repository import insert_user, find_user_by_username

def create_user(username, email, password):
    if not username or not email or not password:
        raise ValueError("Missing required fields")
    hashed_pw = generate_password_hash(password)
    insert_user(username, email, hashed_pw)
    return {"message": "User created successfully"}

def get_user_info(username):
    user = find_user_by_username(username)
    if user:
        # Do not expose the hashed password in the response
        user.pop("password", None)
        return user
    else:
        return None