from fastapi import HTTPException

from .db import execute, fetch_all, fetch_one, get_connection
from .resources import RESOURCE_CONFIG


def list_resources():
    return sorted(RESOURCE_CONFIG.keys())


def healthcheck():
    return fetch_one("select 1 as ok")


def bootstrap_household():
    existing = fetch_one("select id, name from households order by id asc limit 1")
    if existing:
        return existing

    created = fetch_one(
        "insert into households (name) values (%s) returning id, name, created_at",
        ("Casa",),
    )
    if created is None:
        raise HTTPException(status_code=500, detail="failed to bootstrap household")

    fetch_one(
        "insert into cost_settings (household_id, labor_rate_cents_per_hour, monthly_overhead_cents, default_margin_percent, default_freight_subsidy_cents) values (%s, 0, 0, 0, 0) returning id",
        (created["id"],),
    )
    return created


def _require_resource(resource: str):
    config = RESOURCE_CONFIG.get(resource)
    if not config:
        raise HTTPException(status_code=404, detail=f"unknown resource: {resource}")
    return config


def _validate_required(payload: dict, required: list[str]):
    missing = [field for field in required if field not in payload or payload[field] is None]
    if missing:
        raise HTTPException(status_code=422, detail={"missing": missing})


def list_records(resource: str, household_id: int | None = None, limit: int = 100, offset: int = 0):
    config = _require_resource(resource)
    table = config["table"]
    if limit < 1:
        limit = 1
    if limit > 500:
        limit = 500

    if household_id is not None and config["filterable_by_household"]:
        return fetch_all(
            f"select * from {table} where household_id = %s order by id desc limit %s offset %s",
            (household_id, limit, offset),
        )

    return fetch_all(f"select * from {table} order by id desc limit %s offset %s", (limit, offset))


def get_record(resource: str, item_id: int):
    config = _require_resource(resource)
    row = fetch_one(f"select * from {config['table']} where id = %s", (item_id,))
    if row is None:
        raise HTTPException(status_code=404, detail="record not found")
    return row


def create_record(resource: str, payload: dict):
    config = _require_resource(resource)
    _validate_required(payload, config["required"])

    columns = [field for field in config["fields"] if field in payload]
    if not columns:
        raise HTTPException(status_code=422, detail="no writable fields supplied")

    values = [payload[column] for column in columns]
    placeholders = ", ".join(["%s"] * len(columns))
    cols_sql = ", ".join(columns)
    sql = f"insert into {config['table']} ({cols_sql}) values ({placeholders}) returning *"
    return fetch_one(sql, tuple(values))


def update_record(resource: str, item_id: int, payload: dict):
    config = _require_resource(resource)
    columns = [field for field in config["fields"] if field in payload]
    if not columns:
        raise HTTPException(status_code=422, detail="no writable fields supplied")

    set_sql = ", ".join([f"{field} = %s" for field in columns])
    values = [payload[column] for column in columns]
    values.append(item_id)
    if config.get("touch_updated_at", True):
        sql = f"update {config['table']} set {set_sql}, updated_at = now() where id = %s returning *"
    else:
        sql = f"update {config['table']} set {set_sql} where id = %s returning *"
    updated = fetch_one(sql, tuple(values))
    if updated is None:
        raise HTTPException(status_code=404, detail="record not found")
    return updated


def delete_record(resource: str, item_id: int):
    config = _require_resource(resource)
    deleted = fetch_one(f"delete from {config['table']} where id = %s returning id", (item_id,))
    if deleted is None:
        raise HTTPException(status_code=404, detail="record not found")
    return {"deleted": True, "id": deleted["id"]}
