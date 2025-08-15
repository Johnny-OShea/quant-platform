from typing import Dict, Any
import hashlib, json
import pandas as pd
from strategies import STRATEGY_REGISTRY
from repositories.market_data_repository import get_stock_data
from repositories.backtest_repository import get_back_test_cache, set_back_test_cache

def _resp(ok: bool, msg: str, data=None, error=None):
    return {"success": ok, "message": msg, "data": data or {}, "error": error or {}}

def run_back_test_service(key: str, payload: Dict[str, Any]):
    s = STRATEGY_REGISTRY.get(key)
    if not s:
        return _resp(False, "Unknown strategy", error={"code": "NOT_FOUND"})

    symbol = payload.get("symbol", "SPY")
    time_frequency = payload.get("time_frequency", "1d")
    start = payload.get("start")
    end = payload.get("end")
    invested = float(payload.get("invested", 10_000))
    params = payload.get("params") or {k: v["default"] for k, v in s.param_defs.items()}

    rows = get_stock_data(symbol, time_frequency, start, end)
    if not rows:
        return _resp(False, "No data", error={"code": "NO_DATA"})

    df = pd.DataFrame(rows)
    if df.empty or "ts" not in df.columns:
        return _resp(False, "No data", error={"code": "NO_DATA"})

    if not pd.api.types.is_datetime64_any_dtype(df["ts"]):
        df["ts"] = pd.to_datetime(df["ts"])
    df = df.sort_values("ts").reset_index(drop=True)

    # try cache
    cached = get_back_test_cache(s.k, symbol, time_frequency, start, end, invested)
    if cached:
        msg = "OK (cached)"
        data = {cached["metrics"]}
        return _resp(True, msg, data)

    # compute
    df2 = df.rename(columns=str.lower)  # expects 'close'
    sigs = s.compute_signals(df2, params)
    metrics = s.backtest(df2, sigs, invested)

    set_back_test_cache(
        s.k, symbol, time_frequency, start, end, invested,
        metrics=metrics
    )

    # respond (respect include_signals)
    out = {**metrics}
    return _resp(True, "OK", out)
