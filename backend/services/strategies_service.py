from typing import Dict, Any
import hashlib, json
import pandas as pd
from strategies import STRATEGY_REGISTRY
from repositories.strategies_repository import (
    fetch_prices_df,
    get_signals_cache, set_signals_cache,
    get_best_params
)

def _resp(ok: bool, msg: str, data=None, error=None):
    return {"success": ok, "message": msg, "data": data or {}, "error": error or {}}

def list_all_strategies():
    # Create a list to hold all strategies
    strategies = []

    # Add each strategy from our registry to this list
    for strategy in STRATEGY_REGISTRY.values():
        print(strategy)
        strategies.append({
            "key": strategy.k, "name": strategy.name, "category": strategy.category, "version": strategy.version,
            "param_defs": strategy.param_defs
        })

    # Return them all
    return {
        "success": True,
        "message": "All Strategies Retrieved",
        "data": strategies,
    }

def get_strategy_information(key: str):
    # Just use the registry to get the strategy
    strategy = STRATEGY_REGISTRY.get(key)

    # If it was not found return an error
    if not strategy:
        return {
            "success": False,
            "message": "This strategy does not exist",
            "error": {"code": "NOT_FOUND"}
        }

    # If it was found create the data object
    data = {
        "key": strategy.k,
        "name": strategy.name,
        "category": strategy.category,
        "version": strategy.version,
        "param_defs": strategy.param_defs
    }

    return {
        "success": True,
        "message": "Strategy was successfully returned",
        "data": data
    }

def _params_hash(d: Dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(d, sort_keys=True).encode()).hexdigest()

def compute_signals_service(key: str, payload: Dict[str, Any]):
    s = STRATEGY_REGISTRY.get(key)
    if not s: return _resp(False, "Unknown strategy", error={"code":"NOT_FOUND"})

    symbol = payload.get("symbol", "SPY")
    timeframe = payload.get("timeframe", "1d")
    start, end = payload.get("start"), payload.get("end")
    params = payload.get("params") or {k:v["default"] for k,v in s.param_defs.items()}

    df = fetch_prices_df(symbol, timeframe, start, end)  # pandas DataFrame
    if df is None or df.empty: return _resp(False, "No data", error={"code":"NO_DATA"})

    data_version = str(df["ts"].max().date())
    p_hash = _params_hash({"params": params, "start": str(start), "end": str(end)})
    cached = get_signals_cache(s.key, symbol, timeframe, p_hash, start, end, data_version)
    if cached: return _resp(True, "OK (cached)", data=cached)

    sigs = s.compute_signals(df.rename(columns=str.lower), params)  # expects 'close'
    out = {"signals": sigs, "data_version": data_version}
    set_signals_cache(s.key, symbol, timeframe, p_hash, start, end, data_version, out)
    return _resp(True, "OK", data=out)

def run_backtest_service(key: str, payload: Dict[str, Any]):
    s = STRATEGY_REGISTRY.get(key)
    if not s: return _resp(False, "Unknown strategy", error={"code":"NOT_FOUND"})

    symbol = payload.get("symbol", "SPY")
    timeframe = payload.get("timeframe", "1d")
    start, end = payload.get("start"), payload.get("end")
    invested = float(payload.get("invested", 10_000))
    params = payload.get("params") or {k:v["default"] for k,v in s.param_defs.items()}

    df = fetch_prices_df(symbol, timeframe, start, end)
    if df is None or df.empty: return _resp(False, "No data", error={"code":"NO_DATA"})

    sigs = s.compute_signals(df.rename(columns=str.lower), params)
    metrics = s.backtest(df.rename(columns=str.lower), sigs, invested)
    # (optionally) store in backtests table here
    return _resp(True, "OK", data={**metrics, "signals": sigs})