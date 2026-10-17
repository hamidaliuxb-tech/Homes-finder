import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, Eye, ShieldCheck, FileText, Check, X, Search, AlertCircle, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, fileUrl } from "@/lib/apiClient";

export default function CustomersTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetAgentId, setTargetAgentId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/admin/customers")
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggle = async (c) => {
    const to = c.status === "disabled" ? "enable" : "disable";
    if (!window.confirm(`${to === "disable" ? "Disable" : "Enable"} ${c.name}'s account?`)) return;
    try {
      await api.post(`/admin/customers/${c.id}/status`, { reason: to });
      toast.success(`Account ${to}d`);
      load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleApproveAgent = async (agentId, name) => {
    if (!window.confirm(`Approve agent credentials for ${name}? This will activate their account and grant permission to list properties.`)) return;
    try {
      await api.post(`/admin/agents/${agentId}/approve`);
      toast.success(`Agent ${name} approved successfully!`);
      if (selectedAgent?.id === agentId) setSelectedAgent(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to approve agent");
    }
  };

  const handleRejectAgent = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please enter a reason or required changes");
      return;
    }
    try {
      await api.post(`/admin/agents/${targetAgentId}/reject`, { reason: rejectReason });
      toast.success("Agent status updated to changes required");
      setRejectModalOpen(false);
      setRejectReason("");
      setTargetAgentId(null);
      if (selectedAgent?.id === targetAgentId) setSelectedAgent(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to update agent");
    }
  };

  // Filtered customer items
  const filteredItems = items.filter((c) => {
    const isAgent = (c.user_type || "").toLowerCase().includes("agent") || (c.user_type || "").toLowerCase().includes("broker");
    if (filterType === "agents") {
      if (!isAgent) return false;
    } else if (filterType === "pending_agents") {
      if (!isAgent || c.agent_verified) return false;
    } else if (filterType === "owners") {
      if (isAgent) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.mobile || "").toLowerCase().includes(q) ||
      (c.company || "").toLowerCase().includes(q) ||
      (c.emirate || "").toLowerCase().includes(q)
    );
  });

  const pendingAgentsCount = items.filter(
    (c) => ((c.user_type || "").toLowerCase().includes("agent") || (c.user_type || "").toLowerCase().includes("broker")) && !c.agent_verified
  ).length;

  return (
    <div data-testid="customers-tab" className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="font-serif text-xl font-bold text-slate-900">User Accounts &amp; Agent Verifications</h2>
          <p className="text-xs text-slate-500">Manage registered customers, review agent Trade Licences &amp; Broker Cards, and authorize listings.</p>
        </div>
        <div className="w-full sm:w-72 relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by name, email, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setFilterType("all")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            filterType === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All Users ({items.length})
        </button>
        <button
          onClick={() => setFilterType("pending_agents")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            filterType === "pending_agents" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5" /> Pending Verification ({pendingAgentsCount})
        </button>
        <button
          onClick={() => setFilterType("agents")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            filterType === "agents" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Agents &amp; Brokers
        </button>
        <button
          onClick={() => setFilterType("owners")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            filterType === "owners" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Landlords &amp; Buyers
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-slate-500 py-6 text-center">Loading accounts…</p>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          No accounts found matching this filter.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto shadow-xs">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left border-b border-slate-100">
              <tr>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">User / Contact</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Type / Agency</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Verification Status</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Listings</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Account</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((c) => {
                const isAgent = (c.user_type || "").toLowerCase().includes("agent") || (c.user_type || "").toLowerCase().includes("broker");
                const hasDocs = Boolean(c.agent_documents?.trade_licence || c.agent_documents?.broker_card);

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors" data-testid={`customer-row-${c.id}`}>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.email} · {c.mobile}</div>
                      <div className="text-xs text-slate-400">{c.emirate || c.location || "UAE"}</div>
                    </td>

                    <td className="p-4">
                      <div className="font-medium text-slate-800 text-xs">{c.user_type}</div>
                      {c.company && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="h-3 w-3 text-slate-400" /> {c.company}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      {isAgent ? (
                        c.agent_verified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Approved Agent
                          </span>
                        ) : hasDocs ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" /> Pending Approval
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Docs Missing
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          {c.email_verified ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="text-slate-400">Unverified</span>}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-600 text-xs">
                      <strong className="text-slate-900">{c.property_count || 0}</strong> total
                      <div className="text-[11px] text-slate-400">{c.live_count || 0} live · {c.pending_count || 0} pending</div>
                    </td>

                    <td className="p-4">
                      <Badge className={c.status === "disabled" ? "bg-red-100 text-red-700 hover:bg-red-100" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"}>
                        {c.status}
                      </Badge>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isAgent && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedAgent(c)}
                              className="h-8 px-2.5 text-xs text-slate-700 hover:bg-slate-100"
                              title="View Trade Licence & Broker Card"
                            >
                              <FileText className="h-3.5 w-3.5 mr-1 text-amber-600" /> Docs
                            </Button>

                            {!c.agent_verified && (
                              <Button
                                size="sm"
                                onClick={() => handleApproveAgent(c.id, c.name)}
                                className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                                title="Approve Agent"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" /> Approve
                              </Button>
                            )}
                          </>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggle(c)}
                          className={`h-8 w-8 p-0 ${c.status === "disabled" ? "hover:text-emerald-600" : "hover:text-red-600"}`}
                          title={c.status === "disabled" ? "Enable Account" : "Disable Account"}
                          data-testid={`toggle-customer-${c.id}`}
                        >
                          {c.status === "disabled" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Ban className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Agent Credentials & Documents Viewer Modal */}
      {selectedAgent && (
        <Dialog open={!!selectedAgent} onOpenChange={(o) => !o && setSelectedAgent(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" /> Agent Verification Documents: {selectedAgent.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs grid grid-cols-2 gap-2">
                <div><span className="text-slate-400">Email:</span> <strong>{selectedAgent.email}</strong></div>
                <div><span className="text-slate-400">Mobile:</span> <strong>{selectedAgent.mobile}</strong></div>
                <div><span className="text-slate-400">Company / Agency:</span> <strong>{selectedAgent.company || "Independent"}</strong></div>
                <div><span className="text-slate-400">Emirate:</span> <strong>{selectedAgent.emirate || "Dubai"}</strong></div>
              </div>

              <div className="space-y-3">
                <div className="p-3 border border-slate-200 rounded-lg">
                  <div className="text-xs font-semibold text-slate-800 mb-1">1. Trade Licence</div>
                  {selectedAgent.agent_documents?.trade_licence ? (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-600 font-mono truncate max-w-[280px]">
                        {selectedAgent.agent_documents.trade_licence_filename || selectedAgent.agent_documents.trade_licence}
                      </span>
                      <a
                        href={fileUrl(selectedAgent.agent_documents.trade_licence)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                      >
                        View Licence File
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700">No Trade Licence uploaded yet.</p>
                  )}
                  {selectedAgent.agent_documents?.trade_licence_number && (
                    <div className="text-xs text-slate-500 mt-1">Licence Number: <strong>{selectedAgent.agent_documents.trade_licence_number}</strong></div>
                  )}
                </div>

                <div className="p-3 border border-slate-200 rounded-lg">
                  <div className="text-xs font-semibold text-slate-800 mb-1">2. Broker Card (RERA Card)</div>
                  {selectedAgent.agent_documents?.broker_card ? (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-600 font-mono truncate max-w-[280px]">
                        {selectedAgent.agent_documents.broker_card_filename || selectedAgent.agent_documents.broker_card}
                      </span>
                      <a
                        href={fileUrl(selectedAgent.agent_documents.broker_card)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                      >
                        View Broker Card
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700">No Broker Card uploaded yet.</p>
                  )}
                  {selectedAgent.agent_documents?.broker_number && (
                    <div className="text-xs text-slate-500 mt-1">Broker Number (BRN): <strong>{selectedAgent.agent_documents.broker_number}</strong></div>
                  )}
                </div>
              </div>

              {selectedAgent.rejection_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                  <strong>Previous Revision Note:</strong> {selectedAgent.rejection_reason}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setSelectedAgent(null)}>Close</Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTargetAgentId(selectedAgent.id);
                    setRejectModalOpen(true);
                  }}
                  className="text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" /> Request Changes
                </Button>
                <Button
                  onClick={() => handleApproveAgent(selectedAgent.id, selectedAgent.name)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  <Check className="h-4 w-4 mr-1" /> Approve Agent
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject / Request Changes Modal */}
      {rejectModalOpen && (
        <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-lg">Request Updated Credentials</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-xs text-slate-600">
                Please describe the issue with the submitted documents (e.g. expired broker card, illegible trade licence scan):
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-amber-500"
                placeholder="e.g. Please provide a clear copy of your valid 2026 RERA Broker Card..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
              <Button onClick={handleRejectAgent} className="bg-red-600 hover:bg-red-500 text-white font-semibold">
                Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
