from flask_socketio import SocketIO

# Initialize the WebSocket engine and allow React to connect to it
socketio = SocketIO(cors_allowed_origins="*")