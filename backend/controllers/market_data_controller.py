from flask import Blueprint, request, jsonify
from services.market_data_service import (
    add_full_history, update_since_latest, get_stock_history
)

market_data_bp = Blueprint("market_data_bp", __name__)

# POST -> Add full history for symbol
@market_data_bp.route("/api/market_data", methods=["POST"])
def add_prices():
    data = request.get_json()

    symbol = data["symbol"]
    timeframe = data["timeframe"]

    # Call the service class
    result = add_full_history(symbol, timeframe)

    status = 200 if result["success"] else (400 if result["error"].get("code")=="BAD_REQUEST" else 500)
    return jsonify(result), status

# PUT -> update from last stored date to today
@market_data_bp.route("/api/market_data/symbols/<symbol>/prices", methods=["PUT"])
def update_prices(symbol):
    timeframe = request.args.get("timeframe", "1d")
    result = update_since_latest(symbol, timeframe)
    status = 200 if result["success"] else (400 if result["error"].get("code")=="BAD_REQUEST" else 500)
    return jsonify(result), status

# GET -> read back a range for charting/strategies
@market_data_bp.route("/api/market_data", methods=["GET"])
def get_prices():

    symbol = request.args.get("symbol")
    timeframe = request.args.get("timeframe", "1d")
    start = request.args.get("start")
    end = request.args.get("end")

    # Try to get the data
    result = get_stock_history(symbol, timeframe, start, end)

    if result["success"]:
        return jsonify(result), 200
    if result["error"].get("code") == "BAD_REQUEST":
        return jsonify(result), 400

    return jsonify(result), 500