from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from routes.routes import (
    auth_bp, goals_bp, career_bp, focus_bp,
    wellness_bp, lb_bp, notif_bp, ai_bp, roadmap_bp
)

app = Flask(__name__)
app.config["SECRET_KEY"] = Config.SECRET_KEY

CORS(app, resources={r"/api/*": {"origins": "*"}})

for bp in [auth_bp, goals_bp, career_bp, focus_bp,
           wellness_bp, lb_bp, notif_bp, ai_bp, roadmap_bp]:
    app.register_blueprint(bp)

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "version": "2.0", "app": "PathPilot"}), 200

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Route not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error", "detail": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=Config.DEBUG, port=Config.PORT)