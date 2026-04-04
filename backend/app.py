from flask import Flask, jsonify, request, make_response
from config import Config
from routes.routes import (
    auth_bp, goals_bp, career_bp, focus_bp,
    wellness_bp, lb_bp, notif_bp, ai_bp, roadmap_bp
)

app = Flask(__name__)
app.config["SECRET_KEY"] = Config.SECRET_KEY

def add_cors(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    response.headers["Access-Control-Expose-Headers"] = "Content-Disposition, Content-Type, Content-Length"
    return response

app.after_request(add_cors)

@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers["Access-Control-Allow-Origin"]  = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        return response

for bp in [auth_bp, goals_bp, career_bp, focus_bp,
           wellness_bp, lb_bp, notif_bp, ai_bp, roadmap_bp]:
    app.register_blueprint(bp)

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "version": "2.0", "app": "PathPilot"}), 200

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Route not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error", "detail": str(e)}), 500

if __name__ == "__main__":
    # In development, use 127.0.0.1; in production, set HOST env var
    host = Config.HOST if hasattr(Config, 'HOST') else "127.0.0.1"
    app.run(debug=Config.DEBUG, port=Config.PORT, host=host)