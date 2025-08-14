from flask import Flask
from flask_cors import CORS
from controllers.user_controller import user_bp
from controllers.market_data_controller import market_data_bp
from controllers.strategies_controller import strategies_bp

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(user_bp)
app.register_blueprint(market_data_bp)
app.register_blueprint(strategies_bp)

if __name__ == "__main__":
    app.run(debug=True)
