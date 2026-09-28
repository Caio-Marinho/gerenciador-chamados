"""Configuração da aplicação FastAPI e preparação do schema no startup."""

from fastapi import FastAPI

from .models import migrate_clientes
from .router import chamado


def create_app() -> FastAPI:
    """Cria a API e registra suas rotas e tarefas de inicialização."""
    app = FastAPI(
        title="Central de chamados",
        description="API para abertura e gerenciamento de chamados de atendimento.",
    )
    app.include_router(chamado.app)

    @app.on_event("startup")
    def preparar_schema() -> None:
        """Garante a tabela de clientes e atualiza chamados legados ao iniciar."""
        migrate_clientes()

    return app

__all__ = ["create_app"]
