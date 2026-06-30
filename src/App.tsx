import { invoke } from "@tauri-apps/api/core";
import {
  AlarmClock,
  AlertCircle,
  Ban,
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  CopyPlus,
  ExternalLink,
  Flame,
  GraduationCap,
  Link2,
  ListChecks,
  Monitor,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings,
  ShieldAlert,
  Sparkles,
  Target,
  TimerReset,
  Trash2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar as ReBar,
  BarChart as ReBarChart,
  CartesianGrid,
  Cell as ReCell,
  Pie as RePie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type LockMode = "normal" | "strict" | "locked";
type FocusState = "study" | "off" | "blocked" | "neutral" | "break" | "paused";
type AppView = "study" | "summary" | "makeup" | "settings" | "session-result" | "session-detail";
type SummaryFilter = "today" | "week" | "month" | "year";
type TaskStatus = "pending" | "completed" | "missed" | "scheduled_makeup" | "makeup_completed" | "expired";
type SessionStatus = "active" | "completed" | "cancelled" | "makeup";
type MakeupQuickChoice = "today" | "tomorrow" | "weekend" | "custom";
type MakeupTimeChoice = "morning" | "afternoon" | "evening" | "custom";
type AppearanceTheme = "focus-space" | "light-study" | "cute-focus" | "minimal-pro" | "night-oled";
type AccentColor = "teal" | "purple" | "orange" | "pink" | "blue";
type IllustrationStyle = "off" | "minimal" | "cute" | "space";
type InterfaceDensity = "comfortable" | "compact";
type MotionLevel = "normal" | "reduced";

type ActiveWindowInfo = {
  process_name: string;
  title: string;
  pid: number;
};

type WarningPayload = {
  subject: string;
  message: string;
  detail: string;
  remainingSeconds: number;
  graceSeconds: number;
  lockMode: LockMode;
};

type StudyRoom = {
  id: string;
  subject: string;
  goal: string;
  focusMinutes: number;
  breakMinutes: number;
  graceSeconds: number;
  lockMode: LockMode;
  allowedApps: string[];
  allowedTitleKeywords: string[];
  allowedLinks: string[];
  blockedApps: string[];
  blockedKeywords: string[];
  tasks: StudyTask[];
  color: string;
  isMakeupSession?: boolean;
  sourceSessionId?: string;
  makeupDueAt?: string;
  originalSubject?: string;
};

type StudyTask = {
  id: string;
  title: string;
  done: boolean;
  createdAt?: string;
  sessionId?: string;
  subjectId?: string;
  status?: TaskStatus;
  completedAt?: string;
  missedAt?: string;
  makeupDeadlineAt?: string;
  makeupScheduledAt?: string;
  makeupSessionId?: string;
  makeupCompletedAt?: string;
  sourceSessionId?: string;
  sourceTaskId?: string;
};

type SessionSummary = {
  id: string;
  date: string;
  subjectId?: string;
  subject: string;
  title?: string;
  goal: string;
  status?: SessionStatus;
  startedAt?: string;
  endedAt?: string;
  deepMinutes: number;
  breakMinutes: number;
  distractionMinutes: number;
  leaves: number;
  completed: boolean;
  totalTaskCount?: number;
  completedTaskCount?: number;
  incompleteTaskCount?: number;
  completedTasks?: string[];
  incompleteTasks?: string[];
  completedTaskSnapshots?: StudyTask[];
  missedTaskSnapshots?: StudyTask[];
  progressPercent?: number;
  isMakeupSession?: boolean;
  sourceSessionId?: string;
  makeupSessionId?: string;
  makeupDueAt?: string;
};

type MissedTaskItem = {
  sessionId: string;
  subjectId?: string;
  subject: string;
  goal: string;
  missedAt: string;
  task: StudyTask;
};

type MakeupScheduleDraft = {
  taskItem: MissedTaskItem;
  quickChoice: MakeupQuickChoice;
  timeChoice: MakeupTimeChoice;
  customDate: string;
  customTime: string;
  error: string;
};

type SummaryTaskItem = {
  id: string;
  title: string;
  subject: string;
  goal: string;
  done: boolean;
  date: string;
  source: "current" | "session";
  roomId?: string;
  durationMinutes?: number;
};

type SubjectSummary = {
  subjectId: string;
  subject: string;
  totalSessions: number;
  totalStudyTime: number;
  totalTasks: number;
  completedTasks: number;
  missedTasks: number;
  progressPercent: number;
  lastStudiedAt: string;
  makeupTaskCount: number;
};

type ProgressReset = {
  id: string;
  date: string;
  resetAt: string;
  scope: "today";
  reason: "manual";
};

type DailyActivity = {
  date: string;
  appOpened: boolean;
  studyMinutes: number;
  reachedDailyGoal: boolean;
  streakEarned: boolean;
  streakCelebratedAt?: string;
};

type StreakInfo = {
  currentStreak: number;
  longestStreak: number;
  todayStudyMinutes: number;
  todayReachedGoal: boolean;
  remainingMinutes: number;
};

type DaySummary = {
  date: string;
  label: string;
  studyMinutes: number;
  taskTotal: number;
  taskCompleted: number;
  taskMissed: number;
  timeProgress: number;
  taskProgress: number;
  progressPercent: number;
  reachedDailyMinimum: boolean;
  sessions: SessionSummary[];
  tasks: SummaryTaskItem[];
};

type MonthSummary = {
  month: number;
  label: string;
  studyMinutes: number;
  taskTotal: number;
  taskCompleted: number;
  taskMissed: number;
  progressPercent: number;
  daysReachedGoal: number;
  activeDays: number;
};

type EndSessionReview = {
  roomId: string;
  subject: string;
  goal: string;
  totalTasks: number;
  completedTasks: StudyTask[];
  incompleteTasks: StudyTask[];
  progressPercent: number;
  studyMinutes: number;
  breakMinutes: number;
  distractionMinutes: number;
  leaves: number;
  startedAt: string;
  endedAt: string;
  isMakeupSession?: boolean;
  sourceSessionId?: string;
};

type AppearanceSettings = {
  theme: AppearanceTheme;
  accentColor: AccentColor;
  illustrationStyle: IllustrationStyle;
  density: InterfaceDensity;
  motion: MotionLevel;
};

type SelectOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

const browserProcesses = [
  "chrome.exe",
  "msedge.exe",
  "firefox.exe",
  "brave.exe",
  "opera.exe",
  "browser.exe",
  "coccoc.exe",
];

const neutralProcesses = [
  "Focus Space",
  "focus_space.exe",
  "SnippingTool.exe",
  "ScreenClippingHost.exe",
  "SnipAndSketch.exe",
  "ShareX.exe",
  "Lightshot.exe",
  "Greenshot.exe",
  "GameBar.exe",
];

const starterRooms: StudyRoom[] = [
  {
    id: crypto.randomUUID(),
    subject: "Python",
    goal: "Làm xong bài 1-3 và ghi lại lỗi hay gặp",
    focusMinutes: 50,
    breakMinutes: 10,
    graceSeconds: 10,
    lockMode: "strict",
    allowedApps: ["Code.exe", "python.exe", "pycharm64.exe"],
    allowedTitleKeywords: ["docs.python.org", "Kaggle", "Jupyter", "Colab", "Python", "ChatGPT"],
    allowedLinks: ["https://docs.python.org", "https://colab.research.google.com"],
    blockedApps: ["Discord.exe", "steam.exe", "RobloxPlayerBeta.exe", "EpicGamesLauncher.exe"],
    blockedKeywords: ["Facebook", "TikTok", "YouTube Shorts"],
    tasks: [
      { id: crypto.randomUUID(), title: "Đọc lại lý thuyết chính", done: false },
      { id: crypto.randomUUID(), title: "Làm bài tập đang dở", done: false },
      { id: crypto.randomUUID(), title: "Ghi 3 điều chưa hiểu", done: false },
    ],
    color: "#5eead4",
  },
  {
    id: crypto.randomUUID(),
    subject: "Tiếng Anh",
    goal: "Học 20 từ mới và luyện nghe 15 phút",
    focusMinutes: 45,
    breakMinutes: 8,
    graceSeconds: 15,
    lockMode: "normal",
    allowedApps: ["WINWORD.EXE", "AcroRd32.exe", "SumatraPDF.exe"],
    allowedTitleKeywords: ["Cambridge", "Oxford", "IELTS", "Google Docs", "Quizlet"],
    allowedLinks: ["https://dictionary.cambridge.org"],
    blockedApps: ["Discord.exe", "steam.exe"],
    blockedKeywords: ["Facebook", "TikTok"],
    tasks: [{ id: crypto.randomUUID(), title: "Ôn từ hôm qua", done: false }],
    color: "#a78bfa",
  },
];

const chartFallback = [
  { day: "T2", minutes: 0 },
  { day: "T3", minutes: 0 },
  { day: "T4", minutes: 0 },
  { day: "T5", minutes: 0 },
  { day: "T6", minutes: 0 },
  { day: "T7", minutes: 0 },
  { day: "CN", minutes: 0 },
];

const summaryFilters: { value: SummaryFilter; label: string }[] = [
  { value: "today", label: "Hôm nay" },
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
  { value: "year", label: "Năm nay" },
];

const dailyMinimumStudyMinutes = 60;

const defaultAppearanceSettings: AppearanceSettings = {
  theme: "focus-space",
  accentColor: "teal",
  illustrationStyle: "space",
  density: "comfortable",
  motion: "normal",
};

const themeOptions: {
  value: AppearanceTheme;
  label: string;
  description: string;
  swatches: string[];
}[] = [
  {
    value: "focus-space",
    label: "Focus Space",
    description: "Dark teal hiện đại, giữ vibe hiện tại.",
    swatches: ["#081316", "#0f252b", "#5eead4"],
  },
  {
    value: "light-study",
    label: "Light Study",
    description: "Sáng, mềm, dễ đọc cho học sinh nhỏ tuổi.",
    swatches: ["#fffaf0", "#e0f2fe", "#14b8a6"],
  },
  {
    value: "cute-focus",
    label: "Cute Focus",
    description: "Pastel vui hơn nhưng vẫn gọn và sạch.",
    swatches: ["#fff1f7", "#ede9fe", "#ec4899"],
  },
  {
    value: "minimal-pro",
    label: "Minimal Pro",
    description: "Tối giản, ít màu, hợp sinh viên và người đi làm.",
    swatches: ["#111827", "#1f2937", "#60a5fa"],
  },
  {
    value: "night-oled",
    label: "Night OLED",
    description: "Đen sâu, ít chói mắt khi học ban đêm.",
    swatches: ["#000000", "#09090b", "#22d3ee"],
  },
];

const accentOptions: { value: AccentColor; label: string; color: string }[] = [
  { value: "teal", label: "Xanh ngọc", color: "#5eead4" },
  { value: "purple", label: "Tím", color: "#a78bfa" },
  { value: "orange", label: "Cam", color: "#fb923c" },
  { value: "pink", label: "Hồng", color: "#f472b6" },
  { value: "blue", label: "Xanh dương", color: "#60a5fa" },
];

const illustrationOptions: { value: IllustrationStyle; label: string; description: string }[] = [
  { value: "off", label: "Tắt", description: "Không hiện hình minh họa." },
  { value: "minimal", label: "Tối giản", description: "Icon line nhẹ nhàng." },
  { value: "cute", label: "Dễ thương", description: "Sticker học tập pastel." },
  { value: "space", label: "Space", description: "Hành tinh, tên lửa, huy hiệu." },
];

const lockModeOptions: SelectOption<LockMode>[] = [
  { value: "normal", label: "Normal - chỉ cảnh báo", description: "Nhắc nhẹ khi bạn rời vùng học." },
  { value: "strict", label: "Strict - cảnh báo + ghi lỗi + thu nhỏ app chặn", description: "Phù hợp phiên học nghiêm túc." },
  { value: "locked", label: "Locked - cảnh báo nghiêm hơn", description: "Tăng độ khó khi muốn tập trung cao." },
];

const makeupQuickOptions: { value: MakeupQuickChoice; label: string }[] = [
  { value: "today", label: "Hôm nay" },
  { value: "tomorrow", label: "Ngày mai" },
  { value: "weekend", label: "Cuối tuần" },
  { value: "custom", label: "Chọn ngày" },
];

const makeupTimeOptions: { value: MakeupTimeChoice; label: string; time: string }[] = [
  { value: "morning", label: "Sáng", time: "08:00" },
  { value: "afternoon", label: "Chiều", time: "14:00" },
  { value: "evening", label: "Tối", time: "19:30" },
  { value: "custom", label: "Chọn giờ", time: "19:30" },
];

function App() {
  const [rooms, setRooms] = useStoredState<StudyRoom[]>("focus-space.rooms", starterRooms);
  const [sessions, setSessions] = useStoredState<SessionSummary[]>("focus-space.sessions", []);
  const [progressResets, setProgressResets] = useStoredState<ProgressReset[]>("focus-space.progressResets", []);
  const [dailyActivities, setDailyActivities] = useStoredState<DailyActivity[]>("focus-space.dailyActivities", []);
  const [appearanceSettings, setAppearanceSettings] = useStoredState<AppearanceSettings>(
    "focus-space.appearanceSettings",
    defaultAppearanceSettings
  );
  const [activeRoomId, setActiveRoomId] = useState(rooms.find((room) => !isMakeupRoom(room))?.id ?? rooms[0]?.id ?? "");
  const [view, setView] = useState<AppView>("study");
  const [activeWindow, setActiveWindow] = useState<ActiveWindowInfo>({
    process_name: "",
    title: "",
    pid: 0,
  });
  const [running, setRunning] = useState(false);
  const [breakMode, setBreakMode] = useState(false);
  const [studySeconds, setStudySeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [distractionSeconds, setDistractionSeconds] = useState(0);
  const [focusSinceBreak, setFocusSinceBreak] = useState(0);
  const [leaveCount, setLeaveCount] = useState(0);
  const [warningSeconds, setWarningSeconds] = useState(0);
  const [showFocusWarning, setShowFocusWarning] = useState(false);
  const [warningPayload, setWarningPayload] = useState<WarningPayload>({
    subject: "môn học",
    message: "Bạn đang rời khỏi vùng học tập",
    detail: "Quay lại app/link học để tiếp tục tính giờ học sâu.",
    remainingSeconds: 10,
    graceSeconds: 10,
    lockMode: "normal",
  });
  const [status, setStatus] = useState<FocusState>("paused");
  const [notice, setNotice] = useState("Chọn phòng học rồi bấm Bắt đầu.");
  const [newTask, setNewTask] = useState("");
  const [endSessionReview, setEndSessionReview] = useState<EndSessionReview | null>(null);
  const [completedSession, setCompletedSession] = useState<SessionSummary | null>(null);
  const [celebrationSession, setCelebrationSession] = useState<SessionSummary | null>(null);
  const [sourceSessionSelection, setSourceSessionSelection] = useState<{ sessionId: string; taskId?: string } | null>(null);
  const violationRef = useRef(false);
  const activeRoomRef = useRef<StudyRoom | undefined>(undefined);
  const activeWindowRef = useRef(activeWindow);
  const runningRef = useRef(running);
  const breakModeRef = useRef(breakMode);
  const offStartedAtRef = useRef<number | null>(null);
  const lastTickRef = useRef(Date.now());
  const warningWindowRaisedRef = useRef(false);
  const sessionStartedAtRef = useRef(new Date().toISOString());
  const scheduledMakeupKeysRef = useRef(new Set<string>());

  const normalRooms = useMemo(() => rooms.filter((room) => !isMakeupRoom(room)), [rooms]);
  const makeupItems = useMemo(() => buildMissedTaskItems(sessions), [sessions]);
  const actionableMakeupCount = makeupItems.filter((item) => {
    const status = getMissedTaskStatus(item.task);
    return status === "missed" || status === "scheduled_makeup";
  }).length;
  const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? normalRooms[0] ?? rooms[0];
  const effectiveAppearanceSettings = { ...defaultAppearanceSettings, ...appearanceSettings };
  const streakInfo = useMemo(
    () => calculateStudyStreak(sessions, dailyActivities, Math.round(studySeconds / 60)),
    [dailyActivities, sessions, studySeconds]
  );

  useEffect(() => {
    const todayKey = getDateKey(new Date());
    setDailyActivities((value) => upsertDailyActivity(value, todayKey, { appOpened: true }));
  }, [setDailyActivities]);

  useEffect(() => {
    if (!streakInfo.todayReachedGoal) return;
    const todayKey = getDateKey(new Date());
    const todayActivity = dailyActivities.find((activity) => activity.date === todayKey);
    if (todayActivity?.streakCelebratedAt) return;
    setNotice("Bạn đã giữ streak hôm nay!");
    setDailyActivities((value) =>
      upsertDailyActivity(value, todayKey, {
        appOpened: true,
        reachedDailyGoal: true,
        streakEarned: true,
        streakCelebratedAt: new Date().toISOString(),
      })
    );
  }, [dailyActivities, setDailyActivities, streakInfo.todayReachedGoal]);

  useEffect(() => {
    if (!activeRoom && normalRooms.length > 0) {
      setActiveRoomId(normalRooms[0].id);
    }
  }, [activeRoom, normalRooms]);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  useEffect(() => {
    activeWindowRef.current = activeWindow;
  }, [activeWindow]);

  useEffect(() => {
    runningRef.current = running;
    lastTickRef.current = Date.now();
    if (!running) {
      setWarningSeconds(0);
    }
  }, [running]);

  useEffect(() => {
    breakModeRef.current = breakMode;
    lastTickRef.current = Date.now();
    if (breakMode) {
      offStartedAtRef.current = null;
      setWarningSeconds(0);
      violationRef.current = false;
    }
  }, [breakMode]);

  useEffect(() => {
    const poll = window.setInterval(async () => {
      if (warningWindowRaisedRef.current) return;

      try {
        const info = await invoke<ActiveWindowInfo>("get_active_window");
        setActiveWindow(info);
      } catch {
        setActiveWindow({
          process_name: "preview-mode",
          title: "Không đọc được active window. Hãy chạy bằng Tauri trên Windows.",
          pid: 0,
        });
      }
    }, 1000);

    return () => window.clearInterval(poll);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();

      if (!runningRef.current) {
        lastTickRef.current = now;
        setStatus("paused");
        return;
      }

      const elapsedMs = now - lastTickRef.current;
      if (elapsedMs < 1000) return;

      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      lastTickRef.current += elapsedSeconds * 1000;

      const room = activeRoomRef.current;
      if (!room) return;

      if (breakModeRef.current) {
        setStatus("break");
        setBreakSeconds((value) => value + elapsedSeconds);
        setWarningSeconds(0);
        setNotice("Đang nghỉ giải lao. App không cảnh báo trong lúc nghỉ.");
        return;
      }

      const result = classifyWindow(room, activeWindowRef.current);
      setStatus(result.state);
      setNotice(result.reason);

      if (result.state === "study" || result.state === "neutral") {
        offStartedAtRef.current = null;
        setWarningSeconds(0);
        violationRef.current = false;
      }

      if (result.state === "study") {
        setStudySeconds((value) => value + elapsedSeconds);
        setFocusSinceBreak((value) => value + elapsedSeconds);
      }

      if (result.state === "off" || result.state === "blocked") {
        const started = offStartedAtRef.current ?? now;
        if (offStartedAtRef.current === null) {
          offStartedAtRef.current = started;
        }

        const awaySeconds = Math.floor((now - started) / 1000);
        setWarningSeconds(Math.max(0, room.graceSeconds - awaySeconds));

        if (awaySeconds >= room.graceSeconds) {
          setDistractionSeconds((value) => value + elapsedSeconds);
          if (!violationRef.current) {
            setLeaveCount((value) => value + 1);
            violationRef.current = true;
          }
          if (result.state === "blocked" && room.lockMode !== "normal") {
            invoke("minimize_active_window").catch(() => undefined);
          }
        }
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeRoom) return;

    const shouldWarn = (status === "off" || status === "blocked") && running && !breakMode;

    if (!shouldWarn) {
      setShowFocusWarning(false);
      if (warningWindowRaisedRef.current) {
        warningWindowRaisedRef.current = false;
        invoke("hide_warning_window").catch(() => undefined);
      }
      return;
    }

    const payload = {
      subject: activeRoom.subject,
      message: "Bạn đang rời khỏi vùng học tập",
      detail: notice,
      remainingSeconds: warningSeconds,
      graceSeconds: activeRoom.graceSeconds,
      lockMode: activeRoom.lockMode,
    };

    setWarningPayload(payload);
    setShowFocusWarning(true);

    if (!warningWindowRaisedRef.current) {
      warningWindowRaisedRef.current = true;
      invoke("show_warning_window", { payload }).catch((error) => {
        warningWindowRaisedRef.current = false;
        setNotice(`Không mở được overlay cảnh báo: ${String(error)}`);
      });
    }
  }, [activeRoom, breakMode, notice, running, status, warningSeconds]);

  const chartData = useMemo(() => {
    if (sessions.length === 0) return chartFallback;
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const map = new Map(chartFallback.map((item) => [item.day, 0]));
    sessions.slice(-20).forEach((session) => {
      const day = days[new Date(session.date).getDay()];
      map.set(day, (map.get(day) ?? 0) + session.deepMinutes);
    });
    return ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => ({
      day,
      minutes: Math.round(map.get(day) ?? 0),
    }));
  }, [sessions]);

  function updateRoom(nextRoom: StudyRoom) {
    setRooms((value) => value.map((room) => (room.id === nextRoom.id ? nextRoom : room)));
  }

  function addRoom() {
    const next: StudyRoom = {
      id: crypto.randomUUID(),
      subject: "Môn mới",
      goal: "Mục tiêu buổi học",
      focusMinutes: 50,
      breakMinutes: 10,
      graceSeconds: 10,
      lockMode: "normal",
      allowedApps: [],
      allowedTitleKeywords: [],
      allowedLinks: [],
      blockedApps: [],
      blockedKeywords: [],
      tasks: [],
      color: "#facc15",
    };
    setRooms((value) => [...value, next]);
    setActiveRoomId(next.id);
    setView("study");
  }

  function deleteRoom(roomId: string) {
    if (rooms.length <= 1) return;
    const next = rooms.filter((room) => room.id !== roomId);
    setRooms(next);
    setActiveRoomId(next[0].id);
  }

  async function captureActiveApp(kind: "allow" | "block") {
    setNotice("Trong 5 giây nữa, hãy chuyển sang app/tab cần thêm.");
    window.setTimeout(async () => {
      const info = await invoke<ActiveWindowInfo>("get_active_window");
      if (!activeRoom || !info.process_name) return;
      const nextRoom = { ...activeRoom };

      if (kind === "allow") {
        nextRoom.allowedApps = unique([...nextRoom.allowedApps, info.process_name]);
        const keyword = inferKeyword(info.title);
        if (keyword) nextRoom.allowedTitleKeywords = unique([...nextRoom.allowedTitleKeywords, keyword]);
        setNotice(`Đã thêm vùng học: ${info.process_name}`);
      } else {
        nextRoom.blockedApps = unique([...nextRoom.blockedApps, info.process_name]);
        setNotice(`Đã chặn app: ${info.process_name}`);
      }

      updateRoom(nextRoom);
    }, 5000);
  }

  function addLink() {
    if (!activeRoom) return;
    const link = window.prompt("Dán link học hoặc keyword của tab, ví dụ: docs.python.org");
    if (!link) return;
    updateRoom({
      ...activeRoom,
      allowedLinks: unique([...activeRoom.allowedLinks, link.trim()]),
      allowedTitleKeywords: unique([...activeRoom.allowedTitleKeywords, normalizeKeyword(link)]),
    });
  }

  function addTask() {
    if (!activeRoom || !newTask.trim()) return;
    updateRoom({
      ...activeRoom,
      tasks: [
        ...activeRoom.tasks,
        { id: crypto.randomUUID(), title: newTask.trim(), done: false, status: "pending", createdAt: new Date().toISOString() },
      ],
    });
    setNewTask("");
  }

  function toggleRunning() {
    if (!running && studySeconds === 0 && breakSeconds === 0 && distractionSeconds === 0) {
      sessionStartedAtRef.current = new Date().toISOString();
    }
    setRunning((value) => !value);
  }

  function resetCurrentSession() {
    setStudySeconds(0);
    setBreakSeconds(0);
    setDistractionSeconds(0);
    setFocusSinceBreak(0);
    setLeaveCount(0);
    setWarningSeconds(0);
    offStartedAtRef.current = null;
    violationRef.current = false;
    lastTickRef.current = Date.now();
    sessionStartedAtRef.current = new Date().toISOString();
    invoke("hide_warning_window").catch(() => undefined);
  }

  function openEndSessionModal() {
    if (!activeRoom) return;
    if (activeRoom.isMakeupSession && activeRoom.tasks.length === 0) {
      setNotice("Buổi bù này không còn nhiệm vụ cần xử lý.");
      setView("makeup");
      return;
    }
    if (activeRoom.tasks.length === 0 && studySeconds === 0 && breakSeconds === 0 && distractionSeconds === 0) {
      setNotice("Buổi học này chưa có thời gian hoặc nhiệm vụ để lưu.");
      return;
    }

    const completedTasks = activeRoom.tasks.filter((task) => task.done);
    const incompleteTasks = activeRoom.tasks.filter((task) => !task.done);
    setEndSessionReview({
      roomId: activeRoom.id,
      subject: activeRoom.subject,
      goal: activeRoom.goal,
      totalTasks: activeRoom.tasks.length,
      completedTasks,
      incompleteTasks,
      progressPercent: calculatePercent(completedTasks.length, activeRoom.tasks.length),
      studyMinutes: Math.round(studySeconds / 60),
      breakMinutes: Math.round(breakSeconds / 60),
      distractionMinutes: Math.round(distractionSeconds / 60),
      leaves: leaveCount,
      startedAt: sessionStartedAtRef.current,
      endedAt: new Date().toISOString(),
      isMakeupSession: activeRoom.isMakeupSession,
      sourceSessionId: activeRoom.sourceSessionId,
    });
  }

  function finishSessionFromReview() {
    if (!endSessionReview || !activeRoom) return;

    const isMakeupSession = Boolean(endSessionReview.isMakeupSession);
    const sessionId = crypto.randomUUID();
    const endedAt = endSessionReview.endedAt;
    const sourceSession = isMakeupSession && endSessionReview.sourceSessionId
      ? sessions.find((session) => session.id === endSessionReview.sourceSessionId)
      : undefined;
    const subjectId = isMakeupSession ? sourceSession?.subjectId ?? activeRoom.originalSubject ?? activeRoom.subject : endSessionReview.roomId;
    const subject = isMakeupSession ? sourceSession?.subject ?? activeRoom.originalSubject ?? endSessionReview.subject : endSessionReview.subject;
    const makeupDeadlineAt = addDays(endedAt, 7).toISOString();

    const completedSnapshots = endSessionReview.completedTasks.map((task) => ({
      ...task,
      done: true,
      status: isMakeupSession ? ("makeup_completed" as const) : ("completed" as const),
      sessionId,
      subjectId,
      completedAt: endedAt,
      makeupCompletedAt: isMakeupSession ? endedAt : task.makeupCompletedAt,
      makeupSessionId: isMakeupSession ? endSessionReview.roomId : task.makeupSessionId,
    }));

    const missedSnapshots = endSessionReview.incompleteTasks.map((task) => ({
      ...task,
      done: false,
      status: isMakeupSession ? ("scheduled_makeup" as const) : ("missed" as const),
      sessionId,
      subjectId,
      missedAt: task.missedAt ?? endedAt,
      makeupDeadlineAt: task.makeupDeadlineAt ?? makeupDeadlineAt,
      makeupScheduledAt: task.makeupScheduledAt,
      makeupSessionId: isMakeupSession ? endSessionReview.roomId : task.makeupSessionId,
      sourceSessionId: isMakeupSession ? task.sourceSessionId ?? endSessionReview.sourceSessionId : sessionId,
      sourceTaskId: isMakeupSession ? task.sourceTaskId ?? task.id : task.id,
    }));

    const totalTaskCount = endSessionReview.totalTasks;
    const completedTaskCount = completedSnapshots.length;
    const incompleteTaskCount = missedSnapshots.length;
    const progressPercent = totalTaskCount === 0 ? 0 : calculatePercent(completedTaskCount, totalTaskCount);

    const summary: SessionSummary = {
      id: sessionId,
      date: endedAt,
      subjectId,
      subject,
      title: isMakeupSession ? `${subject} - Buổi bù` : endSessionReview.goal,
      goal: endSessionReview.goal,
      status: isMakeupSession ? "makeup" : "completed",
      startedAt: endSessionReview.startedAt,
      endedAt: endSessionReview.endedAt,
      deepMinutes: endSessionReview.studyMinutes,
      breakMinutes: endSessionReview.breakMinutes,
      distractionMinutes: endSessionReview.distractionMinutes,
      leaves: endSessionReview.leaves,
      completed: totalTaskCount > 0 && incompleteTaskCount === 0,
      totalTaskCount,
      completedTaskCount,
      incompleteTaskCount,
      completedTasks: completedSnapshots.map((task) => task.title),
      incompleteTasks: missedSnapshots.map((task) => task.title),
      completedTaskSnapshots: completedSnapshots,
      missedTaskSnapshots: missedSnapshots,
      progressPercent,
      isMakeupSession,
      sourceSessionId: endSessionReview.sourceSessionId,
      makeupSessionId: isMakeupSession ? endSessionReview.roomId : undefined,
      makeupDueAt: isMakeupSession ? activeRoom.makeupDueAt : undefined,
    };

    setRooms((value) =>
      value.flatMap((room) => {
        if (room.id !== endSessionReview.roomId) return [room];
        if (!isMakeupSession) return [{ ...room, tasks: [] }];

        const remainingTasks = endSessionReview.incompleteTasks.map((task) => ({
          ...task,
          done: false,
          status: "pending" as const,
        }));
        return remainingTasks.length === 0 ? [] : [{ ...room, tasks: remainingTasks }];
      })
    );

    if (isMakeupSession && incompleteTaskCount === 0) {
      const fallbackRoom = normalRooms.find((room) => room.id !== endSessionReview.roomId) ?? normalRooms[0];
      if (fallbackRoom) setActiveRoomId(fallbackRoom.id);
    }

    setRunning(false);
    setBreakMode(false);
    resetCurrentSession();
    setEndSessionReview(null);

    setSessions((value) => {
      const updatedSessions = isMakeupSession
        ? value.map((session) => ({
            ...session,
            missedTaskSnapshots: (session.missedTaskSnapshots ?? []).map((task) => {
              const completedMakeupTask = completedSnapshots.find(
                (completedTask) =>
                  (completedTask.sourceSessionId ?? endSessionReview.sourceSessionId) === session.id &&
                  completedTask.sourceTaskId === task.id
              );
              const remainingMakeupTask = missedSnapshots.find(
                (missedTask) =>
                  (missedTask.sourceSessionId ?? endSessionReview.sourceSessionId) === session.id &&
                  missedTask.sourceTaskId === task.id
              );

              if (completedMakeupTask) {
                return {
                  ...task,
                  done: true,
                  status: "makeup_completed" as const,
                  completedAt: endedAt,
                  makeupCompletedAt: endedAt,
                  makeupSessionId: endSessionReview.roomId,
                };
              }

              if (remainingMakeupTask) {
                return {
                  ...task,
                  done: false,
                  status: "scheduled_makeup" as const,
                  makeupSessionId: endSessionReview.roomId,
                  makeupScheduledAt: remainingMakeupTask.makeupScheduledAt ?? task.makeupScheduledAt,
                };
              }

              return task;
            }),
          }))
        : value;
      return [summary, ...updatedSessions].slice(0, 200);
    });

    setDailyActivities((value) => addStudyMinutesToDailyActivity(value, endedAt, summary.deepMinutes));
    setCompletedSession(summary);
    setCelebrationSession(totalTaskCount > 0 ? summary : null);
    setView("session-result");
    setNotice(
      isMakeupSession
        ? incompleteTaskCount === 0 && totalTaskCount > 0
          ? "Bạn đã xử lý xong nhiệm vụ bù."
          : "Đã lưu buổi bù. Nhiệm vụ còn lại vẫn nằm trong mục Cần bù."
        : missedSnapshots.length === 0
          ? "Bạn đã hoàn thành toàn bộ nhiệm vụ của buổi học này."
          : "Đã lưu tổng kết. Các nhiệm vụ chưa xong đã chuyển vào mục Cần bù."
    );
  }

  function scheduleMakeupTask(item: MissedTaskItem, scheduledAt: string) {
    const scheduleKey = `${item.sessionId}:${item.task.id}`;
    if (scheduledMakeupKeysRef.current.has(scheduleKey)) return;
    const existingSession = sessions.find((session) => session.id === item.sessionId);
    const existingTask = existingSession?.missedTaskSnapshots?.find((task) => task.id === item.task.id);
    if (!existingSession || !existingTask || existingTask.makeupSessionId) {
      return;
    }
    scheduledMakeupKeysRef.current.add(scheduleKey);

    const originalRoom = rooms.find((room) => room.id === item.subjectId);
    const makeupRoomId = crypto.randomUUID();
    const makeupTask: StudyTask = {
      ...existingTask,
      id: crypto.randomUUID(),
      done: false,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      sessionId: makeupRoomId,
      subjectId: item.subjectId,
      sourceSessionId: item.sessionId,
      sourceTaskId: existingTask.id,
      makeupScheduledAt: scheduledAt,
      makeupSessionId: makeupRoomId,
    };
    const makeupRoom: StudyRoom = {
      id: makeupRoomId,
      subject: item.subject,
      goal: `Bù: ${item.task.title}`,
      focusMinutes: originalRoom?.focusMinutes ?? 50,
      breakMinutes: originalRoom?.breakMinutes ?? 10,
      graceSeconds: originalRoom?.graceSeconds ?? 10,
      lockMode: originalRoom?.lockMode ?? "normal",
      allowedApps: originalRoom?.allowedApps ?? [],
      allowedTitleKeywords: originalRoom?.allowedTitleKeywords ?? [],
      allowedLinks: originalRoom?.allowedLinks ?? [],
      blockedApps: originalRoom?.blockedApps ?? [],
      blockedKeywords: originalRoom?.blockedKeywords ?? [],
      tasks: [makeupTask],
      color: originalRoom?.color ?? "#facc15",
      isMakeupSession: true,
      sourceSessionId: item.sessionId,
      makeupDueAt: scheduledAt,
      originalSubject: item.subject,
    };

    setRooms((value) => [...value, makeupRoom]);
    setSessions((value) =>
      value.map((session) =>
        session.id === item.sessionId
          ? {
              ...session,
              missedTaskSnapshots: (session.missedTaskSnapshots ?? []).map((task) =>
                task.id === item.task.id
                  ? {
                      ...task,
                      status: "scheduled_makeup" as const,
                      makeupScheduledAt: scheduledAt,
                      makeupSessionId: makeupRoomId,
                    }
                  : task
              ),
            }
          : session
      )
    );
    setCompletedSession((value) =>
      value?.id === item.sessionId
        ? {
            ...value,
            missedTaskSnapshots: (value.missedTaskSnapshots ?? []).map((task) =>
              task.id === item.task.id
                ? {
                    ...task,
                    status: "scheduled_makeup" as const,
                    makeupScheduledAt: scheduledAt,
                    makeupSessionId: makeupRoomId,
                  }
                : task
            ),
          }
        : value
    );
    setView("makeup");
    setNotice("Đã xếp lịch bù. Buổi bù nằm trong mục Cần bù, không thêm vào danh sách môn học.");
  }

  function markMakeupTaskCompleted(item: MissedTaskItem) {
    const completedAt = new Date().toISOString();
    setSessions((value) =>
      value.map((session) =>
        session.id === item.sessionId
          ? {
              ...session,
              missedTaskSnapshots: (session.missedTaskSnapshots ?? []).map((task) =>
                task.id === item.task.id
                  ? {
                      ...task,
                      done: true,
                      status: "makeup_completed" as const,
                      completedAt,
                    }
                  : task
              ),
            }
          : session
      )
    );
    setCompletedSession((value) =>
      value?.id === item.sessionId
        ? {
            ...value,
            missedTaskSnapshots: (value.missedTaskSnapshots ?? []).map((task) =>
              task.id === item.task.id
                ? {
                    ...task,
                    done: true,
                    status: "makeup_completed" as const,
                    completedAt,
                  }
                : task
            ),
          }
        : value
    );
    setRooms((value) =>
      value.map((room) =>
        room.id === item.task.makeupSessionId
          ? {
              ...room,
              tasks: room.tasks.map((task) => ({ ...task, done: true, status: "makeup_completed" as const, completedAt })),
            }
          : room
      )
    );
    setNotice("Đã đánh dấu nhiệm vụ bù là hoàn thành.");
  }

  function openMakeupRoom(roomId?: string) {
    if (!roomId) return;
    const room = rooms.find((item) => item.id === roomId);
    if (!room || !isMakeupRoom(room)) return;

    const hasPendingTask = room.tasks.some((task) => !task.done);
    if (!hasPendingTask) {
      const makeupSummary = sessions.find(
        (session) => session.isMakeupSession && (session.makeupSessionId === roomId || session.subjectId === roomId)
      );
      if (makeupSummary) {
        setCompletedSession(makeupSummary);
        setView("session-result");
      } else {
        setView("makeup");
        setNotice("Buổi bù này không còn nhiệm vụ cần xử lý.");
      }
      return;
    }

    resetCurrentSession();
    sessionStartedAtRef.current = new Date().toISOString();
    setActiveRoomId(roomId);
    setView("study");
    setNotice("Đã mở buổi bù. Hãy tick nhiệm vụ khi bạn thật sự hoàn thành rồi mới kết thúc buổi bù.");
  }

  function resetTodayProgress() {
    const now = new Date();
    const todayKey = getDateKey(now);
    const reset: ProgressReset = {
      id: crypto.randomUUID(),
      date: todayKey,
      resetAt: now.toISOString(),
      scope: "today",
      reason: "manual",
    };

    setProgressResets((value) => [
      ...value.filter((item) => !(item.scope === "today" && item.date === todayKey)),
      reset,
    ]);
    setNotice("Đã xóa tiến độ hôm nay. Nếu bạn học tiếp, dữ liệu mới vẫn được tính lại.");
  }

  if (!activeRoom) {
    return (
      <main className="empty">
        <button onClick={addRoom}>Tạo phòng học đầu tiên</button>
      </main>
    );
  }

  const progress = Math.min(100, (focusSinceBreak / (activeRoom.focusMinutes * 60)) * 100);
  const activeTaskTotal = activeRoom.tasks.length;
  const activeTaskCompleted = activeRoom.tasks.filter((task) => task.done).length;
  const activeTaskPercent = activeTaskTotal === 0 ? 0 : Math.round((activeTaskCompleted / activeTaskTotal) * 100);
  const latestSession = sessions[0];
  const latestIncompleteTasks = latestSession?.incompleteTasks?.slice(0, 3) ?? [];
  const latestTaskStatus =
    latestSession?.totalTaskCount && latestSession.totalTaskCount > 0
      ? `, nhiệm vụ ${latestSession.completedTaskCount ?? 0}/${latestSession.totalTaskCount}`
      : "";
  const pendingMakeupTaskCount = actionableMakeupCount;
  const canFinishSession =
    activeRoom.tasks.length > 0 || studySeconds > 0 || breakSeconds > 0 || distractionSeconds > 0;
  const isActiveMakeupSession = Boolean(activeRoom.isMakeupSession);
  const activeRoomDisplaySubject = activeRoom.originalSubject ?? activeRoom.subject;
  const makeupDeadlineText = isActiveMakeupSession
    ? getDeadlineText(activeRoom.tasks[0]?.makeupDeadlineAt ?? activeRoom.makeupDueAt)
    : "";

  return (
    <main
      className={`app-shell density-${effectiveAppearanceSettings.density} motion-${effectiveAppearanceSettings.motion}`}
      data-theme={effectiveAppearanceSettings.theme}
      data-accent={effectiveAppearanceSettings.accentColor}
      data-illustration={effectiveAppearanceSettings.illustrationStyle}
    >
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <GraduationCap size={25} />
          </div>
          <div>
            <h1>Focus Space</h1>
            <p>Vào vùng học, giảm xao nhãng.</p>
          </div>
        </div>

        <button className="create-room" onClick={addRoom}>
          <Plus size={17} />
          Thêm môn học
        </button>

        <nav className="sidebar-nav">
          <button
            className={view === "study" ? "active" : ""}
            onClick={() => {
              if (activeRoom?.isMakeupSession && normalRooms[0]) setActiveRoomId(normalRooms[0].id);
              setView("study");
            }}
          >
            <BookOpen size={17} />
            Phòng học
          </button>
          <button className={view === "summary" ? "active" : ""} onClick={() => setView("summary")}>
            <BarChart3 size={17} />
            Tổng kết
          </button>
          <button className={view === "makeup" ? "active" : ""} onClick={() => setView("makeup")}>
            <AlertCircle size={17} />
            Cần bù
            {actionableMakeupCount > 0 ? <span className="nav-count">{actionableMakeupCount}</span> : null}
          </button>
          <button className={view === "settings" ? "active" : ""} onClick={() => setView("settings")}>
            <Settings size={17} />
            Cài đặt
          </button>
        </nav>

        <div className="room-list">
          {normalRooms.map((room) => (
            <button
              className={`room-item ${room.id === activeRoom?.id ? "active" : ""}`}
              key={room.id}
              onClick={() => {
                setActiveRoomId(room.id);
                setView("study");
              }}
            >
              <span className="room-dot" style={{ background: room.color }} />
              <span>
                <strong>{room.subject}</strong>
                <small>{room.allowedApps.length + room.allowedTitleKeywords.length} luật học</small>
              </span>
            </button>
          ))}
        </div>

        <div className="privacy-card">
          <ShieldAlert size={18} />
          <span>Dữ liệu lưu local trong máy. Không gửi lịch sử học đi đâu.</span>
        </div>
      </aside>

      <section className="workspace">
        {view === "summary" ? (
          <SummaryPage
            rooms={rooms}
            sessions={sessions}
            todayResetAt={getTodayResetAt(progressResets)}
            illustrationStyle={effectiveAppearanceSettings.illustrationStyle}
            onScheduleMakeup={scheduleMakeupTask}
            onMarkMakeupCompleted={markMakeupTaskCompleted}
            onOpenMakeupRoom={openMakeupRoom}
            onOpenSourceSession={(item) => {
              setSourceSessionSelection({ sessionId: item.sessionId, taskId: item.task.id });
              setView("session-detail");
            }}
            onResetToday={resetTodayProgress}
            onCreateRoom={addRoom}
            onOpenStudy={(roomId) => {
              setActiveRoomId(roomId);
              setView("study");
            }}
          />
        ) : view === "session-result" && completedSession ? (
          <SessionResultPage
            session={completedSession}
            onHome={() => setView(completedSession.isMakeupSession ? "makeup" : "study")}
            onSummary={() => setView("summary")}
          />
        ) : view === "session-detail" ? (
          <SourceSessionDetailPage
            selection={sourceSessionSelection}
            sessions={sessions}
            onBack={() => setView("makeup")}
            onSchedule={scheduleMakeupTask}
          />
        ) : view === "makeup" ? (
          <MakeupCenterPage
            items={makeupItems}
            onSchedule={scheduleMakeupTask}
            onMarkCompleted={markMakeupTaskCompleted}
            onOpenMakeupRoom={openMakeupRoom}
            onOpenSourceSession={(item) => {
              setSourceSessionSelection({ sessionId: item.sessionId, taskId: item.task.id });
              setView("session-detail");
            }}
          />
        ) : view === "settings" ? (
          <AppearanceSettingsPage
            settings={effectiveAppearanceSettings}
            onChange={(nextSettings) => {
              setAppearanceSettings(nextSettings);
              setNotice("Đã lưu giao diện.");
            }}
            onReset={() => {
              setAppearanceSettings(defaultAppearanceSettings);
              setNotice("Đã khôi phục giao diện mặc định.");
            }}
          />
        ) : (
          <>
        <header className="topbar">
          <div>
            <p className="eyebrow">{isActiveMakeupSession ? "Buổi bù" : "Study Room"}</p>
            {isActiveMakeupSession ? (
              <div className="makeup-study-title">
                <span>BUỔI BÙ</span>
                <h2>{activeRoomDisplaySubject}</h2>
                <small>{activeRoom.goal}</small>
              </div>
            ) : (
              <input
                className="subject-input"
                value={activeRoom.subject}
                onChange={(event) => updateRoom({ ...activeRoom, subject: event.target.value })}
              />
            )}
          </div>
          <div className={`status-pill ${status}`}>
            {statusLabel(status)}
          </div>
        </header>

        <section className="hero-panel">
          <div className="hero-copy">
            <div className={isActiveMakeupSession ? "goal-row makeup-goal-row" : "goal-row"}>
              <Target size={20} />
              {isActiveMakeupSession ? (
                <div className="makeup-goal-copy">
                  <strong>{activeRoom.goal}</strong>
                  <span>Cần bù trong 7 ngày · {makeupDeadlineText}</span>
                </div>
              ) : (
                <input
                  value={activeRoom.goal}
                  onChange={(event) => updateRoom({ ...activeRoom, goal: event.target.value })}
                  placeholder="Mục tiêu buổi học"
                />
              )}
            </div>
            <div className="timer">{formatSeconds(studySeconds)}</div>
            <div className="session-note">{notice}</div>

            <div className="controls">
              <button className="primary" onClick={toggleRunning}>
                {running ? <Pause size={18} /> : <Play size={18} />}
                {running ? "Tạm dừng" : isActiveMakeupSession ? "Bắt đầu bù" : "Bắt đầu học"}
              </button>
              <button onClick={() => setBreakMode((value) => !value)}>
                <Coffee size={18} />
                {breakMode ? "Kết thúc nghỉ" : "Nghỉ giải lao"}
              </button>
              <button onClick={openEndSessionModal} disabled={!canFinishSession}>
                <CheckCircle2 size={18} />
                {isActiveMakeupSession ? "Kết thúc buổi bù" : "Kết thúc buổi"}
              </button>
              <button
                onClick={resetCurrentSession}
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>
          </div>

          <div className="focus-ring">
            <div className="ring-value">{Math.round(progress)}%</div>
            <div className="ring-label">đến giờ nghỉ</div>
            <div className="mini-stats">
              <span>
                <Brain size={15} /> Học sâu {Math.round(studySeconds / 60)}p
              </span>
              <span>
                <Ban size={15} /> Rời vùng {leaveCount} lần
              </span>
            </div>
            <button className="today-summary-card" onClick={() => setView("summary")}>
              <TrendingUp size={16} />
              <span>
                Tiến độ hôm nay
                <strong>{activeTaskPercent}% nhiệm vụ</strong>
              </span>
            </button>
            {pendingMakeupTaskCount > 0 ? (
              <button
                className="makeup-home-card"
                onClick={() => {
                  setView("makeup");
                }}
              >
                <AlertCircle size={16} />
                <span>
                  Cần bù
                  <strong>{pendingMakeupTaskCount} nhiệm vụ</strong>
                </span>
              </button>
            ) : null}
          </div>
        </section>

        <section className="grid">
          <div className="panel rules-panel">
            <div className="panel-title">
              <BookOpen size={19} />
              Vùng học tập
            </div>
            <div className="rule-actions">
              <button onClick={() => captureActiveApp("allow")}>
                <Monitor size={16} /> Thêm app/tab đang mở sau 5s
              </button>
              <button onClick={addLink}>
                <Link2 size={16} /> Thêm link/keyword học
              </button>
              <button onClick={() => captureActiveApp("block")}>
                <Ban size={16} /> Chặn app đang mở sau 5s
              </button>
            </div>

            <div className="rule-columns">
              <TagList
                title="App được học"
                values={activeRoom.allowedApps}
                onRemove={(item) =>
                  updateRoom({ ...activeRoom, allowedApps: activeRoom.allowedApps.filter((value) => value !== item) })
                }
              />
              <TagList
                title="Link/keyword học"
                values={unique([...activeRoom.allowedLinks, ...activeRoom.allowedTitleKeywords])}
                onRemove={(item) =>
                  updateRoom({
                    ...activeRoom,
                    allowedLinks: activeRoom.allowedLinks.filter((value) => value !== item),
                    allowedTitleKeywords: activeRoom.allowedTitleKeywords.filter((value) => value !== item),
                  })
                }
              />
              <TagList
                title="App bị chặn"
                values={activeRoom.blockedApps}
                danger
                onRemove={(item) =>
                  updateRoom({ ...activeRoom, blockedApps: activeRoom.blockedApps.filter((value) => value !== item) })
                }
              />
            </div>
          </div>

          <div className="panel settings-panel">
            <div className="panel-title">
              <AlarmClock size={19} />
              Cài đặt phiên học
            </div>
            <label>
              Học sâu
              <input
                type="number"
                value={activeRoom.focusMinutes}
                onChange={(event) => updateRoom({ ...activeRoom, focusMinutes: Number(event.target.value) })}
              />
              phút
            </label>
            <label>
              Nghỉ
              <input
                type="number"
                value={activeRoom.breakMinutes}
                onChange={(event) => updateRoom({ ...activeRoom, breakMinutes: Number(event.target.value) })}
              />
              phút
            </label>
            <label>
              Tha thứ
              <input
                type="number"
                value={activeRoom.graceSeconds}
                onChange={(event) => updateRoom({ ...activeRoom, graceSeconds: Number(event.target.value) })}
              />
              giây
            </label>
            <label>
              Mức khóa
              <AppSelect
                value={activeRoom.lockMode}
                options={lockModeOptions}
                onChange={(value) => updateRoom({ ...activeRoom, lockMode: value })}
                className="settings-select"
              />
            </label>
            {!isActiveMakeupSession ? (
              <button className="delete-room" onClick={() => deleteRoom(activeRoom.id)}>
                <Trash2 size={16} /> Xóa phòng học này
              </button>
            ) : null}
          </div>

          <div className="panel task-panel">
            <div className="panel-title">
              <CopyPlus size={19} />
              {isActiveMakeupSession ? "Nhiệm vụ cần bù" : "Nhiệm vụ buổi học"}
            </div>
            {!isActiveMakeupSession ? (
            <div className="task-input">
              <input
                value={newTask}
                onChange={(event) => setNewTask(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addTask();
                }}
                placeholder="Ví dụ: Làm xong bài 1-3"
              />
              <button onClick={addTask}>
                <Plus size={16} />
              </button>
            </div>
            ) : (
              <div className="makeup-task-hint">Tick nhiệm vụ sau khi bạn thật sự đã bù xong. Task gốc chỉ cập nhật khi bạn kết thúc buổi bù.</div>
            )}
            <div className="tasks">
              {activeRoom.tasks.length === 0 && isActiveMakeupSession ? (
                <div className="summary-soft-empty">Buổi bù này không còn nhiệm vụ cần xử lý.</div>
              ) : null}
              {activeRoom.tasks.map((task) => (
                <div className={isActiveMakeupSession ? "task makeup-session-task" : "task"} key={task.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() =>
                        updateRoom({
                          ...activeRoom,
                          tasks: activeRoom.tasks.map((item) =>
                            item.id === task.id
                              ? {
                                  ...item,
                                  done: !item.done,
                                  status: !item.done ? ("completed" as const) : ("pending" as const),
                                  completedAt: !item.done ? new Date().toISOString() : undefined,
                                }
                              : item
                          ),
                        })
                      }
                    />
                    <span>{task.title}</span>
                  </label>
                  {!isActiveMakeupSession ? (
                    <button
                      className="task-delete"
                      title="Xóa nhiệm vụ"
                      onClick={() =>
                        updateRoom({
                          ...activeRoom,
                          tasks: activeRoom.tasks.filter((item) => item.id !== task.id),
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="panel stats-panel">
            <div className="panel-title">
              <BarChart3 size={19} />
              Tiến bộ
            </div>
            <div className="stat-grid">
              <Stat icon={<TimerReset size={17} />} label="Học sâu" value={`${Math.round(studySeconds / 60)}p`} />
              <Stat icon={<Coffee size={17} />} label="Nghỉ" value={`${Math.round(breakSeconds / 60)}p`} />
              <Stat icon={<Ban size={17} />} label="Mất tập trung" value={`${Math.round(distractionSeconds / 60)}p`} />
              <Stat icon={<Flame size={17} />} label="Streak học" value={`${streakInfo.currentStreak} ngày`} />
            </div>
            <div className={streakInfo.todayReachedGoal ? "streak-card reached" : "streak-card"}>
              <div>
                <strong>{streakInfo.todayReachedGoal ? "Hôm nay đã nối streak" : "Hôm nay chưa nối streak"}</strong>
                <span>
                  {streakInfo.todayReachedGoal
                    ? `Đã học ${formatMinutes(streakInfo.todayStudyMinutes)}. Longest streak: ${streakInfo.longestStreak} ngày.`
                    : `Còn thiếu ${streakInfo.remainingMinutes}p để đạt mục tiêu 60 phút.`}
                </span>
              </div>
              <Flame size={20} />
            </div>
            <div className="chart">
              <ResponsiveContainer width="100%" height={155}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="focusGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#5eead4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#5eead4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#24444a" />
                  <XAxis dataKey="day" stroke="#9fb8bd" />
                  <YAxis stroke="#9fb8bd" />
                  <Tooltip
                    contentStyle={{ background: "#102328", border: "1px solid #2a4c54", borderRadius: 10 }}
                  />
                  <Area type="monotone" dataKey="minutes" stroke="#5eead4" fill="url(#focusGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {latestSession && (
              <div className="last-session">
                Buổi gần nhất: {latestSession.subject}, học sâu {latestSession.deepMinutes} phút,
                rời vùng {latestSession.leaves} lần{latestTaskStatus}.
                {latestIncompleteTasks.length > 0 ? (
                  <ul>
                    {latestIncompleteTasks.map((task) => (
                      <li key={task}>{task}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </div>
        </section>

        <footer className="active-window">
          <ExternalLink size={16} />
          Active: <strong>{activeWindow.process_name || "Không rõ"}</strong>
          <span>{activeWindow.title || "Không có tiêu đề"}</span>
        </footer>
          </>
        )}
      </section>

      {endSessionReview ? (
        <EndSessionModal
          review={endSessionReview}
          onCancel={() => setEndSessionReview(null)}
          onSave={finishSessionFromReview}
        />
      ) : null}

      {showFocusWarning ? (
        <WarningOverlay
          payload={warningPayload}
          onHide={() => {
            setShowFocusWarning(false);
            warningWindowRaisedRef.current = false;
            invoke("hide_warning_window").catch(() => undefined);
          }}
        />
      ) : null}

      {celebrationSession ? (
        <CelebrationModal
          session={celebrationSession}
          motion={effectiveAppearanceSettings.motion}
          onClose={() => setCelebrationSession(null)}
          onSummary={() => setCelebrationSession(null)}
          onMakeup={() => {
            setCelebrationSession(null);
            setView("makeup");
          }}
        />
      ) : null}
    </main>
  );
}

function classifyWindow(room: StudyRoom, active: ActiveWindowInfo): { state: FocusState; reason: string } {
  const process = active.process_name || "";
  const title = active.title || "";
  const text = `${process} ${title}`.toLowerCase();

  if (neutralProcesses.some((item) => same(item, process) || text.includes(item.toLowerCase()))) {
    return { state: "neutral", reason: "Công cụ phụ/trung lập, không cảnh báo." };
  }

  if (room.blockedApps.some((item) => same(item, process))) {
    return { state: "blocked", reason: `App bị chặn: ${process}` };
  }

  if (room.blockedKeywords.some((item) => text.includes(item.toLowerCase()))) {
    return { state: "blocked", reason: `Nội dung bị chặn: ${title}` };
  }

  if (room.allowedApps.some((item) => same(item, process))) {
    return { state: "study", reason: `Đang học bằng app được phép: ${process}` };
  }

  const keyword = unique([...room.allowedTitleKeywords, ...room.allowedLinks.map(normalizeKeyword)]).find((item) =>
    text.includes(item.toLowerCase())
  );
  if (keyword) {
    return { state: "study", reason: `Đang ở link/keyword học: ${keyword}` };
  }

  if (browserProcesses.some((item) => same(item, process))) {
    return { state: "off", reason: "Trình duyệt đang mở tab chưa nằm trong vùng học." };
  }

  return { state: "off", reason: "Cửa sổ này chưa thuộc vùng học." };
}

function TagList({
  title,
  values,
  danger,
  onRemove,
}: {
  title: string;
  values: string[];
  danger?: boolean;
  onRemove: (item: string) => void;
}) {
  return (
    <div className="tag-list">
      <h3>{title}</h3>
      {values.length === 0 ? <p>Chưa có.</p> : null}
      <div>
        {values.map((item) => (
          <button className={danger ? "tag danger" : "tag"} key={item} onClick={() => onRemove(item)}>
            {item}
            <Trash2 size={12} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="stat-card">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EndSessionModal({
  review,
  onCancel,
  onSave,
}: {
  review: EndSessionReview;
  onCancel: () => void;
  onSave: () => void;
}) {
  const hasIncompleteTasks = review.incompleteTasks.length > 0;
  const isMakeupSession = Boolean(review.isMakeupSession);

  return (
    <div className="session-modal-backdrop" role="dialog" aria-modal="true">
      <section className="session-modal-card">
        <div className="session-modal-header">
          <div>
            <p className="eyebrow">{isMakeupSession ? "Kết thúc buổi bù" : "Kết thúc buổi học"}</p>
            <h2>{isMakeupSession ? "Bạn muốn kết thúc buổi bù này?" : "Bạn muốn kết thúc buổi học này?"}</h2>
            <strong>{review.subject}</strong>
          </div>
          <div className="session-modal-progress">
            <span>{review.progressPercent}%</span>
            <small>tiến độ</small>
          </div>
        </div>

        <div className="modal-progress-track">
          <span style={{ width: `${review.progressPercent}%` }} />
        </div>

        <div className="session-modal-stats">
          <ModalStat label="Tổng nhiệm vụ" value={`${review.totalTasks}`} />
          <ModalStat label="Đã hoàn thành" value={`${review.completedTasks.length}`} />
          <ModalStat label="Chưa hoàn thành" value={`${review.incompleteTasks.length}`} warning />
          <ModalStat label="Thời gian học" value={formatMinutes(review.studyMinutes)} />
        </div>

        {hasIncompleteTasks ? (
          <div className="missed-task-box">
            <div>
              <AlertCircle size={18} />
              <strong>Bạn còn nhiệm vụ chưa hoàn thành</strong>
            </div>
            <div className="missed-task-scroll">
              {review.incompleteTasks.map((task) => (
                <span key={task.id}>{task.title}</span>
              ))}
            </div>
            <p>
              {isMakeupSession
                ? "Nhiệm vụ chưa bù xong sẽ tiếp tục nằm trong mục Cần bù để bạn xử lý trong thời hạn còn lại."
                : "Các nhiệm vụ chưa hoàn thành sẽ được chuyển vào mục Cần bù. Bạn có thể xếp lịch bù trong vòng 7 ngày."}
            </p>
          </div>
        ) : (
          <div className="complete-task-box">
            <CheckCircle2 size={18} />
            {isMakeupSession ? "Bạn đã hoàn thành toàn bộ nhiệm vụ của buổi bù này." : "Bạn đã hoàn thành toàn bộ nhiệm vụ của buổi học này."}
          </div>
        )}

        <div className="session-modal-actions">
          <button onClick={onCancel}>Hủy</button>
          <button className="primary" onClick={onSave}>
            {isMakeupSession ? "Kết thúc và lưu buổi bù" : "Kết thúc và lưu tổng kết"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ModalStat({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div className={warning ? "modal-stat warning" : "modal-stat"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AppSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder = "Chọn",
  disabled = false,
  className = "",
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((option) => option.value === value))
  );
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)));
  }, [options, value]);

  function selectOption(option: SelectOption<T>) {
    onChange(option.value);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(options.length - 1, index + 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.max(0, index - 1));
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) {
        const option = options[activeIndex] ?? options[0];
        if (option) selectOption(option);
      } else {
        setOpen(true);
      }
    }
  }

  return (
    <div className={`app-select ${open ? "open" : ""} ${className}`} ref={rootRef}>
      <button
        type="button"
        className="app-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={handleKeyDown}
      >
        <span>
          <strong>{selectedOption?.label ?? placeholder}</strong>
          {selectedOption?.description ? <small>{selectedOption.description}</small> : null}
        </span>
        <span className="app-select-chevron">⌄</span>
      </button>

      {open ? (
        <div className="app-select-menu" role="listbox">
          {options.map((option, index) => (
            <button
              type="button"
              className={`${option.value === value ? "selected" : ""} ${index === activeIndex ? "active" : ""}`}
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectOption(option)}
            >
              <span>
                <strong>{option.label}</strong>
                {option.description ? <small>{option.description}</small> : null}
              </span>
              {option.value === value ? <CheckCircle2 size={16} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AppearanceSettingsPage({
  settings,
  onChange,
  onReset,
}: {
  settings: AppearanceSettings;
  onChange: (settings: AppearanceSettings) => void;
  onReset: () => void;
}) {
  const selectedAccent = accentOptions.find((option) => option.value === settings.accentColor) ?? accentOptions[0];

  function updateSetting(next: Partial<AppearanceSettings>) {
    onChange({ ...settings, ...next });
  }

  return (
    <section className="appearance-page">
      <header className="summary-header appearance-header">
        <div>
          <p className="eyebrow">Appearance</p>
          <h2>Cài đặt giao diện</h2>
          <p>Tùy chỉnh Focus Space theo cách bạn học tốt nhất.</p>
        </div>
        <button className="appearance-reset-button" onClick={onReset}>
          <RotateCcw size={16} />
          Khôi phục mặc định
        </button>
      </header>

      <section className="appearance-grid">
        <div className="appearance-main">
          <AppearanceSection title="Chủ đề" description="Chọn phong cách tổng thể cho app.">
            <div className="theme-card-grid">
              {themeOptions.map((theme) => (
                <button
                  className={settings.theme === theme.value ? "theme-choice-card active" : "theme-choice-card"}
                  key={theme.value}
                  onClick={() => updateSetting({ theme: theme.value })}
                >
                  <div className="theme-preview-strip">
                    {theme.swatches.map((swatch) => (
                      <span style={{ background: swatch }} key={swatch} />
                    ))}
                  </div>
                  <div>
                    <strong>{theme.label}</strong>
                    <small>{theme.description}</small>
                  </div>
                  {settings.theme === theme.value ? <CheckCircle2 size={18} /> : null}
                </button>
              ))}
            </div>
          </AppearanceSection>

          <AppearanceSection title="Màu nhấn" description="Áp dụng cho button, tab active, progress bar, badge quan trọng.">
            <div className="accent-swatch-row">
              {accentOptions.map((accent) => (
                <button
                  className={settings.accentColor === accent.value ? "accent-swatch active" : "accent-swatch"}
                  key={accent.value}
                  onClick={() => updateSetting({ accentColor: accent.value })}
                  title={accent.label}
                >
                  <span style={{ background: accent.color }} />
                  <small>{accent.label}</small>
                </button>
              ))}
            </div>
          </AppearanceSection>

          <div className="appearance-two-col">
            <AppearanceSection title="Hình minh họa" description="Dùng cho empty state, thành tích, tổng kết nhẹ.">
              <SegmentedChoice
                value={settings.illustrationStyle}
                options={illustrationOptions}
                onChange={(value) => updateSetting({ illustrationStyle: value as IllustrationStyle })}
              />
            </AppearanceSection>

            <AppearanceSection title="Mật độ giao diện" description="Chọn độ thoáng hoặc gọn của dashboard.">
              <SegmentedChoice
                value={settings.density}
                options={[
                  { value: "comfortable", label: "Thoải mái", description: "Card rộng và dễ nhìn." },
                  { value: "compact", label: "Gọn gàng", description: "Hiện được nhiều dữ liệu hơn." },
                ]}
                onChange={(value) => updateSetting({ density: value as InterfaceDensity })}
              />
            </AppearanceSection>
          </div>

          <AppearanceSection title="Hiệu ứng" description="Giảm glow/blur/transition nếu thích giao diện nghiêm túc hoặc máy yếu.">
            <SegmentedChoice
              value={settings.motion}
              options={[
                { value: "normal", label: "Bình thường", description: "Giữ animation hiện tại." },
                { value: "reduced", label: "Ít hiệu ứng", description: "Giảm chuyển động và glow." },
              ]}
              onChange={(value) => updateSetting({ motion: value as MotionLevel })}
            />
          </AppearanceSection>
        </div>

        <aside className="appearance-preview-card">
          <div className="summary-card-title">
            <Sparkles size={18} />
            Preview
          </div>
          <IllustrationMark styleName={settings.illustrationStyle} />
          <article className="preview-study-card">
            <div>
              <span>Study Room</span>
              <strong>Machine Learning</strong>
              <small>Hoàn thành bài tập và ghi lỗi hay gặp</small>
            </div>
            <button> Bắt đầu học</button>
          </article>
          <div className="preview-progress">
            <div>
              <span>Tiến độ hôm nay</span>
              <strong>68%</strong>
            </div>
            <div className="summary-progress-track">
              <span style={{ width: "68%" }} />
            </div>
          </div>
          <div className="preview-badges">
            <span style={{ borderColor: selectedAccent.color }}>Đạt 60p</span>
            <span>Cần bù 2</span>
          </div>
        </aside>
      </section>
    </section>
  );
}

function AppearanceSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="appearance-section">
      <div className="appearance-section-title">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

function SegmentedChoice({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string; description: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="segmented-choice">
      {options.map((option) => (
        <button
          className={value === option.value ? "active" : ""}
          key={option.value}
          onClick={() => onChange(option.value)}
        >
          <strong>{option.label}</strong>
          <small>{option.description}</small>
        </button>
      ))}
    </div>
  );
}

function IllustrationMark({ styleName }: { styleName: IllustrationStyle }) {
  if (styleName === "off") return null;
  const content =
    styleName === "cute"
      ? { icon: "✦", label: "Cute Focus" }
      : styleName === "minimal"
        ? { icon: "◌", label: "Minimal" }
        : { icon: "✧", label: "Space" };

  return (
    <div className={`illustration-mark ${styleName}`}>
      <span>{content.icon}</span>
      <small>{content.label}</small>
    </div>
  );
}

function SessionResultPage({
  session,
  onHome,
  onSummary,
}: {
  session: SessionSummary;
  onHome: () => void;
  onSummary: () => void;
}) {
  const completedTasks = session.completedTaskSnapshots ?? [];
  const missedTasks = session.missedTaskSnapshots ?? [];
  const progress = session.progressPercent ?? 0;
  const isMakeupSession = Boolean(session.isMakeupSession);
  const hasNoTasks = (session.totalTaskCount ?? 0) === 0;

  return (
    <section className="session-result-page">
      <header className="session-result-hero">
        <div>
          <p className="eyebrow">{isMakeupSession ? "Tổng kết buổi bù" : "Session summary"}</p>
          <h2>{isMakeupSession ? `${session.subject} - Buổi bù` : session.subject}</h2>
          <span>{isMakeupSession ? "Đã kết thúc buổi bù" : "Đã kết thúc"} · {formatShortDate(session.endedAt ?? session.date)}</span>
        </div>
        <div className="session-result-score">
          <strong>{progress}%</strong>
          <small>hoàn thành</small>
        </div>
      </header>

      <section className="session-result-progress">
        <div className="modal-progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="session-result-cards">
        <ProgressStatCard icon={<CheckCircle2 size={18} />} label="Đã hoàn thành" value={`${completedTasks.length} nhiệm vụ`} />
        <ProgressStatCard icon={<AlertCircle size={18} />} label="Chưa hoàn thành" value={`${missedTasks.length} nhiệm vụ`} tone="warning" />
        <ProgressStatCard icon={<Clock size={18} />} label="Thời gian học" value={formatMinutes(session.deepMinutes)} />
        <ProgressStatCard icon={<Ban size={18} />} label="Rời vùng học" value={`${session.leaves} lần`} />
      </section>

      {hasNoTasks && isMakeupSession ? (
        <section className="result-makeup-panel">
          <AlertCircle size={20} />
          Buổi bù này không còn nhiệm vụ cần xử lý.
        </section>
      ) : missedTasks.length > 0 ? (
        <section className="result-makeup-panel">
          <div>
            <h3>{isMakeupSession ? "Buổi bù còn nhiệm vụ chưa xử lý" : "Bạn còn nhiệm vụ chưa hoàn thành"}</h3>
            <p>
              {isMakeupSession
                ? "Nhiệm vụ chưa bù xong vẫn nằm trong mục Cần bù để bạn hoàn thành trong thời hạn còn lại."
                : "Các nhiệm vụ này đã được chuyển vào mục Cần bù. Bạn có thể tự xếp lịch trong vòng 7 ngày ở trang Tổng kết."}
            </p>
          </div>
          <button className="result-summary-button" onClick={onSummary}>
            <Calendar size={16} />
            {isMakeupSession ? "Xem Tổng kết" : "Xếp lịch ở Tổng kết"}
          </button>
        </section>
      ) : (
        <section className="result-makeup-panel success">
          <CheckCircle2 size={20} />
          {isMakeupSession ? "Bạn đã xử lý xong toàn bộ nhiệm vụ bù." : "Bạn đã hoàn thành toàn bộ nhiệm vụ của buổi học này."}
        </section>
      )}

      <section className="summary-task-columns">
        <SnapshotTaskList title="Đã hoàn thành" tasks={completedTasks} emptyText="Chưa có nhiệm vụ hoàn thành." />
        <SnapshotTaskList title="Chưa hoàn thành" tasks={missedTasks} emptyText="Không còn nhiệm vụ chưa hoàn thành." />
      </section>

      <footer className="session-result-actions">
        <button onClick={onHome}>{isMakeupSession ? "Quay lại Cần bù" : "Quay về trang chủ"}</button>
        <button className="primary" onClick={onSummary}>Xem tổng kết môn học</button>
      </footer>
    </section>
  );
}

function AchievementVisual({
  progress,
  hasMissedTasks,
  motion,
  variant = "inline",
  isMakeupSession = false,
}: {
  progress: number;
  hasMissedTasks: boolean;
  motion: MotionLevel;
  variant?: "inline" | "modal";
  isMakeupSession?: boolean;
}) {
  const tier = isMakeupSession ? getMakeupAchievementTier(progress) : getAchievementTier(progress);
  const reducedClass = motion === "reduced" ? "static" : "";

  return (
    <section className={`achievement-card ${variant} ${tier.key} ${isMakeupSession ? "makeup-visual" : "study-visual"} ${reducedClass}`}>
      <div className="achievement-scene" aria-hidden="true">
        <span className="achievement-glow" />
        <span className="achievement-orbit" />
        <span className="achievement-planet">
          <span className="achievement-planet-shine" />
        </span>
        <span className="achievement-rocket">
          <span className="rocket-body">{isMakeupSession ? "✓" : "▲"}</span>
          <span className="rocket-flame" />
        </span>
        {motion === "normal" ? (
          <>
            <span className="achievement-star one" />
            <span className="achievement-star two" />
            <span className="achievement-star three" />
            <span className="achievement-comet one" />
            <span className="achievement-comet two" />
            <span className="achievement-confetti c1" />
            <span className="achievement-confetti c2" />
            <span className="achievement-confetti c3" />
            <span className="achievement-confetti c4" />
          </>
        ) : null}
      </div>
      <div>
        <p className="eyebrow">{tier.status}</p>
        <h2>{tier.title}</h2>
        <p>{tier.description}</p>
        {hasMissedTasks ? <small>Phần còn lại có thể đưa vào Cần bù trong vòng 7 ngày.</small> : null}
      </div>
    </section>
  );
}

function SourceSessionDetailPage({
  selection,
  sessions,
  onBack,
  onSchedule,
}: {
  selection: { sessionId: string; taskId?: string } | null;
  sessions: SessionSummary[];
  onBack: () => void;
  onSchedule: (item: MissedTaskItem, scheduledAt: string) => void;
}) {
  const [scheduleDraft, setScheduleDraft] = useState<MakeupScheduleDraft | null>(null);
  const session = selection ? sessions.find((item) => item.id === selection.sessionId) : undefined;
  const selectedTask = session?.missedTaskSnapshots?.find((task) => task.id === selection?.taskId);
  const completedTasks = session?.completedTaskSnapshots ?? [];
  const missedTasks = session?.missedTaskSnapshots ?? [];
  const movedTasks = missedTasks.filter((task) => {
    const status = getMissedTaskStatus(task);
    return status === "scheduled_makeup" || status === "makeup_completed";
  });
  const progress = session?.progressPercent ?? 0;
  const selectedTaskStatus = selectedTask ? getMissedTaskStatus(selectedTask) : undefined;
  const canScheduleSelectedTask = Boolean(
    session &&
      selectedTask &&
      selectedTaskStatus === "missed" &&
      (!selectedTask.makeupDeadlineAt || new Date() <= new Date(selectedTask.makeupDeadlineAt))
  );

  function buildSelectedMissedItem(): MissedTaskItem | null {
    if (!session || !selectedTask) return null;
    return {
      sessionId: session.id,
      subjectId: session.subjectId,
      subject: session.subject,
      goal: session.goal,
      missedAt: selectedTask.missedAt ?? session.endedAt ?? session.date,
      task: selectedTask,
    };
  }

  if (!selection || !session) {
    return (
      <section className="summary-empty-page source-session-empty">
        <IllustrationMark styleName="minimal" />
        <h2>Không tìm thấy buổi học gốc.</h2>
        <p>Buổi học này có thể đã bị xóa khỏi lịch sử hoặc dữ liệu cũ chưa có sourceSessionId.</p>
        <button onClick={onBack}>Quay lại Cần bù</button>
      </section>
    );
  }

  return (
    <section className="source-session-page">
      <header className="session-result-hero source-session-hero">
        <div>
          <p className="eyebrow">Buổi học gốc</p>
          <h2>{session.subject}</h2>
          <span>{formatShortDate(session.endedAt ?? session.date)} · {formatTimeRange(session.startedAt, session.endedAt ?? session.date)}</span>
        </div>
        <div className="session-result-score">
          <strong>{progress}%</strong>
          <small>hoàn thành</small>
        </div>
      </header>

      <section className="source-session-reason">
        <AlertCircle size={18} />
        <div>
          <strong>Nhiệm vụ này chưa hoàn thành trong buổi học gốc.</strong>
          <span>{selectedTask?.title ?? "Không tìm thấy nhiệm vụ cụ thể trong snapshot cũ."}</span>
        </div>
      </section>

      <section className="session-result-cards">
        <ProgressStatCard icon={<Clock size={18} />} label="Tổng thời gian học" value={formatMinutes(session.deepMinutes)} />
        <ProgressStatCard icon={<ListChecks size={18} />} label="Tổng nhiệm vụ" value={`${session.totalTaskCount ?? 0}`} />
        <ProgressStatCard icon={<CheckCircle2 size={18} />} label="Đã hoàn thành" value={`${completedTasks.length}`} />
        <ProgressStatCard icon={<AlertCircle size={18} />} label="Chưa hoàn thành" value={`${missedTasks.length}`} tone="warning" />
      </section>

      <section className="session-result-progress">
        <div className="modal-progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="summary-task-columns">
        <SnapshotTaskList title="Đã hoàn thành" tasks={completedTasks} emptyText="Chưa có nhiệm vụ hoàn thành." />
        <SnapshotTaskList title="Chưa hoàn thành" tasks={missedTasks} emptyText="Không còn nhiệm vụ chưa hoàn thành." />
        <SnapshotTaskList title="Đã chuyển sang bù" tasks={movedTasks} emptyText="Chưa có nhiệm vụ nào được xếp bù." />
      </section>

      <footer className="session-result-actions">
        <button onClick={onBack}>Quay lại Cần bù</button>
        {canScheduleSelectedTask ? (
          <button
            className="primary"
            onClick={() => {
              const missedItem = buildSelectedMissedItem();
              if (missedItem) setScheduleDraft(createScheduleDraft(missedItem));
            }}
          >
            Xếp lịch bù
          </button>
        ) : null}
      </footer>

      {scheduleDraft ? (
        <MakeupSchedulePanel
          draft={scheduleDraft}
          onChange={setScheduleDraft}
          onClose={() => setScheduleDraft(null)}
          onSave={(scheduledAt) => {
            onSchedule(scheduleDraft.taskItem, scheduledAt);
            setScheduleDraft(null);
          }}
        />
      ) : null}
    </section>
  );
}

function SnapshotTaskList({ title, tasks, emptyText }: { title: string; tasks: StudyTask[]; emptyText: string }) {
  return (
    <div className="summary-task-card">
      <div className="summary-card-title">
        {title === "Đã hoàn thành" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        {title}
      </div>
      <div className="summary-task-list">
        {tasks.length === 0 ? (
          <div className="summary-soft-empty">{emptyText}</div>
        ) : (
          tasks.map((task) => (
            <article className={task.done ? "summary-task-item done" : "summary-task-item"} key={task.id}>
              <strong>{task.title}</strong>
              <small>{task.done ? "Đã hoàn thành" : "Cần bù"}</small>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function CelebrationModal({
  session,
  motion,
  onClose,
  onSummary,
  onMakeup,
}: {
  session: SessionSummary;
  motion: MotionLevel;
  onClose: () => void;
  onSummary: () => void;
  onMakeup: () => void;
}) {
  const progress = session.progressPercent ?? 0;
  const isMakeupSession = Boolean(session.isMakeupSession);
  const tier = isMakeupSession ? getMakeupAchievementTier(progress) : getAchievementTier(progress);
  const missedTasks = session.missedTaskSnapshots ?? [];
  const hasMissedTasks = (session.incompleteTaskCount ?? missedTasks.length) > 0;
  const modalRef = useRef<HTMLDivElement | null>(null);
  const showSecondaryAction = isMakeupSession || hasMissedTasks;
  const secondaryLabel = isMakeupSession ? "Quay lại Cần bù" : tier.secondaryCta;
  const primaryLabel = isMakeupSession && hasMissedTasks ? "Xem nhiệm vụ còn lại" : "Xem tổng kết";
  const handlePrimaryAction = isMakeupSession && hasMissedTasks ? onMakeup : onSummary;

  useEffect(() => {
    document.body.classList.add("celebration-open");
    modalRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("celebration-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="celebration-modal-backdrop" role="presentation">
      <section
        className={`celebration-modal ${tier.key} ${isMakeupSession ? "makeup-celebration" : "study-celebration"} ${motion === "reduced" ? "static" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        tabIndex={-1}
        ref={modalRef}
      >
        <button className="celebration-close" aria-label="Đóng" onClick={onClose}>
          ×
        </button>

        <AchievementVisual
          progress={progress}
          hasMissedTasks={hasMissedTasks}
          motion={motion}
          variant="modal"
          isMakeupSession={isMakeupSession}
        />

        <div className="celebration-copy">
          <p className="celebration-label">{tier.label}</p>
          <h2 id="celebration-title">{tier.title}</h2>
          <p>{tier.description}</p>
        </div>

        <div className="celebration-score">
          <div className="celebration-ring" style={{ "--celebration-progress": `${progress}%` } as React.CSSProperties}>
            <strong>{progress}%</strong>
            <span>{isMakeupSession ? "đã bù" : "hoàn thành"}</span>
          </div>
          <small>
            {session.subject} · {formatMinutes(session.deepMinutes)} · {session.completedTaskCount ?? 0}/{session.totalTaskCount ?? 0} nhiệm vụ
          </small>
        </div>

        <footer className="celebration-actions">
          {showSecondaryAction ? (
            <button className="celebration-secondary" onClick={onMakeup}>
              {secondaryLabel}
            </button>
          ) : null}
          <button className="celebration-primary" onClick={handlePrimaryAction}>
            {primaryLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}

function MakeupCenterPage({
  items,
  onSchedule,
  onMarkCompleted,
  onOpenMakeupRoom,
  onOpenSourceSession,
}: {
  items: MissedTaskItem[];
  onSchedule: (item: MissedTaskItem, scheduledAt: string) => void;
  onMarkCompleted: (item: MissedTaskItem) => void;
  onOpenMakeupRoom: (roomId?: string) => void;
  onOpenSourceSession: (item: MissedTaskItem) => void;
}) {
  const [scheduleDraft, setScheduleDraft] = useState<MakeupScheduleDraft | null>(null);
  const activeItems = items.filter((item) => {
    const status = getMissedTaskStatus(item.task);
    return status === "missed" || status === "scheduled_makeup";
  });
  const urgentCount = items.filter((item) => {
    const status = getMissedTaskStatus(item.task);
    const days = getRemainingDays(item.task.makeupDeadlineAt);
    return status === "missed" && days >= 0 && days <= 2;
  }).length;
  const expiredCount = items.filter((item) => getMissedTaskStatus(item.task) === "expired").length;
  const scheduledCount = items.filter((item) => getMissedTaskStatus(item.task) === "scheduled_makeup").length;
  const completedCount = items.filter((item) => getMissedTaskStatus(item.task) === "makeup_completed").length;

  return (
    <section className="makeup-page">
      <header className="summary-header">
        <div>
          <p className="eyebrow">Makeup center</p>
          <h2>Cần bù</h2>
          <p>Quản lý các nhiệm vụ phát sinh do buổi học trước chưa hoàn thành.</p>
        </div>
      </header>

      <section className="makeup-risk-hero">
        <div>
          <h3>Cần bù trong 7 ngày</h3>
          <p>
            {activeItems.length > 0
              ? `Bạn có ${activeItems.length} nhiệm vụ cần xử lý. Hãy xếp lịch trong 7 ngày để giữ tiến độ học ổn định.`
              : "Không có nhiệm vụ cần bù đang mở. Các mục đã bù xong hoặc quá hạn được lưu lại trong lịch sử."}
          </p>
        </div>
        <AlertCircle size={30} />
      </section>

      <section className="summary-stat-grid makeup-stat-grid">
        <ProgressStatCard icon={<AlertCircle size={18} />} label="Cần xử lý" value={`${activeItems.length}`} tone="warning" />
        <ProgressStatCard icon={<Clock size={18} />} label="Sắp hết hạn" value={`${urgentCount}`} tone="warning" />
        <ProgressStatCard icon={<Ban size={18} />} label="Quá hạn" value={`${expiredCount}`} tone="warning" />
        <ProgressStatCard icon={<Calendar size={18} />} label="Đã xếp lịch" value={`${scheduledCount}`} />
        <ProgressStatCard icon={<CheckCircle2 size={18} />} label="Đã bù xong" value={`${completedCount}`} />
      </section>

      {items.length === 0 ? (
        <section className="summary-empty-page makeup-empty">
          <IllustrationMark styleName="minimal" />
          <h2>Chưa có nhiệm vụ cần bù</h2>
          <p>Khi kết thúc buổi học mà còn nhiệm vụ chưa hoàn thành, chúng sẽ xuất hiện ở đây.</p>
        </section>
      ) : (
        <MakeupTaskBoard
          items={items}
          onSchedule={(item) => setScheduleDraft(createScheduleDraft(item))}
          onMarkCompleted={onMarkCompleted}
          onOpenMakeupRoom={onOpenMakeupRoom}
          onOpenSourceSession={onOpenSourceSession}
        />
      )}

      {scheduleDraft ? (
        <MakeupSchedulePanel
          draft={scheduleDraft}
          onChange={setScheduleDraft}
          onClose={() => setScheduleDraft(null)}
          onSave={(scheduledAt) => {
            onSchedule(scheduleDraft.taskItem, scheduledAt);
            setScheduleDraft(null);
          }}
        />
      ) : null}
    </section>
  );
}

function SummaryPage({
  rooms,
  sessions,
  todayResetAt,
  illustrationStyle,
  onScheduleMakeup,
  onMarkMakeupCompleted,
  onOpenMakeupRoom,
  onOpenSourceSession,
  onResetToday,
  onCreateRoom,
  onOpenStudy,
}: {
  rooms: StudyRoom[];
  sessions: SessionSummary[];
  todayResetAt?: string;
  illustrationStyle: IllustrationStyle;
  onScheduleMakeup: (item: MissedTaskItem, scheduledAt: string) => void;
  onMarkMakeupCompleted: (item: MissedTaskItem) => void;
  onOpenMakeupRoom: (roomId?: string) => void;
  onOpenSourceSession: (item: MissedTaskItem) => void;
  onResetToday: () => void;
  onCreateRoom: () => void;
  onOpenStudy: (roomId: string) => void;
}) {
  const [filter, setFilter] = useState<SummaryFilter>("today");
  const [scheduleDraft, setScheduleDraft] = useState<MakeupScheduleDraft | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  const filteredSessions = useMemo(
    () =>
      sessions
        .filter((session) => shouldUseSessionForSummary(session, todayResetAt))
        .filter((session) => isWithinFilter(getSessionDate(session), filter)),
    [filter, sessions, todayResetAt]
  );
  const currentYearSessions = useMemo(
    () =>
      sessions
        .filter((session) => shouldUseSessionForSummary(session, todayResetAt))
        .filter((session) => isWithinFilter(getSessionDate(session), "year")),
    [sessions, todayResetAt]
  );
  const tasks = useMemo(
    () => buildSummaryTasks(rooms, filteredSessions, todayResetAt),
    [filteredSessions, rooms, todayResetAt]
  );
  const completedTasks = tasks.filter((task) => task.done);
  const incompleteTasks = tasks.filter((task) => !task.done);
  const totalTasks = tasks.length;
  const completionPercent = totalTasks === 0 ? 0 : Math.round((completedTasks.length / totalTasks) * 100);
  const totalMinutes = filteredSessions.reduce((sum, session) => sum + session.deepMinutes, 0);
  const completedSessions = filteredSessions.filter((session) => session.completed).length;
  const subjectSummaries = useMemo(
    () => buildSubjectSummaries(filteredSessions, rooms),
    [filteredSessions, rooms]
  );
  const missedTaskItems = useMemo(() => buildMissedTaskItems(currentYearSessions), [currentYearSessions]);
  const todaySummary = useMemo(
    () => buildDaySummary(new Date(), rooms, currentYearSessions, todayResetAt),
    [currentYearSessions, rooms, todayResetAt]
  );
  const weekSummaries = useMemo(
    () => buildCurrentWeekSummaries(rooms, currentYearSessions, todayResetAt),
    [currentYearSessions, rooms, todayResetAt]
  );
  const monthSummaries = useMemo(
    () => buildCurrentMonthSummaries(rooms, currentYearSessions, todayResetAt),
    [currentYearSessions, rooms, todayResetAt]
  );
  const yearMonths = useMemo(() => buildCurrentYearMonthSummaries(currentYearSessions), [currentYearSessions]);
  const hasAnyData = currentYearSessions.length > 0 || rooms.some((room) => room.tasks.length > 0);

  if (!hasAnyData) {
    return (
      <section className="summary-empty-page">
        <div className="summary-empty-planet">
          <GraduationCap size={34} />
        </div>
        <IllustrationMark styleName={illustrationStyle} />
        <h2>Chưa có dữ liệu tiến độ</h2>
        <p>Tạo phòng học đầu tiên, thêm nhiệm vụ rồi bắt đầu một phiên học để xem tổng kết.</p>
        <button onClick={onCreateRoom}>
          <Plus size={17} />
          Tạo buổi học đầu tiên
        </button>
      </section>
    );
  }

  return (
    <section className="summary-page">
      <header className="summary-header">
        <div>
          <p className="eyebrow">Progress</p>
          <h2>Tổng kết tiến độ</h2>
          <p>Theo dõi mức độ hoàn thành mục tiêu học tập của bạn</p>
        </div>
        <div className="summary-filter" aria-label="Bộ lọc thời gian">
          {summaryFilters.map((item) => (
            <button
              className={filter === item.value ? "active" : ""}
              key={item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {filter === "today" ? (
        <TodaySummaryView
          summary={todaySummary}
          missedTaskItems={missedTaskItems}
          todayResetAt={todayResetAt}
          illustrationStyle={illustrationStyle}
          onReset={() => setShowResetModal(true)}
          onSchedule={(item) => setScheduleDraft(createScheduleDraft(item))}
          onOpenSourceSession={onOpenSourceSession}
        />
      ) : filter === "week" ? (
        <WeekSummaryView summaries={weekSummaries} sessions={filteredSessions} tasks={tasks} />
      ) : filter === "month" ? (
        <MonthSummaryView summaries={monthSummaries} subjectSummaries={subjectSummaries} />
      ) : (
        <YearSummaryView months={yearMonths} sessions={currentYearSessions} />
      )}

      {filter !== "year" ? (
        <MakeupTaskBoard
          items={missedTaskItems}
          onSchedule={(item) => setScheduleDraft(createScheduleDraft(item))}
          onMarkCompleted={onMarkMakeupCompleted}
          onOpenMakeupRoom={onOpenMakeupRoom}
          onOpenSourceSession={onOpenSourceSession}
        />
      ) : null}

      {filter !== "today" && filter !== "year" ? (
        <section className="summary-task-columns">
          <TaskCompletionList title="Đã hoàn thành" tasks={completedTasks} emptyText="Chưa có nhiệm vụ hoàn thành." />
          <TaskCompletionList title="Chưa hoàn thành" tasks={incompleteTasks} emptyText="Không còn nhiệm vụ nào đang mở." />
        </section>
      ) : null}

      {scheduleDraft ? (
        <MakeupSchedulePanel
          draft={scheduleDraft}
          onChange={setScheduleDraft}
          onClose={() => setScheduleDraft(null)}
          onSave={(scheduledAt) => {
            onScheduleMakeup(scheduleDraft.taskItem, scheduledAt);
            setScheduleDraft(null);
          }}
        />
      ) : null}

      {showResetModal ? (
        <ResetTodayModal
          onClose={() => setShowResetModal(false)}
          onConfirm={() => {
            onResetToday();
            setShowResetModal(false);
          }}
        />
      ) : null}
    </section>
  );
}

function TodaySummaryView({
  summary,
  missedTaskItems,
  todayResetAt,
  illustrationStyle,
  onReset,
  onSchedule,
  onOpenSourceSession,
}: {
  summary: DaySummary;
  missedTaskItems: MissedTaskItem[];
  todayResetAt?: string;
  illustrationStyle: IllustrationStyle;
  onReset: () => void;
  onSchedule: (item: MissedTaskItem) => void;
  onOpenSourceSession: (item: MissedTaskItem) => void;
}) {
  const remainingMinutes = Math.max(0, dailyMinimumStudyMinutes - summary.studyMinutes);
  const todayMakeupItems = missedTaskItems.filter((item) => {
    const status = getMissedTaskStatus(item.task);
    const deadline = item.task.makeupDeadlineAt ? new Date(item.task.makeupDeadlineAt) : null;
    return status !== "expired" && (isSameDay(new Date(item.missedAt), new Date()) || (deadline && isSameDay(deadline, new Date())));
  });

  return (
    <section className="today-dashboard">
      <article className="daily-goal-card">
        <div>
          <p className="eyebrow">Daily focus</p>
          <h3>Mục tiêu hôm nay</h3>
          <p>
            Đã học {formatMinutes(summary.studyMinutes)} / {dailyMinimumStudyMinutes}p.
            {summary.reachedDailyMinimum ? " Đạt mục tiêu ngày." : ` Còn thiếu ${remainingMinutes}p.`}
          </p>
          {todayResetAt ? <small>Đã reset hôm nay lúc {formatDateTime(todayResetAt)}.</small> : null}
        </div>
        {summary.reachedDailyMinimum ? <IllustrationMark styleName={illustrationStyle} /> : null}
        <div
          className="goal-ring-large"
          style={{ background: `conic-gradient(#5eead4 ${summary.timeProgress}%, rgba(255,255,255,0.08) 0)` }}
        >
          <span>{summary.timeProgress}%</span>
          <small>thời gian</small>
        </div>
      </article>

      <article className="summary-progress-card today-progress-card">
        <div className="summary-progress-copy">
          <span>Tiến độ ngày</span>
          <strong>{summary.progressPercent}%</strong>
          <small>
            Kết hợp {summary.taskProgress}% nhiệm vụ và {summary.timeProgress}% mục tiêu 60 phút.
          </small>
        </div>
        <div className="summary-progress-shell">
          <div className="summary-progress-track">
            <span style={{ width: `${summary.progressPercent}%` }} />
          </div>
          <div className="summary-progress-tooltip">
            <strong>Tổng nhiệm vụ: {summary.taskTotal}</strong>
            <span>Đã hoàn thành: {summary.taskCompleted}</span>
            <span>Chưa hoàn thành: {summary.taskMissed}</span>
            <span>Đã học: {summary.studyMinutes} phút</span>
          </div>
        </div>
      </article>

      <section className="today-grid">
        <article className="summary-task-card today-list-card">
          <div className="summary-card-title">
            <ListChecks size={18} />
            Nhiệm vụ hôm nay
          </div>
          <div className="summary-task-list">
            {summary.tasks.length === 0 ? (
              <div className="summary-soft-empty">Hôm nay chưa có nhiệm vụ nào.</div>
            ) : (
              summary.tasks.map((task) => (
                <article className={task.done ? "summary-task-item done" : "summary-task-item"} key={task.id}>
                  <strong>{task.title}</strong>
                  <span>{task.subject} - {task.goal}</span>
                  <small>{task.done ? "Đã hoàn thành" : "Chưa hoàn thành"}</small>
                </article>
              ))
            )}
          </div>
        </article>

        <article className="summary-task-card today-list-card">
          <div className="summary-card-title">
            <Clock size={18} />
            Buổi học hôm nay
          </div>
          <div className="today-timeline-list">
            {summary.sessions.length === 0 ? (
              <div className="summary-soft-empty">Hôm nay chưa có buổi học nào được lưu.</div>
            ) : (
              summary.sessions.map((session) => (
                <article className="timeline-item" key={session.id}>
                  <span>{formatTimeRange(session.startedAt, session.endedAt ?? session.date)}</span>
                  <strong>{session.subject}</strong>
                  <small>{formatMinutes(session.deepMinutes)} · {session.completedTaskCount ?? 0}/{session.totalTaskCount ?? 0} nhiệm vụ</small>
                </article>
              ))
            )}
          </div>
        </article>

        <article className="summary-task-card today-list-card">
          <div className="summary-card-title">
            <AlertCircle size={18} />
            Cần bù hôm nay
          </div>
          <div className="summary-task-list">
            {todayMakeupItems.length === 0 ? (
              <div className="summary-soft-empty">Không có nhiệm vụ bù trong hôm nay.</div>
            ) : (
              todayMakeupItems.map((item) => (
                <article className="summary-task-item" key={`${item.sessionId}-${item.task.id}`}>
                  <strong>{item.task.title}</strong>
                  <span>{item.subject} - hạn bù {getDeadlineText(item.task.makeupDeadlineAt)}</span>
                  <small>{makeupStatusLabel(getMissedTaskStatus(item.task))}</small>
                  {getMissedTaskStatus(item.task) === "missed" ? <button onClick={() => onSchedule(item)}>Bù</button> : null}
                  <button className="source-session-button" onClick={() => onOpenSourceSession(item)}>Xem buổi gốc</button>
                </article>
              ))
            )}
          </div>
        </article>

        <article className="today-reset-card">
          <div>
            <h3>Cài đặt ngày hôm nay</h3>
            <p>Reset toàn bộ đóng góp của hôm nay nếu bạn thêm nhầm hoặc muốn bắt đầu lại từ thời điểm hiện tại.</p>
          </div>
          <button className="danger-soft-button" onClick={onReset}>
            <Trash2 size={16} />
            Xóa tiến độ hôm nay
          </button>
        </article>
      </section>
    </section>
  );
}

function WeekSummaryView({
  summaries,
  sessions,
  tasks,
}: {
  summaries: DaySummary[];
  sessions: SessionSummary[];
  tasks: SummaryTaskItem[];
}) {
  const aggregate = aggregateDaySummaries(summaries);
  const completedSessions = sessions.filter((session) => session.completed).length;
  const chartData = summaries.map((day) => ({
    day: day.label,
    minutes: day.studyMinutes,
    progress: day.progressPercent,
  }));

  return (
    <section className="week-dashboard">
      <section className="summary-stat-grid">
        <ProgressStatCard icon={<Clock size={18} />} label="Thời gian tuần này" value={formatMinutes(aggregate.studyMinutes)} />
        <ProgressStatCard icon={<Trophy size={18} />} label="Buổi hoàn thành" value={`${completedSessions} buổi`} />
        <ProgressStatCard icon={<CheckCircle2 size={18} />} label="Nhiệm vụ hoàn thành" value={`${aggregate.taskCompleted}`} />
        <ProgressStatCard icon={<AlertCircle size={18} />} label="Nhiệm vụ chưa xong" value={`${aggregate.taskMissed}`} tone="warning" />
        <ProgressStatCard icon={<Target size={18} />} label="Progress tuần" value={`${aggregate.progressPercent}%`} />
        <ProgressStatCard icon={<Flame size={18} />} label="Ngày đạt 60p" value={`${aggregate.daysReachedGoal}/7`} />
      </section>

      <section className="summary-progress-card">
        <div className="summary-progress-copy">
          <span>Tuần hiện tại</span>
          <strong>{aggregate.progressPercent}%</strong>
          <small>{tasks.filter((task) => task.done).length}/{tasks.length} nhiệm vụ trong tuần này.</small>
        </div>
        <div className="summary-progress-shell">
          <div className="summary-progress-track">
            <span style={{ width: `${aggregate.progressPercent}%` }} />
          </div>
          <div className="summary-progress-tooltip">
            <strong>Tuần này</strong>
            <span>Phút học: {aggregate.studyMinutes}</span>
            <span>Ngày đạt 60p: {aggregate.daysReachedGoal}</span>
            <span>Nhiệm vụ chưa xong: {aggregate.taskMissed}</span>
          </div>
        </div>
      </section>

      <section className="week-main-grid">
        <article className="summary-chart-card">
          <div className="summary-card-title">
            <Calendar size={18} />
            7 ngày trong tuần
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ReBarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#24444a" />
              <XAxis dataKey="day" stroke="#9fb8bd" />
              <YAxis stroke="#9fb8bd" />
              <Tooltip contentStyle={{ background: "#102328", border: "1px solid #2a4c54", borderRadius: 10 }} />
              <ReBar dataKey="minutes" name="Phút học" radius={[10, 10, 0, 0]} fill="#5eead4" />
            </ReBarChart>
          </ResponsiveContainer>
        </article>

        <article className="week-day-panel">
          {summaries.map((day) => (
            <div className={day.reachedDailyMinimum ? "week-day-card reached" : "week-day-card"} key={day.date}>
              <strong>{day.label}</strong>
              <span>{day.progressPercent}%</span>
              <small>{day.studyMinutes}p · {day.taskCompleted}/{day.taskTotal} nhiệm vụ</small>
              <em>{day.reachedDailyMinimum ? "Đạt 60p" : "Chưa đạt"}</em>
            </div>
          ))}
        </article>
      </section>
    </section>
  );
}

function MonthSummaryView({
  summaries,
  subjectSummaries,
}: {
  summaries: DaySummary[];
  subjectSummaries: SubjectSummary[];
}) {
  const aggregate = aggregateDaySummaries(summaries);
  const bestDay = summaries.reduce<DaySummary | null>(
    (best, day) => (!best || day.studyMinutes > best.studyMinutes ? day : best),
    null
  );
  const missedDay = summaries.reduce<DaySummary | null>(
    (worst, day) => (!worst || day.taskMissed > worst.taskMissed ? day : worst),
    null
  );
  const topSubject = [...subjectSummaries].sort((left, right) => right.totalStudyTime - left.totalStudyTime)[0];
  const riskSubject = [...subjectSummaries].sort((left, right) => right.missedTasks - left.missedTasks)[0];
  const monthLabel = new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

  return (
    <section className="month-dashboard">
      <div className="period-title">
        <div>
          <p className="eyebrow">Monthly overview</p>
          <h3>Tổng kết tháng {monthLabel}</h3>
        </div>
        <span>{aggregate.progressPercent}% hoàn thành</span>
      </div>

      <section className="summary-stat-grid month-kpis">
        <ProgressStatCard icon={<Clock size={18} />} label="Tổng giờ học" value={formatMinutes(aggregate.studyMinutes)} />
        <ProgressStatCard icon={<Flame size={18} />} label="Ngày đạt 60p" value={`${aggregate.daysReachedGoal} ngày`} />
        <ProgressStatCard icon={<CheckCircle2 size={18} />} label="Nhiệm vụ xong" value={`${aggregate.taskCompleted}`} />
        <ProgressStatCard icon={<AlertCircle size={18} />} label="Nhiệm vụ chưa xong" value={`${aggregate.taskMissed}`} tone="warning" />
        <ProgressStatCard icon={<Target size={18} />} label="Tỷ lệ tháng" value={`${aggregate.progressPercent}%`} />
        <ProgressStatCard icon={<TrendingUp size={18} />} label="Streak dài nhất" value={`${calculateLongestStreak(summaries)} ngày`} />
      </section>

      <section className="month-main-grid">
        <article className="summary-chart-card">
          <div className="summary-card-title">
            <Calendar size={18} />
            Calendar heatmap tháng
          </div>
          <div className="month-heatmap">
            {summaries.map((day) => (
              <div
                className={`month-day-cell ${getHeatClass(day.progressPercent, day.reachedDailyMinimum)}`}
                key={day.date}
                title={`${day.date}: ${day.studyMinutes}p, ${day.taskCompleted}/${day.taskTotal} nhiệm vụ, ${day.progressPercent}%`}
              >
                {new Date(day.date).getDate()}
              </div>
            ))}
          </div>
        </article>

        <article className="summary-chart-card">
          <div className="summary-card-title">
            <BookOpen size={18} />
            Phân bổ theo môn
          </div>
          <div className="subject-breakdown">
            {subjectSummaries.length === 0 ? (
              <div className="summary-soft-empty">Tháng này chưa có dữ liệu môn học.</div>
            ) : (
              subjectSummaries.map((subject) => (
                <div className="subject-row" key={subject.subjectId}>
                  <div>
                    <strong>{subject.subject}</strong>
                    <small>{formatMinutes(subject.totalStudyTime)} · {subject.completedTasks}/{subject.totalTasks} nhiệm vụ</small>
                  </div>
                  <span>{subject.progressPercent}%</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="insight-grid">
        <article>
          <span>Ngày học tốt nhất</span>
          <strong>{bestDay && bestDay.studyMinutes > 0 ? `${formatShortDate(bestDay.date)} · ${formatMinutes(bestDay.studyMinutes)}` : "Chưa có"}</strong>
        </article>
        <article>
          <span>Ngày bỏ lỡ nhiều nhất</span>
          <strong>{missedDay && missedDay.taskMissed > 0 ? `${formatShortDate(missedDay.date)} · ${missedDay.taskMissed} nhiệm vụ` : "Chưa có"}</strong>
        </article>
        <article>
          <span>Môn học nhiều nhất</span>
          <strong>{topSubject ? topSubject.subject : "Chưa có"}</strong>
        </article>
        <article>
          <span>Môn cần chú ý</span>
          <strong>{riskSubject && riskSubject.missedTasks > 0 ? riskSubject.subject : "Chưa có"}</strong>
        </article>
      </section>
    </section>
  );
}

function YearSummaryView({ months, sessions }: { months: MonthSummary[]; sessions: SessionSummary[] }) {
  const aggregate = aggregateMonthSummaries(months);
  const bestMonth = [...months].sort((left, right) => right.studyMinutes - left.studyMinutes)[0];
  const chartData = months.map((month) => ({
    month: `T${month.month + 1}`,
    minutes: month.studyMinutes,
    progress: month.progressPercent,
  }));

  return (
    <section className="year-dashboard">
      <div className="period-title">
        <div>
          <p className="eyebrow">Year overview</p>
          <h3>Tổng kết năm {new Date().getFullYear()}</h3>
        </div>
        <span>{aggregate.progressPercent}% hoàn thành</span>
      </div>

      <section className="summary-stat-grid">
        <ProgressStatCard icon={<Clock size={18} />} label="Tổng giờ học năm" value={formatMinutes(aggregate.studyMinutes)} />
        <ProgressStatCard icon={<Flame size={18} />} label="Ngày đạt 60p" value={`${aggregate.daysReachedGoal} ngày`} />
        <ProgressStatCard icon={<CheckCircle2 size={18} />} label="Nhiệm vụ xong" value={`${aggregate.taskCompleted}`} />
        <ProgressStatCard icon={<AlertCircle size={18} />} label="Nhiệm vụ chưa xong" value={`${aggregate.taskMissed}`} tone="warning" />
        <ProgressStatCard icon={<Target size={18} />} label="Tỷ lệ năm" value={`${aggregate.progressPercent}%`} />
        <ProgressStatCard icon={<Trophy size={18} />} label="Tháng tốt nhất" value={bestMonth?.studyMinutes ? bestMonth.label : "Chưa có"} />
      </section>

      <section className="year-main-grid">
        <article className="summary-chart-card">
          <div className="summary-card-title">
            <BarChart3 size={18} />
            12 tháng trong năm
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ReBarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#24444a" />
              <XAxis dataKey="month" stroke="#9fb8bd" />
              <YAxis stroke="#9fb8bd" />
              <Tooltip contentStyle={{ background: "#102328", border: "1px solid #2a4c54", borderRadius: 10 }} />
              <ReBar dataKey="minutes" name="Phút học" radius={[10, 10, 0, 0]} fill="#5eead4" />
            </ReBarChart>
          </ResponsiveContainer>
        </article>

        <div className="year-month-grid">
          {months.map((month) => (
            <article className="year-month-card" key={month.label}>
              <div>
                <strong>{month.label}</strong>
                <span>{month.progressPercent}%</span>
              </div>
              <div className="subject-summary-progress">
                <span style={{ width: `${month.progressPercent}%` }} />
              </div>
              <small>{formatMinutes(month.studyMinutes)} · {month.daysReachedGoal} ngày đạt mục tiêu · {month.taskCompleted} task</small>
            </article>
          ))}
        </div>
      </section>

      {sessions.length === 0 ? <div className="summary-soft-empty">Năm nay chưa có dữ liệu tiến độ.</div> : null}
    </section>
  );
}

function ResetTodayModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="session-modal-backdrop">
      <section className="session-modal-card reset-modal-card">
        <header className="session-modal-header">
          <div>
            <h2>Xóa tiến độ hôm nay?</h2>
            <strong>Chỉ dữ liệu của ngày hôm nay bị loại khỏi thống kê từ thời điểm này trở về trước.</strong>
          </div>
          <div className="session-modal-progress danger">
            <Trash2 size={26} />
          </div>
        </header>
        <p className="reset-warning-text">
          Thao tác này sẽ xóa toàn bộ tiến độ của hôm nay. Các thống kê tuần, tháng, năm sẽ tính ngày hôm nay là 0% cho phần dữ liệu đã xóa. Nếu bạn học tiếp sau khi xóa, tiến độ mới vẫn được tính lại từ thời điểm đó.
        </p>
        <footer className="session-modal-actions">
          <button onClick={onClose}>Hủy</button>
          <button className="danger-soft-button" onClick={onConfirm}>Xóa tiến độ hôm nay</button>
        </footer>
      </section>
    </div>
  );
}

function ProgressStatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "warning";
}) {
  return (
    <div className={tone === "warning" ? "progress-stat-card warning" : "progress-stat-card"}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SubjectSummaryGrid({ summaries }: { summaries: SubjectSummary[] }) {
  if (summaries.length === 0) return null;

  return (
    <section className="subject-summary-grid">
      {summaries.map((summary) => (
        <article className="subject-summary-card" key={summary.subjectId}>
          <div>
            <span>Tổng kết môn học</span>
            <strong>{summary.subject}</strong>
          </div>
          <div className="subject-summary-progress">
            <span style={{ width: `${summary.progressPercent}%` }} />
          </div>
          <div className="subject-summary-metrics">
            <small>{summary.totalSessions} buổi</small>
            <small>{formatMinutes(summary.totalStudyTime)}</small>
            <small>{summary.completedTasks}/{summary.totalTasks} nhiệm vụ</small>
            <small>{summary.makeupTaskCount} cần bù</small>
          </div>
        </article>
      ))}
    </section>
  );
}

function MakeupTaskBoard({
  items,
  onSchedule,
  onMarkCompleted,
  onOpenMakeupRoom,
  onOpenSourceSession,
}: {
  items: MissedTaskItem[];
  onSchedule: (item: MissedTaskItem) => void;
  onMarkCompleted: (item: MissedTaskItem) => void;
  onOpenMakeupRoom: (roomId?: string) => void;
  onOpenSourceSession: (item: MissedTaskItem) => void;
}) {
  if (items.length === 0) return null;

  const groups = groupMissedTasks(items);
  const groupMeta: { key: keyof ReturnType<typeof groupMissedTasks>; title: string }[] = [
    { key: "today", title: "Hôm nay" },
    { key: "urgent", title: "Sắp hết hạn" },
    { key: "open", title: "Còn thời gian" },
    { key: "scheduled", title: "Đã xếp lịch" },
    { key: "completed", title: "Đã bù xong" },
    { key: "expired", title: "Quá hạn" },
  ];

  return (
    <section className="makeup-board">
      <div className="makeup-board-header">
        <div>
          <p className="eyebrow">Makeup tasks</p>
          <h3>Cần bù trong 7 ngày</h3>
          <span>Các nhiệm vụ chưa hoàn thành sẽ ở đây cho tới khi bạn xếp lịch hoặc quá hạn.</span>
        </div>
        <strong>{items.filter((item) => getMissedTaskStatus(item.task) === "missed").length} cần bù</strong>
      </div>
      <div className="makeup-groups">
        {groupMeta.map((group) => (
          <div className="makeup-group" key={group.key}>
            <h4>{group.title}</h4>
            <div className="makeup-card-list">
              {groups[group.key].length === 0 ? (
                <div className="summary-soft-empty">Không có nhiệm vụ.</div>
              ) : (
                groups[group.key].map((item) => (
                  <MakeupTaskCard
                    item={item}
                    key={`${item.sessionId}-${item.task.id}`}
                    onSchedule={onSchedule}
                    onMarkCompleted={onMarkCompleted}
                    onOpenMakeupRoom={onOpenMakeupRoom}
                    onOpenSourceSession={onOpenSourceSession}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MakeupTaskCard({
  item,
  onSchedule,
  onMarkCompleted,
  onOpenMakeupRoom,
  onOpenSourceSession,
}: {
  item: MissedTaskItem;
  onSchedule: (item: MissedTaskItem) => void;
  onMarkCompleted: (item: MissedTaskItem) => void;
  onOpenMakeupRoom: (roomId?: string) => void;
  onOpenSourceSession: (item: MissedTaskItem) => void;
}) {
  const status = getMissedTaskStatus(item.task);
  const deadlineText = getDeadlineText(item.task.makeupDeadlineAt);
  const canSchedule = status === "missed";
  const canOpenMakeupRoom = status === "scheduled_makeup" && Boolean(item.task.makeupSessionId);

  return (
    <article className={`makeup-task-card ${status}`}>
      <div className="makeup-task-topline">
        <strong>{item.task.title}</strong>
        <span className={`makeup-status ${status}`}>{makeupStatusLabel(status)}</span>
      </div>
      <div className="makeup-task-meta">
        <span>{item.subject}</span>
        <span>{item.goal}</span>
        <span>Nhiệm vụ này chưa hoàn thành trong buổi học trước.</span>
        <span>Bỏ lỡ: {formatShortDate(item.task.missedAt ?? item.missedAt)}</span>
        <span>Hạn bù: {deadlineText}</span>
        {item.task.makeupScheduledAt ? <span>Lịch bù: {formatDateTime(item.task.makeupScheduledAt)}</span> : null}
      </div>
      <div className="makeup-task-actions">
        {canSchedule ? <button className="makeup-primary-button" onClick={() => onSchedule(item)}>Xếp lịch bù</button> : null}
        {canOpenMakeupRoom ? <button className="makeup-secondary-button" onClick={() => onOpenMakeupRoom(item.task.makeupSessionId)}>Mở buổi bù</button> : null}
        <button className="source-session-button" onClick={() => onOpenSourceSession(item)}>Xem buổi gốc</button>
      </div>
    </article>
  );
}

function MakeupSchedulePanel({
  draft,
  onChange,
  onClose,
  onSave,
}: {
  draft: MakeupScheduleDraft;
  onChange: (draft: MakeupScheduleDraft) => void;
  onClose: () => void;
  onSave: (scheduledAt: string) => void;
}) {
  const selectedDate = resolveScheduleDate(draft);
  const validation = validateMakeupSchedule(draft.taskItem, selectedDate);
  const error = draft.error || validation;

  return (
    <div className="makeup-panel-backdrop">
      <aside className="makeup-panel">
        <header>
          <p className="eyebrow">Xếp lịch bù</p>
          <h3>{draft.taskItem.task.title}</h3>
          <span>{draft.taskItem.subject} · hạn bù {formatShortDate(draft.taskItem.task.makeupDeadlineAt ?? "")}</span>
        </header>

        <section className="chip-section">
          <h4>Chọn ngày</h4>
          <div className="chip-row">
            {makeupQuickOptions.map((option) => (
              <button
                className={draft.quickChoice === option.value ? "active" : ""}
                key={option.value}
                onClick={() => onChange({ ...draft, quickChoice: option.value, error: "" })}
              >
                {option.label}
              </button>
            ))}
          </div>
          {draft.quickChoice === "custom" ? (
            <input
              className="dark-date-input"
              type="date"
              value={draft.customDate}
              onChange={(event) => onChange({ ...draft, customDate: event.target.value, error: "" })}
            />
          ) : null}
        </section>

        <section className="chip-section">
          <h4>Chọn giờ</h4>
          <div className="chip-row">
            {makeupTimeOptions.map((option) => (
              <button
                className={draft.timeChoice === option.value ? "active" : ""}
                key={option.value}
                onClick={() => onChange({ ...draft, timeChoice: option.value, error: "" })}
              >
                {option.label}
              </button>
            ))}
          </div>
          {draft.timeChoice === "custom" ? (
            <input
              className="dark-date-input"
              type="time"
              value={draft.customTime}
              onChange={(event) => onChange({ ...draft, customTime: event.target.value, error: "" })}
            />
          ) : null}
        </section>

        <div className="makeup-panel-preview">
          <Calendar size={16} />
          <span>{selectedDate ? formatDateTime(selectedDate.toISOString()) : "Chưa chọn ngày bù"}</span>
        </div>

        {error ? <div className="makeup-panel-error">{error}</div> : null}

        <footer>
          <button onClick={onClose}>Hủy</button>
          <button
            className="primary"
            onClick={() => {
              const nextDate = resolveScheduleDate(draft);
              const nextError = validateMakeupSchedule(draft.taskItem, nextDate);
              if (nextError || !nextDate) {
                onChange({ ...draft, error: nextError || "Bạn cần chọn ngày bù." });
                return;
              }
              onSave(nextDate.toISOString());
            }}
          >
            Lưu lịch bù
          </button>
        </footer>
      </aside>
    </div>
  );
}

function RecommendedTasks({
  tasks,
  onOpenStudy,
}: {
  tasks: SummaryTaskItem[];
  onOpenStudy: (roomId: string) => void;
}) {
  return (
    <div className="summary-recommend-card">
      <div className="summary-card-title">
        <ListChecks size={18} />
        Nên làm tiếp
      </div>
      {tasks.length === 0 ? (
        <div className="summary-soft-empty">Ổn rồi, chưa có nhiệm vụ nào cần kéo lại.</div>
      ) : (
        <div className="recommended-list">
          {tasks.map((task) => (
            <article className="recommended-item" key={task.id}>
              <strong>{task.title}</strong>
              <span>{task.subject} - {task.goal}</span>
              {task.roomId ? (
                <button onClick={() => onOpenStudy(task.roomId!)}>
                  <Play size={15} />
                  Xem buổi học
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCompletionList({
  title,
  tasks,
  emptyText,
}: {
  title: string;
  tasks: SummaryTaskItem[];
  emptyText: string;
}) {
  return (
    <div className="summary-task-card">
      <div className="summary-card-title">
        {title === "Đã hoàn thành" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        {title}
      </div>
      <div className="summary-task-list">
        {tasks.length === 0 ? (
          <div className="summary-soft-empty">{emptyText}</div>
        ) : (
          tasks.map((task) => (
            <article className={task.done ? "summary-task-item done" : "summary-task-item"} key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <span>{task.subject} - {task.goal}</span>
                <small>
                  {task.done ? "Đã hoàn thành" : "Chưa hoàn thành"} · {task.durationMinutes ? `${task.durationMinutes} phút dự kiến` : formatShortDate(task.date)}
                </small>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function buildDaySummary(date: Date, rooms: StudyRoom[], sessions: SessionSummary[], todayResetAt?: string): DaySummary {
  const dateKey = getDateKey(date);
  const daySessions = sessions
    .filter((session) => getDateKey(new Date(getSessionDate(session))) === dateKey)
    .sort((left, right) => new Date(getSessionDate(right)).getTime() - new Date(getSessionDate(left)).getTime());
  const includeCurrentTasks = isSameDay(date, new Date());
  const tasks = buildSummaryTasks(includeCurrentTasks ? rooms : [], daySessions, todayResetAt);
  const studyMinutes = daySessions.reduce((sum, session) => sum + session.deepMinutes, 0);
  const sessionTaskTotal = daySessions.reduce((sum, session) => sum + (session.totalTaskCount ?? 0), 0);
  const sessionTaskCompleted = daySessions.reduce((sum, session) => sum + (session.completedTaskCount ?? 0), 0);
  const sessionTaskMissed = daySessions.reduce((sum, session) => sum + (session.incompleteTaskCount ?? 0), 0);
  const currentTasks = includeCurrentTasks
    ? rooms.flatMap((room) => room.tasks.filter((task) => shouldUseActiveTaskForSummary(task, todayResetAt)))
    : [];
  const taskTotal = sessionTaskTotal + currentTasks.length;
  const taskCompleted = sessionTaskCompleted + currentTasks.filter((task) => task.done).length;
  const taskMissed = sessionTaskMissed + currentTasks.filter((task) => !task.done).length;
  const timeProgress = Math.min(100, Math.round((studyMinutes / dailyMinimumStudyMinutes) * 100));
  const taskProgress = taskTotal === 0 ? 0 : calculatePercent(taskCompleted, taskTotal);
  const progressPercent =
    taskTotal === 0 && studyMinutes === 0
      ? 0
      : taskTotal === 0
        ? timeProgress
        : Math.round((taskProgress + timeProgress) / 2);

  return {
    date: dateKey,
    label: weekDayLabel(date),
    studyMinutes,
    taskTotal,
    taskCompleted,
    taskMissed,
    timeProgress,
    taskProgress,
    progressPercent,
    reachedDailyMinimum: studyMinutes >= dailyMinimumStudyMinutes,
    sessions: daySessions,
    tasks,
  };
}

function buildCurrentWeekSummaries(rooms: StudyRoom[], sessions: SessionSummary[], todayResetAt?: string) {
  const start = getStartOfWeek(new Date());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return buildDaySummary(day, rooms, sessions, todayResetAt);
  });
}

function buildCurrentMonthSummaries(rooms: StudyRoom[], sessions: SessionSummary[], todayResetAt?: string) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = new Date(now.getFullYear(), now.getMonth(), index + 1);
    return buildDaySummary(day, rooms, sessions, todayResetAt);
  });
}

function buildCurrentYearMonthSummaries(sessions: SessionSummary[]) {
  const now = new Date();
  return Array.from({ length: 12 }, (_, month) => {
    const monthSessions = sessions.filter((session) => {
      const date = new Date(getSessionDate(session));
      return date.getFullYear() === now.getFullYear() && date.getMonth() === month;
    });
    const studyMinutes = monthSessions.reduce((sum, session) => sum + session.deepMinutes, 0);
    const taskTotal = monthSessions.reduce((sum, session) => sum + (session.totalTaskCount ?? 0), 0);
    const taskCompleted = monthSessions.reduce((sum, session) => sum + (session.completedTaskCount ?? 0), 0);
    const taskMissed = monthSessions.reduce((sum, session) => sum + (session.incompleteTaskCount ?? 0), 0);
    const daysReachedGoal = countDaysReachedGoal(monthSessions);

    return {
      month,
      label: `T${month + 1}`,
      studyMinutes,
      taskTotal,
      taskCompleted,
      taskMissed,
      progressPercent: calculatePercent(taskCompleted, taskTotal),
      daysReachedGoal,
      activeDays: new Set(monthSessions.map((session) => getDateKey(new Date(getSessionDate(session))))).size,
    };
  });
}

function aggregateDaySummaries(summaries: DaySummary[]) {
  const studyMinutes = summaries.reduce((sum, day) => sum + day.studyMinutes, 0);
  const taskTotal = summaries.reduce((sum, day) => sum + day.taskTotal, 0);
  const taskCompleted = summaries.reduce((sum, day) => sum + day.taskCompleted, 0);
  const taskMissed = summaries.reduce((sum, day) => sum + day.taskMissed, 0);
  const daysReachedGoal = summaries.filter((day) => day.reachedDailyMinimum).length;
  const avgProgress =
    summaries.length === 0 ? 0 : Math.round(summaries.reduce((sum, day) => sum + day.progressPercent, 0) / summaries.length);

  return {
    studyMinutes,
    taskTotal,
    taskCompleted,
    taskMissed,
    daysReachedGoal,
    progressPercent: taskTotal === 0 && studyMinutes === 0 ? avgProgress : avgProgress,
  };
}

function aggregateMonthSummaries(months: MonthSummary[]) {
  const studyMinutes = months.reduce((sum, month) => sum + month.studyMinutes, 0);
  const taskTotal = months.reduce((sum, month) => sum + month.taskTotal, 0);
  const taskCompleted = months.reduce((sum, month) => sum + month.taskCompleted, 0);
  const taskMissed = months.reduce((sum, month) => sum + month.taskMissed, 0);
  const daysReachedGoal = months.reduce((sum, month) => sum + month.daysReachedGoal, 0);
  return {
    studyMinutes,
    taskTotal,
    taskCompleted,
    taskMissed,
    daysReachedGoal,
    progressPercent: calculatePercent(taskCompleted, taskTotal),
  };
}

function countDaysReachedGoal(sessions: SessionSummary[]) {
  const minutesByDay = new Map<string, number>();
  sessions.forEach((session) => {
    const key = getDateKey(new Date(getSessionDate(session)));
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + session.deepMinutes);
  });
  return Array.from(minutesByDay.values()).filter((minutes) => minutes >= dailyMinimumStudyMinutes).length;
}

function calculateLongestStreak(summaries: DaySummary[]) {
  let longest = 0;
  let current = 0;
  summaries.forEach((day) => {
    if (day.reachedDailyMinimum) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  });
  return longest;
}

function getHeatClass(progressPercent: number, reachedDailyMinimum: boolean) {
  if (reachedDailyMinimum || progressPercent >= 100) return "level-3";
  if (progressPercent >= 50) return "level-2";
  if (progressPercent > 0) return "level-1";
  return "level-0";
}

function shouldUseSessionForSummary(session: SessionSummary, todayResetAt?: string) {
  const date = new Date(getSessionDate(session));
  if (Number.isNaN(date.getTime())) return false;
  if (date.getFullYear() !== new Date().getFullYear()) return false;
  if (!todayResetAt) return true;
  const reset = new Date(todayResetAt);
  if (Number.isNaN(reset.getTime()) || !isSameDay(date, reset)) return true;
  return date > reset;
}

function shouldUseActiveTaskForSummary(task: StudyTask, todayResetAt?: string) {
  if (!todayResetAt) return true;
  if (!task.createdAt) return false;
  const createdAt = new Date(task.createdAt);
  const reset = new Date(todayResetAt);
  if (Number.isNaN(createdAt.getTime()) || Number.isNaN(reset.getTime())) return true;
  if (!isSameDay(createdAt, reset)) return true;
  return createdAt > reset;
}

function getTodayResetAt(resets: ProgressReset[]) {
  const todayKey = getDateKey(new Date());
  return resets
    .filter((reset) => reset.scope === "today" && reset.date === todayKey)
    .sort((left, right) => new Date(right.resetAt).getTime() - new Date(left.resetAt).getTime())[0]?.resetAt;
}

function getSessionDate(session: SessionSummary) {
  return session.endedAt ?? session.date;
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function weekDayLabel(date: Date) {
  return ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][date.getDay()];
}

function formatTimeRange(startValue?: string, endValue?: string) {
  const start = startValue ? new Date(startValue) : null;
  const end = endValue ? new Date(endValue) : null;
  const format = (date: Date | null) =>
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      : "--:--";
  return `${format(start)} - ${format(end)}`;
}

function buildSummaryTasks(rooms: StudyRoom[], sessions: SessionSummary[], todayResetAt?: string) {
  const now = new Date().toISOString();
  const currentTasks: SummaryTaskItem[] = rooms.filter((room) => !isMakeupRoom(room)).flatMap((room) =>
    room.tasks
      .filter((task) => shouldUseActiveTaskForSummary(task, todayResetAt))
      .map((task) => ({
        id: `room-${room.id}-${task.id}`,
        title: task.title,
        subject: room.subject,
        goal: room.goal,
        done: task.done,
        date: task.createdAt ?? now,
        source: "current" as const,
        roomId: room.id,
        durationMinutes: room.focusMinutes,
      }))
  );

  const sessionTasks: SummaryTaskItem[] = sessions.flatMap((session) => {
    const completed = (session.completedTasks ?? []).map((title, index) => ({
      id: `session-${session.id}-done-${index}`,
      title,
      subject: session.subject,
      goal: session.goal,
      done: true,
      date: session.date,
      source: "session" as const,
      durationMinutes: session.deepMinutes,
    }));
    const incomplete = (session.incompleteTasks ?? []).map((title, index) => ({
      id: `session-${session.id}-todo-${index}`,
      title,
      subject: session.subject,
      goal: session.goal,
      done: false,
      date: session.date,
      source: "session" as const,
      durationMinutes: session.deepMinutes,
    }));
    return [...completed, ...incomplete];
  });

  return [...currentTasks, ...sessionTasks];
}

function buildSubjectSummaries(sessions: SessionSummary[], rooms: StudyRoom[]) {
  const map = new Map<string, SubjectSummary>();

  sessions.forEach((session) => {
    const sourceSession =
      session.isMakeupSession && session.sourceSessionId
        ? sessions.find((item) => item.id === session.sourceSessionId)
        : undefined;
    const subjectId = sourceSession?.subjectId ?? session.subjectId ?? session.subject;
    const subject = sourceSession?.subject ?? session.subject;
    const current = map.get(subjectId) ?? {
      subjectId,
      subject,
      totalSessions: 0,
      totalStudyTime: 0,
      totalTasks: 0,
      completedTasks: 0,
      missedTasks: 0,
      progressPercent: 0,
      lastStudiedAt: session.endedAt ?? session.date,
      makeupTaskCount: 0,
    };
    const totalTasks = session.totalTaskCount ?? 0;
    const completedTasks = session.completedTaskCount ?? 0;
    const missedTasks = session.incompleteTaskCount ?? 0;

    current.totalSessions += 1;
    current.totalStudyTime += session.deepMinutes;
    current.totalTasks += totalTasks;
    current.completedTasks += completedTasks;
    current.missedTasks += missedTasks;
    if (new Date(session.endedAt ?? session.date) > new Date(current.lastStudiedAt)) {
      current.lastStudiedAt = session.endedAt ?? session.date;
    }
    current.progressPercent = calculatePercent(current.completedTasks, current.totalTasks);
    map.set(subjectId, current);
  });

  rooms.forEach((room) => {
    if (!room.isMakeupSession) return;
    const subjectId = room.sourceSessionId
      ? sessions.find((session) => session.id === room.sourceSessionId)?.subjectId ?? room.originalSubject ?? room.id
      : room.id;
    const current = map.get(subjectId) ?? {
      subjectId,
      subject: room.originalSubject ?? room.subject,
      totalSessions: 0,
      totalStudyTime: 0,
      totalTasks: 0,
      completedTasks: 0,
      missedTasks: 0,
      progressPercent: 0,
      lastStudiedAt: room.makeupDueAt ?? new Date().toISOString(),
      makeupTaskCount: 0,
    };
    current.makeupTaskCount += room.tasks.filter((task) => !task.done).length;
    map.set(subjectId, current);
  });

  return Array.from(map.values()).sort(
    (left, right) => new Date(right.lastStudiedAt).getTime() - new Date(left.lastStudiedAt).getTime()
  );
}

function buildMissedTaskItems(sessions: SessionSummary[]) {
  return sessions
    .filter((session) => !session.isMakeupSession)
    .flatMap((session) =>
      (session.missedTaskSnapshots ?? []).map((task) => ({
        sessionId: session.id,
        subjectId: session.subjectId,
        subject: session.subject,
        goal: session.goal,
        missedAt: task.missedAt ?? session.endedAt ?? session.date,
        task,
      }))
    );
}

function groupMissedTasks(items: MissedTaskItem[]) {
  const groups = {
    today: [] as MissedTaskItem[],
    urgent: [] as MissedTaskItem[],
    open: [] as MissedTaskItem[],
    scheduled: [] as MissedTaskItem[],
    completed: [] as MissedTaskItem[],
    expired: [] as MissedTaskItem[],
  };

  items.forEach((item) => {
    const status = getMissedTaskStatus(item.task);
    if (status === "makeup_completed") {
      groups.completed.push(item);
      return;
    }
    if (status === "scheduled_makeup") {
      groups.scheduled.push(item);
      return;
    }
    if (status === "expired") {
      groups.expired.push(item);
      return;
    }
    if (isSameDay(new Date(item.missedAt), new Date())) {
      groups.today.push(item);
      return;
    }
    if (getRemainingDays(item.task.makeupDeadlineAt) <= 2) {
      groups.urgent.push(item);
      return;
    }
    groups.open.push(item);
  });

  return groups;
}

function getMissedTaskStatus(task: StudyTask): TaskStatus {
  if (task.status === "makeup_completed" || task.done) return "makeup_completed";
  if (task.makeupDeadlineAt && new Date() > new Date(task.makeupDeadlineAt)) return "expired";
  if (task.makeupSessionId || task.makeupScheduledAt || task.status === "scheduled_makeup") return "scheduled_makeup";
  return "missed";
}

function isMakeupRoom(room: StudyRoom) {
  return room.isMakeupSession || Boolean(room.sourceSessionId) || /\s-\sBù$/i.test(room.subject.trim());
}

function makeupStatusLabel(status: TaskStatus) {
  switch (status) {
    case "scheduled_makeup":
      return "Đã xếp lịch bù";
    case "expired":
      return "Quá hạn bù";
    case "makeup_completed":
      return "Đã bù xong";
    default:
      return "Cần bù";
  }
}

function getRemainingDays(deadlineValue?: string) {
  if (!deadlineValue) return 7;
  const deadline = new Date(deadlineValue);
  if (Number.isNaN(deadline.getTime())) return 7;
  const diffMs = deadline.getTime() - Date.now();
  return Math.ceil(diffMs / 86400000);
}

function getDeadlineText(deadlineValue?: string) {
  const days = getRemainingDays(deadlineValue);
  if (days < 0) return `quá hạn ${Math.abs(days)} ngày`;
  if (days === 0) return "hết hạn hôm nay";
  return `còn ${days} ngày`;
}

function createScheduleDraft(item: MissedTaskItem): MakeupScheduleDraft {
  return {
    taskItem: item,
    quickChoice: "today",
    timeChoice: "evening",
    customDate: toDateInputValue(new Date()),
    customTime: "19:30",
    error: "",
  };
}

function resolveScheduleDate(draft: MakeupScheduleDraft) {
  const date = new Date();

  if (draft.quickChoice === "today") {
    date.setHours(0, 0, 0, 0);
  } else if (draft.quickChoice === "tomorrow") {
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
  } else if (draft.quickChoice === "weekend") {
    const day = date.getDay();
    const daysUntilSaturday = day === 6 ? 0 : (6 - day + 7) % 7;
    date.setDate(date.getDate() + daysUntilSaturday);
    date.setHours(0, 0, 0, 0);
  } else if (draft.customDate) {
    const custom = new Date(`${draft.customDate}T00:00:00`);
    if (Number.isNaN(custom.getTime())) return null;
    date.setFullYear(custom.getFullYear(), custom.getMonth(), custom.getDate());
  } else {
    return null;
  }

  const time = draft.timeChoice === "custom"
    ? draft.customTime
    : makeupTimeOptions.find((option) => option.value === draft.timeChoice)?.time ?? "19:30";
  const [hours, minutes] = time.split(":").map(Number);
  date.setHours(Number.isFinite(hours) ? hours : 19, Number.isFinite(minutes) ? minutes : 30, 0, 0);
  return date;
}

function validateMakeupSchedule(item: MissedTaskItem, selectedDate: Date | null) {
  if (!selectedDate) return "Bạn cần chọn ngày bù.";
  const missedAt = new Date(item.task.missedAt ?? item.missedAt);
  const deadlineAt = item.task.makeupDeadlineAt ? new Date(item.task.makeupDeadlineAt) : addDays(missedAt, 7);
  if (selectedDate < missedAt || selectedDate > deadlineAt) {
    return "Lịch bù chỉ được xếp trong vòng 7 ngày sau buổi học.";
  }
  return "";
}

function addDays(dateValue: string | Date, days: number) {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
  return date;
}

function isSameDay(left: Date, right: Date) {
  return left.toDateString() === right.toDateString();
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isWithinFilter(dateValue: string, filter: SummaryFilter) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();

  if (filter === "year") {
    return date.getFullYear() === now.getFullYear();
  }

  if (filter === "today") {
    return date.toDateString() === now.toDateString();
  }

  if (filter === "month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }

  const startOfWeek = getStartOfWeek(now);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return date >= startOfWeek && date < endOfWeek;
}

function getStartOfWeek(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  return date;
}

function buildWeekStudyData(sessions: SessionSummary[]) {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const map = new Map(chartFallback.map((item) => [item.day, 0]));
  sessions.forEach((session) => {
    const day = days[new Date(session.date).getDay()];
    map.set(day, (map.get(day) ?? 0) + session.deepMinutes);
  });
  return ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => ({
    day,
    minutes: Math.round(map.get(day) ?? 0),
  }));
}

function calculateStudyStreak(
  sessions: SessionSummary[],
  dailyActivities: DailyActivity[],
  activeStudyMinutes = 0
): StreakInfo {
  const today = new Date();
  const todayKey = getDateKey(today);
  const minutesFromSessions = new Map<string, number>();

  sessions.forEach((session) => {
    const date = new Date(getSessionDate(session));
    if (Number.isNaN(date.getTime())) return;
    const key = getDateKey(date);
    minutesFromSessions.set(key, (minutesFromSessions.get(key) ?? 0) + session.deepMinutes);
  });

  const activities = new Map<string, DailyActivity>();
  dailyActivities.forEach((activity) => {
    activities.set(activity.date, {
      ...activity,
      studyMinutes: Math.max(activity.studyMinutes, minutesFromSessions.get(activity.date) ?? 0),
    });
  });

  minutesFromSessions.forEach((studyMinutes, date) => {
    const current = activities.get(date);
    activities.set(date, {
      date,
      appOpened: current?.appOpened ?? true,
      studyMinutes: Math.max(current?.studyMinutes ?? 0, studyMinutes),
      reachedDailyGoal: Math.max(current?.studyMinutes ?? 0, studyMinutes) >= dailyMinimumStudyMinutes,
      streakEarned: Math.max(current?.studyMinutes ?? 0, studyMinutes) >= dailyMinimumStudyMinutes,
      streakCelebratedAt: current?.streakCelebratedAt,
    });
  });

  const todayActivity = activities.get(todayKey) ?? {
    date: todayKey,
    appOpened: true,
    studyMinutes: 0,
    reachedDailyGoal: false,
    streakEarned: false,
  };
  todayActivity.appOpened = true;
  todayActivity.studyMinutes += activeStudyMinutes;
  todayActivity.reachedDailyGoal = todayActivity.studyMinutes >= dailyMinimumStudyMinutes;
  todayActivity.streakEarned = todayActivity.reachedDailyGoal;
  activities.set(todayKey, todayActivity);

  const reachedOnDate = (date: Date) => {
    const activity = activities.get(getDateKey(date));
    return Boolean(activity?.appOpened && activity.studyMinutes >= dailyMinimumStudyMinutes);
  };

  let longestStreak = 0;
  let rollingStreak = 0;
  const cursor = new Date(today.getFullYear(), 0, 1);
  while (cursor <= today) {
    if (reachedOnDate(cursor)) {
      rollingStreak += 1;
      longestStreak = Math.max(longestStreak, rollingStreak);
    } else {
      rollingStreak = 0;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const streakCursor = new Date(today);
  streakCursor.setHours(0, 0, 0, 0);
  if (!reachedOnDate(streakCursor)) {
    streakCursor.setDate(streakCursor.getDate() - 1);
  }
  let currentStreak = 0;
  while (streakCursor.getFullYear() === today.getFullYear() && reachedOnDate(streakCursor)) {
    currentStreak += 1;
    streakCursor.setDate(streakCursor.getDate() - 1);
  }

  return {
    currentStreak,
    longestStreak,
    todayStudyMinutes: todayActivity.studyMinutes,
    todayReachedGoal: todayActivity.reachedDailyGoal,
    remainingMinutes: Math.max(0, dailyMinimumStudyMinutes - todayActivity.studyMinutes),
  };
}

function upsertDailyActivity(
  activities: DailyActivity[],
  date: string,
  patch: Partial<Omit<DailyActivity, "date">>
) {
  const existing = activities.find((activity) => activity.date === date);
  const next: DailyActivity = {
    date,
    appOpened: false,
    studyMinutes: 0,
    reachedDailyGoal: false,
    streakEarned: false,
    ...existing,
    ...patch,
  };
  next.reachedDailyGoal = next.studyMinutes >= dailyMinimumStudyMinutes || Boolean(patch.reachedDailyGoal);
  next.streakEarned = next.reachedDailyGoal;
  return [...activities.filter((activity) => activity.date !== date), next].sort((left, right) =>
    left.date.localeCompare(right.date)
  );
}

function addStudyMinutesToDailyActivity(activities: DailyActivity[], dateValue: string, minutes: number) {
  const date = getDateKey(new Date(dateValue));
  const current = activities.find((activity) => activity.date === date);
  const studyMinutes = (current?.studyMinutes ?? 0) + minutes;
  return upsertDailyActivity(activities, date, {
    appOpened: true,
    studyMinutes,
    reachedDailyGoal: studyMinutes >= dailyMinimumStudyMinutes,
    streakEarned: studyMinutes >= dailyMinimumStudyMinutes,
  });
}

function getAchievementTier(progress: number) {
  if (progress >= 100) {
    return {
      key: "perfect",
      label: "HOÀN THÀNH XUẤT SẮC",
      status: "HOÀN THÀNH XUẤT SẮC",
      title: "Hoàn thành trọn vẹn!",
      description: "Bạn đã xử lý toàn bộ nhiệm vụ của buổi học này.",
      secondaryCta: "Xếp lịch bù",
    };
  }
  if (progress >= 80) {
    return {
      key: "near",
      label: "GẦN CHẠM ĐÍCH",
      status: "GẦN CHẠM ĐÍCH",
      title: "Bạn gần hoàn thành rồi!",
      description: "Chỉ còn một chút nữa thôi. Hãy xếp lịch bù để giữ tiến độ.",
      secondaryCta: "Xếp lịch bù",
    };
  }
  if (progress >= 60) {
    return {
      key: "steady",
      label: "TIẾN ĐỘ TỐT",
      status: "TIẾN ĐỘ TỐT",
      title: "Bạn đã đi hơn nửa chặng.",
      description: "Phần còn lại có thể bù trong 7 ngày để không mất nhịp học.",
      secondaryCta: "Xếp lịch bù",
    };
  }
  if (progress >= 50) {
    return {
      key: "checkpoint",
      label: "CẦN CỐ THÊM",
      status: "CẦN CỐ THÊM",
      title: "Bạn đã bắt đầu tốt.",
      description: "Hãy chọn nhiệm vụ quan trọng nhất để bù trước.",
      secondaryCta: "Tạo lịch bù",
    };
  }
  return {
    key: "reset",
    label: "LÊN KẾ HOẠCH LẠI",
    status: "LÊN KẾ HOẠCH LẠI",
    title: "Hôm nay chưa vào guồng.",
    description: "Không sao, hãy bù phần quan trọng trong 7 ngày tới.",
    secondaryCta: "Xếp lịch bù",
  };
}

function getMakeupAchievementTier(progress: number) {
  if (progress >= 100) {
    return {
      key: "makeup-perfect",
      label: "ĐÃ BÙ XONG",
      status: "ĐÃ BÙ XONG",
      title: "Bạn đã xử lý xong nhiệm vụ bù!",
      description: "Nhiệm vụ bị bỏ lỡ đã được hoàn thành. Tiến độ của bạn đã được cập nhật.",
      secondaryCta: "Quay lại Cần bù",
    };
  }

  if (progress >= 60) {
    return {
      key: "makeup-partial",
      label: "BÙ ĐƯỢC MỘT PHẦN",
      status: "BÙ ĐƯỢC MỘT PHẦN",
      title: "Bạn đã xử lý được một phần nhiệm vụ bù.",
      description: "Vẫn còn nhiệm vụ cần bù. Hãy hoàn thành nốt trong thời hạn còn lại.",
      secondaryCta: "Quay lại Cần bù",
    };
  }

  return {
    key: "makeup-reset",
    label: "CẦN XẾP LẠI",
    status: "CẦN XẾP LẠI",
    title: "Buổi bù chưa hoàn thành.",
    description: "Bạn vẫn có thể tiếp tục bù nếu còn trong hạn 7 ngày.",
    secondaryCta: "Quay lại Cần bù",
  };
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}p`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}p`;
}

function formatShortDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Chưa có ngày";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function formatDateTime(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Chưa có lịch";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function filterLabel(filter: SummaryFilter) {
  return summaryFilters.find((item) => item.value === filter)?.label ?? "Năm nay";
}

function calculatePercent(completedTasks: number, totalTasks: number) {
  if (totalTasks <= 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
}

function useStoredState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    if (!raw) return initial;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState] as const;
}

function same(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeKeyword(value: string) {
  return value
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "")
    .trim();
}

function inferKeyword(title: string) {
  if (!title) return "";
  return title
    .replace(" - Google Chrome", "")
    .replace(" - Microsoft Edge", "")
    .replace(" - Cốc Cốc", "")
    .replace(" - Coc Coc", "")
    .trim()
    .slice(0, 80);
}

function formatSeconds(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function statusLabel(status: FocusState) {
  switch (status) {
    case "study":
      return "Đang học";
    case "off":
      return "Đi lạc";
    case "blocked":
      return "Bị chặn";
    case "neutral":
      return "Trung lập";
    case "break":
      return "Đang nghỉ";
    default:
      return "Tạm dừng";
  }
}

function WarningOverlay({ payload, onHide }: { payload: WarningPayload; onHide: () => void }) {
  const progress = useMemo(() => {
    const graceSeconds = Math.max(1, payload.graceSeconds);
    return Math.max(8, Math.min(100, (payload.remainingSeconds / graceSeconds) * 100));
  }, [payload.graceSeconds, payload.remainingSeconds]);

  return (
    <div className={`warning-overlay-shell ${payload.lockMode}`} role="dialog" aria-modal="true">
      <section className="warning-overlay-card">
        <div className="warning-overlay-icon">!</div>
        <h1>{payload.message}</h1>
        <p>
          Quay lại app/link của môn <strong>{payload.subject}</strong>.
        </p>
        {payload.remainingSeconds > 0 ? (
          <div className="warning-countdown">Còn {payload.remainingSeconds}s để quay lại</div>
        ) : (
          <div className="warning-countdown danger">Đã tính là mất tập trung</div>
        )}
        <div className="warning-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <small>{payload.detail}</small>
        <button onClick={onHide}>Quay lại học</button>
      </section>
    </div>
  );
}

export default App;
