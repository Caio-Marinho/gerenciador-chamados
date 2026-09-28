"""Schemas Pydantic que validam dados recebidos e serializam respostas da API."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, PositiveInt


# --- Schemas Auxiliares (Relacionamentos) ---

class PrioridadeResponse(BaseModel):
    """Prioridade exposta pela API e usada nos formulários de chamados."""
    id: int
    prioridade: str
    
    model_config = ConfigDict(from_attributes=True)


class StatusResponse(BaseModel):
    """Status exposto pela API para acompanhar o ciclo de atendimento."""
    id: int
    status: str
    
    model_config = ConfigDict(from_attributes=True)


class ResponsavelResponse(BaseModel):
    """Identificação pública de um responsável."""
    id: int
    nome: str
    
    model_config = ConfigDict(from_attributes=True)


class ClienteResponse(BaseModel):
    """Identificação pública de um cliente."""
    id: int
    nome: str

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Chamado ---

class ChamadoBase(BaseModel):
    """Campos comuns enviados ao criar e retornados ao consultar um chamado."""
    Titulo: str
    Descricao: str
    id_prioridade: PositiveInt
    id_responsavel: Optional[PositiveInt] = None


class ChamadoCreate(ChamadoBase):
    """Dados necessários para abrir um chamado para um cliente."""
    id_cliente: PositiveInt

    # O status pode ser opcional na criação se assumir o padrão (id=1)
    id_status: Optional[PositiveInt] = 1
    
    atribuir_auto: bool = False


class ClienteIdentify(BaseModel):
    """Nome usado para localizar ou criar um cliente."""
    nome: str


class ChamadoClienteUpdate(BaseModel):
    """Campos que o cliente pode editar enquanto o chamado estiver aberto."""
    Titulo: str
    Descricao: str
    id_prioridade: PositiveInt


class ChamadoResponsavelUpdate(BaseModel):
    """Campos que o responsável pode alterar durante o atendimento."""
    id_status: PositiveInt
    id_prioridade: PositiveInt
    id_responsavel: PositiveInt


class ChamadoResponse(ChamadoBase):
    """Representação completa do chamado, incluindo relacionamentos disponíveis."""
    id: PositiveInt
    id_status: PositiveInt
    data_hora_abertura: datetime
    # Campo nulo para chamados em andamento; preenchido ao resolver/fechar.
    data_hora_fechamento: Optional[datetime] = None
    
    # Os objetos aninhados permitem à interface exibir nomes sem consultas adicionais.
    prioridade: Optional[PrioridadeResponse] = None
    status: Optional[StatusResponse] = None
    responsavel: Optional[ResponsavelResponse] = None
    cliente: Optional[ClienteResponse] = None

    model_config = ConfigDict(from_attributes=True)
    
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
