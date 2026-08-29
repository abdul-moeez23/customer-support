import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# We look for ENCRYPTION_KEY in .env, otherwise generate a random one for dev
key_str = os.getenv("ENCRYPTION_KEY")
if not key_str:
    # Generate on the fly, but it might be lost on full restart. It's guaranteed valid though.
    key_str = Fernet.generate_key().decode()
    print("WARNING: Using auto-generated fallback encryption key.")

cipher_suite = Fernet(key_str.encode())

def encrypt(text: str) -> str:
    if not text:
        return ""
    return cipher_suite.encrypt(text.encode()).decode()

def decrypt(encrypted_text: str) -> str:
    if not encrypted_text:
        return ""
    return cipher_suite.decrypt(encrypted_text.encode()).decode()
