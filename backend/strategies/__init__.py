from .sma_crossover import SMACrossover

STRATEGY_REGISTRY = {
    "sma_crossover": SMACrossover(),
    # add more: "macd": MACD(), "earnings_momentum": EarningsMomentum(), ...
}
