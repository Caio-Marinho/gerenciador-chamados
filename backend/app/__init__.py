"""Pacote da aplicação FastAPI e ponto de exportação de sua factory."""

from .main import create_app

__all__ = ["create_app"]
