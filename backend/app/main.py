from fastapi import FastAPI, Query, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict

from .config import get_settings
from .db import fetch_one
from .crud import (
    bootstrap_household,
    create_record,
    delete_record,
    get_record,
    healthcheck,
    get_setup_status,
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


class EstimatePayload(BaseModel):
    household_id: int
    printer_id: int
    primary_material_lot_id: int | None = None
    estimated_print_minutes: float | None = None
    actual_print_minutes: float | None = None
    material_g: float = 0
    support_material_g: float = 0
    purge_waste_g: float = 0
    post_process_minutes: float = 0
    quantity: int = 1
    override_power_watts: float | None = None
    freight_subsidy_cents: int | None = None
    margin_percent: float | None = None


@app.get("/health")
def health():
    row = healthcheck()
    return {"ok": True, "db": row["ok"]}


@api.get("/health")
def api_health():
    return health()


@api.get("/auth-config")
def auth_config():
    return {"enabled": False}


@api.get("/me")
def me():
    return {"authenticated": False, "user": None}


@api.get("/resources")
def resources():
    return {"resources": list_resources()}


@api.get("/bootstrap")
def bootstrap():
    return bootstrap_household()


@api.get("/setup-status")
def setup_status(household_id: int = 1):
    return get_setup_status(household_id)


@api.post("/estimate-print-job")
def estimate_print_job(payload: EstimatePayload):
    printer = fetch_one(
        "select * from printers where id = %s and household_id = %s",
        (payload.printer_id, payload.household_id),
    )
    if printer is None:
        raise HTTPException(status_code=404, detail="printer not found")

    settings_row = fetch_one(
        "select * from cost_settings where household_id = %s order by id desc limit 1",
        (payload.household_id,),
    ) or {}
    energy_rate = fetch_one(
        """
        select price_per_kwh_cents
        from energy_rates
        where household_id = %s and is_active = true
        order by effective_from desc, id desc
        limit 1
        """,
        (payload.household_id,),
    ) or {"price_per_kwh_cents": 0}

    material_lot = None
    if payload.primary_material_lot_id is not None:
        material_lot = fetch_one(
            "select * from material_lots where id = %s and household_id = %s",
            (payload.primary_material_lot_id, payload.household_id),
        )
        if material_lot is None:
            raise HTTPException(status_code=404, detail="material lot not found")

    print_minutes = payload.actual_print_minutes or payload.estimated_print_minutes or 0
    print_hours = max(print_minutes, 0) / 60.0
    quantity = max(payload.quantity, 1)
    consumed_g = max(payload.material_g, 0) + max(payload.support_material_g, 0) + max(payload.purge_waste_g, 0)
    consumed_g *= quantity

    material_cost_cents = 0
    warnings: list[str] = []
    if material_lot is not None:
        gross_weight_g = float(material_lot["gross_weight_g"] or 0)
        remaining_weight_g = float(material_lot["remaining_weight_g"] or 0)
        if gross_weight_g <= 0:
            warnings.append("lote sem peso bruto para calcular o custo do material")
        else:
            cost_per_g = float(material_lot["cost_cents"] or 0) / gross_weight_g
            material_cost_cents = round(cost_per_g * consumed_g)
            if remaining_weight_g and consumed_g > remaining_weight_g:
                warnings.append("consumo informado maior que o saldo restante do lote")
    elif consumed_g > 0:
        warnings.append("selecione um lote para calcular o custo do material")

    power_watts = float(payload.override_power_watts or printer["average_power_watts"] or 0)
    energy_cost_cents = round((power_watts * print_hours * quantity / 1000.0) * float(energy_rate["price_per_kwh_cents"] or 0))

    purchase_price_cents = float(printer["purchase_price_cents"] or 0)
    salvage_value_cents = float(printer["salvage_value_cents"] or 0)
    lifetime_hours = float(printer["expected_lifetime_hours"] or 0)
    depreciation_cost_cents = 0
    if lifetime_hours > 0:
        depreciation_cost_cents = round(((purchase_price_cents - salvage_value_cents) / lifetime_hours) * print_hours * quantity)
    else:
        warnings.append("impressora sem vida útil configurada")

    labor_rate_cents_per_hour = float(settings_row.get("labor_rate_cents_per_hour") or 0)
    labor_cost_cents = round((max(payload.post_process_minutes, 0) / 60.0) * labor_rate_cents_per_hour * quantity)

    freight_subsidy_cents = (
        payload.freight_subsidy_cents
        if payload.freight_subsidy_cents is not None
        else int(settings_row.get("default_freight_subsidy_cents") or 0)
    )
    margin_percent = payload.margin_percent if payload.margin_percent is not None else float(settings_row.get("default_margin_percent") or 0)

    direct_cost_cents = int(material_cost_cents + energy_cost_cents + depreciation_cost_cents + labor_cost_cents + freight_subsidy_cents)
    total_with_margin_cents = None
    if margin_percent < 100:
        total_with_margin_cents = round(direct_cost_cents / (1 - (margin_percent / 100.0)))

    return {
        "household_id": payload.household_id,
        "printer_id": payload.printer_id,
        "printer_name": printer["name"],
        "material_lot_id": payload.primary_material_lot_id,
        "quantity": quantity,
        "consumed_g": round(consumed_g, 2),
        "print_minutes": round(print_minutes, 2),
        "breakdown_cents": {
            "material": material_cost_cents,
            "energy": energy_cost_cents,
            "depreciation": depreciation_cost_cents,
            "labor": labor_cost_cents,
            "freight_subsidy": freight_subsidy_cents,
            "monthly_overhead": int(settings_row.get("monthly_overhead_cents") or 0),
        },
        "direct_cost_cents": direct_cost_cents,
        "suggested_sale_price_cents": total_with_margin_cents,
        "margin_percent": margin_percent,
        "energy_rate_cents_per_kwh": int(energy_rate["price_per_kwh_cents"] or 0),
        "warnings": warnings,
    }


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
