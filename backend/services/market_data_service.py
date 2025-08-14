from typing import Dict, Any
from datetime import date, timedelta
import yfinance as yf
import pandas as pd

from repositories.market_data_repository import (
    insert_prices, get_stock_data, latest_ts
)

# An enum of the allowed timeframes for now
ALLOWED_TIMEFRAMES = {"1d"}

# The Response object
def _resp(ok: bool, msg: str, data=None, error=None):
    return {
        "success": ok,
        "message": msg,
        "data": data or {},
        "error": error or {}
    }

def _validate_timeframe(tf: str) -> bool:
    return tf in ALLOWED_TIMEFRAMES

# A function to add a specific stock's history to the database
def add_full_history(symbol: str, timeframe: str = "1d") -> Dict[str, Any]:

    # We need to check that we have a valid timeframe to start
    if not _validate_timeframe(timeframe):
        return _resp(
            False,
            f"Unsupported timeframe '{timeframe}'",
            error={"code":"BAD_REQUEST"}
        )

    # TODO create a validate_symbol function
    # _validate_symbol(symbol)

    try:
        # Get the full daily history from yahooFinance
        df = yf.Ticker(symbol).history(period="max", interval="1d", auto_adjust=False)

        # Make sure some data was found
        if df is None or df.empty:
            return _resp(
                False,
                "No data returned",
                error={"code":"NO_DATA"}
            )

        # Normalize everything
        df = df.reset_index().rename(columns={"Date":"ts"})
        df.columns = [c.lower() for c in df.columns]
        df = df[["ts","open","high","low","close","volume"]].dropna()
        df["ts"] = pd.to_datetime(df["ts"]).dt.date
        rows = [(r.ts, float(r.open), float(r.high), float(r.low), float(r.close), float(r.volume))
                for r in df.itertuples(index=False)]

        print(rows)

        # Put the rows (data) into the database
        affected = insert_prices(symbol, timeframe, rows)
        return _resp(
            True,
            "Stock data added",
            data={"symbol": symbol, "timeframe": timeframe, "rows": len(rows), "affected": affected}
        )

    except Exception as e:
        return _resp(
                    False,
                    f"Fetch failed: {e}",
                    error={"code":"FETCH_ERROR"}
        )

def update_since_latest(symbol: str, timeframe: str="1d") -> Dict[str, Any]:
    if not _validate_timeframe(timeframe):
        return _resp(False, f"Unsupported timeframe '{timeframe}'", error={"code":"BAD_REQUEST"})
    sym = symbol.upper().strip()

    last = latest_ts(sym, timeframe)
    if not last:
        # nothing stored yet → ingest full
        return ingest_full_history(sym, timeframe)

    start_dt = date.fromisoformat(last) + timedelta(days=1)
    try:
        df = yf.download(sym, start=start_dt.isoformat(), interval="1d", auto_adjust=False, progress=False)
        if df is None or df.empty:
            return _resp(True, "Up-to-date", data={"symbol": sym, "timeframe": timeframe, "rows": 0, "affected": 0})

        df = df.reset_index().rename(columns={"Date":"ts","Open":"o","High":"h","Low":"l","Close":"c","Volume":"v"})
        df = df[["ts","o","h","l","c","v"]].dropna()
        df["ts"] = pd.to_datetime(df["ts"]).dt.date
        rows = [(r.ts, float(r.o), float(r.h), float(r.l), float(r.c), float(r.v)) for r in df.itertuples(index=False)]
        affected = upsert_daily_prices(sym, timeframe, rows)
        return _resp(True, "Updated", data={"symbol": sym, "timeframe": timeframe, "rows": len(rows), "affected": affected})
    except Exception as e:
        return _resp(False, f"Update failed: {e}", error={"code":"FETCH_ERROR"})

def get_stock_history(symbol: str, timeframe: str = "1d", start: str = None, end: str = None) -> Dict[str, Any]:

    # Make sure the time frame is set to be a valid type
    if not _validate_timeframe(timeframe):
        return _resp(
            False,
            f"Unsupported timeframe '{timeframe}'",
            error={"code":"BAD_REQUEST"}
        )

    # Ensure a symbol was passed
    if not symbol:
        return _resp(
            False,
            "Please enter a valid symbol",
            error = {"code": "BAD_REQUEST"}
        )

    rows = get_stock_data(symbol, timeframe, start, end)
    print(rows)

    # Return the data
    return _resp(
        True,
        "Stock data successfully retrieved",
        data = {
            "symbol": symbol, "timeframe": timeframe, "count": len(rows), "prices": rows
        }
    )
