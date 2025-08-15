from typing import List, Dict, Any
import pandas as pd

class StrategyBase:
    k: str
    name: str
    category: str
    version: int
    param_defs: Dict[str, Any]

    def compute_signals(self, df: pd.DataFrame, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def backtest(self, df: pd.DataFrame, signals: List[Dict[str, Any]], invested: float) -> Dict[str, Any]:
        cash = invested
        shares = 0.0
        last = "sell"
        trades = 0
        wins = 0
        entry = None

        for s in signals:
            idx = s["index"]
            price = float(df.iloc[idx]["close"])
            if s["side"] == "buy" and last == "sell":
                shares = cash / price if price > 0 else 0
                cash = 0.0
                last = "buy"
                trades += 1
                entry = price
            elif s["side"] == "sell" and last == "buy":
                cash = shares * price
                shares = 0.0
                last = "sell"
                if entry is not None and price > entry:
                    wins += 1
                entry = None

        # liquidate at end if still long
        final_price = float(df.iloc[-1]["close"])
        final_equity = cash + shares * final_price
        ret_pct = (final_equity / invested - 1.0) if invested else 0.0

        return {
            "final_equity": round(final_equity, 2),
            "return_pct": round(ret_pct, 6),
            "trades": trades,
            "win_rate": round((wins / trades) if trades else 0.0, 6)
        }