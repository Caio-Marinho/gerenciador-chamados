"""Endpoints da API para identificação de clientes e gestão de chamados."""

from collections.abc import Generator
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import (
    Chamado,
    Cliente,
    Prioridade,
    Responsavel,
    SessionLocal,
    Status,
)
from ..schemas import (
    ChamadoClienteUpdate,
    ChamadoCreate,
    ChamadoResponse,
    ChamadoResponsavelUpdate,
    ClienteIdentify,
    ClienteResponse,
    PrioridadeResponse,
    ResponsavelResponse,
    StatusResponse,
)
from ..utils import dia_hora

app = APIRouter(tags=["chamado"])


def get_db() -> Generator[Session, None, None]:
    """Abre uma sessão SQLAlchemy e garante seu fechamento após a requisição."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/clientes/identificar", response_model=ClienteResponse)
def identify_cliente(
    dados: ClienteIdentify,
    db: Session = Depends(get_db),
) -> Cliente:
    """Busca o cliente pelo nome ou cria um registro para um novo nome."""
    nome = dados.nome.strip()
    if not nome:
        raise HTTPException(status_code=400, detail="Informe seu nome.")

    cliente = db.query(Cliente).filter(func.lower(Cliente.nome) == nome.lower()).first()
    if cliente is None:
        cliente = Cliente(nome=nome)
        db.add(cliente)
        db.commit()
        db.refresh(cliente)
    return cliente


@app.post("/cadastrar", response_model=ChamadoResponse)
def create_chamado(
    chamado: ChamadoCreate,
    db: Session = Depends(get_db),
) -> Chamado:
    """Cria um chamado e, se solicitado, atribui ao responsável menos carregado."""
    dados_chamado = chamado.model_dump()
    if db.get(Cliente, dados_chamado["id_cliente"]) is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    if dados_chamado.get("atribuir_auto"):
        responsaveis_ids = [responsavel.id for responsavel in db.query(Responsavel).all()]
        if not responsaveis_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nenhum responsável cadastrado para atribuição automática.",
            )

        # Conta apenas os chamados ainda em atendimento para distribuir a carga.
        status_ativos = ["Aberto", "Pendente", "Em Andamento"]
        contagens = (
            db.query(Chamado.id_responsavel, func.count(Chamado.id))
            .join(Status, Chamado.id_status == Status.id)
            .filter(Status.status.in_(status_ativos))
            .group_by(Chamado.id_responsavel)
            .all()
        )
        carga = {responsavel_id: total for responsavel_id, total in contagens}
        dados_chamado["id_responsavel"] = min(
            responsaveis_ids, key=lambda responsavel_id: carga.get(responsavel_id, 0)
        )

    dados_chamado.pop("atribuir_auto", None)
    db_chamado = Chamado(**dados_chamado)
    db.add(db_chamado)
    db.commit()
    db.refresh(db_chamado)
    return db_chamado


@app.get("/listar", response_model=list[ChamadoResponse])
def list_chamados(db: Session = Depends(get_db)) -> list[Chamado]:
    """Retorna todos os chamados com os dados relacionados configurados no modelo."""
    return db.query(Chamado).all()


@app.get("/clientes/{cliente_id}/chamados", response_model=list[ChamadoResponse])
def list_chamados_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
) -> list[Chamado]:
    """Lista os chamados de um cliente; retorna 404 se o cliente não existir."""
    if db.get(Cliente, cliente_id) is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")
    return db.query(Chamado).filter(Chamado.id_cliente == cliente_id).all()


@app.patch(
    "/clientes/{cliente_id}/chamados/{chamado_id}",
    response_model=ChamadoResponse,
)
def update_chamado_cliente(
    cliente_id: int,
    chamado_id: int,
    dados: ChamadoClienteUpdate,
    db: Session = Depends(get_db),
) -> Chamado:
    """Permite ao cliente editar título, descrição e prioridade se estiver aberto."""
    chamado = (
        db.query(Chamado)
        .join(Status)
        .filter(Chamado.id == chamado_id, Chamado.id_cliente == cliente_id)
        .first()
    )
    if chamado is None:
        raise HTTPException(status_code=404, detail="Chamado não encontrado.")
    if chamado.status.status.casefold() != "aberto":
        raise HTTPException(status_code=409, detail="Somente chamados abertos podem ser editados.")
    if db.get(Prioridade, dados.id_prioridade) is None:
        raise HTTPException(status_code=404, detail="Prioridade não encontrada.")

    chamado.Titulo = dados.Titulo.strip()
    chamado.Descricao = dados.Descricao.strip()
    chamado.id_prioridade = dados.id_prioridade
    db.commit()
    db.refresh(chamado)
    return chamado


@app.get("/responsavel", response_model=list[ResponsavelResponse])
def list_responsavel(db: Session = Depends(get_db)) -> list[Responsavel]:
    """Lista os responsáveis disponíveis para atribuição e atendimento."""
    return db.query(Responsavel).all()


@app.get("/responsavel/{responsavel_id}/chamados", response_model=list[ChamadoResponse])
def list_chamados_responsavel(
    responsavel_id: int,
    db: Session = Depends(get_db),
) -> list[Chamado]:
    """Lista os chamados atualmente atribuídos ao responsável informado."""
    if db.get(Responsavel, responsavel_id) is None:
        raise HTTPException(status_code=404, detail="Responsável não encontrado.")
    return db.query(Chamado).filter(Chamado.id_responsavel == responsavel_id).all()


@app.patch("/responsavel/chamados/{chamado_id}", response_model=ChamadoResponse)
def update_chamado_responsavel(
    chamado_id: int,
    dados: ChamadoResponsavelUpdate,
    db: Session = Depends(get_db),
) -> Chamado:
    """Atualiza status, prioridade e responsável de um chamado."""
    chamado = db.get(Chamado, chamado_id)
    if chamado is None:
        raise HTTPException(status_code=404, detail="Chamado não encontrado.")
    status_novo = db.get(Status, dados.id_status)
    if status_novo is None:
        raise HTTPException(status_code=404, detail="Status não encontrado.")
    if db.get(Prioridade, dados.id_prioridade) is None:
        raise HTTPException(status_code=404, detail="Prioridade não encontrada.")
    if db.get(Responsavel, dados.id_responsavel) is None:
        raise HTTPException(status_code=404, detail="Responsável não encontrado.")

    status_anterior = chamado.status.status.casefold()
    status_anterior_finalizado = status_anterior in {"resolvido", "fechado"}

    chamado.id_status = dados.id_status
    chamado.id_prioridade = dados.id_prioridade
    chamado.id_responsavel = dados.id_responsavel
    status_novo_finalizado = status_novo.status.casefold() in {"resolvido", "fechado"}

    if status_novo_finalizado:
        # Registra uma única vez no mesmo fuso/forma da data de abertura.
        # Alterações posteriores em um chamado finalizado preservam esse horário.
        if not status_anterior_finalizado or chamado.data_hora_fechamento is None:
            chamado.data_hora_fechamento = dia_hora()
    else:
        # Ao reabrir o chamado, não deve permanecer uma data de fechamento.
        chamado.data_hora_fechamento = None
    db.commit()
    db.refresh(chamado)
    return chamado


@app.get("/prioridade", response_model=list[PrioridadeResponse])
def list_prioridade(db: Session = Depends(get_db)) -> list[Prioridade]:
    """Lista as prioridades disponíveis para os chamados."""
    return db.query(Prioridade).all()


@app.get("/status", response_model=list[StatusResponse])
def list_status(db: Session = Depends(get_db)) -> list[Status]:
    """Lista os status que podem ser usados no fluxo de atendimento."""
    return db.query(Status).all()
