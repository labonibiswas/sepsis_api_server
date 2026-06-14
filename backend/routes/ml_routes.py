from flask import Blueprint, request, jsonify
from codecarbon import EmissionsTracker
import tensorflow as tf
from tensorflow.keras.layers import Layer, Conv1D, Concatenate
import numpy as np
import time
import sys
from extensions import socketio
from database import db

tracker_init = EmissionsTracker(project_name="sepsis_model_init")
tracker_init.start()

try:
    model = tf.keras.models.load_model('sepsis_model.h5', custom_objects={'TiedBlockConv1D': TiedBlockConv1D})
    print("✅ ML Model loaded successfully!")
except Exception as e:
    print(f"⚠️ Error loading ML model: {e}")

init_emissions = tracker_init.stop()
print(f"🔋 Energy used to load AI model: {init_emissions} kWh")

# 2. TRACK RUNTIME ENERGY
tracker_run = EmissionsTracker(project_name="sepsis_predict_loop")

ml_bp = Blueprint('ml', __name__)

vitals_log_collection = db["vitals_log"]

# --- ORIGINAL TBC LAYER (This fixes the mismatch!) ---
class TiedBlockConv1D(Layer):
    def __init__(self, filters, kernel_size, blocks=2, padding='causal', dilation_rate=1, activation='relu', **kwargs):
        super(TiedBlockConv1D, self).__init__(**kwargs)
        self.filters = filters
        self.kernel_size = kernel_size
        self.blocks = blocks
        self.padding = padding
        self.dilation_rate = dilation_rate
        self.activation = activation

        # The "Shared" Filter (This is the magic that saves memory)
        self.shared_conv = Conv1D(
            filters=filters // blocks,
            kernel_size=kernel_size,
            padding=padding,
            dilation_rate=dilation_rate,
            activation=activation
        )

    def call(self, inputs):
        # 1. Split features into blocks
        block_inputs = tf.split(inputs, num_or_size_splits=self.blocks, axis=2)
        # 2. Apply the SAME filter to every block
        block_outputs = [self.shared_conv(b) for b in block_inputs]
        # 3. Recombine
        return Concatenate(axis=2)(block_outputs)

    def get_config(self):
        config = super(TiedBlockConv1D, self).get_config()
        config.update({
            "filters": self.filters,
            "kernel_size": self.kernel_size,
            "blocks": self.blocks,
            "padding": self.padding,
            "dilation_rate": self.dilation_rate,
            "activation": self.activation
        })
        return config
# -----------------------------------------------------

# Load the Model
try:
    model = tf.keras.models.load_model(
        'sepsis_model.h5',
        custom_objects={'TiedBlockConv1D': TiedBlockConv1D}
    )
    print("✅ ML Model loaded successfully!")
except Exception as e:
    print(f"⚠️ Error loading ML model: {e}")


@ml_bp.route('/')
def home():
    return "✅ Sepsis AI Cloud Server is Awake and Running!"

@ml_bp.route('/predict', methods=['POST'])
def predict():
    tracker_run.start()
    start_time = time.time()
    try:
        data = request.json

        payload_size_bytes = sys.getsizeof(str(data))

        
        # 1. Grab the scaled data for the AI (40 floats)
        ai_data = data.get("scaled_data")
        # 2. Grab the raw data for the Dashboard
        raw_vitals = data.get("raw_vitals") 
        
        if not ai_data or len(ai_data) != 40:
            return jsonify({"error": "Invalid data format. Expected 40 floats in scaled_data."}), 400

        # Process AI Prediction
        input_array = np.array(ai_data).reshape(1, 5, 8)
        prediction = model.predict(input_array)
        risk_score = float(prediction[0][0])
        
        # Package the combined data for MongoDB and React
        live_packet = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "vitals": raw_vitals, # The raw HR, RR, BP, etc.
            "risk_score": risk_score
        }

        # Save to DB and Broadcast to React
        vitals_log_collection.insert_one(live_packet.copy())
        socketio.emit('new_vitals', live_packet)

        end_time = time.trim()
        processing_delay = (end_time - start_time) * 1000

        throughput_bps = payload_size_bytes / (processing_delay_ms / 1000) if processing_delay_ms > 0 else 0
        print(f"📡 ESP32->Flask | Payload: {payload_size_bytes}B | Processing Delay: {processing_delay_ms:.2f} ms | Throughput: {throughput_bps:.2f} B/s")
        
        return jsonify({"risk": risk_score})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@socketio.on('latency_ping')
def handle_ping():
    # An empty return automatically triggers the callback function in React
    return