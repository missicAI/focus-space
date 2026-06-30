import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { Sparkles } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "./warning.css";

type WarningPayload = {
  subject: string;
  message: string;
  detail: string;
  remainingSeconds: number;
  graceSeconds: number;
  lockMode: "normal" | "strict" | "locked";
};

const fallback: WarningPayload = {
  subject: "môn học",
  message: "Bạn đang rời khỏi vùng học tập",
  detail: "Quay lại app/link học.",
  remainingSeconds: 10,
  graceSeconds: 10,
  lockMode: "normal",
};

function WarningApp() {
  const [payload, setPayload] = useState<WarningPayload>(fallback);

  useEffect(() => {
    const unlistenPromise = listen<WarningPayload>("warning-update", (event) => {
      setPayload(event.payload);
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten()).catch(() => undefined);
    };
  }, []);

  const progress = useMemo(() => {
    if (payload.graceSeconds <= 0) return 0;
    return Math.max(8, Math.min(100, (payload.remainingSeconds / payload.graceSeconds) * 100));
  }, [payload.graceSeconds, payload.remainingSeconds]);

  return (
    <main className={`warning-shell ${payload.lockMode}`}>
      <section className="warning-card-floating">
        <Sparkles size={34} />
        <h1>{payload.message}</h1>
        <p>
          Quay lại app/link của môn <strong>{payload.subject}</strong>.
        </p>
        {payload.remainingSeconds > 0 ? (
          <div className="countdown-pill">Còn {payload.remainingSeconds}s tha thứ</div>
        ) : (
          <div className="countdown-pill danger">Đã tính là mất tập trung</div>
        )}
        <div className="warning-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <small>{payload.detail}</small>
        {payload.lockMode === "normal" && (
          <button onClick={() => invoke("hide_warning_window").catch(() => undefined)}>Ẩn cảnh báo</button>
        )}
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("warning-root")!).render(
  <React.StrictMode>
    <WarningApp />
  </React.StrictMode>
);
