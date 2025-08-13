from config import get_db_connection
from typing import Optional, Dict, Any, List
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

def update_user_fields(user_id: int, fields: Dict[str, Any]) -> None:
    """Partial update for users table. Allowed keys only."""

    print(fields)
    if not fields:
        return

    # List of valid update fields
    allowed = {"income", "location", "preferred_currency"}
    sets, params = [], []
    for k, v in fields.items():
        if k in allowed:
            sets.append(f"{k} = %s")
            params.append(v)
    if not sets:
        return
    params.append(user_id)

    print("STARTING CONNECTION")

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        print("IN TRY")
        cur.execute(f"UPDATE users SET {', '.join(sets)} WHERE id = %s", tuple(params))
        print("FINISH CONNECTION")
        conn.commit()
    finally:
        cur.close()
        conn.close()

def replace_liked_strategies(user_id: int, strategies: List[str]) -> int:
    """Replace the full set of liked strategies for a user (idempotent)."""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("DELETE FROM user_liked_strategies WHERE user_id = %s", (user_id,))
        inserted = 0
        if strategies:
            cur.executemany(
                "INSERT INTO user_liked_strategies (user_id, strategy_key) VALUES (%s, %s)",
                [(user_id, s) for s in strategies]
            )
            inserted = cur.rowcount
        conn.commit()
        return inserted
    finally:
        cur.close()
        conn.close()