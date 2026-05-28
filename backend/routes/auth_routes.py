from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from database import users_collection
import datetime

auth_bp = Blueprint('auth', __name__)

# --- REQUIREMENT 1: REGISTER ---
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    age = data.get("age")
    gender = data.get("gender")

    if not email or not password:
        return jsonify({"message": "Email and password are required!"}), 400

    # Check if email is already in MongoDB
    if users_collection.find_one({"email": email}):
        return jsonify({"message": "User already exists!"}), 409

    # Hash the password for security
    hashed_password = generate_password_hash(password)
    
    new_user = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "age": age,
        "gender": gender,
        "created_at": datetime.datetime.utcnow()
    }
    
    users_collection.insert_one(new_user)
    return jsonify({"message": "Account created successfully!"}), 201


# --- REQUIREMENT 1: LOGIN ---
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = users_collection.find_one({"email": email})

    # If user exists and password matches the hash
    if user and check_password_hash(user["password"], password):
        # Generate a 24-hour token holding their email
        access_token = create_access_token(identity=email)
        return jsonify({
            "message": "Login successful!", 
            "token": access_token,
            "name": user.get("name", "User") 
        }), 200
    else:
        return jsonify({"message": "Invalid email or password"}), 401


# --- REQUIREMENT 2: CURRENT USER PROFILE ---
@auth_bp.route('/profile', methods=['GET'])
@jwt_required() # <--- This blocks anyone without a valid token!
def get_profile():
    # get_jwt_identity() reads the token and tells us exactly who is asking
    current_user_email = get_jwt_identity()
    
    # Fetch ONLY this user's data from MongoDB (and hide the password field)
    user = users_collection.find_one({"email": current_user_email}, {"_id": 0, "password": 0})
    
    if user:
        return jsonify(user), 200
    else:
        return jsonify({"message": "User not found"}), 404

# --- REQUIREMENT: EDIT PROFILE (UPDATED WITH PASSWORD) ---
@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_email = get_jwt_identity()
    data = request.json
    
    update_fields = {}

    if "name" in data:
        update_fields["name"] = data["name"]
    if "age" in data:
        update_fields["age"] = data["age"]
    if "gender" in data:
        update_fields["gender"] = data["gender"]
        
    # ✨ NEW: Check if the user sent a new password
    if "new_password" in data and data["new_password"].strip() != "":
        # We MUST hash the new password, never store it as plain text!
        update_fields["password"] = generate_password_hash(data["new_password"])
        
    if update_fields:
        users_collection.update_one(
            {"email": current_user_email},
            {"$set": update_fields}
        )
        return jsonify({"message": "Profile updated successfully!"}), 200
        
    return jsonify({"message": "No changes provided."}), 400