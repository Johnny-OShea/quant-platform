from config import get_db_connection
from typing import Optional, Dict, Any
from mysql.connector import IntegrityError

def insert_user(username: str, email: str, hashed_password: str) -> int:
    """
    Insert a new user. Returns the new user's id.
    Raises DuplicateUserError on unique-constraint violation.
    """

    ## Get a DB connection (open TCP session with MySQL)
    conn = get_db_connection()
    ## Let's us actually send SQL to the DB
    cur = conn.cursor()

    ## Attempt to add the user
    try:
        cur.execute(
            "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
            (username, email, hashed_password)
        )

        ## If success, persist the change
        conn.commit()
        return cur.lastrowid
    except IntegrityError as e:
        ## Undo the partial work on fail
        conn.rollback()
        raise
    finally:
        ## Close connection
        cur.close()
        conn.close()

def find_user_by_username(username):
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, username, email, password FROM users WHERE username = %s", (username,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    return user
