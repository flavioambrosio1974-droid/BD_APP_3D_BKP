from fastapi import FastAPI, Query, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict

from .config import get_settings
from .crud import (
    bootstrap_household,
    create_record,
    delete_record,
    get_record,
    healthcheck,
    list_records,
    list_resources,
    update_record,
)

settings = get_settings()

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")


class Payload(BaseModel):
    model_config = ConfigDict(extra="allow")


@app.get("/health")
def health():
    row = healthcheck()
    return {"ok": True, "db": row["ok"]}


@api.get("/health")
def api_health():
    return health()


@api.get("/resources")
def resources():
    return {"resources": list_resources()}


@api.get("/bootstrap")
def bootstrap():
    return bootstrap_household()


@api.get("/{resource}")
def list_items(
    resource: str,
    household_id: int | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    return {"items": list_records(resource, household_id=household_id, limit=limit, offset=offset)}


@api.get("/{resource}/{item_id}")
def read_item(resource: str, item_id: int):
    return get_record(resource, item_id)


@api.post("/{resource}")
def create_item(resource: str, payload: Payload):
    return create_record(resource, payload.model_dump())


@api.patch("/{resource}/{item_id}")
def update_item(resource: str, item_id: int, payload: Payload):
    return update_record(resource, item_id, payload.model_dump(exclude_unset=True))


@api.delete("/{resource}/{item_id}")
def delete_item(resource: str, item_id: int):
    return delete_record(resource, item_id)


app.include_router(api)
