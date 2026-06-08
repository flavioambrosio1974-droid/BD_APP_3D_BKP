const state = {
  resources: [],
  currentResource: "printers",
};

const el = {
  healthState: document.getElementById("healthState"),
  healthDetail: document.getElementById("healthDetail"),
  summaryCount: document.getElementById("summaryCount"),
  heroMetrics: document.getElementById("heroMetrics"),
  resourceChips: document.getElementById("resourceChips"),
  resourceSelect: document.getElementById("resourceSelect"),
  householdId: document.getElementById("householdId"),
  payloadInput: document.getElementById("payloadInput"),
  listOutput: document.getElementById("listOutput"),
  listHint: document.getElementById("listHint"),
  resourceForm: document.getElementById("resourceForm"),
  bootstrapBtn: document.getElementById("bootstrapBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
};

function prettyJson(value) {
  return JSON.stringify(value, null, 2);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  return response.json();
}

function renderResources(resources) {
  el.resourceSelect.innerHTML = resources
    .map((resource) => `<option value="${resource}">${resource}</option>`)
    .join("");
  el.resourceChips.innerHTML = resources
    .map((resource) => `<button class="chip" data-resource="${resource}" type="button">${resource}</button>`)
    .join("");
}

function renderMetrics(resources) {
  const metrics = [
    { label: "Recursos", value: resources.length },
    { label: "Backend", value: "ok" },
    { label: "Banco", value: "ok" },
    { label: "Visão", value: "privada" },
  ];
  el.heroMetrics.innerHTML = metrics
    .map(
      (metric) => `
      <div class="metric">
        <div class="label">${metric.label}</div>
        <div class="value">${metric.value}</div>
      </div>
    `,
    )
    .join("");
  el.summaryCount.textContent = resources.length;
}

async function loadResources() {
  const payload = await api("/api/resources");
  state.resources = payload.resources || [];
  state.currentResource = state.resources.includes(state.currentResource) ? state.currentResource : state.resources[0];
  renderResources(state.resources);
  renderMetrics(state.resources);
  el.listHint.textContent = state.currentResource;
  el.resourceSelect.value = state.currentResource;
  await loadList();
}

async function loadHealth() {
  try {
    const health = await api("/health");
    el.healthState.textContent = health.ok ? "Online" : "Offline";
    el.healthDetail.textContent = `DB: ${health.db}`;
  } catch (error) {
    el.healthState.textContent = "Erro";
    el.healthDetail.textContent = error.message;
  }
}

async function loadList() {
  const resource = el.resourceSelect.value || state.currentResource;
  state.currentResource = resource;
  el.listHint.textContent = resource;
  const householdId = Number(el.householdId.value || 1);
  try {
    const data = await api(`/api/${resource}?household_id=${householdId}&limit=10`);
    el.listOutput.textContent = prettyJson(data.items || []);
  } catch (error) {
    el.listOutput.textContent = `Erro ao carregar ${resource}\n\n${error.message}`;
  }
}

function setDefaultPayload(resource) {
  const templates = {
    households: { name: "Casa" },
    users: { household_id: 1, name: "Flavio", email: "flavio@casa.local", role: "admin", is_active: true },
    printers: {
      household_id: 1,
      name: "Bambu Lab A1",
      brand: "Bambu Lab",
      model: "A1",
      purchase_price_cents: 0,
      expected_lifetime_hours: 0,
      average_power_watts: 0,
      standby_power_watts: 0,
      is_active: true,
    },
    materials: {
      household_id: 1,
      name: "PLA Branco",
      material_type: "PLA",
      color: "Branco",
      spool_weight_g: 1000,
      is_active: true,
    },
    material_lots: {
      household_id: 1,
      material_id: 1,
      supplier_name: "Fornecedor",
      cost_cents: 0,
      gross_weight_g: 1000,
      remaining_weight_g: 1000,
    },
    energy_rates: {
      household_id: 1,
      name: "Tarifa padrão",
      price_per_kwh_cents: 0,
      effective_from: new Date().toISOString().slice(0, 10),
      is_active: true,
    },
    cost_settings: {
      household_id: 1,
      labor_rate_cents_per_hour: 0,
      monthly_overhead_cents: 0,
      default_margin_percent: 0,
      default_freight_subsidy_cents: 0,
    },
    packaging_items: { household_id: 1, name: "Caixa", unit: "unit", cost_cents: 0, is_active: true },
    sales_channels: { household_id: 1, name: "Direto", fee_percent: 0, fixed_fee_cents: 0, is_active: true },
    products: { household_id: 1, sku: "SKU-001", name: "Peça teste", description: "", target_margin_percent: 0, is_active: true },
    print_jobs: { household_id: 1, printer_id: 1, status: "planned", quantity: 1, failed: false },
    print_job_packaging_items: { print_job_id: 1, packaging_item_id: 1, quantity: 1, unit_cost_cents_snapshot: 0 },
    orders: { household_id: 1, status: "open", order_date: new Date().toISOString().slice(0, 10), shipping_cents: 0, discount_cents: 0 },
    order_items: { order_id: 1, quantity: 1, selling_price_cents: 0, estimated_cost_cents_snapshot: 0 },
    expenses: { household_id: 1, category: "geral", description: "Despesas", amount_cents: 0, occurred_on: new Date().toISOString().slice(0, 10) },
  };
  el.payloadInput.value = prettyJson(templates[resource] || { household_id: 1 });
}

function bindNav() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      if (button.dataset.panel === "dashboard") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (button.dataset.panel === "materials") {
        el.resourceSelect.value = "materials";
        setDefaultPayload("materials");
        loadList();
      } else if (button.dataset.panel === "printers") {
        el.resourceSelect.value = "printers";
        setDefaultPayload("printers");
        loadList();
      } else if (button.dataset.panel === "jobs") {
        el.resourceSelect.value = "print_jobs";
        setDefaultPayload("print_jobs");
        loadList();
      } else if (button.dataset.panel === "orders") {
        el.resourceSelect.value = "orders";
        setDefaultPayload("orders");
        loadList();
      }
    });
  });
}

function bindActions() {
  el.resourceSelect.addEventListener("change", () => {
    state.currentResource = el.resourceSelect.value;
    setDefaultPayload(state.currentResource);
    loadList();
  });

  el.bootstrapBtn.addEventListener("click", async () => {
    const result = await api("/api/bootstrap");
    el.healthDetail.textContent = `Household: ${result.name} (#${result.id})`;
    await loadList();
  });

  el.refreshBtn.addEventListener("click", loadList);

  el.resourceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const resource = el.resourceSelect.value;
    const payload = JSON.parse(el.payloadInput.value);
    await api(`/api/${resource}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await loadList();
  });

  el.resourceChips.addEventListener("click", (event) => {
    const button = event.target.closest("[data-resource]");
    if (!button) return;
    const resource = button.dataset.resource;
    el.resourceSelect.value = resource;
    state.currentResource = resource;
    setDefaultPayload(resource);
    loadList();
  });
}

async function main() {
  bindNav();
  bindActions();
  await loadHealth();
  await loadResources();
  setDefaultPayload(el.resourceSelect.value);
}

main().catch((error) => {
  console.error(error);
  el.listOutput.textContent = error.message;
});

