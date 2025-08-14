from typing import Optional, Dict, Any
import pandas as pd
from config import get_db_connection
import json

def fetch_prices_df(symbol: str, timeframe: str, start=None, end=None) -> pd.DataFrame:
    conn = get_db_connection(); cur = conn.cursor()
    try:
        q = "SELECT ts, o, h, l, c, v FROM prices WHERE symbol=%s AND timeframe=%s"
        args = [symbol, timeframe]
        if start: q += " AND ts >= %s"; args.append(start)
        if end:   q += " AND ts <= %s"; args.append(end)
        q += " ORDER BY ts ASC"
        cur.execute(q, tuple(args))
        rows = cur.fetchall()
        df = pd.DataFrame(rows, columns=["ts","open","high","low","close","volume"])
        return df
    finally:
        cur.close(); conn.close()

def get_signals_cache(strategy_key, symbol, timeframe, params_hash, start, end, data_version) -> Optional[Dict[str, Any]]:
    conn = get_db_connection(); cur = conn.cursor(dictionary=True)
    try:
        cur.execute("""
            SELECT signals_json FROM signals_cache
            WHERE strategy_key=%s AND symbol=%s AND timeframe=%s
              AND params_hash=%s AND start_date=%s AND end_date=%s
              AND data_version=%s
            ORDER BY id DESC LIMIT 1
        """, (strategy_key, symbol, timeframe, params_hash, start, end, data_version))
        row = cur.fetchone()
        if not row: return None
        return json.loads(row["signals_json"])
    finally:
        cur.close(); conn.close()

def set_signals_cache(strategy_key, symbol, timeframe, params_hash, start, end, data_version, data: Dict[str, Any]):
    conn = get_db_connection(); cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO signals_cache (strategy_key, symbol, timeframe, params_hash, start_date, end_date, data_version, signals_json)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """, (strategy_key, symbol, timeframe, params_hash, start, end, data_version, json.dumps(data)))
        conn.commit()
    finally:
        cur.close(); conn.close()

def get_best_params(strategy_key: str, symbol: str, timeframe: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection(); cur = conn.cursor(dictionary=True)
    try:
        cur.execute("""
            SELECT params_json, metric, metric_value, data_version, created_at
            FROM optimized_params
            WHERE strategy_key=%s AND symbol=%s AND timeframe=%s
            ORDER BY created_at DESC LIMIT 1
        """, (strategy_key, symbol, timeframe))
        row = cur.fetchone()
        return row
    finally:
        cur.close(); conn.close()
