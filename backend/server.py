"""Ponto de entrada usado pelo container para iniciar o servidor ASGI."""

import uvicorn


if __name__ == "__main__":
    # `factory=True` chama create_app para construir a aplicação FastAPI.
    uvicorn.run(
        "app:create_app",
        host="0.0.0.0",  # ou "127.0.0.1" para só localhost
        port=5000,
        factory=True
    )
