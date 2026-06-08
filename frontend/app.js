const state = {
  resources: [],
  currentResource: "printers",
  printers: [],
  materials: [],
  materialLots: [],
  lastEstimate: null,
  setupStatus: null,
  activeView: "dashboard",
};

const el = {
  healthState: document.getElementById("healthState"),
  healthDetail: document.getElementById("healthDetail"),
  summaryCount: document.getElementById("summaryCount"),
  heroMetrics: document.getElementById("heroMetrics"),
  resourceChips: document.getElementById("resourceChips"),
  dashboardPanel: document.getElementById("dashboardPanel"),
  simulatorPanel: document.getElementById("simulatorPanel"),
  formsPanel: document.getElementById("formsPanel"),
  listPanel: document.getElementById("listPanel"),
  formsTitle: document.getElementById("formsTitle"),
  setupProgressLabel: document.getElementById("setupProgressLabel"),
  setupSummary: document.getElementById("setupSummary"),
  setupProgressBar: document.getElementById("setupProgressBar"),
  setupChecklist: document.getElementById("setupChecklist"),
  setupNextLabel: document.getElementById("setupNextLabel"),
  setupNextDetail: document.getElementById("setupNextDetail"),
  setupActionBtn: document.getElementById("setupActionBtn"),
  setupBootstrapBtn: document.getElementById("setupBootstrapBtn"),
  resourceSelect: document.getElementById("resourceSelect"),
  householdId: document.getElementById("householdId"),
  payloadInput: document.getElementById("payloadInput"),
  listOutput: document.getElementById("listOutput"),
  listHint: document.getElementById("listHint"),
  resourceForm: document.getElementById("resourceForm"),
  bootstrapBtn: document.getElementById("bootstrapBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  simulatorForm: document.getElementById("simulatorForm"),
  simPrinterSelect: document.getElementById("simPrinterSelect"),
  simLotSelect: document.getElementById("simLotSelect"),
  simPrintMinutes: document.getElementById("simPrintMinutes"),
  simMaterialG: document.getElementById("simMaterialG"),
  simSupportG: document.getElementById("simSupportG"),
  simPurgeG: document.getElementById("simPurgeG"),
  simPostMinutes: document.getElementById("simPostMinutes"),
  simQuantity: document.getElementById("simQuantity"),
  simMarginPercent: document.getElementById("simMarginPercent"),
  simFreightSubsidy: document.getElementById("simFreightSubsidy"),
  simRefreshBtn: document.getElementById("simRefreshBtn"),
  estimateCards: document.getElementById("estimateCards"),
  estimateOutput: document.getElementById("estimateOutput"),
};

function prettyJson(value) {
  return JSON.stringify(value, null, 2);
}

function formatCurrency(cents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((Number(cents) || 0) / 100);
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

function setActiveNav(panelName) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.panel === panelName);
  });
}

function setView(viewName) {
  state.activeView = viewName;
  const isDashboard = viewName === "dashboard";
  el.dashboardPanel.classList.toggle("hidden", !isDashboard);
  el.simulatorPanel.classList.toggle("hidden", !isDashboard);
  el.formsPanel.classList.toggle("hidden", isDashboard);
  el.listPanel.classList.toggle("hidden", isDashboard);
}

function setupStepDetail(resource) {
  const details = {
    bootstrap: "Cria a casa/equipe e a configuração de custo base.",
    cost_settings: "Define hora de trabalho, margem padrão e subsídio de frete.",
    printers: "Registra a impressora que vai produzir as peças.",
    materials: "Registra o tipo de filamento usado.",
    material_lots: "Registra o lote físico comprado e o custo por peso.",
    energy_rates: "Registra a tarifa de energia usada no cálculo.",
    products: "Registra o item que vocês vão vender.",
    print_jobs: "Registra uma produção real com custo e resultado.",
  };
  return details[resource] || "Abra o cadastro correspondente.";
}

function openSetupResource(step) {
  if (!step) return;
  if (step.resource === "bootstrap") {
    el.setupBootstrapBtn.click();
    return;
  }
  if (step.resource === "print_jobs") {
    focusResource("print_jobs", "jobs");
    return;
  }
  focusResource(step.resource, step.resource);
}

function focusResource(resource, panelName = "materials") {
  el.resourceSelect.value = resource;
  state.currentResource = resource;
  setDefaultPayload(resource);
  loadList();
  setActiveNav(panelName);
  setView("resource");
  el.formsTitle.textContent = `Cadastro - ${resource}`;
  el.formsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderSetupStatus(status) {
  state.setupStatus = status;
  if (!status) return;

  const progress = Number(status.progress || 0);
  el.setupProgressLabel.textContent = `${progress}%`;
  el.setupSummary.textContent = status.ready
    ? "Tudo pronto para simular custo e começar a registrar produção."
    : `Faltam ${status.steps.filter((step) => !step.done).length} passos para liberar o fluxo completo.`;
  el.setupProgressBar.style.width = `${progress}%`;
  el.setupChecklist.innerHTML = status.steps
    .map(
      (step) => `
        <li>
          <strong>${step.label}</strong>
          <span>${step.done ? "feito" : "pendente"}</span>
        </li>
      `,
    )
    .join("");
  el.setupNextLabel.textContent = status.next_step?.label || "-";
  el.setupNextDetail.textContent = setupStepDetail(status.next_step?.resource);
  el.setupActionBtn.textContent = status.ready ? "Ir para o simulador" : "Abrir próximo cadastro";
}

function renderSimulatorOptions() {
  const materialById = new Map(state.materials.map((material) => [material.id, material]));

  el.simPrinterSelect.innerHTML = state.printers
    .map((printer) => `<option value="${printer.id}">${printer.name || `Impressora #${printer.id}`}</option>`)
    .join("");

  el.simLotSelect.innerHTML = state.materialLots
    .map((lot) => {
      const material = materialById.get(lot.material_id);
      const label = material?.name || `Material #${lot.material_id}`;
      const remaining = lot.remaining_weight_g ?? lot.gross_weight_g ?? 0;
      return `<option value="${lot.id}">${label} - lote #${lot.id} (${remaining}g)</option>`;
    })
    .join("");

  if (!state.printers.length) {
    el.simPrinterSelect.innerHTML = `<option value="">Nenhuma impressora</option>`;
  }
  if (!state.materialLots.length) {
    el.simLotSelect.innerHTML = `<option value="">Nenhum lote</option>`;
  }
}

function renderEstimate(result) {
  const cards = [
    { label: "Custo direto", value: formatCurrency(result.direct_cost_cents), tone: "good" },
    { label: "Preço sugerido", value: result.suggested_sale_price_cents == null ? "sem margem" : formatCurrency(result.suggested_sale_price_cents), tone: "good" },
    { label: "Material", value: formatCurrency(result.breakdown_cents?.material), tone: "" },
    { label: "Energia + depreciação", value: formatCurrency((result.breakdown_cents?.energy || 0) + (result.breakdown_cents?.depreciation || 0)), tone: "" },
  ];

  el.estimateCards.innerHTML = cards
    .map(
      (card) => `
        <article class="estimate-card ${card.tone}">
          <div class="label">${card.label}</div>
          <div class="value">${card.value}</div>
        </article>
      `,
    )
    .join("");

  const warnings = result.warnings && result.warnings.length
    ? `<ul class="warning-list">${result.warnings.map((warning) => `<li>${warning}</li>`).join("")}</ul>`
    : "";
  el.estimateOutput.innerHTML = `${warnings}<div class="estimate-json">${prettyJson(result)}</div>`;
}

async function loadResources() {
  const payload = await api("/api/resources");
  state.resources = payload.resources || [];
  state.currentResource = state.resources.includes(state.currentResource) ? state.currentResource : state.resources[0];
  renderResources(state.resources);
  renderMetrics(state.resources);
  el.listHint.textContent = state.currentResource;
  el.resourceSelect.value = state.currentResource;
  el.formsTitle.textContent = `Cadastro - ${state.currentResource}`;
  await loadList();
}

async function loadSetupStatus() {
  const householdId = Number(el.householdId.value || 1);
  const status = await api(`/api/setup-status?household_id=${householdId}`);
  renderSetupStatus(status);
}

async function loadSimulatorLookups() {
  const householdId = Number(el.householdId.value || 1);
  const [printersPayload, materialsPayload, lotsPayload] = await Promise.all([
    api(`/api/printers?household_id=${householdId}&limit=50`),
    api(`/api/materials?household_id=${householdId}&limit=50`),
    api(`/api/material_lots?household_id=${householdId}&limit=50`),
  ]);

  state.printers = printersPayload.items || [];
  state.materials = materialsPayload.items || [];
  state.materialLots = lotsPayload.items || [];
  renderSimulatorOptions();

  if (state.printers.length) {
    el.simPrinterSelect.value = state.printers[0].id;
  }
  if (state.materialLots.length) {
    el.simLotSelect.value = state.materialLots[0].id;
  }
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
      if (button.dataset.panel === "dashboard") {
        setActiveNav("dashboard");
        setView("dashboard");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (button.dataset.panel === "materials") {
        focusResource("materials", "materials");
      } else if (button.dataset.panel === "printers") {
        focusResource("printers", "printers");
      } else if (button.dataset.panel === "jobs") {
        focusResource("print_jobs", "jobs");
      } else if (button.dataset.panel === "orders") {
        focusResource("orders", "orders");
      }
    });
  });
}

function bindActions() {
  el.resourceSelect.addEventListener("change", () => {
    state.currentResource = el.resourceSelect.value;
    setDefaultPayload(state.currentResource);
    el.formsTitle.textContent = `Cadastro - ${state.currentResource}`;
    loadList();
  });

  el.bootstrapBtn.addEventListener("click", async () => {
    const result = await api("/api/bootstrap");
    el.healthDetail.textContent = `Household: ${result.name} (#${result.id})`;
    await loadSetupStatus();
    await loadSimulatorLookups();
    await loadList();
  });

  el.refreshBtn.addEventListener("click", loadList);

  el.setupActionBtn.addEventListener("click", async () => {
    if (state.setupStatus?.ready) {
      setView("dashboard");
      setActiveNav("dashboard");
      document.getElementById("simulatorPanel").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (state.setupStatus?.next_step) {
      openSetupResource(state.setupStatus.next_step);
    }
  });

  el.setupBootstrapBtn.addEventListener("click", async () => {
    await api("/api/bootstrap");
    await loadSetupStatus();
    await loadSimulatorLookups();
    await loadResources();
  });

  el.simRefreshBtn.addEventListener("click", loadSimulatorLookups);

  el.simulatorForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      household_id: Number(el.householdId.value || 1),
      printer_id: Number(el.simPrinterSelect.value),
      primary_material_lot_id: el.simLotSelect.value ? Number(el.simLotSelect.value) : null,
      estimated_print_minutes: Number(el.simPrintMinutes.value || 0),
      material_g: Number(el.simMaterialG.value || 0),
      support_material_g: Number(el.simSupportG.value || 0),
      purge_waste_g: Number(el.simPurgeG.value || 0),
      post_process_minutes: Number(el.simPostMinutes.value || 0),
      quantity: Number(el.simQuantity.value || 1),
      margin_percent: el.simMarginPercent.value ? Number(el.simMarginPercent.value) : null,
      freight_subsidy_cents: el.simFreightSubsidy.value ? Number(el.simFreightSubsidy.value) : null,
    };
    const result = await api("/api/estimate-print-job", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.lastEstimate = result;
    renderEstimate(result);
  });

  el.resourceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const resource = el.resourceSelect.value;
    const payload = JSON.parse(el.payloadInput.value);
    await api(`/api/${resource}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await loadSetupStatus();
    await loadSimulatorLookups();
    await loadList();
  });

  el.resourceChips.addEventListener("click", (event) => {
    const button = event.target.closest("[data-resource]");
    if (!button) return;
    const resource = button.dataset.resource;
    setActiveNav(resource === "materials" ? "materials" : resource === "printers" ? "printers" : resource === "print_jobs" ? "jobs" : resource === "orders" ? "orders" : "dashboard");
    focusResource(resource, resource === "print_jobs" ? "jobs" : resource);
  });
}

async function main() {
  bindNav();
  bindActions();
  await loadHealth();
  await loadSetupStatus();
  await loadResources();
  await loadSimulatorLookups();
  setDefaultPayload(el.resourceSelect.value);
  setView("dashboard");
}

main().catch((error) => {
  console.error(error);
  el.listOutput.textContent = error.message;
});
