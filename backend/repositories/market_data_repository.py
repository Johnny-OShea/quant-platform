from typing import Iterable, List, Dict, Any, Optional
from config import get_db_connection

def insert_prices(symbol: str, timeframe: str, rows: Iterable):
    conn = get_db_connection(); cur = conn.cursor()
    try:
        sql = """
        INSERT INTO prices (`symbol`,`timeframe`,`ts`,`open`,`high`,`low`,`close`,`volume`)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        ON DUPLICATE KEY UPDATE
          `open`=VALUES(`open`),
          `high`=VALUES(`high`),
          `low`=VALUES(`low`),
          `close`=VALUES(`close`),
          `volume`=VALUES(`volume`)
        """
        data = [(symbol, timeframe, r[0], r[1], r[2], r[3], r[4], r[5]) for r in rows]
        if data:
            cur.executemany(sql, data)
            conn.commit()
        return cur.rowcount
    finally:
        cur.close()
        conn.close()

def get_stock_data(symbol: str, timeframe: str, start: Optional[str]=None, end: Optional[str]=None) -> List[Dict[str,Any]]:

    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    try:
        # Build the query
        query = "SELECT `ts`,`open`,`high`,`low`,`close`,`volume` FROM prices WHERE symbol=%s AND timeframe=%s"
        args = [symbol, timeframe]

        # Add a range if necessary
        if start:
            query += " AND ts >= %s"; args.append(start)
        if end:
            query += " AND ts <= %s"; args.append(end)

        # Return in order
        query += " ORDER BY ts ASC"

        # Run the query
        cur.execute(query, tuple(args))
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()

def latest_ts(symbol: str, timeframe: str) -> Optional[str]:
    conn = get_db_connection(); cur = conn.cursor()
    try:
        cur.execute("SELECT MAX(`ts`) FROM prices WHERE symbol=%s AND timeframe=%s", (symbol, timeframe))
        row = cur.fetchone()
        return row[0].isoformat() if row and row[0] else None
    finally:
        cur.close(); conn.close()
