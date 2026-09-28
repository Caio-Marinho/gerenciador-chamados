"""Migra chamados antigos para incluir cliente e data de fechamento."""

from sqlalchemy import inspect, text

from .databaseConections import engine


def migrate_clientes() -> None:
    """Atualiza o schema de clientes e chamados em instalações anteriores.

    Cria a tabela de clientes e a coluna nullable de fechamento quando faltam,
    associa chamados sem cliente ao registro legado e evita duplicar a chave
    estrangeira. Pode ser executada em cada inicialização.
    """
    with engine.begin() as connection:
        connection.execute(text(
            "CREATE TABLE IF NOT EXISTS clientes ("
            "id INT PRIMARY KEY AUTO_INCREMENT, "
            "nome VARCHAR(100) NOT NULL UNIQUE)"
        ))

        colunas = {coluna["name"] for coluna in inspect(connection).get_columns("chamados")}
        if "id_cliente" not in colunas:
            connection.execute(text("ALTER TABLE chamados ADD COLUMN id_cliente INT NULL"))
        if "data_hora_fechamento" not in colunas:
            connection.execute(
                text("ALTER TABLE chamados ADD COLUMN data_hora_fechamento DATETIME NULL")
            )

        sem_cliente = connection.execute(text(
            "SELECT COUNT(*) FROM chamados WHERE id_cliente IS NULL"
        )).scalar_one()

        if sem_cliente:
            cliente_legado = connection.execute(text(
                "SELECT id FROM clientes WHERE nome = 'Cliente legado' LIMIT 1"
            )).scalar_one_or_none()
            if cliente_legado is None:
                resultado = connection.execute(text(
                    "INSERT INTO clientes (nome) VALUES ('Cliente legado')"
                ))
                cliente_legado = resultado.lastrowid
            connection.execute(
                text("UPDATE chamados SET id_cliente = :cliente WHERE id_cliente IS NULL"),
                {"cliente": cliente_legado},
            )

        chaves = inspect(connection).get_foreign_keys("chamados")
        possui_fk_cliente = any(
            chave.get("referred_table") == "clientes"
            and chave.get("constrained_columns") == ["id_cliente"]
            for chave in chaves
        )
        if not possui_fk_cliente:
            connection.execute(text(
                "ALTER TABLE chamados ADD CONSTRAINT fk_cliente "
                "FOREIGN KEY (id_cliente) REFERENCES clientes(id)"
            ))

        connection.execute(text("ALTER TABLE chamados MODIFY id_cliente INT NOT NULL"))
