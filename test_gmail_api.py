#!/usr/bin/env python3

"""
Gmail API Test Script
Tests Gmail OAuth authentication and basic API functionality
"""

import os
import json
import sys
from pathlib import Path
from dotenv import load_dotenv
import requests
from urllib.parse import urlencode

# Load environment variables
env_path = Path('/var/www/vanguard/.env')
if env_path.exists():
    load_dotenv(env_path)
else:
    print("❌ .env file not found at /var/www/vanguard/.env")
    sys.exit(1)

class GmailAPITester:
    def __init__(self):
        self.client_id = os.getenv('GMAIL_CLIENT_ID')
        self.client_secret = os.getenv('GMAIL_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GMAIL_REDIRECT_URI', 'http://162-220-14-239.nip.io/api/gmail/callback')
        self.base_url = 'https://accounts.google.com/o/oauth2'
        self.api_base = 'https://www.googleapis.com/gmail/v1'
        self.token_file = '/var/www/vanguard/gmail_token.json'

    def check_credentials(self):
        """Check if credentials are properly configured"""
        print("🔍 Checking credentials...")

        if not self.client_id or self.client_id == 'your-actual-client-id':
            print("❌ GMAIL_CLIENT_ID is not configured properly")
            return False

        if not self.client_secret or self.client_secret == 'your-actual-client-secret':
            print("❌ GMAIL_CLIENT_SECRET is not configured properly")
            return False

        print("✅ Credentials are configured")
        print(f"   Client ID: {self.client_id[:20]}...")
        print(f"   Redirect URI: {self.redirect_uri}")
        return True

    def generate_auth_url(self):
        """Generate OAuth authorization URL"""
        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'response_type': 'code',
            'scope': 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly',
            'access_type': 'offline',
            'prompt': 'consent'
        }

        auth_url = f"{self.base_url}/auth?{urlencode(params)}"
        return auth_url

    def exchange_code_for_token(self, auth_code):
        """Exchange authorization code for access token"""
        token_url = f"{self.base_url}/token"

        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': auth_code,
            'redirect_uri': self.redirect_uri,
            'grant_type': 'authorization_code'
        }

        try:
            response = requests.post(token_url, data=data)
            response.raise_for_status()
            token_data = response.json()

            # Save token for future use
            with open(self.token_file, 'w') as f:
                json.dump(token_data, f, indent=2)

            print("✅ Token obtained and saved successfully")
            return token_data

        except requests.exceptions.RequestException as e:
            print(f"❌ Error exchanging code for token: {e}")
            if hasattr(e.response, 'text'):
                print(f"   Response: {e.response.text}")
            return None

    def test_api_access(self, access_token):
        """Test Gmail API access with token"""
        headers = {
            'Authorization': f'Bearer {access_token}'
        }

        # Test profile endpoint
        profile_url = f"{self.api_base}/users/me/profile"

        try:
            response = requests.get(profile_url, headers=headers)
            response.raise_for_status()
            profile = response.json()

            print("✅ Successfully accessed Gmail API")
            print(f"   Email: {profile.get('emailAddress')}")
            print(f"   Messages Total: {profile.get('messagesTotal')}")
            return True

        except requests.exceptions.RequestException as e:
            print(f"❌ Error accessing Gmail API: {e}")
            if hasattr(e.response, 'text'):
                print(f"   Response: {e.response.text}")
            return False

    def load_saved_token(self):
        """Load previously saved token"""
        if os.path.exists(self.token_file):
            try:
                with open(self.token_file, 'r') as f:
                    token_data = json.load(f)
                    return token_data
            except:
                return None
        return None

    def refresh_token(self, refresh_token):
        """Refresh access token using refresh token"""
        token_url = f"{self.base_url}/token"

        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        }

        try:
            response = requests.post(token_url, data=data)
            response.raise_for_status()
            token_data = response.json()

            # Update saved token
            saved_token = self.load_saved_token() or {}
            saved_token.update(token_data)

            with open(self.token_file, 'w') as f:
                json.dump(saved_token, f, indent=2)

            print("✅ Token refreshed successfully")
            return token_data

        except requests.exceptions.RequestException as e:
            print(f"❌ Error refreshing token: {e}")
            return None

def main():
    print("================================")
    print("Gmail API Test Script")
    print("================================")
    print()

    tester = GmailAPITester()

    # Check credentials
    if not tester.check_credentials():
        print("\n⚠️  Please update your credentials in /var/www/vanguard/.env")
        print("   GMAIL_CLIENT_ID=your-actual-client-id")
        print("   GMAIL_CLIENT_SECRET=your-actual-client-secret")
        sys.exit(1)

    print("\nOptions:")
    print("1. Generate authorization URL")
    print("2. Exchange authorization code for token")
    print("3. Test with saved token")
    print("4. Refresh saved token")

    choice = input("\nEnter your choice (1-4): ").strip()

    if choice == '1':
        auth_url = tester.generate_auth_url()
        print("\n📝 Authorization URL generated:")
        print(f"\n{auth_url}\n")
        print("Open this URL in your browser to authorize the application.")
        print("After authorization, you'll be redirected to the callback URL.")
        print("Copy the 'code' parameter from the URL and use option 2.")

    elif choice == '2':
        auth_code = input("\nEnter the authorization code from the redirect URL: ").strip()
        if auth_code:
            token_data = tester.exchange_code_for_token(auth_code)
            if token_data:
                print("\n🧪 Testing API access...")
                tester.test_api_access(token_data['access_token'])

    elif choice == '3':
        token_data = tester.load_saved_token()
        if token_data:
            print("\n📂 Found saved token")
            print("🧪 Testing API access...")
            if not tester.test_api_access(token_data.get('access_token')):
                if 'refresh_token' in token_data:
                    print("\n🔄 Attempting to refresh token...")
                    new_token = tester.refresh_token(token_data['refresh_token'])
                    if new_token:
                        tester.test_api_access(new_token['access_token'])
        else:
            print("❌ No saved token found. Please authorize first (option 1 & 2)")

    elif choice == '4':
        token_data = tester.load_saved_token()
        if token_data and 'refresh_token' in token_data:
            new_token = tester.refresh_token(token_data['refresh_token'])
            if new_token:
                print("🧪 Testing refreshed token...")
                tester.test_api_access(new_token['access_token'])
        else:
            print("❌ No refresh token found. Please authorize first.")

if __name__ == "__main__":
    try:
        # Check for required packages
        import requests
        from dotenv import load_dotenv
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("\nInstall with:")
        print("  pip3 install requests python-dotenv")
        sys.exit(1)

    main()