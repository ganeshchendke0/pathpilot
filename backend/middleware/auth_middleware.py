import jwt
from functools import wraps
from flask import request, jsonify
from config import Config

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        header = request.headers.get("Authorization", "")
        if header.startswith("Bearer "):
            token = header.split(" ")[1]
        if not token:
            return jsonify({"error": "Access denied: No token provided. Please sign in."}), 401
        try:
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            request.user_id   = payload["user_id"]
            request.user_role = payload.get("role", "student")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Your session has expired. Please sign in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid or corrupted token. Please sign in again."}), 401
        return f(*args, **kwargs)
    return decorated