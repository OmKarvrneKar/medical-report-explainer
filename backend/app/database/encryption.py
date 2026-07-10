from sqlalchemy.types import TypeDecorator, Text
from cryptography.fernet import Fernet
import os
import base64

# Ensure there's always a key (for safety during migrations/startups if not set in .env yet)
encryption_key = os.getenv("ENCRYPTION_KEY")
if not encryption_key:
    # Generate a random one for fallback, though in production you want the env var.
    encryption_key = Fernet.generate_key().decode()

fernet = Fernet(encryption_key.encode())

class EncryptedText(TypeDecorator):
    """
    SQLAlchemy TypeDecorator that seamlessly encrypts/decrypts strings 
    using symmetric Fernet encryption before storing them in the DB.
    """
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            # encrypt requires bytes and returns bytes
            encrypted = fernet.encrypt(value.encode('utf-8'))
            return encrypted.decode('utf-8')
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            decrypted = fernet.decrypt(value.encode('utf-8'))
            return decrypted.decode('utf-8')
        return value
