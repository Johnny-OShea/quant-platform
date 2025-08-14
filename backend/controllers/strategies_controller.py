from flask import Blueprint, request, jsonify
from services.strategies_service import (
    list_all_strategies, get_strategy_information,
    compute_signals_service, run_backtest_service
)

strategies_bp = Blueprint("strategies_bp", __name__)

@strategies_bp.route("/api/strategies", methods=["GET"])
def get_all_strategies():
    # This function can only ever succeed
    return jsonify(list_all_strategies()), 200

@strategies_bp.route("/api/strategies/<key>", methods=["GET"])
def get_strategy_by_key(key):
    info = get_strategy_information(key)
    if info.get("error"): return jsonify(info), 404
    return jsonify(info), 200

@strategies_bp.route("/api/strategies/<key>/signals", methods=["POST"])
def signals(key):
    payload = request.get_json(silent=True) or {}
    data = compute_signals_service(key, payload)
    code = 200 if data.get("success") else 400
    return jsonify(data), code

@strategies_bp.route("/api/strategies/<key>/backtest", methods=["POST"])
def backtest(key):
    payload = request.get_json(silent=True) or {}
    data = run_backtest_service(key, payload)
    code = 200 if data.get("success") else 400
    return jsonify(data), code
