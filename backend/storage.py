import os
import boto3
from botocore.client import Config
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# S3 / MinIO client configuration
# We use forcePathStyle (addressing_style) which is crucial for MinIO
s3_client = boto3.client(
    's3',
    endpoint_url=os.getenv('S3_ENDPOINT', 'http://minio:9000'),
    aws_access_key_id=os.getenv('MINIO_ACCESS_KEY', 'minioadmin'),
    aws_secret_access_key=os.getenv('MINIO_SECRET_KEY', 'minioadmin'),
    config=Config(s3={'addressing_style': 'path'})
)

BUCKET_NAME = "company-documents"

def init_minio():
    """Ensure the bucket exists in MinIO."""
    try:
        s3_client.head_bucket(Bucket=BUCKET_NAME)
    except Exception:
        s3_client.create_bucket(Bucket=BUCKET_NAME)

def _get_encryption_key() -> bytes:
    """Retrieve the AES-256 GCM key from the environment."""
    key_hex = os.getenv("DOCUMENT_ENCRYPTION_KEY")
    if not key_hex:
        # Fallback for dev - normally you should set DOCUMENT_ENCRYPTION_KEY in .env
        key = b'0123456789abcdef0123456789abcdef' # 32 bytes for AES-256
        return key
    return bytes.fromhex(key_hex)

def encrypt_document(data: bytes) -> bytes:
    """Encrypts data using AES-256 GCM."""
    key = _get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 12-byte nonce recommended for GCM
    ciphertext = aesgcm.encrypt(nonce, data, None)
    # Prepend the nonce so it can be extracted during decryption
    return nonce + ciphertext

def decrypt_document(data: bytes) -> bytes:
    """Decrypts data using AES-256 GCM."""
    key = _get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = data[:12]
    ciphertext = data[12:]
    return aesgcm.decrypt(nonce, ciphertext, None)

def upload_to_minio(file_id: str, file_bytes: bytes) -> str:
    """Encrypts and uploads a file to MinIO, returning the S3 object key."""
    init_minio()
    encrypted_bytes = encrypt_document(file_bytes)
    object_key = f"{file_id}.enc"
    
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=object_key,
        Body=encrypted_bytes
    )
    return object_key

def download_from_minio(object_key: str) -> bytes:
    """Downloads and decrypts a file from MinIO."""
    response = s3_client.get_object(Bucket=BUCKET_NAME, Key=object_key)
    encrypted_bytes = response['Body'].read()
    return decrypt_document(encrypted_bytes)
