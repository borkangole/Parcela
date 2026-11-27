// Parcela database schema (Phase 1: inventory, agents, buyers, inquiries, sales, accounting)
//
// Rules:
// - Money is numeric(14, 2), never a float. Drizzle returns numeric columns as strings,
//   so do money math with integers (centavos) or a decimal library, not JS floats.
// - Financial records are never deleted. Payments are voided, contracts are cancelled.
// - Installment status (Paid / Partial / Due / Past Due) is computed from payments, not stored.
// - Login tables (users, sessions, accounts) live in auth-schema.ts and are re-exported here.
import { createId } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

const id = () => text("id").primaryKey().$defaultFn(() => createId());
const money = (name: string) => numeric(name, { precision: 14, scale: 2 });
const sqm = (name: string) => numeric(name, { precision: 12, scale: 3 });
const percent = (name: string) => numeric(name, { precision: 5, scale: 2 });
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

// ─────────────────────────── Inventory ───────────────────────────

export const projects = pgTable("projects", {
  id: id(),
  name: text("name").notNull().unique(),
  location: text("location"),
  grossArea: sqm("gross_area").notNull(),
  notes: text("notes"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const blocks = pgTable(
  "blocks",
  {
    id: id(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    name: text("name").notNull(), // "1", "2A", "2B", "3", "4"
    area: sqm("area").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("blocks_project_name_key").on(t.projectId, t.name)],
);

export const lotType = pgEnum("lot_type", ["SALEABLE", "ROAD_RIGHT_OF_WAY", "EASEMENT", "EXCLUDED"]);

// UNAVAILABLE = on hold, removed from the plan, or not for sale
export const lotStatus = pgEnum("lot_status", ["AVAILABLE", "RESERVED", "SOLD", "UNAVAILABLE"]);

export const lots = pgTable(
  "lots",
  {
    id: id(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    blockId: text("block_id").references(() => blocks.id), // null for roads, easements, excluded areas
    code: text("code").notNull(), // "466-A"
    type: lotType("type").notNull().default("SALEABLE"),
    status: lotStatus("status").notNull().default("AVAILABLE"),
    area: sqm("area").notNull(),
    pricePerSqm: money("price_per_sqm"),
    totalPrice: money("total_price"),
    titleNo: text("title_no"), // TCT number of this lot's title, if separately titled
    taxDeclarationNo: text("tax_declaration_no"),
    geometry: jsonb("geometry"), // GeoJSON polygon for the lot map (Phase 2)
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("lots_project_code_key").on(t.projectId, t.code),
    index("lots_status_idx").on(t.status),
  ],
);

// ─────────────────────────── People ───────────────────────────

export const agents = pgTable("agents", {
  id: id(),
  // The agent's login account. Empty until an admin creates a login for this agent.
  userId: text("user_id")
    .unique()
    .references(() => user.id),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  email: text("email").unique(),
  // This agent's own rate, e.g. 5.00 = 5%. Leave empty to use the commission rule's rate.
  commissionRate: percent("commission_rate"),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// Buyers are records only. They never log in.
export const buyers = pgTable("buyers", {
  id: id(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const inquiryStatus = pgEnum("inquiry_status", ["NEW", "FOLLOWING_UP", "RESERVED", "LOST"]);

export const inquiries = pgTable(
  "inquiries",
  {
    id: id(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id),
    lotId: text("lot_id").references(() => lots.id),
    clientName: text("client_name").notNull(),
    phone: text("phone"),
    status: inquiryStatus("status").notNull().default("NEW"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("inquiries_agent_status_idx").on(t.agentId, t.status)],
);

// ─────────────────────────── Sales ───────────────────────────

// RESERVED = reservation fee paid · ACTIVE = paying installments · COMPLETED = fully paid
export const contractStatus = pgEnum("contract_status", ["RESERVED", "ACTIVE", "COMPLETED", "CANCELLED"]);

// Who shoulders a tax or fee. Empty (null) = not agreed yet.
export const taxParty = pgEnum("tax_party", ["SELLER", "BUYER", "SHARED"]);

// Closing steps after full payment, in order.
export const titleTransferStatus = pgEnum("title_transfer_status", [
  "NOT_STARTED",
  "DEED_SIGNED", // Deed of Absolute Sale signed and notarized
  "TAXES_PAID", // CGT/DST paid, BIR issued the CAR/eCAR, transfer tax paid
  "SUBMITTED_TO_REGISTRY", // documents filed with the Registry of Deeds
  "TRANSFERRED", // new title issued in the buyer's name
]);

export const contracts = pgTable(
  "contracts",
  {
    id: id(),
    contractNo: text("contract_no").notNull().unique(),
    lotId: text("lot_id")
      .notNull()
      .references(() => lots.id),
    buyerId: text("buyer_id")
      .notNull()
      .references(() => buyers.id),
    agentId: text("agent_id").references(() => agents.id),
    status: contractStatus("status").notNull().default("RESERVED"),
    totalPrice: money("total_price").notNull(),
    reservationFee: money("reservation_fee").notNull().default("0"),
    downPayment: money("down_payment").notNull().default("0"),
    termMonths: integer("term_months").notNull().default(0),
    interestRate: percent("interest_rate").notNull().default("0"), // annual %
    penaltyRate: percent("penalty_rate").notNull().default("0"), // % per month late
    monthlyAmortization: money("monthly_amortization").notNull().default("0"),
    reservedAt: timestamp("reserved_at", { withTimezone: true }).notNull().defaultNow(),
    reservationExpiresAt: timestamp("reservation_expires_at", { withTimezone: true }),
    startDate: timestamp("start_date", { withTimezone: true }),

    // Taxes and fees: who pays, as agreed in the contract
    cgtPaidBy: taxParty("cgt_paid_by"), // Capital Gains Tax
    dstPaidBy: taxParty("dst_paid_by"), // Documentary Stamp Tax
    transferTaxPaidBy: taxParty("transfer_tax_paid_by"),
    registrationFeesPaidBy: taxParty("registration_fees_paid_by"),

    // Closing and title transfer (after full payment)
    titleTransferStatus: titleTransferStatus("title_transfer_status").notNull().default("NOT_STARTED"),
    deedSignedAt: timestamp("deed_signed_at", { withTimezone: true }),
    titleTransferredAt: timestamp("title_transferred_at", { withTimezone: true }),
    newTitleNo: text("new_title_no"), // title number issued in the buyer's name

    // Cancellation is always a manual, approved step, never automatic.
    // Installment buyers are protected by the Maceda Law (RA 6552): grace periods and,
    // after 2+ years of payments, a refund (cash surrender value) of part of what they paid.
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledById: text("cancelled_by_id"), // user who approved it (linked after auth is added)
    cancelReason: text("cancel_reason"),
    refundAmount: money("refund_amount"),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("contracts_status_idx").on(t.status),
    // A lot can have only one contract that isn't cancelled. The database itself refuses a
    // second reservation, even if two people click "Reserve" on the same lot at the same time.
    uniqueIndex("contracts_one_open_per_lot")
      .on(t.lotId)
      .where(sql`${t.status} <> 'CANCELLED'`),
  ],
);

// ─────────────────────────── Accounting ───────────────────────────

export const installments = pgTable(
  "installments",
  {
    id: id(),
    contractId: text("contract_id")
      .notNull()
      .references(() => contracts.id),
    number: integer("number").notNull(), // 0 = down payment, 1..n = monthly
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    amountDue: money("amount_due").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("installments_contract_number_key").on(t.contractId, t.number),
    index("installments_due_date_idx").on(t.dueDate),
  ],
);

export const paymentMethod = pgEnum("payment_method", ["CASH", "BANK_TRANSFER", "GCASH", "CHECK", "OTHER"]);

export const payments = pgTable(
  "payments",
  {
    id: id(),
    contractId: text("contract_id")
      .notNull()
      .references(() => contracts.id),
    receiptNo: text("receipt_no").notNull().unique(),
    amount: money("amount").notNull(),
    method: paymentMethod("method").notNull(),
    referenceNo: text("reference_no"),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    recordedById: text("recorded_by_id"), // user who entered it (linked after auth is added)

    // A payment counts toward the buyer's balance only after accounting verifies it.
    // Unverified = verifiedAt is empty.
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedById: text("verified_by_id"),

    // Never delete a payment; void it (with a reason) so the history stays complete.
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidedById: text("voided_by_id"),
    voidReason: text("void_reason"),
    createdAt: createdAt(),
  },
  (t) => [index("payments_contract_paid_at_idx").on(t.contractId, t.paidAt)],
);

// What the commission percentage is applied to.
export const commissionBasis = pgEnum("commission_basis", [
  "CONTRACT_PRICE", // % of the selling price
  "AMOUNT_COLLECTED", // % of what the buyer has actually paid so far
]);

// When the agent becomes entitled to the commission.
export const commissionTrigger = pgEnum("commission_trigger", [
  "ON_RESERVATION",
  "ON_DOWN_PAYMENT",
  "ON_PERCENT_PAID", // after the buyer has paid triggerPercent of the price
  "ON_FULL_PAYMENT",
]);

// The company's commission policy, set by the owner instead of hard-coded in the app.
export const commissionRules = pgTable("commission_rules", {
  id: id(),
  name: text("name").notNull().unique(), // "Standard"
  rate: percent("rate").notNull(), // e.g. 3.00 = 3%
  basis: commissionBasis("basis").notNull().default("CONTRACT_PRICE"),
  trigger: commissionTrigger("trigger").notNull().default("ON_DOWN_PAYMENT"),
  triggerPercent: percent("trigger_percent"), // only for ON_PERCENT_PAID
  isDefault: boolean("is_default").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// PENDING = sale made, conditions not met yet · ELIGIBLE = earned, ready to pay · PAID
export const commissionStatus = pgEnum("commission_status", ["PENDING", "ELIGIBLE", "PAID", "CANCELLED"]);

export const commissions = pgTable("commissions", {
  id: id(),
  contractId: text("contract_id")
    .notNull()
    .references(() => contracts.id),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id),
  ruleId: text("rule_id").references(() => commissionRules.id),
  // Copied from the rule when the sale is made, so a later policy change
  // doesn't change commissions on deals that already happened.
  rate: percent("rate").notNull(),
  basis: commissionBasis("basis").notNull(),
  amount: money("amount").notNull(),
  status: commissionStatus("status").notNull().default("PENDING"),
  eligibleAt: timestamp("eligible_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  paymentReference: text("payment_reference"),
  createdAt: createdAt(),
});

// ─────────────────────────── Audit ───────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    actorId: text("actor_id"), // user who made the change (linked after auth is added)
    action: text("action").notNull(), // "lot.status_changed", "payment.voided", ...
    entity: text("entity").notNull(), // "lot", "payment", ...
    entityId: text("entity_id").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: createdAt(),
  },
  (t) => [
    index("audit_logs_entity_idx").on(t.entity, t.entityId),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ],
);

// ─────────────────────────── Relations (for db.query) ───────────────────────────

export const projectsRelations = relations(projects, ({ many }) => ({
  blocks: many(blocks),
  lots: many(lots),
}));

export const blocksRelations = relations(blocks, ({ one, many }) => ({
  project: one(projects, { fields: [blocks.projectId], references: [projects.id] }),
  lots: many(lots),
}));

export const lotsRelations = relations(lots, ({ one, many }) => ({
  project: one(projects, { fields: [lots.projectId], references: [projects.id] }),
  block: one(blocks, { fields: [lots.blockId], references: [blocks.id] }),
  contracts: many(contracts),
  inquiries: many(inquiries),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  user: one(user, { fields: [agents.userId], references: [user.id] }),
  inquiries: many(inquiries),
  contracts: many(contracts),
  commissions: many(commissions),
}));

export const buyersRelations = relations(buyers, ({ many }) => ({
  contracts: many(contracts),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  agent: one(agents, { fields: [inquiries.agentId], references: [agents.id] }),
  lot: one(lots, { fields: [inquiries.lotId], references: [lots.id] }),
}));

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  lot: one(lots, { fields: [contracts.lotId], references: [lots.id] }),
  buyer: one(buyers, { fields: [contracts.buyerId], references: [buyers.id] }),
  agent: one(agents, { fields: [contracts.agentId], references: [agents.id] }),
  installments: many(installments),
  payments: many(payments),
  commissions: many(commissions),
}));

export const installmentsRelations = relations(installments, ({ one }) => ({
  contract: one(contracts, { fields: [installments.contractId], references: [contracts.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  contract: one(contracts, { fields: [payments.contractId], references: [contracts.id] }),
}));

export const commissionRulesRelations = relations(commissionRules, ({ many }) => ({
  commissions: many(commissions),
}));

export const commissionsRelations = relations(commissions, ({ one }) => ({
  contract: one(contracts, { fields: [commissions.contractId], references: [contracts.id] }),
  agent: one(agents, { fields: [commissions.agentId], references: [agents.id] }),
  rule: one(commissionRules, { fields: [commissions.ruleId], references: [commissionRules.id] }),
}));