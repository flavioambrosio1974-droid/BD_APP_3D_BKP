const state = {
  resources: [],
  currentResource: "printers",
  printers: [],
  materials: [],
  materialLots: [],
  products: [],
  orders: [],
  salesChannels: [],
  packagingItems: [],
  users: [],
  printJobs: [],
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
  formsHint: document.getElementById("formsHint"),
  formsMode: document.getElementById("formsMode"),
  resourceTabs: document.getElementById("resourceTabs"),
  resourceFields: document.getElementById("resourceFields"),
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

const RESOURCE_FORM_DEFS = {
  households: {
    label: "Casa",
    hint: "Identifica a operação compartilhada.",
    scoped: false,
    fields: [
      { name: "name", label: "Nome", type: "text", required: true, span: "full" },
    ],
  },
  users: {
    label: "Usuários",
    hint: "Pessoas que trabalham na operação.",
    scoped: true,
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { name: "email", label: "E-mail", type: "text" },
      { name: "role", label: "Perfil", type: "select", options: ["admin", "operator", "viewer"], defaultValue: "operator" },
      { name: "is_active", label: "Ativo", type: "checkbox", defaultValue: true, span: "full" },
    ],
  },
  printers: {
    label: "Impressoras",
    hint: "Cadastre a máquina usada para produzir as peças.",
    scoped: true,
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { name: "brand", label: "Marca", type: "text" },
      { name: "model", label: "Modelo", type: "text" },
      { name: "nozzle_mm", label: "Bico (mm)", type: "number", step: 0.01 },
      { name: "build_width_mm", label: "Largura útil (mm)", type: "number", step: 1 },
      { name: "build_depth_mm", label: "Profundidade útil (mm)", type: "number", step: 1 },
      { name: "build_height_mm", label: "Altura útil (mm)", type: "number", step: 1 },
      { name: "purchase_price_cents", label: "Preço de compra (centavos)", type: "number", step: 1 },
      { name: "purchase_date", label: "Data de compra", type: "date" },
      { name: "expected_lifetime_hours", label: "Vida útil estimada (h)", type: "number", step: 1 },
      { name: "salvage_value_cents", label: "Valor residual (centavos)", type: "number", step: 1 },
      { name: "average_power_watts", label: "Potência média (W)", type: "number", step: 1 },
      { name: "standby_power_watts", label: "Standby (W)", type: "number", step: 1 },
      { name: "is_active", label: "Ativa", type: "checkbox", defaultValue: true, span: "full" },
    ],
  },
  materials: {
    label: "Materiais",
    hint: "Cadastre o tipo de filamento usado nos jobs.",
    scoped: true,
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { name: "material_type", label: "Tipo", type: "text", required: true },
      { name: "color", label: "Cor", type: "text" },
      { name: "density_g_cm3", label: "Densidade (g/cm³)", type: "number", step: 0.001 },
      { name: "spool_weight_g", label: "Peso do carretel (g)", type: "number", step: 1 },
      { name: "nozzle_temp_c", label: "Bico (°C)", type: "number", step: 1 },
      { name: "bed_temp_c", label: "Mesa (°C)", type: "number", step: 1 },
      { name: "is_active", label: "Ativo", type: "checkbox", defaultValue: true, span: "full" },
    ],
  },
  material_lots: {
    label: "Lotes de material",
    hint: "Registra o carretel comprado e o saldo restante.",
    scoped: true,
    fields: [
      { name: "material_id", label: "Material", type: "select", source: "materials", required: true },
      { name: "supplier_name", label: "Fornecedor", type: "text" },
      { name: "spool_code", label: "Código do carretel", type: "text" },
      { name: "purchased_at", label: "Data da compra", type: "date" },
      { name: "cost_cents", label: "Custo (centavos)", type: "number", step: 1, required: true },
      { name: "gross_weight_g", label: "Peso bruto (g)", type: "number", step: 1 },
      { name: "remaining_weight_g", label: "Peso restante (g)", type: "number", step: 1 },
      { name: "notes", label: "Notas", type: "textarea", span: "full" },
    ],
  },
  energy_rates: {
    label: "Tarifas de energia",
    hint: "Define o custo do kWh usado no cálculo.",
    scoped: true,
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { name: "price_per_kwh_cents", label: "Preço por kWh (centavos)", type: "number", step: 1, required: true },
      { name: "effective_from", label: "Vigente desde", type: "date" },
      { name: "is_active", label: "Ativa", type: "checkbox", defaultValue: true, span: "full" },
    ],
  },
  cost_settings: {
    label: "Configuração de custo",
    hint: "Margem padrão, mão de obra e frete.",
    scoped: true,
    fields: [
      { name: "labor_rate_cents_per_hour", label: "Mão de obra por hora (centavos)", type: "number", step: 1 },
      { name: "monthly_overhead_cents", label: "Custo fixo mensal (centavos)", type: "number", step: 1 },
      { name: "default_margin_percent", label: "Margem padrão (%)", type: "number", step: 0.1 },
      { name: "default_freight_subsidy_cents", label: "Subsídio padrão de frete (centavos)", type: "number", step: 1 },
    ],
  },
  packaging_items: {
    label: "Embalagens",
    hint: "Caixas, sacos, etiquetas e itens de envio.",
    scoped: true,
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { name: "unit", label: "Unidade", type: "text", defaultValue: "unit" },
      { name: "cost_cents", label: "Custo (centavos)", type: "number", step: 1 },
      { name: "is_active", label: "Ativo", type: "checkbox", defaultValue: true, span: "full" },
    ],
  },
  sales_channels: {
    label: "Canais de venda",
    hint: "Mercado livre, direto, Instagram, loja etc.",
    scoped: true,
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { name: "fee_percent", label: "Taxa (%)", type: "number", step: 0.1 },
      { name: "fixed_fee_cents", label: "Taxa fixa (centavos)", type: "number", step: 1 },
      { name: "is_active", label: "Ativo", type: "checkbox", defaultValue: true, span: "full" },
    ],
  },
  products: {
    label: "Produtos",
    hint: "Produtos/peças que vocês vendem.",
    scoped: true,
    fields: [
      { name: "sku", label: "SKU", type: "text" },
      { name: "name", label: "Nome", type: "text", required: true },
      { name: "description", label: "Descrição", type: "textarea", span: "full" },
      { name: "target_margin_percent", label: "Margem alvo (%)", type: "number", step: 0.1 },
      { name: "is_active", label: "Ativo", type: "checkbox", defaultValue: true, span: "full" },
    ],
  },
  print_jobs: {
    label: "Jobs de impressão",
    hint: "Produção real com custo e resultado.",
    scoped: true,
    fields: [
      { name: "product_id", label: "Produto", type: "select", source: "products" },
      { name: "printer_id", label: "Impressora", type: "select", source: "printers", required: true },
      { name: "primary_material_id", label: "Material", type: "select", source: "materials" },
      { name: "primary_material_lot_id", label: "Lote", type: "select", source: "materialLots" },
      { name: "requested_by_user_id", label: "Solicitado por", type: "select", source: "users" },
      { name: "status", label: "Status", type: "select", options: ["planned", "in_progress", "paused", "completed", "cancelled"], defaultValue: "planned" },
      { name: "quantity", label: "Quantidade", type: "number", step: 1, defaultValue: 1 },
      { name: "estimated_print_minutes", label: "Minutos estimados", type: "number", step: 0.1 },
      { name: "actual_print_minutes", label: "Minutos reais", type: "number", step: 0.1 },
      { name: "estimated_material_g", label: "Material estimado (g)", type: "number", step: 0.1 },
      { name: "actual_material_g", label: "Material real (g)", type: "number", step: 0.1 },
      { name: "support_material_g", label: "Suportes (g)", type: "number", step: 0.1 },
      { name: "purge_waste_g", label: "Purga/perdas (g)", type: "number", step: 0.1 },
      { name: "post_process_minutes", label: "Pós-processo (min)", type: "number", step: 0.1 },
      { name: "avg_power_watts", label: "Potência média (W)", type: "number", step: 1 },
      { name: "failed", label: "Falhou", type: "checkbox", defaultValue: false, span: "full" },
      { name: "failure_reason", label: "Motivo da falha", type: "text", span: "full" },
      { name: "started_at", label: "Início", type: "datetime-local" },
      { name: "finished_at", label: "Fim", type: "datetime-local" },
      { name: "notes", label: "Notas", type: "textarea", span: "full" },
    ],
  },
  print_job_packaging_items: {
    label: "Embalagens do job",
    hint: "Ligação entre job e embalagem usada.",
    scoped: false,
    fields: [
      { name: "print_job_id", label: "Job", type: "select", source: "printJobs", required: true },
      { name: "packaging_item_id", label: "Embalagem", type: "select", source: "packagingItems", required: true },
      { name: "quantity", label: "Quantidade", type: "number", step: 1, defaultValue: 1 },
      { name: "unit_cost_cents_snapshot", label: "Custo unitário snapshot (centavos)", type: "number", step: 1 },
    ],
  },
  orders: {
    label: "Pedidos",
    hint: "Pedido fechado ou em aberto para venda.",
    scoped: true,
    fields: [
      { name: "sales_channel_id", label: "Canal de venda", type: "select", source: "salesChannels" },
      { name: "customer_name", label: "Cliente", type: "text" },
      { name: "customer_reference", label: "Referência", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["open", "quoted", "paid", "shipped", "completed", "cancelled"], defaultValue: "open" },
      { name: "order_date", label: "Data do pedido", type: "date" },
      { name: "shipping_cents", label: "Frete (centavos)", type: "number", step: 1 },
      { name: "discount_cents", label: "Desconto (centavos)", type: "number", step: 1 },
      { name: "notes", label: "Notas", type: "textarea", span: "full" },
    ],
  },
  order_items: {
    label: "Itens do pedido",
    hint: "Linha de pedido associada a produto e job.",
    scoped: false,
    fields: [
      { name: "order_id", label: "Pedido", type: "select", source: "orders", required: true },
      { name: "product_id", label: "Produto", type: "select", source: "products" },
      { name: "print_job_id", label: "Job", type: "select", source: "printJobs" },
      { name: "quantity", label: "Quantidade", type: "number", step: 1, defaultValue: 1 },
      { name: "selling_price_cents", label: "Preço de venda (centavos)", type: "number", step: 1, required: true },
      { name: "estimated_cost_cents_snapshot", label: "Custo estimado snapshot (centavos)", type: "number", step: 1 },
    ],
  },
  expenses: {
    label: "Despesas",
    hint: "Gastos gerais fora do job.",
    scoped: true,
    fields: [
      { name: "category", label: "Categoria", type: "text", required: true },
      { name: "description", label: "Descrição", type: "text", required: true },
      { name: "amount_cents", label: "Valor (centavos)", type: "number", step: 1, required: true },
      { name: "occurred_on", label: "Data", type: "date" },
    ],
  },
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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function nowLocalInputValue() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getResourceDefinition(resource) {
  return RESOURCE_FORM_DEFS[resource] || {
    label: resource,
    hint: "Cadastro genérico.",
    scoped: true,
    fields: [],
  };
}

function getResourceOptions(source) {
  const data = {
    printers: state.printers,
    materials: state.materials,
    materialLots: state.materialLots,
    products: state.products,
    orders: state.orders,
    salesChannels: state.salesChannels,
    packagingItems: state.packagingItems,
    users: state.users,
    printJobs: state.printJobs,
  }[source] || [];

  return data.map((item) => {
    const labelParts = [
      item.name,
      item.sku,
      item.brand,
      item.model,
      item.status,
    ].filter(Boolean);
    const fallback = item.id ? `#${item.id}` : "item";
    return {
      value: String(item.id),
      label: labelParts.length ? `${labelParts[0]}${labelParts[1] ? ` (${labelParts[1]})` : ""}` : fallback,
    };
  });
}

function renderResourceTabs(resources) {
  const safeResources = resources.length ? resources : Object.keys(RESOURCE_FORM_DEFS);
  el.resourceTabs.innerHTML = safeResources
    .map((resource) => {
      const def = getResourceDefinition(resource);
      return `<button type="button" class="resource-tab" data-resource="${resource}">${def.label}</button>`;
    })
    .join("");
}

function setActiveResourceTab(resource) {
  el.resourceTabs.querySelectorAll(".resource-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.resource === resource);
  });
}

function fieldDefaultValue(resource, field) {
  if (field.name === "household_id") {
    return Number(el.householdId.value || 1);
  }
  if (field.defaultValue !== undefined) {
    return typeof field.defaultValue === "function" ? field.defaultValue(resource, field) : field.defaultValue;
  }
  if (field.type === "date") {
    return todayISO();
  }
  if (field.type === "datetime-local") {
    return nowLocalInputValue();
  }
  if (field.type === "checkbox") {
    return false;
  }
  if (field.type === "number") {
    return "";
  }
  if (field.type === "select") {
    const options = field.options || getResourceOptions(field.source);
    return options.length ? options[0].value || options[0] : "";
  }
  return "";
}

function renderField(field, resource) {
  const spanClass = field.span === "full" ? "full" : "";
  const required = field.required ? "required" : "";
  const defaultValue = fieldDefaultValue(resource, field);

  if (field.type === "checkbox") {
    return `
      <label class="toggle-field ${spanClass}">
        <span>${field.label}${field.required ? " *" : ""}</span>
        <input data-field="${field.name}" type="checkbox" ${defaultValue ? "checked" : ""} />
      </label>
    `;
  }

  if (field.type === "textarea") {
    return `
      <label class="${spanClass}">
        ${field.label}${field.required ? " *" : ""}
        <textarea data-field="${field.name}" rows="4" ${required}>${defaultValue || ""}</textarea>
      </label>
    `;
  }

  if (field.type === "select") {
    const options = field.options || getResourceOptions(field.source);
    const optionMarkup = [
      `<option value="">Selecione...</option>`,
      ...options.map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        const selected = String(defaultValue) === String(value) ? "selected" : "";
        return `<option value="${value}" ${selected}>${label}</option>`;
      }),
    ].join("");
    return `
      <label class="${spanClass}">
        ${field.label}${field.required ? " *" : ""}
        <select data-field="${field.name}" ${required}>${optionMarkup}</select>
      </label>
    `;
  }

  const valueAttr = defaultValue === "" || defaultValue === null || defaultValue === undefined ? "" : `value="${defaultValue}"`;
  const stepAttr = field.step !== undefined ? `step="${field.step}"` : "";
  const minAttr = field.min !== undefined ? `min="${field.min}"` : "";
  return `
    <label class="${spanClass}">
      ${field.label}${field.required ? " *" : ""}
      <input data-field="${field.name}" type="${field.type}" ${valueAttr} ${stepAttr} ${minAttr} ${required} />
    </label>
  `;
}

function renderResourceForm(resource) {
  const def = getResourceDefinition(resource);
  el.formsTitle.textContent = def.label;
  el.formsHint.textContent = def.hint;
  el.formsMode.textContent = def.scoped ? "com casa" : "avançado";
  el.resourceSelect.value = resource;
  setActiveResourceTab(resource);

  const fields = [];
  if (def.scoped) {
    fields.push({
      name: "household_id",
      label: "Household ID",
      type: "number",
      step: 1,
      required: true,
      defaultValue: () => Number(el.householdId.value || 1),
      span: "full",
    });
  }
  fields.push(...def.fields);

  el.resourceFields.innerHTML = fields.length
    ? fields.map((field) => renderField(field, resource)).join("")
    : `<div class="empty-state">Não há campos configurados para este recurso.</div>`;
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
  renderResourceTabs(resources);
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

function resourcePanelName(resource) {
  if (resource === "materials" || resource === "material_lots") return "materials";
  if (resource === "printers") return "printers";
  if (resource === "print_jobs" || resource === "print_job_packaging_items") return "jobs";
  if (resource === "orders" || resource === "order_items") return "orders";
  return null;
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
  renderResourceForm(resource);
  loadList();
  if (panelName) {
    setActiveNav(panelName);
  }
  setView("resource");
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
  renderResourceForm(state.currentResource);
  await loadList();
}

async function loadSetupStatus() {
  const householdId = Number(el.householdId.value || 1);
  const status = await api(`/api/setup-status?household_id=${householdId}`);
  renderSetupStatus(status);
}

async function loadSimulatorLookups() {
  const householdId = Number(el.householdId.value || 1);
  const [printersPayload, materialsPayload, lotsPayload, productsPayload, ordersPayload, salesChannelsPayload, packagingItemsPayload, usersPayload, printJobsPayload] = await Promise.all([
    api(`/api/printers?household_id=${householdId}&limit=50`),
    api(`/api/materials?household_id=${householdId}&limit=50`),
    api(`/api/material_lots?household_id=${householdId}&limit=50`),
    api(`/api/products?household_id=${householdId}&limit=50`),
    api(`/api/orders?household_id=${householdId}&limit=50`),
    api(`/api/sales_channels?household_id=${householdId}&limit=50`),
    api(`/api/packaging_items?household_id=${householdId}&limit=50`),
    api(`/api/users?household_id=${householdId}&limit=50`),
    api(`/api/print_jobs?household_id=${householdId}&limit=50`),
  ]);

  state.printers = printersPayload.items || [];
  state.materials = materialsPayload.items || [];
  state.materialLots = lotsPayload.items || [];
  state.products = productsPayload.items || [];
  state.orders = ordersPayload.items || [];
  state.salesChannels = salesChannelsPayload.items || [];
  state.packagingItems = packagingItemsPayload.items || [];
  state.users = usersPayload.items || [];
  state.printJobs = printJobsPayload.items || [];
  renderSimulatorOptions();
  renderResourceForm(state.currentResource);

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

function parseFieldValue(field, input) {
  if (field.type === "checkbox") {
    return input.checked;
  }
  if (field.type === "number") {
    if (input.value === "") return null;
    return Number(input.value);
  }
  if (field.type === "select") {
    return input.value === "" ? null : Number.isNaN(Number(input.value)) ? input.value : Number(input.value);
  }
  if (field.type === "textarea" || field.type === "text" || field.type === "date" || field.type === "datetime-local") {
    return input.value || null;
  }
  return input.value || null;
}

function collectResourcePayload(resource) {
  const def = getResourceDefinition(resource);
  const fields = [];
  if (def.scoped) {
    fields.push({
      name: "household_id",
      type: "number",
    });
  }
  fields.push(...def.fields);

  const payload = {};
  for (const field of fields) {
    const input = el.resourceFields.querySelector(`[data-field="${field.name}"]`);
    if (!input) continue;
    const value = parseFieldValue(field, input);
    if (value !== null && value !== undefined && value !== "") {
      payload[field.name] = value;
    } else if (field.type === "checkbox") {
      payload[field.name] = false;
    }
  }
  return payload;
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
    renderResourceForm(state.currentResource);
    loadList();
  });

  el.householdId.addEventListener("change", async () => {
    renderResourceForm(state.currentResource);
    await loadSetupStatus();
    await loadSimulatorLookups();
    await loadList();
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
    const payload = collectResourcePayload(resource);
    if (!payload.household_id && getResourceDefinition(resource).scoped) {
      payload.household_id = Number(el.householdId.value || 1);
    }
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
    const panelName = resourcePanelName(resource);
    if (panelName) setActiveNav(panelName);
    focusResource(resource, panelName);
  });

  el.resourceTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-resource]");
    if (!button) return;
    const resource = button.dataset.resource;
    const panelName = resourcePanelName(resource);
    if (panelName) setActiveNav(panelName);
    focusResource(resource, panelName);
  });
}

async function main() {
  bindNav();
  bindActions();
  await loadHealth();
  await loadSetupStatus();
  await loadResources();
  await loadSimulatorLookups();
  renderResourceForm(el.resourceSelect.value);
  setView("dashboard");
}

main().catch((error) => {
  console.error(error);
  el.listOutput.textContent = error.message;
});
