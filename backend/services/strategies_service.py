from typing import Dict, Any
import pandas as pd
from strategies import STRATEGY_REGISTRY
from repositories.strategies_repository import (
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