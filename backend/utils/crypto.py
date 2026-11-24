"""
Criptografia de campos sensíveis (prontuários).
Em produção, use uma chave AES-256 armazenada em variável de ambiente.
"""

import base64
import hashlib
import os

from cryptography.fernet import Fernet

_KEY_ENV = "ENCRYPTION_KEY"


def _get_fernet() -> Fernet:
    """Retorna instância do Fernet com a chave do ambiente."""
    key = os.getenv(_KEY_ENV)
    if not key:
        # Em desenvolvimento, gera uma chave temporária (NÃO use em produção)
        key = Fernet.generate_key().decode()
        os.environ[_KEY_ENV] = key
    # Garante que a chave tem 32 bytes URL-safe base64
    if len(key) < 44:
        key = base64.urlsafe_b64encode(hashlib.sha256(key.encode()).digest()).decode()
    return Fernet(key.encode() if isinstance(key, str) else key)


def criptografar(texto: str | None) -> str | None:
    """Criptografa um texto com AES-256 (Fernet)."""
    if not texto:
        return texto
    f = _get_fernet()
    return f.encrypt(texto.encode("utf-8")).decode("utf-8")


def descriptografar(texto_cifrado: str | None) -> str | None:
    """Descriptografa um texto criptografado com Fernet."""
    if not texto_cifrado:
        return texto_cifrado
    try:
        f = _get_fernet()
        return f.decrypt(texto_cifrado.encode("utf-8")).decode("utf-8")
    except Exception:
        # Se não conseguir descriptografar, retorna o texto original
        # (pode ser texto não criptografado de antes da ativação)
        return texto_cifrado
