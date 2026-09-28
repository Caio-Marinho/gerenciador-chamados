"""Modelo SQLAlchemy para clientes identificados no portal."""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from .databaseConections import Base


class Cliente(Base):
    """Cliente identificado pelo nome e associado a um ou mais chamados."""

    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False, unique=True)

    chamados = relationship("Chamado", back_populates="cliente")


__all__ = ["Cliente"]
