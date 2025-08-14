from abc import ABC, abstractmethod
from typing import Dict, Any, List
import pandas as pd

class StrategyBase(ABC):
    key: str
    name: str
    category: str  # 'technical' | 'fundamental' | 'machine learning'
    version: int = 1

    # Parameter schema
    # {fast:{default:12,min:2,max:200}, ...}
    param_defs: Dict[str, Dict[str, Any]]

    # Default parameter space for optimization (grid/bayes)
    param_space: Dict[str, Any]

    @abstractmethod
    def compute_signals(self, df: pd.DataFrame, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Return list of {'index': int, 'side': 'buy'|'sell'} based on df (must contain 'close')."""

    def backtest(self, df: pd.DataFrame, signals: List[Dict[str, Any]], initial_cash: float = 10_000) -> Dict[str, Any]:
        """Naive long-only; replace with your engine if you prefer."""
        cash, shares, last, trades, wins, entry = initial_cash, 0.0, "sell", 0, 0, None
        closes = df["close"].tolist()
        for s in signals:
            px = closes[s["index"]]
            if s["side"] == "buy" and last == "sell":
                shares = cash / px; cash = 0; last = "buy"; trades += 1; entry = px
            elif s["side"] == "sell" and last == "buy":
                cash = shares * px; shares = 0; last = "sell"; wins += 1 if (entry is not None and px > entry) else 0; entry = None
        final_eq = cash + shares * closes[-1]
        return {"final_equity": round(final_eq, 2), "trades": trades, "wins": wins}
