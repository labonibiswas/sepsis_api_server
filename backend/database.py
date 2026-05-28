from pymongo import MongoClient
import certifi

# TODO: Replace with your actual MongoDB connection string from Atlas
MONGO_URI = "mongodb+srv://biswasl927_db_user:EdFEesE1w6zmulAY@cluster0.y80pz0g.mongodb.net/?appName=Cluster0"

try:
    # certifi ensures the secure connection isn't blocked by SSL errors
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client["sepsis_database"]
    
    # We will store all users in this collection
    users_collection = db["users"]
    
    print("✅ Successfully connected to MongoDB!")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")