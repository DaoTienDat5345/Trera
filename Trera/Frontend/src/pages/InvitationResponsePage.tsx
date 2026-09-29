import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import { CheckCircle, XCircle, Clock, Loader2, Building2, UserCircle, Mail } from "lucide-react";
import api from "../lib/api";

type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

interface InvitationData {
  status: InviteStatus;
  role: string;
  expiresAt: string;
  project: { id: string; name: string; key: string; description?: string };
  invitedUser: { id: string; name: string; email: string };
  invitedBy: { id: string; name: string; email: string };
}

type PageState = "loading" | "ready" | "submitting" | "done" | "error";

export default function InvitationResponsePage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [state, setState] = useState<PageState>("loading");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [result, setResult] = useState<{ status: InviteStatus; message: string; projectId?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) { setErrorMsg("Link loi moi khong hop le."); setState("error"); return; }
    api.get(`/invitations/${token}`)
      .then((res) => { setInvitation(res.data); setState("ready"); })
      .catch((err) => {
        const d = err?.response?.data;
        if (d?.status === "EXPIRED") { setResult({ status: "EXPIRED", message: d.message }); setState("done"); }
        else { setErrorMsg(d?.message || "Khong the tai thong tin loi moi."); setState("error"); }
      });
  }, [token]);

  // Auto-handle ?action=accept or ?action=decline from email link
  const autoActionRef = React.useRef(false);
  useEffect(() => {
    if (state !== "ready" || autoActionRef.current) return;
    const action = searchParams.get("action");
    if (action === "accept" || action === "decline") {
      autoActionRef.current = true;
      handleRespond(action);
    }
  }, [state]);

  const handleRespond = async (action: "accept" | "decline") => {
    if (!token) return;
    setState("submitting");
    try {
      const res = await api.post(`/invitations/${token}/respond`, { action });
      setResult({ status: res.data.status, message: res.data.message, projectId: res.data.project?.id });
      setState("done");
    } catch (err: any) {
      const d = err?.response?.data;
      setResult({ status: d?.status || "EXPIRED", message: d?.message || "Co loi xay ra." });
      setState("done");
    }
  };

  const roleLabel = (role: string) => role === "ADMIN" ? "Quan tri vien (Admin)" : "Thanh vien (Member)";

  // ---- LOADING ----
  if (state === "loading" || state === "submitting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-10 max-w-sm w-full flex flex-col items-center text-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-slate-600 font-medium">{state === "submitting" ? "Dang xu ly phan hoi..." : "Dang tai thong tin loi moi..."}</p>
        </div>
      </div>
    );
  }

  // ---- ERROR ----
  if (state === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-10 max-w-md w-full flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-9 h-9 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Khong tim thay loi moi</h2>
          <p className="text-slate-500 text-sm">{errorMsg}</p>
          <button onClick={() => navigate("/login")} className="mt-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
            Dang nhap Trera
          </button>
        </div>
      </div>
    );
  }

  // ---- DONE (after response or expired) ----
  if (state === "done" && result) {
    const isAccepted = result.status === "ACCEPTED";
    const isDeclined = result.status === "DECLINED";
    const isExpired = result.status === "EXPIRED";
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-10 max-w-md w-full flex flex-col items-center text-center gap-5">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isAccepted ? "bg-green-100" : isDeclined ? "bg-red-100" : "bg-amber-100"}`}>
            {isAccepted && <CheckCircle className="w-11 h-11 text-green-500" />}
            {isDeclined && <XCircle className="w-11 h-11 text-red-500" />}
            {isExpired && <Clock className="w-11 h-11 text-amber-500" />}
          </div>
          <div>
            <h2 className={`text-2xl font-bold mb-1 ${isAccepted ? "text-green-700" : isDeclined ? "text-red-700" : "text-amber-700"}`}>
              {isAccepted ? "Chap nhan thanh cong!" : isDeclined ? "Da tu choi loi moi" : "Loi moi da het han"}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">{result.message}</p>
          </div>
          {isAccepted && result.projectId ? (
            <button onClick={() => navigate(`/projects/${result.projectId}`)} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
              Vao du an ngay
            </button>
          ) : (
            <button onClick={() => navigate("/projects")} className="px-6 py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors text-sm">
              Tro ve trang chu
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---- READY (show invitation details) ----
  if (state === "ready" && invitation) {
    const isPending = invitation.status === "PENDING";
    const isAlreadyProcessed = !isPending;
    const expiryDate = new Date(invitation.expiresAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-9 h-9 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Loi moi tham gia du an</h1>
            <p className="text-slate-500 text-sm mt-1">Trera Project Management</p>
          </div>

          {/* Project info */}
          <div className="bg-blue-50 rounded-xl p-5 mb-5 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{invitation.project.key}</span>
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-lg">{invitation.project.name}</h2>
                {invitation.project.description && (
                  <p className="text-slate-500 text-sm mt-1">{invitation.project.description}</p>
                )}
                <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  Vai tro: {roleLabel(invitation.role)}
                </span>
              </div>
            </div>
          </div>

          {/* Invited by */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <UserCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <div className="text-sm">
              <span className="text-slate-500">Duoc moi boi </span>
              <span className="font-semibold text-slate-700">{invitation.invitedBy.name}</span>
              <span className="text-slate-400"> ({invitation.invitedBy.email})</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <div className="text-sm">
              <span className="text-slate-500">Gui toi </span>
              <span className="font-semibold text-slate-700">{invitation.invitedUser.name}</span>
              <span className="text-slate-400"> ({invitation.invitedUser.email})</span>
            </div>
          </div>

          {/* Expiry */}
          <p className="text-xs text-slate-400 text-center mb-6">Het han vao: {expiryDate}</p>

          {/* Already processed */}
          {isAlreadyProcessed && (
            <div className={`p-4 rounded-xl text-center font-medium mb-4 ${invitation.status === "ACCEPTED" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              Loi moi nay da duoc {invitation.status === "ACCEPTED" ? "chap nhan" : "xu ly"} truoc do.
            </div>
          )}

          {/* Action buttons */}
          {isPending && (
            <div className="flex gap-3">
              <button
                onClick={() => handleRespond("decline")}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5 text-red-500" />
                Tu choi
              </button>
              <button
                onClick={() => handleRespond("accept")}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Chap nhan
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}