"""Configuração compartilhada do engine e das sessões SQLAlchemy."""

import os
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_USER: str = os.getenv("DB_USER", "")
DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
DB_HOST: str = os.getenv("DB_HOST", "localhost")
DB_NAME: str = os.getenv("DB_NAME", "test")
DB_PORT: str = os.getenv("DB_PORT", "3306")

# DB_PORT é usada pelo Compose para publicar o MySQL no host. A conexão feita
# pelo backend dentro da rede Docker usa a porta padrão 3306 do serviço mysql.
engine: Engine = create_engine(
	f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}",
	echo=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

__all__ = ["Base", "SessionLocal","engine"]
