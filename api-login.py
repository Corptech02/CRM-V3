#!/usr/bin/env python3
"""
Login API for Vanguard Insurance
Provides authentication endpoint for the web application
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
import secrets
import json
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Valid user accounts (in production, these would be in a secure database with hashed passwords)
USERS = {
    'uigtest@gmail.com': {
        'password_hash': hashlib.sha256('uigtest123'.encode()).hexdigest(),
        'name': 'Test User',
        'role': 'user',
        'created': '2024-01-01'
    },
    'grant.corp2006@gmail.com': {
        'password_hash': hashlib.sha256('25Nickc124!'.encode()).hexdigest(),
        'name': 'Grant Corp',
        'role': 'admin',
        'created': '2024-01-01'
    }
}

# Active sessions (in production, use Redis or database)
sessions = {}

@app.route('/api/login', methods=['POST'])
def login():
    """Handle user login"""
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        # Validate input
        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400

        # Check if user exists
        if email not in USERS:
            return jsonify({
                'success': False,
                'message': 'Invalid email or password'
            }), 401

        # Verify password
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        if password_hash != USERS[email]['password_hash']:
            return jsonify({
                'success': False,
                'message': 'Invalid email or password'
            }), 401

        # Create session token
        session_token = secrets.token_urlsafe(32)
        session_expiry = datetime.now() + timedelta(hours=24)

        # Store session
        sessions[session_token] = {
            'email': email,
            'expiry': session_expiry.isoformat(),
            'role': USERS[email]['role']
        }

        # Return success response
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': session_token,
            'user': {
                'email': email,
                'name': USERS[email]['name'],
                'role': USERS[email]['role']
            },
            'expiry': session_expiry.isoformat()
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """Handle user logout"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        if token in sessions:
            del sessions[token]

        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/verify', methods=['GET'])
def verify_session():
    """Verify if session is valid"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        if not token or token not in sessions:
            return jsonify({
                'success': False,
                'message': 'Invalid or expired session'
            }), 401

        session = sessions[token]
        expiry = datetime.fromisoformat(session['expiry'])

        if datetime.now() > expiry:
            del sessions[token]
            return jsonify({
                'success': False,
                'message': 'Session expired'
            }), 401

        return jsonify({
            'success': True,
            'user': {
                'email': session['email'],
                'role': session['role']
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/change-password', methods=['POST'])
def change_password():
    """Handle password change"""
    try:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        if not token or token not in sessions:
            return jsonify({
                'success': False,
                'message': 'Unauthorized'
            }), 401

        data = request.json
        old_password = data.get('old_password', '')
        new_password = data.get('new_password', '')

        if not old_password or not new_password:
            return jsonify({
                'success': False,
                'message': 'Both old and new passwords are required'
            }), 400

        email = sessions[token]['email']

        # Verify old password
        old_hash = hashlib.sha256(old_password.encode()).hexdigest()
        if old_hash != USERS[email]['password_hash']:
            return jsonify({
                'success': False,
                'message': 'Current password is incorrect'
            }), 401

        # Update password
        USERS[email]['password_hash'] = hashlib.sha256(new_password.encode()).hexdigest()

        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'vanguard-login-api',
        'timestamp': datetime.now().isoformat()
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8901, debug=True)