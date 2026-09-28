"""Funções auxiliares relacionadas ao horário local da aplicação."""

from datetime import datetime
import pytz

FUSO_LOCAL = pytz.timezone("America/Sao_Paulo")


def dia_hora() -> datetime:
    """Retorna a data e hora atuais no fuso de São Paulo."""
    return datetime.now(FUSO_LOCAL)

__all__ = ["dia_hora"]
