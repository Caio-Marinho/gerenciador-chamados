"""Modelo SQLAlchemy para profissionais responsáveis pelo atendimento."""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from .databaseConections import Base


class Responsavel(Base):
    """Pessoa que recebe e atualiza chamados na fila de atendimento."""

    __tablename__ = "responsaveis"

    id = Column(Integer, primary_key=True)
    nome = Column(String(50), nullable=False)

    chamado = relationship("Chamado", uselist=False, back_populates="responsavel")


__all__ = ["Responsavel"]
