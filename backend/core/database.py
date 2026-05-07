import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

def init_firebase():
    if not firebase_admin._apps:
        cred_path = "serviceAccountKey.json"
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
        else:
            firebase_env = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
            if not firebase_env:
                raise ValueError("Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_KEY env var.")
            cred_json = json.loads(firebase_env)
            cred = credentials.Certificate(cred_json)
        
        firebase_admin.initialize_app(cred)
    return firestore.client()

db = init_firebase()
