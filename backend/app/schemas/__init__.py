"""Schemas Pydantic exportados para uso pelas rotas da API."""

from .schema import (
    ChamadoBase,
    ChamadoCreate,
    ChamadoResponse,
    PrioridadeResponse,
    StatusResponse,
    ResponsavelResponse,
    ClienteResponse,
    ClienteIdentify,
    ChamadoClienteUpdate,
    ChamadoResponsavelUpdate
)

__all__ = [
    "ChamadoBase",
    "ChamadoCreate",
    "ChamadoResponse",
    "PrioridadeResponse",
    "StatusResponse",
    "ResponsavelResponse",
    "ClienteResponse",
    "ClienteIdentify",
    "ChamadoClienteUpdate",
    "ChamadoResponsavelUpdate"
]
