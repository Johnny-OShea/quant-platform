from typing import Dict, Any, List
import pandas as pd
from .base import StrategyBase

def sma(series, window: int):
    return series.rolling(window, min_periods=window).mean()

class SMACrossover(StrategyBase):

    # Internal information about every strategy
    k = "sma_crossover"
    name = "SMA Crossover"
    category = "technical"
    version = 1

    # SMACrossover depends on a fast MA, slow MA, and signal
    param_defs = {
        "fast":   {"label":"Fast MA",   "default":12,  "min":2, "max":100, "step":1},
        "slow":   {"label":"Slow MA",   "default":26,  "min":5, "max":200, "step":1},
        "signal": {"label":"Signal Len","default":9,   "min":2, "max":50,  "step":1}
    }

    # Describe the minimum and maximum MA's
    param_space = { "fast": ("int",[15,55]), "slow": ("int",[80,200]) }

    # Every strategy has this method, we just have to define it
    def compute_signals(self, df: pd.DataFrame, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        # Get the fast and slow MA's
        fast = int(params.get("fast", self.param_defs["fast"]["default"]))
        slow = int(params.get("slow", self.param_defs["slow"]["default"]))

        f = sma(df["close"], max(1, fast))
        s = sma(df["close"], max(1, slow))

        sigs: List[Dict[str,Any]] = []

        prev = None

        for i in range(len(df)):
            if pd.isna(f.iloc[i]) or pd.isna(s.iloc[i]):
                continue
            diff = f.iloc[i] - s.iloc[i]
            if prev is not None:
                if prev <= 0 and diff > 0: sigs.append({"index": i, "side":"buy"})
                if prev >= 0 and diff < 0: sigs.append({"index": i, "side":"sell"})
            prev = diff

        # normalize start with buy and alternate
        cleaned = []
        for sgl in sigs:
            if not cleaned and sgl["side"] == "sell": continue
            if cleaned and cleaned[-1]["side"] == sgl["side"]: continue
            cleaned.append(sgl)

        print(cleaned)
        return cleaned
