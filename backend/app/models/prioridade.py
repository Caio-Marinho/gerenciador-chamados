"""Modelo SQLAlchemy para níveis de prioridade de atendimento."""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from .databaseConections import Base


class Prioridade(Base):
    """Prioridade selecionada para classificar um chamado."""

    __tablename__ = "prioridades"

    id = Column(Integer, primary_key=True)
    prioridade = Column(String(50), nullable=False)

    chamado = relationship("Chamado", uselist=False, back_populates="prioridade")


__all__ = ["Prioridade"]
