"""
encryption.py - Decryption utility for MCP server.

Shares the same ENCRYPTION_KEY used by the backend so the MCP
server can decrypt stored database passwords before connecting.
"""

import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

key_str = os.getenv("ENCRYPTION_KEY")
if not key_str:
    key_str = Fernet.generate_key().decode()
    print("WARNING: Using auto-generated fallback encryption key.")

cipher_suite = Fernet(key_str.encode())


def decrypt(encrypted_text: str) -> str:
    """Decrypt a Fernet-encrypted string back to plaintext."""
    if not encrypted_text:
        return ""
    return cipher_suite.decrypt(encrypted_text.encode()).decode()
