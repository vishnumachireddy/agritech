import os
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
import bcrypt

logger = logging.getLogger("agrosmart.auth")

SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    logger.warning("SECURITY ALERT: JWT_SECRET environment variable is not configured. Falling back to default secret.")
    SECRET_KEY = "supersecret_jwt_key_123_development_only"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

LEGACY_STATIC_SALT = "agri_assist_static_salt_2026"

def get_password_hash(password: str) -> str:
    """
    Hash passwords using salted bcrypt (Blowfish-based key derivation).
    """
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against bcrypt hash, with backward-compatibility for legacy SHA-256 hashes.
    """
    if not hashed_password or not plain_password:
        return False
        
    # Check if hash is bcrypt ($2a$ or $2b$)
    if hashed_password.startswith("$2a$") or hashed_password.startswith("$2b$"):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception as e:
            logger.error(f"Bcrypt verification error: {e}")
            return False

    # Backward compatibility with legacy SHA-256 hashes
    legacy_hash = hashlib.sha256((plain_password + LEGACY_STATIC_SALT).encode("utf-8")).hexdigest()
    return legacy_hash == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.debug("JWT token has expired")
        return None
    except jwt.PyJWTError as e:
        logger.debug(f"Invalid JWT token: {e}")
        return None
