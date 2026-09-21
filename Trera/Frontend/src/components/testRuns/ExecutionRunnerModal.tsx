import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  Clock,
  Search,
  Filter,
  Bug,
  Upload,
  ChevronLeft,
  ChevronRight,
  Monitor,
  ExternalLink,
  Layers,
  Sparkles,
  Paperclip,
  Check,
} from "lucide-react";
import { useTestRunStore } from "../../store/testRunStore";
import type {
  TestRun,
  TestRunResult,
  TestRunStepResult,
  ExecutionStatus,
} from "../../store/testRunStore";
import { toast } from "sonner";

interface ExecutionRunnerModalProps {
  projectId: string;
  runId: string;
  isOpen: boolean;
  onClose: () => void;
  initialCaseId?: string;
}

const STATUS_CONFIG: Record<
  ExecutionStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  PASSED: {
    label: "PASS",
    bg: "bg-emerald-500",
    text: "text-white",
    border: "border-emerald-500",
  },
  FAILED: {
    label: "FAIL",
    bg: "bg-red-500",
    text: "text-white",
    border: "border-red-500",
  },
  BLOCKED: {
    label: "BLOCKED",
    bg: "bg-amber-500",
    text: "text-white",
    border: "border-amber-500",
  },
  SKIPPED: {
    label: "SKIPPED",
    bg: "bg-purple-500",
    text: "text-white",
    border: "border-purple-500",
  },
  UNTESTED: {
    label: "CHƯA TEST",
    bg: "bg-slate-200",
    text: "text-slate-700",
    border: "border-slate-300",
  },
};

export default function ExecutionRunnerModal({
  projectId,
  runId,
  isOpen,
  onClose,
  initialCaseId,
}: ExecutionRunnerModalProps) {
  const {
    currentTestRun,
    fetchTestRunById,
    executeTestCase,
    logDefectFromRun,
    uploadStepAttachment,
  } = useTestRunStore();

  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Step state for active case
  const [stepStates, setStepStates] = useState<
    Record<string, { status: ExecutionStatus; actualResult: string }>
  >({});
  const [caseActualResult, setCaseActualResult] = useState("");

  // Stopwatch state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const timerRef = useRef<any>(null);

  // 1-Click Bug modal
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugPriority, setBugPriority] = useState("HIGH");
  const [isLoggingBug, setIsLoggingBug] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  // Load run details
  useEffect(() => {
    if (isOpen && runId) {
      fetchTestRunById(projectId, runId).then((run) => {
        if (run && run.results && run.results.length > 0) {
          if (initialCaseId) {
            setSelectedCaseId(initialCaseId);
          } else {
            setSelectedCaseId(run.results[0].testCaseId);
          }
        }
      });
    }
  }, [isOpen, runId, projectId, initialCaseId]);

  // Active case result
  const activeResult = currentTestRun?.results?.find(
    (r) => r.testCaseId === selectedCaseId
  );

  // Synchronize step states when active case changes
  useEffect(() => {
    if (activeResult) {
      const states: Record<
        string,
        { status: ExecutionStatus; actualResult: string }
      > = {};
      activeResult.stepResults?.forEach((sr) => {
        states[sr.stepId] = {
          status: sr.status,
          actualResult: sr.actualResult || "",
        };
      });
      setStepStates(states);
      setCaseActualResult(activeResult.actualResult || "");
    }
  }, [activeResult?.id]);

  // Stopwatch timer
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStepStatus = async (
    stepId: string,
    status: ExecutionStatus,
    stepOrder: number
  ) => {
    const nextStates = {
      ...stepStates,
      [stepId]: {
        ...(stepStates[stepId] || { actualResult: "" }),
        status,
      },
    };
    setStepStates(nextStates);

    // Save to backend
    const stepArray = Object.entries(nextStates).map(([sId, val], idx) => ({
      stepId: sId,
      stepOrder: idx,
      status: val.status,
      actualResult: val.actualResult,
    }));

    try {
      await executeTestCase(projectId, runId, selectedCaseId, {
        stepResults: stepArray,
        elapsedSeconds: 5,
      });
    } catch {
      toast.error("Không thể lưu trạng thái bước");
    }
  };

  const handleStepActualResult = async (stepId: string, text: string) => {
    const nextStates = {
      ...stepStates,
      [stepId]: {
        ...(stepStates[stepId] || { status: "UNTESTED" }),
        actualResult: text,
      },
    };
    setStepStates(nextStates);
  };

  const handleSaveStepActualResult = async (stepId: string) => {
    const stepArray = Object.entries(stepStates).map(([sId, val], idx) => ({
      stepId: sId,
      stepOrder: idx,
      status: val.status,
      actualResult: val.actualResult,
    }));

    try {
      await executeTestCase(projectId, runId, selectedCaseId, {
        stepResults: stepArray,
      });
      toast.success("Đã lưu kết quả thực tế");
    } catch {
      toast.error("Không thể lưu kết quả");
    }
  };

  const handleOverallStatus = async (status: ExecutionStatus) => {
    if (!selectedCaseId) return;
    try {
      await executeTestCase(projectId, runId, selectedCaseId, {
        status,
        actualResult: caseActualResult,
        elapsedSeconds: timerSeconds,
      });
      toast.success(`Đã đánh dấu ca test: ${status}`);

      // Auto advance to next case if passed
      if (status === "PASSED") {
        handleNavigate("next");
      }
    } catch {
      toast.error("Không thể cập nhật trạng thái ca test");
    }
  };

  const handle1ClickBug = async () => {
    if (!selectedCaseId) return;
    setIsLoggingBug(true);
    try {
      const res = await logDefectFromRun(projectId, runId, selectedCaseId, {
        priority: bugPriority,
      });
      toast.success(
        `Đã tạo thành công Bug: "${res.bug?.title}" trên bảng Kanban!`,
        { duration: 5000 }
      );
      setShowBugModal(false);
    } catch {
      toast.error("Không thể tạo Bug tự động");
    } finally {
      setIsLoggingBug(false);
    }
  };

  const handleUploadImage = async (
    stepId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(stepId);
    try {
      await uploadStepAttachment(projectId, runId, selectedCaseId, stepId, file);
      toast.success("Đã tải ảnh bằng chứng lỗi thành công");
      await fetchTestRunById(projectId, runId);
    } catch {
      toast.error("Không thể tải ảnh");
    } finally {
      setIsUploading(null);
    }
  };

  // Keyboard navigation
  const results = currentTestRun?.results || [];
  const currentIndex = results.findIndex((r) => r.testCaseId === selectedCaseId);

  const handleNavigate = (dir: "prev" | "next") => {
    if (results.length === 0) return;
    if (dir === "prev" && currentIndex > 0) {
      setSelectedCaseId(results[currentIndex - 1].testCaseId);
    } else if (dir === "next" && currentIndex < results.length - 1) {
      setSelectedCaseId(results[currentIndex + 1].testCaseId);
    }
  };

  if (!isOpen || !currentTestRun) return null;

  const metrics = currentTestRun.metrics || {
    total: results.length,
    passed: 0,
    failed: 0,
    blocked: 0,
    skipped: 0,
    untested: results.length,
    completed: 0,
    passPercentage: 0,
    completionPercentage: 0,
  };

  const filteredResults = results.filter((r) => {
    const matchesSearch =
      r.testCase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.testCase.key.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "ALL" || r.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const activeCase = activeResult?.testCase;
  const isFailedCase =
    activeResult?.status === "FAILED" ||
    Object.values(stepStates).some((s) => s.status === "FAILED");

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col p-2 md:p-5 animate-in fade-in duration-150">
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Top Focus Bar */}
        <div className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          {/* Left: Run info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Play size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-white">
                  {currentTestRun.name}
                </h2>
                {currentTestRun.environment && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Monitor size={11} /> {currentTestRun.environment.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Ca kiểm thử {currentIndex + 1} trên tổng số {results.length}
              </p>
            </div>
          </div>

          {/* Center: Live Stopwatch & Progress */}
          <div className="flex items-center gap-6">
            {/* Stopwatch */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 font-mono text-[13px]">
              <Clock size={14} className="text-indigo-400" />
              <span className="font-bold text-white tracking-wider">
                {formatTimer(timerSeconds)}
              </span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                title={isTimerRunning ? "Tạm dừng" : "Tiếp tục"}
              >
                {isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <button
                onClick={() => setTimerSeconds(0)}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                title="Đặt lại"
              >
                <RotateCcw size={12} />
              </button>
            </div>

            {/* Visual Metrics */}
            <div className="w-56 hidden md:block">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-emerald-400 font-bold">
                  {metrics.passPercentage}% Pass
                </span>
                <span className="text-slate-400">
                  {metrics.completed}/{metrics.total} Hoàn thành
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${(metrics.passed / metrics.total) * 100}%`,
                  }}
                  className="bg-emerald-500 h-full"
                />
                <div
                  style={{
                    width: `${(metrics.failed / metrics.total) * 100}%`,
                  }}
                  className="bg-red-500 h-full"
                />
                <div
                  style={{
                    width: `${(metrics.blocked / metrics.total) * 100}%`,
                  }}
                  className="bg-amber-500 h-full"
                />
              </div>
            </div>
          </div>

          {/* Right: Exit */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
            >
              <X size={15} />
              <span>Đóng Runner</span>
            </button>
          </div>
        </div>

        {/* Main Workspace: Left Navigator + Right Execution Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Test Cases List */}
          <div className="w-80 border-r border-slate-800 bg-slate-900/60 flex flex-col shrink-0">
            {/* Filter & Search */}
            <div className="p-3 border-b border-slate-800 space-y-2">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm ca test..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-[12px] bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                <button
                  onClick={() => setFilterStatus("ALL")}
                  className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                    filterStatus === "ALL"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Tất cả ({results.length})
                </button>
                <button
                  onClick={() => setFilterStatus("UNTESTED")}
                  className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                    filterStatus === "UNTESTED"
                      ? "bg-slate-700 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Chưa chạy ({metrics.untested})
                </button>
                <button
                  onClick={() => setFilterStatus("FAILED")}
                  className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                    filterStatus === "FAILED"
                      ? "bg-red-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Fail ({metrics.failed})
                </button>
                <button
                  onClick={() => setFilterStatus("PASSED")}
                  className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                    filterStatus === "PASSED"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Pass ({metrics.passed})
                </button>
              </div>
            </div>

            {/* Cases List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
              {filteredResults.map((r, idx) => {
                const isSelected = r.testCaseId === selectedCaseId;
                const cfg = STATUS_CONFIG[r.status];
                const hasDefects = r.defects && r.defects.length > 0;

                return (
                  <div
                    key={r.testCaseId}
                    onClick={() => setSelectedCaseId(r.testCaseId)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-indigo-600/20 border border-indigo-500/50"
                        : "hover:bg-slate-800/60 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        #{idx + 1} {r.testCase.key}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${cfg.bg} ${cfg.text}`}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    <h4 className="text-[13px] font-medium text-white line-clamp-2 mb-1.5">
                      {r.testCase.title}
                    </h4>

                    {hasDefects && (
                      <div className="flex items-center gap-1 text-[11px] text-red-400 font-semibold mt-1">
                        <Bug size={12} />
                        <span>{r.defects.length} Bug đã ghi nhận</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Test Execution */}
          {activeCase ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/40">
              {/* Active Header & Details */}
              <div className="p-6 border-b border-slate-800 shrink-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[12px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                        {activeCase.key}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {activeCase.type}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {activeCase.priority}
                      </span>
                    </div>
                    <h1 className="text-[18px] font-bold text-white">
                      {activeCase.title}
                    </h1>
                  </div>

                  {/* Navigation prev / next */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleNavigate("prev")}
                      disabled={currentIndex <= 0}
                      className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-slate-300 transition-colors"
                      title="Ca test trước"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => handleNavigate("next")}
                      disabled={currentIndex >= results.length - 1}
                      className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-slate-300 transition-colors"
                      title="Ca test tiếp theo"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Preconditions */}
                {activeCase.preconditions && (
                  <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-[12px] text-indigo-200">
                    <span className="font-semibold text-indigo-300">
                      Điều kiện tiên quyết:{" "}
                    </span>
                    {activeCase.preconditions}
                  </div>
                )}
              </div>

              {/* Step Execution Center */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* 1-Click Defect Alert Banner */}
                {isFailedCase && (
                  <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center justify-between gap-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Bug size={18} />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-red-200">
                          Phát hiện lỗi kiểm thử tại ca này!
                        </h4>
                        <p className="text-[12px] text-red-300/80">
                          Tạo Bug ngay lập tức lên bảng Kanban với các bước tái hiện được tự động trích xuất.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowBugModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-[13px] rounded-xl shadow-lg transition-colors shrink-0"
                    >
                      <Bug size={15} />
                      <span>1-Click Tạo Bug</span>
                    </button>
                  </div>
                )}

                {/* Existing Logged Defects list */}
                {activeResult?.defects && activeResult.defects.length > 0 && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-[12px] font-semibold text-slate-400">
                      Các Bug đã liên kết ({activeResult.defects.length}):
                    </span>
                    <div className="space-y-1.5">
                      {activeResult.defects.map((d) => (
                        <div
                          key={d.issueId}
                          className="flex items-center justify-between p-2.5 bg-slate-800/80 rounded-lg text-[12px]"
                        >
                          <div className="flex items-center gap-2">
                            <Bug size={14} className="text-red-400" />
                            <span className="font-semibold text-white">
                              {d.issue?.title}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300">
                            {d.issue?.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Steps list */}
                {activeCase.steps && activeCase.steps.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-[14px] font-bold text-slate-300 mb-2">
                      Các bước thực hiện kiểm thử:
                    </h3>

                    {activeCase.steps.map((step, idx) => {
                      const stepId = step.id || String(idx);
                      const stState = stepStates[stepId] || {
                        status: "UNTESTED",
                        actualResult: "",
                      };
                      const stepResultObj = activeResult?.stepResults?.find(
                        (sr) => sr.stepId === stepId
                      );

                      return (
                        <div
                          key={stepId}
                          className={`p-4 rounded-xl border transition-all ${
                            stState.status === "PASSED"
                              ? "bg-emerald-950/20 border-emerald-800/40"
                              : stState.status === "FAILED"
                              ? "bg-red-950/20 border-red-800/40"
                              : stState.status === "BLOCKED"
                              ? "bg-amber-950/20 border-amber-800/40"
                              : "bg-slate-900/80 border-slate-800"
                          }`}
                        >
                          {/* Step Header & Verdict Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <span className="font-mono text-[12px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              Bước {idx + 1}
                            </span>

                            {/* Verdict Buttons for this Step */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  handleStepStatus(stepId, "PASSED", step.order)
                                }
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  stState.status === "PASSED"
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : "bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-700"
                                }`}
                              >
                                <CheckCircle2 size={13} />
                                <span>PASS</span>
                              </button>

                              <button
                                onClick={() =>
                                  handleStepStatus(stepId, "FAILED", step.order)
                                }
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  stState.status === "FAILED"
                                    ? "bg-red-600 text-white shadow-sm"
                                    : "bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700"
                                }`}
                              >
                                <XCircle size={13} />
                                <span>FAIL</span>
                              </button>

                              <button
                                onClick={() =>
                                  handleStepStatus(stepId, "BLOCKED", step.order)
                                }
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  stState.status === "BLOCKED"
                                    ? "bg-amber-600 text-white shadow-sm"
                                    : "bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-700"
                                }`}
                              >
                                <AlertTriangle size={13} />
                                <span>BLOCKED</span>
                              </button>
                            </div>
                          </div>

                          {/* Action & Expected Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] mb-3">
                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Thao tác (Action)
                              </span>
                              <p className="text-white font-medium">{step.action}</p>
                              {step.testData && (
                                <div className="mt-1 text-[11px] text-slate-300">
                                  <span className="text-slate-500">Data: </span>
                                  <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">
                                    {step.testData}
                                  </code>
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Kết quả kỳ vọng (Expected Result)
                              </span>
                              <p className="text-slate-300">{step.expectedResult}</p>
                            </div>
                          </div>

                          {/* Actual Result Input & Attachments */}
                          <div className="pt-2 border-t border-slate-800/80 flex flex-col md:flex-row gap-3">
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                placeholder="Ghi chú kết quả thực tế bước này (nếu có)..."
                                value={stState.actualResult}
                                onChange={(e) =>
                                  handleStepActualResult(stepId, e.target.value)
                                }
                                onBlur={() => handleSaveStepActualResult(stepId)}
                                className="flex-1 px-3 py-1.5 text-[12px] bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            {/* Screenshot Upload */}
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition-colors">
                                <Upload size={13} />
                                <span>{isUploading === stepId ? "Đang tải..." : "Thêm ảnh lỗi"}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleUploadImage(stepId, e)}
                                  disabled={isUploading === stepId}
                                />
                              </label>
                            </div>
                          </div>

                          {/* Render step attachments */}
                          {stepResultObj?.attachments &&
                            stepResultObj.attachments.length > 0 && (
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/50 overflow-x-auto">
                                {stepResultObj.attachments.map((att) => (
                                  <a
                                    key={att.id}
                                    href={att.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:underline bg-slate-800/80 px-2 py-1 rounded"
                                  >
                                    <Paperclip size={11} />
                                    <span>{att.filename}</span>
                                    <ExternalLink size={10} />
                                  </a>
                                ))}
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* BDD / Gherkin display */
                  <div className="space-y-3">
                    <h3 className="text-[14px] font-bold text-slate-300">
                      Kịch bản BDD / Gherkin:
                    </h3>
                    <pre className="p-4 bg-slate-950 rounded-xl font-mono text-[13px] text-emerald-400 border border-slate-800 whitespace-pre-wrap">
                      {activeCase.gherkinContent || "Không có nội dung BDD"}
                    </pre>
                  </div>
                )}
              </div>

              {/* Bottom Quick Overall Verdict Bar */}
              <div className="h-16 px-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-slate-400">
                    Đánh giá toàn ca:
                  </span>
                  <button
                    onClick={() => handleOverallStatus("PASSED")}
                    className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold rounded-xl transition-all ${
                      activeResult?.status === "PASSED"
                        ? "bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-500/50"
                        : "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    <span>Đạt (PASS)</span>
                  </button>

                  <button
                    onClick={() => handleOverallStatus("FAILED")}
                    className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold rounded-xl transition-all ${
                      activeResult?.status === "FAILED"
                        ? "bg-red-600 text-white shadow-lg ring-2 ring-red-500/50"
                        : "bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white"
                    }`}
                  >
                    <XCircle size={16} />
                    <span>Không đạt (FAIL)</span>
                  </button>

                  <button
                    onClick={() => handleOverallStatus("BLOCKED")}
                    className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold rounded-xl transition-all ${
                      activeResult?.status === "BLOCKED"
                        ? "bg-amber-600 text-white shadow-lg ring-2 ring-amber-500/50"
                        : "bg-amber-600/20 text-amber-400 hover:bg-amber-600 hover:text-white"
                    }`}
                  >
                    <AlertTriangle size={16} />
                    <span>Bị chặn (BLOCKED)</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleNavigate("next")}
                    disabled={currentIndex >= results.length - 1}
                    className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-colors shadow-sm"
                  >
                    <span>Ca tiếp theo</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              Vui lòng chọn một ca kiểm thử để thực hiện
            </div>
          )}
        </div>
      </div>

      {/* 1-Click Bug Confirm Modal */}
      {showBugModal && activeCase && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400 font-bold text-[16px]">
                <Bug size={20} />
                <span>1-Click Tạo Bug / Defect</span>
              </div>
              <button
                onClick={() => setShowBugModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-[13px] text-slate-300">
              Hệ thống sẽ tự động tạo một Issue loại <strong>BUG</strong> và liên kết 2 chiều với kết quả chạy kiểm thử này.
            </p>

            <div className="space-y-2 text-[12px]">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Mức độ nghiêm trọng (Priority):
                </label>
                <select
                  value={bugPriority}
                  onChange={(e) => setBugPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                >
                  <option value="URGENT">Khẩn cấp (URGENT)</option>
                  <option value="HIGH">Cao (HIGH)</option>
                  <option value="MEDIUM">Trung bình (MEDIUM)</option>
                  <option value="LOW">Thấp (LOW)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl text-slate-300 text-[11px] space-y-1">
                <div>• Tiêu đề: <code>[Bug][Test Fail] {activeCase.key}: {activeCase.title}</code></div>
                <div>• Môi trường: <code>{currentTestRun.environment?.name || "Mặc định"}</code></div>
                <div>• Tự động trích xuất các bước và kết quả thực tế vào mô tả.</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowBugModal(false)}
                className="px-4 py-2 text-[13px] font-medium text-slate-400 hover:text-white"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handle1ClickBug}
                disabled={isLoggingBug}
                className="flex items-center gap-2 px-5 py-2 text-[13px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg transition-colors disabled:opacity-50"
              >
                <Bug size={15} />
                <span>{isLoggingBug ? "Đang tạo..." : "Xác nhận tạo Bug"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
