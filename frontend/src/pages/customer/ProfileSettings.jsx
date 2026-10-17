import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck, AlertTriangle, Clock, UploadCloud,
  FileText, CheckCircle2, ExternalLink, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";

export default function ProfileSettings() {
  const { user, checkAuth } = useAuth();
  const [f, setF] = useState({ name: "", mobile: "", country: "", emirate: "", location: "", company: "", user_type: "" });
  const [pw, setPw] = useState({ current_password: "", new_password: "" });

  // Agent verification document state
  const isAgent = user?.user_type === "Agent / Broker";
  const [agentDocs, setAgentDocs] = useState({
    trade_licence_number: "",
    broker_number: "",
    trade_licence: "",
    broker_card: "",
  });
  const [uploadingDoc, setUploadingDoc] = useState(null); // 'trade_licence' | 'broker_card' | null
  const [submittingDocs, setSubmittingDocs] = useState(false);

  useEffect(() => {
    if (user) {
      setF({
        name: user.name || "",
        mobile: user.mobile || "",
        country: user.country || "",
        emirate: user.emirate || "",
        location: user.location || "",
        company: user.company || "",
        user_type: user.user_type || "",
      });

      const docs = user.agent_documents || {};
      setAgentDocs({
        trade_licence_number: docs.trade_licence_number || "",
        broker_number: docs.broker_number || "",
        trade_licence: docs.trade_licence || "",
        broker_card: docs.broker_card || "",
      });
    }
  }, [user]);

  const saveProfile = async () => {
    try {
      await api.put("/auth/profile", f);
      toast.success("Profile updated");
      checkAuth();
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const changePw = async () => {
    try {
      await api.put("/auth/change-password", pw);
      toast.success("Password changed");
      setPw({ current_password: "", new_password: "" });
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  const handleUploadFile = async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(docType);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);

    try {
      const res = await api.post("/auth/upload-agent-document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAgentDocs((prev) => ({
        ...prev,
        [docType]: res.data.url,
      }));
      toast.success(`${docType === "trade_licence" ? "Trade Licence" : "Broker Card"} uploaded!`);
      checkAuth();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to upload file");
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSaveDocs = async () => {
    setSubmittingDocs(true);
    try {
      await api.post("/auth/agent-documents", agentDocs);
      toast.success("Agent credentials submitted for Homes Finder review!");
      checkAuth();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit documents");
    } finally {
      setSubmittingDocs(false);
    }
  };

  return (
    <div data-testid="profile-settings" className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-serif text-3xl font-bold text-slate-900">Profile &amp; Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account information, security, and verification documents.</p>
      </div>

      {/* AGENT VERIFICATION SECTION */}
      {isAgent && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-sm" data-testid="agent-verification-card">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              <h2 className="font-serif text-xl font-semibold text-slate-900">Agent Verification &amp; Credentials</h2>
            </div>
            {user?.agent_verified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> Approved Agent / Broker
              </span>
            ) : user?.status === "changes_required" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <AlertTriangle className="h-3.5 w-3.5" /> Action Required
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                <Clock className="h-3.5 w-3.5" /> Pending Review
              </span>
            )}
          </div>

          {/* Status Context Banner */}
          {user?.agent_verified ? (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Your agent account is fully verified &amp; active!</p>
                <p className="text-xs text-emerald-700 mt-0.5">You are authorized to publish and manage property listings across Homes Finder UAE.</p>
              </div>
            </div>
          ) : user?.status === "changes_required" ? (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 text-sm text-amber-900 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Review note from Homes Finder Administration:</p>
                <p className="text-xs text-amber-800 font-medium mt-1 p-2 bg-white/70 rounded border border-amber-200">
                  {user?.rejection_reason || "Please provide updated Trade Licence and Broker Card documents."}
                </p>
                <p className="text-xs text-amber-700 mt-1.5">Please re-upload your valid credentials below and submit for re-evaluation.</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900 flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">DLD / RERA Compliance Verification Required</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  In accordance with UAE Real Estate regulations, new agent accounts remain inactive for listing properties until Trade Licence and Broker Card are reviewed and approved by Homes Finder.
                </p>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <F label="Trade Licence Number">
              <Input
                placeholder="e.g. 1045239"
                value={agentDocs.trade_licence_number}
                onChange={(e) => setAgentDocs({ ...agentDocs, trade_licence_number: e.target.value })}
              />
            </F>
            <F label="Broker Registration Number (BRN)">
              <Input
                placeholder="e.g. 48291"
                value={agentDocs.broker_number}
                onChange={(e) => setAgentDocs({ ...agentDocs, broker_number: e.target.value })}
              />
            </F>
          </div>

          {/* Document Uploads */}
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            {/* 1. Trade Licence */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">1. Trade Licence</span>
                {agentDocs.trade_licence ? (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Attached
                  </span>
                ) : (
                  <span className="text-xs text-red-500 font-medium">* Required</span>
                )}
              </div>
              <p className="text-xs text-slate-500">Upload your valid UAE Commercial / Real Estate Trade Licence (PDF, JPG, PNG).</p>
              
              {agentDocs.trade_licence && (
                <div className="flex items-center justify-between gap-2 text-xs bg-white p-2 rounded border border-slate-200">
                  <span className="truncate text-slate-700 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                    {user?.agent_documents?.trade_licence_filename || "Trade Licence File"}
                  </span>
                  <a
                    href={agentDocs.trade_licence}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-600 hover:underline flex items-center gap-0.5 shrink-0"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <label className="block">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => handleUploadFile(e, "trade_licence")}
                  disabled={uploadingDoc === "trade_licence"}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold"
                  disabled={uploadingDoc === "trade_licence"}
                  asChild
                >
                  <span>
                    {uploadingDoc === "trade_licence" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {agentDocs.trade_licence ? "Re-upload Trade Licence" : "Choose Trade Licence"}
                  </span>
                </Button>
              </label>
            </div>

            {/* 2. Broker Card */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">2. Broker Card / RERA Card</span>
                {agentDocs.broker_card ? (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Attached
                  </span>
                ) : (
                  <span className="text-xs text-red-500 font-medium">* Required</span>
                )}
              </div>
              <p className="text-xs text-slate-500">Upload your official Broker Card issued by RERA / DLD (PDF, JPG, PNG).</p>

              {agentDocs.broker_card && (
                <div className="flex items-center justify-between gap-2 text-xs bg-white p-2 rounded border border-slate-200">
                  <span className="truncate text-slate-700 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                    {user?.agent_documents?.broker_card_filename || "Broker Card File"}
                  </span>
                  <a
                    href={agentDocs.broker_card}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-600 hover:underline flex items-center gap-0.5 shrink-0"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <label className="block">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => handleUploadFile(e, "broker_card")}
                  disabled={uploadingDoc === "broker_card"}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold"
                  disabled={uploadingDoc === "broker_card"}
                  asChild
                >
                  <span>
                    {uploadingDoc === "broker_card" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {agentDocs.broker_card ? "Re-upload Broker Card" : "Choose Broker Card"}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              onClick={handleSaveDocs}
              disabled={submittingDocs}
              className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold text-xs sm:text-sm"
            >
              {submittingDocs && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit Documents for Verification
            </Button>
          </div>
        </div>
      )}

      {/* ACCOUNT DETAILS */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <h2 className="font-serif text-xl font-semibold text-slate-900">Account Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Full Name"><Input data-testid="pf-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></F>
          <F label="Email"><Input value={user?.email || ""} disabled className="bg-slate-100" /></F>
          <F label="Mobile"><Input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} /></F>
          <F label="Company"><Input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></F>
          <F label="Emirate"><Input value={f.emirate} onChange={(e) => setF({ ...f, emirate: e.target.value })} /></F>
          <F label="Location"><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></F>
        </div>
        <Button onClick={saveProfile} className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold" data-testid="save-profile">Save Changes</Button>
      </div>

      {/* CHANGE PASSWORD */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <h2 className="font-serif text-xl font-semibold text-slate-900">Change Password</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <F label="Current Password"><Input data-testid="cp-current" type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></F>
          <F label="New Password"><Input data-testid="cp-new" type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></F>
        </div>
        <Button onClick={changePw} className="bg-slate-900 text-white hover:bg-slate-800" data-testid="change-password-btn">Update Password</Button>
      </div>
    </div>
  );
}

const F = ({ label, children }) => (
  <div>
    <Label className="text-slate-700 text-sm font-medium">{label}</Label>
    <div className="mt-1.5">{children}</div>
  </div>
);
