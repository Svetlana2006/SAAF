"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button, Panel } from "@saaf/ui/institutional/InstitutionUI";

type Organization = { csrOrganizationId: string; name: string; email: string; approvedFundingBudget: number | null; committedAmount: number; availableFunding: number | null; overAllocatedAmount: number | null };
const money = (value: number | null) => value == null ? "Not set" : `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function CsrBudgetManager() {
  const [organizations, setOrganizations] = useState<Organization[]>([]); const [budgets, setBudgets] = useState<Record<string, string>>({});
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState("");
  const refresh = useCallback(async () => {
    try { const response = await fetch("/api/admin/csr-organizations", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Could not load CSR budgets."); setOrganizations(data.organizations); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Network error loading budgets."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  async function update(event: FormEvent<HTMLFormElement>, organizationId: string) {
    event.preventDefault(); setBusy(organizationId); setError(""); setNotice("");
    const approvedFundingBudget = Number(budgets[organizationId]);
    try {
      const response = await fetch(`/api/admin/csr-organizations/${encodeURIComponent(organizationId)}/budget`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approvedFundingBudget }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Could not update this budget.");
      setNotice(`Approved commitment budget updated for ${organizationId}.`); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Network error updating budget."); }
    finally { setBusy(""); }
  }
  return <section><h2>Approved CSR commitment budgets</h2><p>Update the organization ceiling used to validate new internal funding commitments.</p>{error && <Panel><p role="alert">{error}</p></Panel>}{notice && <Panel><p role="status">{notice}</p></Panel>}{loading && <p>Loading CSR budgets…</p>}{!loading && !error && organizations.length === 0 && <Panel><p>No CSR organizations have been approved yet.</p></Panel>}{organizations.map(organization => <Panel key={organization.csrOrganizationId}><h3>{organization.name}</h3><p>{organization.email} · Committed {money(organization.committedAmount)} · Available {money(organization.availableFunding)}</p>{organization.overAllocatedAmount != null && organization.overAllocatedAmount > 0 && <p role="alert">Commitments exceed the approved budget by {money(organization.overAllocatedAmount)}.</p>}<form onSubmit={event => void update(event, organization.csrOrganizationId)} style={{ display: "flex", alignItems: "end", gap: 8, flexWrap: "wrap" }}><label>Approved total commitment budget (₹)<input type="number" min="0.01" max="100000000" step="0.01" required value={budgets[organization.csrOrganizationId] ?? (organization.approvedFundingBudget?.toString() ?? "")} onChange={event => setBudgets(values => ({ ...values, [organization.csrOrganizationId]: event.target.value }))} /></label><Button disabled={busy === organization.csrOrganizationId || !Number.isFinite(Number(budgets[organization.csrOrganizationId] ?? organization.approvedFundingBudget)) || Number(budgets[organization.csrOrganizationId] ?? organization.approvedFundingBudget) <= 0}>{busy === organization.csrOrganizationId ? "Saving…" : "Save approved budget"}</Button></form></Panel>)}</section>;
}
