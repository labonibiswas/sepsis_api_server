from flask import Blueprint, request, jsonify
import tensorflow as tf
from tensorflow.keras.layers import Layer, Conv1D, Concatenate
import numpy as np
import datetime
import time
import sys
from extensions import socketio
from database import db

# ✨ 1. SAFE IMPORT ✨
try:
    from codecarbon import EmissionsTracker
    TRACKING_ENABLED = True
except ImportError:
    print("⚠️ CodeCarbon not found or failed to load. Running API without energy tracking.")
    TRACKING_ENABLED = False

ml_bp = Blueprint('ml', __name__)
vitals_log_collection = db["vitals_log"]
users_collection = db["users"]

class TiedBlockConv1D(Layer):
    def __init__(self, filters, kernel_size, blocks=2, padding='causal', dilation_rate=1, activation='relu', **kwargs):
        super(TiedBlockConv1D, self).__init__(**kwargs)
        self.filters = filters
        self.kernel_size = kernel_size
        self.blocks = blocks
        self.padding = padding
        self.dilation_rate = dilation_rate
        self.activation = activation

        self.shared_conv = Conv1D(
            filters=filters // blocks,
            kernel_size=kernel_size,
            padding=padding,
            dilation_rate=dilation_rate,
            activation=activation
        )

    def call(self, inputs):
        block_inputs = tf.split(inputs, num_or_size_splits=self.blocks, axis=2)
        block_outputs = [self.shared_conv(b) for b in block_inputs]
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

# ✨ 2. SAFE INIT TRACKING ✨
if TRACKING_ENABLED:
    tracker_init = EmissionsTracker(project_name="sepsis_model_init", logLevel="ERROR")
    tracker_init.start()

model = None
try:
    model = tf.keras.models.load_model(
        'sepsis_model.h5',
        custom_objects={'TiedBlockConv1D': TiedBlockConv1D}
    )
    print("✅ ML Model loaded successfully!")
except Exception as e:
    print(f"⚠️ Error loading ML model: {e}")

if TRACKING_ENABLED:
    init_emissions = tracker_init.stop()
    print(f"🔋 Energy used to load AI model: {init_emissions} kWh")

# ✨ 3. SAFE RUNTIME TRACKING ✨
if TRACKING_ENABLED:
    tracker_run = EmissionsTracker(project_name="sepsis_predict_loop", logLevel="ERROR")

@ml_bp.route('/predict', methods=['POST'])
def predict():
    start_time = time.time()
    if TRACKING_ENABLED:
        tracker_run.start() 
        
    try:
        data = request.json
        payload_size_bytes = sys.getsizeof(str(data)) 
        
        ai_data = data.get("scaled_data")
        raw_vitals = data.get("raw_vitals", {}) 
        
        if not ai_data or len(ai_data) != 40:
            return jsonify({"error": "Invalid data format. Expected 40 floats in scaled_data."}), 400

        email = raw_vitals.get("patient_email")
        age = 65.0
        gender_val = 1.0 
        
        if email:
            user = users_collection.find_one({"email": email})
            if user:
                age = float(user.get("age", 65.0))
                gender_str = user.get("gender", "Male")
                gender_val = 1.0 if gender_str == "Male" else 0.0

        scaled_age = (age - 62.05) / 16.04
        scaled_gender = (gender_val - 0.57) / 0.47

        for step in range(5):
            base_index = step * 8
            ai_data[base_index + 6] = scaled_age
            ai_data[base_index + 7] = scaled_gender

        input_array = np.array(ai_data).reshape(1, 5, 8)
        prediction = model.predict(input_array)
        risk_score = float(prediction[0][0])
        
        live_packet = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "vitals": raw_vitals, 
            "risk_score": risk_score
        }

        vitals_log_collection.insert_one(live_packet.copy())
        socketio.emit('new_vitals', live_packet)
        
        end_time = time.time() 
        processing_delay_ms = (end_time - start_time) * 1000
        throughput_bps = payload_size_bytes / (processing_delay_ms / 1000) if processing_delay_ms > 0 else 0
        
        print(f"📡 ESP32->Flask | Payload: {payload_size_bytes}B | Processing Delay: {processing_delay_ms:.2f} ms | Throughput: {throughput_bps:.2f} B/s")

        if TRACKING_ENABLED:
            run_emissions = tracker_run.stop()
            print(f"⚡ Energy for 1 prediction: {run_emissions} kWh")
            
        return jsonify({"risk": risk_score})
        
    except Exception as e:
        if TRACKING_ENABLED:
            tracker_run.stop()
        return jsonify({"error": str(e)}), 500