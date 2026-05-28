import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import datetime


from extensions import socketio
# Import the Blueprints from your routes folder
from routes.auth_routes import auth_bp
from routes.ml_routes import ml_bp

app = Flask(__name__)

# --- THIS IS THE BULLETPROOF CORS LINE ---
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Configuration
app.config["JWT_SECRET_KEY"] = "super-secret-sepsis-key-change-this-later" 
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(days=1)
jwt = JWTManager(app)

socketio.init_app(app)

# Register the Blueprints (This connects the routes to the app)
app.register_blueprint(auth_bp)
app.register_blueprint(ml_bp)

if __name__ == '__main__':
    # Render assigns a dynamic port. If running locally, it defaults to 5000.
    port = int(os.environ.get("PORT", 5000))
    
    # host="0.0.0.0" opens it to the internet
    # allow_unsafe_werkzeug=True bypasses the production server warning
    socketio.run(app, host="0.0.0.0", port=port, debug=False, allow_unsafe_werkzeug=True)