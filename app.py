from flask import Flask, request, jsonify
import numpy as np
import tensorflow as tf
from tensorflow.keras.layers import Layer, Conv1D, Concatenate

app = Flask(__name__)

# 1. Define your Custom Layer exactly as it is in Colab
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
            "filters": self.filters, "kernel_size": self.kernel_size,
            "blocks": self.blocks, "padding": self.padding,
            "dilation_rate": self.dilation_rate, "activation": self.activation
        })
        return config

# 2. Load the Model and define scaling constants
model = tf.keras.models.load_model(
    'sepsis_model.h5', 
    custom_objects={'TiedBlockConv1D': TiedBlockConv1D}
)

# Means and Stds from your Colab script
MEANS = np.array([86.51486770913331, 97.52455546927243, 36.896013348042246, 122.5158932427556, 63.50451336128933, 18.568937543291415, 62.0513904475568, 0.5761399947198431])
STDS = np.array([17.747861937737415, 2.8151486750736194, 0.8123167781969647, 23.06672409066397, 12.90534681761707, 5.258561191976751, 16.04828766682398, 0.47167752293652937])
THRESHOLD = 0.6198692917823792  # Your optimized threshold

@app.route('/')
def home():
    return "✅ Sepsis AI Cloud Server is Awake and Running!"

# 3. Create the Prediction Endpoint
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        # Expecting a 2D array: 5 hours (timesteps) x 8 vitals (features)
        raw_buffer = np.array(data['vitals_buffer']) 
        
        # Scale the data using the Colab scaler values
        scaled_buffer = (raw_buffer - MEANS) / STDS
        
        # Reshape for the model: (Batch Size, Timesteps, Features) -> (1, 5, 8)
        model_input = scaled_buffer.reshape(1, 5, 8)
        
        # Predict
        prediction = model.predict(model_input)[0][0]
        
        # Response
        return jsonify({
            'risk_score': float(prediction),
            'sepsis_detected': bool(prediction >= THRESHOLD)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)