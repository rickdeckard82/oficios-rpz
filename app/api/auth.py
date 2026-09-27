import hashlib
import hmac
from functools import wraps

from flask import current_app, g, jsonify, request

from ..models import User


def hash_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def current_actor_user():
    actor = getattr(g, "api_actor", None)
    if actor and actor["type"] == "user":
        return actor["user"]
    return None


def require_auth(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[len("Bearer "):].strip()
            user = User.query.filter_by(api_token_hash=hash_token(token)).first() if token else None
            if not user or not user.active:
                return jsonify(error="Token inválido, expirado ou usuário inativo."), 401

            g.api_actor = {"type": "user", "user": user}
            return view(*args, **kwargs)

        configured_key = current_app.config.get("API_KEY", "")
        if not configured_key:
            return (
                jsonify(
                    error="API desabilitada: configure API_KEY no servidor ou autentique-se "
                    "via POST /api/v1/auth/login."
                ),
                503,
            )

        provided_key = request.headers.get("X-API-Key", "")
        if not provided_key or not hmac.compare_digest(provided_key, configured_key):
            return (
                jsonify(
                    error="Autenticação ausente ou inválida. Use o header X-API-Key ou "
                    "Authorization: Bearer <token>."
                ),
                401,
            )

        g.api_actor = {"type": "service", "user": None}
        return view(*args, **kwargs)

    return wrapped
