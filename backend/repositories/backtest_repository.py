from typing import Optional, Dict, Any
from config import get_db_connection
import json

def get_back_test_cache(strategy_key, symbol, time_frequency, start, end, invested) -> Optional[Dict[str, Any]]:
    """
    Fetch a cached backtest by exact key. Uses NULL-safe equality (<=>) so that
    passing None for start/end matches NULLs in the table.
    """
    conn = get_db_connection(); cur = conn.cursor(dictionary=True)
    try:
        cur.execute("""
            SELECT metrics_json
            FROM backtests_cache
            WHERE strategy_key = %s
              AND symbol       = %s
              AND time_frequency = %s
              AND (start_date  <=> %s)
              AND (end_date    <=> %s)
              AND invested     = %s
        """, (strategy_key, symbol, time_frequency, start, end, invested))
        row = cur.fetchone()
        if not row:
            return None
        return {
            "metrics": json.loads(row["metrics_json"])
        }
    finally:
        cur.close()
        conn.close()


def set_back_test_cache(strategy_key, symbol, time_frequency, start, end, invested, metrics: Dict[str, Any]) -> None:
    """
    Upsert a cached backtest. Since the table does not have signals_json,
    we only store metrics_json.
    """
    conn = get_db_connection(); cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO backtests_cache
              (strategy_key, symbol, time_frequency, start_date, end_date, invested, metrics_json)
            VALUES
              (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
              metrics_json = VALUES(metrics_json)
        """, (strategy_key, symbol, time_frequency, start, end, invested, json.dumps(metrics)))
        conn.commit()
    finally:
        cur.close()
        conn.close()
