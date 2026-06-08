BEGIN;

CREATE TABLE households (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id bigint NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'member',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE TABLE printers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id bigint NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  model text,
  nozzle_mm numeric(4,2),
  build_width_mm integer,
  build_depth_mm integer,
  build_height_mm integer,
  purchase_price_cents bigint NOT NULL DEFAULT 0,
  purchase_date date,
  expected_lifetime_hours numeric(12,2) NOT NULL DEFAULT 0,
  salvage_value_cents bigint NOT NULL DEFAULT 0,
  average_power_watts numeric(12,2) NOT NULL DEFAULT 0,
  standby_power_watts numeric(12,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE materials (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id bigint NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name text NOT NULL,
  material_type text NOT NULL,
  color text,
  density_g_cm3 numeric(10,4),
  spool_weight_g numeric(10,2) NOT NULL DEFAULT 1000,
  nozzle_temp_c integer,
  bed_temp_c integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE material_lots (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id bigint NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  material_id bigint NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  supplier_name text,
  spool_code text,
  purchased_at date,
  cost_cents bigint NOT NULL DEFAULT 0,
  gross_weight_g numeric(10,2) NOT NULL DEFAULT 0,
  remaining_weight_g numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE energy_rates (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id bigint NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_per_kwh_cents bigint NOT NULL,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cost_settings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id bigint NOT NULL UNIQUE REFERENCES households(id) ON DELETE CASCADE,
  labor_rate_cents_per_hour bigint NOT NULL DEFAULT 0,
  monthly_overhead_cents bigint NOT NULL DEFAULT 0,
  default_margin_percent numeric(6,3) NOT NULL DEFAULT 0,
  default_freight_subsidy_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE packaging_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id bigint NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'unit',
  cost_cents bigint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sales_channels (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id bigint NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name text NOT NULL,
  fee_percent numeric(6,3) NOT NULL DEFAULT 0,
  fixed_fee_cents bigint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id bigint NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  sku text,
  name text NOT NULL,
  description text,
  target_margin_percent numeric(6,3) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_sku_unique UNIQUE (household_id, sku)
);

CREATE TABLE print_jobs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id bigint NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  product_id bigint REFERENCES products(id) ON DELETE SET NULL,
  printer_id bigint NOT NULL REFERENCES printers(id) ON DELETE RESTRICT,
  primary_material_id bigint REFERENCES materials(id) ON DELETE SET NULL,
  primary_material_lot_id bigint REFERENCES material_lots(id) ON DELETE SET NULL,
  requested_by_user_id bigint REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'planned',
  quantity integer NOT NULL DEFAULT 1,
  estimated_print_minutes numeric(12,2) NOT NULL DEFAULT 0,
  actual_print_minutes numeric(12,2) NOT NULL DEFAULT 0,
  estimated_material_g numeric(12,2) NOT NULL DEFAULT 0,
  actual_material_g numeric(12,2) NOT NULL DEFAULT 0,
  support_material_g numeric(12,2) NOT NULL DEFAULT 0,
  purge_waste_g numeric(12,2) NOT NULL DEFAULT 0,
  post_process_minutes numeric(12,2) NOT NULL DEFAULT 0,
  avg_power_watts numeric(12,2),
  failed boolean NOT NULL DEFAULT false,
  failure_reason text,
  started_at timestamptz,
  finished_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE print_job_packaging_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  print_job_id bigint NOT NULL REFERENCES print_jobs(id) ON DELETE CASCADE,
  packaging_item_id bigint NOT NULL REFERENCES packaging_items(id) ON DELETE RESTRICT,
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit_cost_cents_snapshot bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id bigint NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  sales_channel_id bigint REFERENCES sales_channels(id) ON DELETE SET NULL,
  customer_name text,
  customer_reference text,
  status text NOT NULL DEFAULT 'open',
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  shipping_cents bigint NOT NULL DEFAULT 0,
  discount_cents bigint NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id bigint REFERENCES products(id) ON DELETE SET NULL,
  print_job_id bigint REFERENCES print_jobs(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  selling_price_cents bigint NOT NULL DEFAULT 0,
  estimated_cost_cents_snapshot bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE expenses (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id bigint NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text NOT NULL,
  amount_cents bigint NOT NULL,
  occurred_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_household_id ON users(household_id);
CREATE INDEX idx_printers_household_id ON printers(household_id);
CREATE INDEX idx_materials_household_id ON materials(household_id);
CREATE INDEX idx_material_lots_material_id ON material_lots(material_id);
CREATE INDEX idx_print_jobs_household_id ON print_jobs(household_id);
CREATE INDEX idx_print_jobs_printer_id ON print_jobs(printer_id);
CREATE INDEX idx_orders_household_id ON orders(household_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

CREATE OR REPLACE VIEW v_print_job_cost_estimate AS
SELECT
  pj.id AS print_job_id,
  pj.household_id,
  pj.status,
  pj.quantity,
  pj.estimated_print_minutes,
  pj.actual_print_minutes,
  pj.estimated_material_g,
  pj.actual_material_g,
  pj.support_material_g,
  pj.purge_waste_g,
  pj.post_process_minutes,
  pj.avg_power_watts,
  p.purchase_price_cents,
  p.expected_lifetime_hours,
  er.price_per_kwh_cents,
  cs.labor_rate_cents_per_hour,
  mlt.cost_cents AS lot_cost_cents,
  mlt.gross_weight_g AS lot_gross_weight_g,
  CASE
    WHEN mlt.id IS NOT NULL AND mlt.gross_weight_g > 0
      THEN (pj.actual_material_g + pj.support_material_g + pj.purge_waste_g) * (mlt.cost_cents::numeric / mlt.gross_weight_g)
    ELSE 0
  END AS material_cost_cents,
  CASE
    WHEN COALESCE(pj.avg_power_watts, p.average_power_watts) > 0 AND er.price_per_kwh_cents IS NOT NULL
      THEN ((COALESCE(pj.actual_print_minutes, pj.estimated_print_minutes) / 60.0) * (COALESCE(pj.avg_power_watts, p.average_power_watts) / 1000.0) * er.price_per_kwh_cents)
    ELSE 0
  END AS energy_cost_cents,
  CASE
    WHEN p.expected_lifetime_hours > 0
      THEN ((COALESCE(pj.actual_print_minutes, pj.estimated_print_minutes) / 60.0) * ((p.purchase_price_cents - p.salvage_value_cents)::numeric / p.expected_lifetime_hours))
    ELSE 0
  END AS depreciation_cost_cents,
  CASE
    WHEN cs.labor_rate_cents_per_hour IS NOT NULL
      THEN ((COALESCE(pj.post_process_minutes, 0) / 60.0) * cs.labor_rate_cents_per_hour)
    ELSE 0
  END AS labor_cost_cents,
  COALESCE(cs.monthly_overhead_cents, 0) AS monthly_overhead_cents,
  COALESCE(cs.default_margin_percent, 0) AS default_margin_percent,
  COALESCE(cs.default_freight_subsidy_cents, 0) AS default_freight_subsidy_cents
FROM print_jobs pj
JOIN printers p ON p.id = pj.printer_id
LEFT JOIN material_lots mlt ON mlt.id = pj.primary_material_lot_id
LEFT JOIN cost_settings cs ON cs.household_id = pj.household_id
LEFT JOIN LATERAL (
  SELECT er2.price_per_kwh_cents
  FROM energy_rates er2
  WHERE er2.household_id = pj.household_id AND er2.is_active = true
  ORDER BY er2.effective_from DESC, er2.id DESC
  LIMIT 1
) er ON true;

CREATE OR REPLACE VIEW v_order_profit AS
SELECT
  o.id AS order_id,
  o.household_id,
  o.order_date,
  o.shipping_cents,
  o.discount_cents,
  COALESCE(SUM(oi.quantity * oi.selling_price_cents), 0) AS gross_revenue_cents,
  COALESCE(SUM(oi.quantity * oi.estimated_cost_cents_snapshot), 0) AS item_cost_cents,
  COALESCE(o.shipping_cents, 0) AS shipping_revenue_or_cost_cents,
  COALESCE(o.discount_cents, 0) AS discount_cents_total
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id;

COMMIT;
