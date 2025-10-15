from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from dotenv import load_dotenv
from flask_cors import CORS
import os
import random
import hashlib
from sender import send_code_email
from flights import get_flight_results
import firebase_admin
from firebase_admin import credentials, db
from functools import wraps

load_dotenv()
app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.getenv("SECRET_KEY", "dev_secret_key")  # Use a default for development
CORS(app)

cred = credentials.Certificate("zirabafrica-6c117-firebase-adminsdk-fbsvc-739bc1e985.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://zirabafrica-6c117-default-rtdb.europe-west1.firebasedatabase.app/'
})

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.path.startswith("/api/") or request.path.startswith("/auth") or request.path.startswith("/static/"):
            return f(*args, **kwargs)
        if not session.get("user"):
            return redirect(url_for("auth_page"))
        return f(*args, **kwargs)
    return decorated_function

@app.before_request
def require_login():
    if request.path.startswith("/api/") or request.path.startswith("/auth") or request.path.startswith("/static/"):
        return
    if not session.get("user"):
        return redirect(url_for("auth_page"))


@app.route("/")
@login_required
def home():
    return render_template("index.html")

# Serve the template airtime.html page
@app.route("/airtime.html")
@login_required
def airtime_page():
    return render_template("airtime.html")

@app.route("/search")
@login_required
def search_flights():
    origin = request.args.get("from")
    destination = request.args.get("to")
    date = request.args.get("date")
    return_date = request.args.get("returnDate")
    adults = request.args.get("adults", "1")
    travel_class = request.args.get("class", "ECONOMY")
    currency = request.args.get("currency", "USD").upper()
    amadeus_results = get_flight_results(origin, destination, date, return_date, adults, travel_class, currency)
    if not amadeus_results:
        return jsonify({"error": "No flights found or API error"}), 400
    return jsonify(amadeus_results)





@app.route("/auth")
def auth_page():
    if session.get("user"):
        return redirect(url_for("home"))
    return render_template("auth.html")

@app.route("/api/auth/signup", methods=["POST"])
def api_signup():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    fullname = data.get("fullname")
    phone = data.get("phone")
    email_code = data.get("email_code")
    if not email_code or email_code != session.get("email_code") or email != session.get("email_code_email"):
        return jsonify({"ok": False, "error": "Invalid or missing verification code"}), 400
    ref = db.reference("users")
    all_users = ref.get() or {}
    for uid, user in all_users.items():
        if user.get("email") == email:
            return jsonify({"ok": False, "error": "Email already exists"}), 409
    uid = str(random.randint(10_000_000, 99_999_999))
    hashed = hashlib.sha256(password.encode('utf-8')).hexdigest()
    ref.child(uid).set({
        "uid": uid,
        "email": email,
        "password": hashed,
        "fullname": fullname,
        "phone": phone
    })
    session["user"] = {"uid": uid, "email": email}
    session.pop("email_code", None)
    session.pop("email_code_email", None)
    return jsonify({"ok": True, "message": "Signup successful", "uid": uid}), 200

@app.route("/api/auth/signin", methods=["POST"])
def api_signin():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"ok": False, "error": "Email and password required"}), 400
    ref = db.reference("users")
    all_users = ref.get() or {}
    user = None
    for uid, u in all_users.items():
        if u.get("email") == email:
            user = u
            break
    if not user:
        return jsonify({"ok": False, "error": "User not found"}), 404
    hashed = hashlib.sha256(password.encode('utf-8')).hexdigest()
    if user["password"] != hashed:
        return jsonify({"ok": False, "error": "Incorrect password"}), 401
    session["user"] = {"uid": user["uid"], "email": user["email"]}
    return jsonify({"ok": True, "message": "Signin successful", "uid": user["uid"]}), 200

@app.route("/api/auth/send_code", methods=["POST"])
def api_send_code():
    data = request.get_json() or {}
    email = data.get("email")
    if not email:
        return jsonify({"ok": False, "error": "Email required"}), 400
    code = str(random.randint(100000, 999999))
    session["email_code"] = code
    session["email_code_email"] = email
    sent = send_code_email(email, code)
    if sent:
        return jsonify({"ok": True, "message": "Verification code sent"})
    else:
        return jsonify({"ok": False, "error": "Failed to send code"}), 500

@app.route("/api/auth/reset_password", methods=["POST"])
def api_reset_password():
    data = request.get_json() or {}
    email = data.get("email")
    code = data.get("code")
    new_password = data.get("password")
    if not email or not code or not new_password:
        return jsonify({"ok": False, "error": "All fields required"}), 400
    if code != session.get("email_code") or email != session.get("email_code_email"):
        return jsonify({"ok": False, "error": "Invalid or expired code"}), 400
    ref = db.reference("users")
    all_users = ref.get() or {}
    user_id = None
    for uid, user in all_users.items():
        if user.get("email") == email:
            user_id = uid
            break
    if not user_id:
        return jsonify({"ok": False, "error": "Email not found"}), 404
    hashed = hashlib.sha256(new_password.encode('utf-8')).hexdigest()
    ref.child(user_id).update({"password": hashed})
    session.pop("email_code", None)
    session.pop("email_code_email", None)
    return jsonify({"ok": True, "message": "Password reset successful"})





@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("auth_page"))

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == "__main__":
    from waitress import serve
    import os
    port = int(os.environ.get("PORT", 8000))  # Railway uses PORT=8000
    serve(app, host="0.0.0.0", port=port)
