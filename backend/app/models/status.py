"""Modelo SQLAlchemy para estados do ciclo de vida dos chamados."""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from .databaseConections import Base


class Status(Base):
    """Estado atual de um chamado, como Aberto ou Em Andamento."""

    __tablename__ = "status"

    id = Column(Integer, primary_key=True)
    status = Column(String(50), nullable=False)

    chamado = relationship("Chamado", uselist=False, back_populates="status")


__all__ = ["Status"]
