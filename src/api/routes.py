"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User
from api.utils import generate_sitemap, APIException, validate_email, send_email
from flask_cors import CORS
import cloudinary.uploader as cloudinary_upload
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash
from base64 import b64encode
import os
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, JWTManager, get_jwt, decode_token
from datetime import timedelta

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200


ALLOWED_IMG_EXTENSIONS = {'image/png', 'image/jpg',
                          'image/jpeg', 'image/gif', 'image/webp'}
MAX_IMG_SIZE = 2 * 1024 * 1024  # 2MB


def _resolve_avatar_url(avatar_file):
    # Primero verificar si existe o es string vacío
    if not avatar_file or isinstance(avatar_file, str):
        return "https://i.pravatar.cc/300"

    if avatar_file.mimetype not in ALLOWED_IMG_EXTENSIONS:
        raise ValueError(
            "Invalid image format. Allowed formats: PNG, JPG, JPEG, GIF, WEBP")

    avatar_file.stream.seek(0, 2)
    file_size = avatar_file.stream.tell()
    avatar_file.stream.seek(0)

    if file_size > MAX_IMG_SIZE:
        raise ValueError("Image size exceeds the maximum limit of 2MB")

    return None  # Señal de que hay archivo válido para subir a Cloudinary


@api.route('/health-check', methods=["GET"])
def health_check():
    return jsonify({"status": "Ok"}), 200


@api.route('/users', methods=["POST"])
def create_user():
    data_form = request.form
    data_files = request.files
    data = {**data_form, **data_files}

    for field in ["email", "username", "full_name", "password"]:
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    email = data["email"].strip().lower()
    username = data["username"].strip()
    full_name = data["full_name"].strip()
    password = data["password"].strip()
    avatar_file = data.get("avatar_url")

    try:
        avatar_url = _resolve_avatar_url(avatar_file)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    # Si hay archivo válido (avatar_url es None), subir a Cloudinary
    if avatar_file and avatar_url is None:
        try:
            uploaded_result = cloudinary_upload.upload(
                avatar_file, folder="avatars")
            avatar_url = uploaded_result.get(
                "secure_url", "https://i.pravatar.cc/300")
        except Exception as e:
            return jsonify({"error": f"Error uploading avatar: {str(e)}"}), 500

    valid_email = validate_email(email)
    if not valid_email:
        return jsonify({"error": "Invalid email format"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    salt = b64encode(os.urandom(32)).decode('utf-8')
    hashed_password = generate_password_hash(password + salt)

    try:
        new_user = User(
            email=email,
            username=username,
            password=hashed_password,
            salt=salt,
            is_active=False,
            avatar_url=avatar_url,
            full_name=full_name)

        db.session.add(new_user)
        db.session.flush()

        frontend_url = (os.getenv("URL_FRONTEND") or "").strip()
        if not frontend_url:
            db.session.rollback()
            return jsonify({"error": "URL_FRONTEND is required"}), 500

        activation_token = create_access_token(
            identity=str(new_user.id),
            additional_claims={"purpose": "account_activation"},
            expires_delta=timedelta(hours=1)
        )

        activation_link = f"{frontend_url}activate-account?token={activation_token}"
        email_body = f"""
        <div>
            <p>Hola {new_user.username},</p>
            <p>Bienvenido! Por favor activa tu cuenta ingresando al siguiente enlace:</p>
            <a href="{activation_link}">Activar cuenta</a>
            <p>If you did not create this account, you can ignore this email.</p>
        </div>
        """

        success = send_email(
            subject="Activación de usuario",
            to=new_user.email,
            body=email_body
        )

        if not success:
            db.session.rollback()
            return jsonify({"error": "Failed to send activation email"}), 500

        db.session.commit()

        return jsonify({"message": "User created successfully"}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({"error": "Database integrity error: " + str(e)}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "An error occurred while creating the user"}), 500


@api.route('/login', methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    for field in ["email", "password"]:
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    user = User.query.filter_by(email=email).one_or_none()
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not check_password_hash(user.password, password + user.salt):
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({"message": "Login successful",
                    "user": user.serialize(),
                    "access_token": create_access_token(identity=str(user.id),
                                                        expires_delta=timedelta(hours=1))}
                   ), 200


@api.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"message": "This is the profile endpoint.",
                    "user": user.serialize()}), 200


@api.route('/example-email', methods=['GET'])
def example_email():
    to = "bensirave@hotmail.com"
    subject = "Example Email"
    body = "<h1>This is an example email</h1>"
    if send_email(to, subject, body):
        return jsonify({"message": "Email sent successfully"}), 200
    else:
        return jsonify({"error": "Failed to send email"}), 500


@api.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"error": "Missing required field: email"}), 400

    user = User.query.filter_by(email=email).one_or_none()
    if not user:
        return jsonify({"error": "If email exists, a password reset email will be sent"}), 404

    reset_token = create_access_token(
        identity=str(user.id),
        additional_claims={"purpose": "password-reset"},
        expires_delta=timedelta(minutes=10)
    )
    frontend_url = (os.getenv("URL_FRONTEND") or "").strip()

    if not frontend_url:
        return jsonify({"error": "Frontend URL is not configured"}), 500

    reset_base_url = frontend_url.rstrip("/") + "/recovery-password"
    reset_link = f"{reset_base_url}?token={reset_token}"

    subject = "Solicitud de restaurar la contraseña"

    body = f"""
        <div>
            <p>Hola {user.username},</p>
            <p>Solicitud para restaurar la contraseña. Da click en el siguiente enlace:</p>
            <a href="{reset_link}">Reset Password</a>
            <p>Si tu no solicitaste este enlace puedes ignorarlo.</p>
        </div>
    """

    try:
        success = send_email(
            to=user.email,
            subject=subject,
            body=body
        )
        if success:
            return jsonify({"message": "Email sending success"}), 200
        else:
            return jsonify({"error": "Error sending message"}), 500
    except Exception as error:
        return jsonify({"error": f"Error sending email: {error.args}"}), 500


@api.route("/update-pwd", methods=["POST"])
@jwt_required()
def update_password():
    claims = get_jwt()
    if claims.get("purpose") != "password-reset":
        return jsonify({"error": "Invalid token for password update"}), 403

    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    new_password = data.get("new_password", "")

    if not new_password:
        return jsonify({"error": "Missing required field: new_password"}), 400

    salt = b64encode(os.urandom(32)).decode("utf-8")
    user.password = generate_password_hash(new_password + salt)
    user.salt = salt

    try:
        db.session.commit()
        return jsonify({"message": "Password updated successfully"}), 200
    except Exception as error:
        db.session.rollback()
        return jsonify({"error": f"Error updating password: {error.args}"}), 500


@api.route("/activate-account", methods=["POST"])
def activate_account():
    data = request.get_json(silent=True) or {}
    token = (data.get("token") or request.args.get("token") or "").strip()

    if not token:
        return jsonify({"error": "Missing required field: token"}), 400

    try:
        decoded = decode_token(token)
    except Exception as error:
        return jsonify({"error": f"Invalid or expired token: {error.args}"}), 400

    if decoded.get("purpose") != "account_activation":
        return jsonify({"error": "Invalid token purpose"}), 403

    user_id = decoded.get("sub")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.is_active:
        return jsonify({"message": "User already activated"}), 200

    user.is_active = True

    try:
        db.session.commit()
        return jsonify({"message": "User activated successfully"}), 200
    except Exception as error:
        db.session.rollback()
        return jsonify({"error": f"Error activating user: {error.args}"}), 500
