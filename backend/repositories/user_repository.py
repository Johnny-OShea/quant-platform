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

def find_user_by_email(email: str):
    """
    Using a specified email, we will retrieve the user from the database
    this will return all the information about the specified user
    """

    # Set up the connection
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    # Try to get the user by email
    try:
        cur.execute(
            "SELECT id, username, email, password FROM users WHERE email = %s",
            (email,)
        )
        # Return if found
        return cur.fetchone()
    # Close the connection
    finally:
        cur.close()
        conn.close()
