#!/usr/bin/env python3
"""
Secure Login API for Vanguard Insurance
Enterprise-grade authentication with comprehensive security features
"""

import os
import json
import time
import secrets
import hashlib
import logging
import sqlite3
from datetime import datetime, timedelta
from functools import wraps
from typing import Dict, Optional, Tuple

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import bcrypt
import jwt
from cryptography.fernet import Fernet

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# CORS configuration (restrictive)
CORS(app, origins=['https://yourdomain.com', 'http://localhost:*'])

# Rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Logging configuration
logging.basicConfig(
    filename='/var/www/vanguard/logs/auth.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Security configurations
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION = 900  # 15 minutes in seconds
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = 'HS256'
SESSION_DURATION = 86400  # 24 hours in seconds

# Encryption key for sensitive data
ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY', Fernet.generate_key())
cipher = Fernet(ENCRYPTION_KEY)

# Database configuration
DB_PATH = '/var/www/vanguard/secure_auth.db'

def init_database():
    """Initialize the authentication database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            two_factor_secret TEXT,
            backup_codes TEXT
        )
    ''')

    # Login attempts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS login_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            ip_address TEXT,
            success BOOLEAN,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_agent TEXT,
            location TEXT
        )
    ''')

    # Sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT UNIQUE NOT NULL,
            user_id INTEGER,
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # IP blacklist table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ip_blacklist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT UNIQUE NOT NULL,
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP
        )
    ''')

    # Audit log table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            user_id INTEGER,
            ip_address TEXT,
            details TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()

    # Add initial users if they don't exist
    add_initial_users(conn)

    conn.close()

def add_initial_users(conn):
    """Add initial authorized users with secure password hashing"""
    cursor = conn.cursor()

    users = [
        ('uigtest@gmail.com', 'uigtest123', 'user'),
        ('grant.corp2006@gmail.com', '25Nickc124!', 'admin')
    ]

    for email, password, role in users:
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if not cursor.fetchone():
            # Generate salt and hash password with bcrypt
            salt = bcrypt.gensalt()
            password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)

            cursor.execute("""
                INSERT INTO users (email, password_hash, salt, role)
                VALUES (?, ?, ?, ?)
            """, (email, password_hash.decode('utf-8'), salt.decode('utf-8'), role))

    conn.commit()

def check_ip_blacklist(ip_address: str) -> bool:
    """Check if IP is blacklisted"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id FROM ip_blacklist
        WHERE ip_address = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
    """, (ip_address,))

    is_blacklisted = cursor.fetchone() is not None
    conn.close()

    return is_blacklisted

def check_rate_limit(email: str, ip_address: str) -> Tuple[bool, str]:
    """Check if user has exceeded rate limits"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check failed attempts in last 15 minutes
    cursor.execute("""
        SELECT COUNT(*) FROM login_attempts
        WHERE (email = ? OR ip_address = ?)
        AND success = 0
        AND timestamp > datetime('now', '-15 minutes')
    """, (email, ip_address))

    failed_attempts = cursor.fetchone()[0]

    if failed_attempts >= MAX_LOGIN_ATTEMPTS:
        # Add to blacklist
        cursor.execute("""
            INSERT OR REPLACE INTO ip_blacklist (ip_address, reason, expires_at)
            VALUES (?, ?, datetime('now', '+15 minutes'))
        """, (ip_address, f'Exceeded login attempts: {failed_attempts}'))
        conn.commit()
        conn.close()
        return False, f"Too many failed attempts. Account locked for 15 minutes."

    conn.close()
    return True, ""

def log_login_attempt(email: str, ip_address: str, success: bool, user_agent: str = None):
    """Log login attempt"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO login_attempts (email, ip_address, success, user_agent)
        VALUES (?, ?, ?, ?)
    """, (email, ip_address, success, user_agent))

    conn.commit()
    conn.close()

    # Log to file
    logger.info(f"Login attempt - Email: {email}, IP: {ip_address}, Success: {success}")

def log_audit_event(event_type: str, user_id: Optional[int], ip_address: str, details: Dict):
    """Log audit event"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO audit_log (event_type, user_id, ip_address, details)
        VALUES (?, ?, ?, ?)
    """, (event_type, user_id, ip_address, json.dumps(details)))

    conn.commit()
    conn.close()

def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password using bcrypt"""
    return bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))

def generate_jwt_token(user_id: int, email: str, role: str) -> str:
    """Generate secure JWT token"""
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.utcnow() + timedelta(seconds=SESSION_DURATION),
        'iat': datetime.utcnow(),
        'jti': secrets.token_hex(16)  # JWT ID for revocation
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> Optional[Dict]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    """Decorator for routes requiring authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        if not token:
            return jsonify({'error': 'Authentication required'}), 401

        payload = verify_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        request.user = payload
        return f(*args, **kwargs)

    return decorated_function

@app.route('/api/secure/login', methods=['POST'])
@limiter.limit("5 per minute")
def secure_login():
    """Secure login endpoint with comprehensive protection"""
    try:
        # Get request data
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        recaptcha_token = data.get('recaptcha_token', '')
        csrf_token = data.get('csrf_token', '')

        # Get client info
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent', '')

        # Validate input
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password required'}), 400

        # Check IP blacklist
        if check_ip_blacklist(ip_address):
            log_audit_event('BLOCKED_IP_ATTEMPT', None, ip_address, {'email': email})
            return jsonify({'success': False, 'message': 'Access denied'}), 403

        # Check rate limiting
        allowed, message = check_rate_limit(email, ip_address)
        if not allowed:
            log_audit_event('RATE_LIMIT_EXCEEDED', None, ip_address, {'email': email})
            return jsonify({'success': False, 'message': message}), 429

        # Verify reCAPTCHA (in production, verify with Google's API)
        # if not verify_recaptcha(recaptcha_token):
        #     return jsonify({'success': False, 'message': 'Invalid CAPTCHA'}), 400

        # Get user from database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, password_hash, role, is_active
            FROM users
            WHERE email = ?
        """, (email,))

        user = cursor.fetchone()

        if not user:
            # Log failed attempt
            log_login_attempt(email, ip_address, False, user_agent)
            conn.close()
            # Use generic error message for security
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

        user_id, password_hash, role, is_active = user

        # Check if account is active
        if not is_active:
            log_audit_event('INACTIVE_ACCOUNT_LOGIN', user_id, ip_address, {'email': email})
            conn.close()
            return jsonify({'success': False, 'message': 'Account inactive'}), 403

        # Verify password
        if not verify_password(password, password_hash):
            # Log failed attempt
            log_login_attempt(email, ip_address, False, user_agent)
            log_audit_event('FAILED_LOGIN', user_id, ip_address, {'email': email})
            conn.close()
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

        # Successful login
        log_login_attempt(email, ip_address, True, user_agent)
        log_audit_event('SUCCESSFUL_LOGIN', user_id, ip_address, {'email': email})

        # Update last login
        cursor.execute("""
            UPDATE users SET last_login = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (user_id,))

        # Generate session token
        token = generate_jwt_token(user_id, email, role)

        # Store session
        cursor.execute("""
            INSERT INTO sessions (token, user_id, ip_address, expires_at)
            VALUES (?, ?, ?, datetime('now', '+24 hours'))
        """, (hashlib.sha256(token.encode()).hexdigest(), user_id, ip_address))

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'email': email,
                'role': role
            },
            'expires_in': SESSION_DURATION
        }), 200

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'success': False, 'message': 'System error'}), 500

@app.route('/api/secure/logout', methods=['POST'])
@require_auth
def secure_logout():
    """Secure logout endpoint"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        user = request.user

        # Invalidate session
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE sessions SET is_active = 0
            WHERE token = ?
        """, (hashlib.sha256(token.encode()).hexdigest(),))

        conn.commit()
        conn.close()

        log_audit_event('LOGOUT', user['user_id'], request.remote_addr, {'email': user['email']})

        return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({'success': False, 'message': 'System error'}), 500

@app.route('/api/secure/verify', methods=['GET'])
@require_auth
def verify_session():
    """Verify session endpoint"""
    return jsonify({
        'success': True,
        'user': request.user
    }), 200

@app.route('/api/secure/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'vanguard-secure-auth',
        'timestamp': datetime.now().isoformat()
    }), 200

if __name__ == '__main__':
    # Initialize database
    os.makedirs('/var/www/vanguard/logs', exist_ok=True)
    init_database()

    # Run app (use production WSGI server in production)
    app.run(host='0.0.0.0', port=8902, debug=False)