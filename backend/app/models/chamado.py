"""Modelo SQLAlchemy para registros de chamados e seus relacionamentos."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .databaseConections import Base
from ..utils import dia_hora

class Chamado(Base):
    """Chamado aberto por um cliente e acompanhado por um responsável."""

    __tablename__ = "chamados"
    
    id = Column(Integer, primary_key=True)
    Titulo = Column(String(150), nullable=False)
    Descricao = Column(String(500), nullable=False)
    
    # Chaves estrangeiras conectam o chamado às tabelas de referência.
    id_prioridade = Column(Integer, ForeignKey("prioridades.id"), nullable=False)
    id_status = Column(Integer, ForeignKey("status.id"), nullable=False)
    id_responsavel = Column(Integer, ForeignKey("responsaveis.id"), nullable=False) 
    id_cliente = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    
    # A função é passada sem chamada para gerar um horário novo a cada INSERT.
    data_hora_abertura = Column(DateTime, nullable=False, default=dia_hora)
    # Fica nulo até o primeiro status Resolvido/Fechado.
    data_hora_fechamento = Column(DateTime, nullable=True)
    
    prioridade = relationship("Prioridade", back_populates="chamado")
    status = relationship("Status", back_populates="chamado")
    responsavel = relationship("Responsavel", back_populates="chamado")
    cliente = relationship("Cliente", back_populates="chamados")
    
__all__ = ["Chamado"]
