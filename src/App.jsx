import { useState, useEffect, useMemo, useCallback } from "react";
import api, { API_BASE_URL } from "./api";
import storage from "./utils/storage";
import "./App.css";

// Initial fallback mock skills in case backend has no initial skills seeded
const DEFAULT_SKILLS = [
  { id: 1, name: "Java", category: "Coding", level: "Intermediate", teacher: "Harshika" },
  { id: 2, name: "Python", category: "Coding", level: "Advanced", teacher: "Priya" },
  { id: 3, name: "React", category: "Coding", level: "Intermediate", teacher: "Harshika" },
  { id: 4, name: "C", category: "Coding", level: "Beginner", teacher: "Rahul" },
  { id: 5, name: "C++", category: "Coding", level: "Intermediate", teacher: "Rahul" },
  { id: 6, name: "Canva", category: "Design", level: "Beginner", teacher: "Rahul" },
  { id: 7, name: "Figma", category: "Design", level: "Intermediate", teacher: "Priya" },
  { id: 8, name: "Photoshop", category: "Design", level: "Advanced", teacher: "Harshika" },
  { id: 9, name: "Marketing", category: "Business", level: "Intermediate", teacher: "Priya" },
  { id: 10, name: "Excel", category: "Business", level: "Advanced", teacher: "Rahul" },
  { id: 11, name: "Power BI", category: "Business", level: "Intermediate", teacher: "Harshika" },
  { id: 12, name: "Public Speaking", category: "Communication", level: "Advanced", teacher: "Priya" },
];

export default function App() {
  const [page, setPage] = useState("home");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // Backend status
  const [backendOnline, setBackendOnline] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Directory of users (students)
  const [users, setUsers] = useState([]);

  // Authenticated User
  const [currentUser, setCurrentUser] = useState(() => storage.get("currentUser", null));

  // Skills
  const [skills, setSkills] = useState(() => storage.get("skills", DEFAULT_SKILLS));

  // Requests
  const [requests, setRequests] = useState(() => storage.get("requests", []));

  // Sessions
  const [sessions, setSessions] = useState(() => storage.get("sessions", []));

  // Modal Dialogs
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth Form Inputs
  const [loginId, setLoginId] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [newUser, setNewUser] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  // Offer Skill Form
  const [offerSkill, setOfferSkill] = useState({
    name: "",
    category: "Coding",
    level: "Beginner",
  });

  // Booking Form State for Accepted Requests: { [requestId]: { date, time } }
  const [bookingInputs, setBookingInputs] = useState({});

  // Admin Data
  const [adminData, setAdminData] = useState({ totalStudents: 0, students: [] });
  const [adminLogs, setAdminLogs] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  // =========================================================
  // PERSISTENCE EFFECT
  // =========================================================
  useEffect(() => {
    storage.set("skills", skills);
  }, [skills]);

  useEffect(() => {
    storage.set("requests", requests);
  }, [requests]);

  useEffect(() => {
    if (currentUser) {
      storage.set("currentUser", currentUser);
    } else {
      storage.remove("currentUser");
    }
  }, [currentUser]);

  useEffect(() => {
    storage.set("sessions", sessions);
  }, [sessions]);

  // =========================================================
  // BACKEND SYNC (Students, Skills, Healthcheck)
  // =========================================================
  const syncWithBackend = useCallback(async () => {
    // 1. Health check
    try {
      await api.checkHealth();
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }

    // 2. Load students directory
    try {
      const studentData = await api.getStudents();
      if (Array.isArray(studentData)) {
        const cleaned = studentData.map((s) => ({
          id: s.studentId,
          name: s.name,
          email: s.email,
          phone: s.phone || "",
          role: s.role || "student",
        }));
        setUsers(cleaned);
      }
    } catch {
      // Backend not yet reachable; local user directory remains
    }

    // 3. Load skills from database if available
    try {
      const dbSkills = await api.getSkills();
      if (Array.isArray(dbSkills) && dbSkills.length > 0) {
        setSkills((prev) => {
          const existingNames = new Set(prev.map((s) => `${s.name.toLowerCase()}-${s.teacher.toLowerCase()}`));
          const newFromDb = dbSkills
            .filter((d) => !existingNames.has(`${d.name.toLowerCase()}-${d.teacher.toLowerCase()}`))
            .map((d) => ({
              id: d._id || Date.now() + Math.random(),
              name: d.name,
              category: d.category,
              level: d.level,
              teacher: d.teacher,
            }));
          return [...prev, ...newFromDb];
        });
      }
    } catch {
      // Continue using cached or default skills
    }
  }, []);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  // Load Admin metrics when navigating to admin view
  useEffect(() => {
    if (page === "admin" && currentUser?.role === "admin") {
      setAdminLoading(true);
      Promise.all([
        api.getAdminDashboard().catch(() => null),
        api.getLoginLogs().catch(() => null),
      ]).then(([dashboardRes, logsRes]) => {
        if (dashboardRes) {
          setAdminData({
            totalStudents: dashboardRes.totalStudents || 0,
            students: dashboardRes.students || [],
          });
        }
        if (logsRes && Array.isArray(logsRes)) {
          setAdminLogs(logsRes);
        }
        setAdminLoading(false);
      });
    }
  }, [page, currentUser]);

  // =========================================================
  // AUTHENTICATION
  // =========================================================
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    const studentId = loginId.trim();
    if (!studentId || !loginPass) {
      showToast("Please enter Student ID and Password.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api.login(studentId, loginPass);
      if (data.token) {
        storage.set("token", data.token);
      }

      const loggedStudent = {
        id: data.student.studentId,
        name: data.student.name,
        email: data.student.email,
        phone: data.student.phone,
        role: data.student.role || "student",
      };

      setUsers((prev) => {
        const exists = prev.some((u) => u.id?.toUpperCase() === loggedStudent.id?.toUpperCase());
        return exists
          ? prev.map((u) => (u.id?.toUpperCase() === loggedStudent.id?.toUpperCase() ? { ...u, ...loggedStudent } : u))
          : [...prev, loggedStudent];
      });

      setCurrentUser(loggedStudent);
      setShowLogin(false);
      setLoginId("");
      setLoginPass("");
      setPage("dashboard");
      showToast(`Welcome back, ${loggedStudent.name}!`, "success");
    } catch (err) {
      showToast(err.message || "Invalid Student ID or Password", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    if (
      !newUser.id.trim() ||
      !newUser.name.trim() ||
      !newUser.email.trim() ||
      !newUser.phone.trim() ||
      !newUser.password
    ) {
      showToast("Please fill all required registration fields.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api.register(newUser);
      const student = {
        id: data.student.studentId,
        name: data.student.name,
        email: data.student.email,
        phone: data.student.phone,
        role: data.student.role || "student",
      };

      setUsers((prev) => [...prev, student]);
      setCurrentUser(student);
      setShowRegister(false);
      setNewUser({ id: "", name: "", phone: "", email: "", password: "" });
      setPage("dashboard");
      showToast("Registration successful! Welcome to Skill Exchange.", "success");
    } catch (err) {
      showToast(err.message || "Registration failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    }
    storage.remove("token");
    storage.remove("currentUser");
    setCurrentUser(null);
    setPage("home");
    showToast("You have been logged out.", "info");
  };

  // =========================================================
  // SKILL EXCHANGE ACTIONS
  // =========================================================
  const sendRequest = (skill) => {
    if (!currentUser) {
      showToast("Please login to request a skill.", "info");
      setShowLogin(true);
      return;
    }

    if (skill.teacher.toLowerCase() === currentUser.name.toLowerCase()) {
      showToast("You already teach this skill.", "error");
      return;
    }

    const alreadyRequested = requests.some(
      (r) =>
        r.student === currentUser.name &&
        r.skill === skill.name &&
        r.teacher === skill.teacher
    );

    if (alreadyRequested) {
      showToast("You have already sent a request for this skill.", "info");
      return;
    }

    // Lookup teacher contact information safely
    const teacherUser = users.find((u) => u.name?.toLowerCase() === skill.teacher?.toLowerCase());
    const newRequest = {
      id: Date.now(),
      student: currentUser.name,
      teacher: skill.teacher,
      skill: skill.name,
      status: "Pending",
      phone: teacherUser?.phone || "Shared upon acceptance",
      email: teacherUser?.email || "Shared upon acceptance",
    };

    setRequests((prev) => [...prev, newRequest]);
    showToast(`Request sent to ${skill.teacher}!`, "success");
  };

  const updateRequestStatus = (id, newStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    showToast(`Request marked as ${newStatus}.`, "info");
  };

  const addSkill = async () => {
    if (!currentUser) {
      showToast("Please login first to offer a skill.", "error");
      setShowLogin(true);
      return;
    }

    const skillName = offerSkill.name.trim();
    if (!skillName) {
      showToast("Please enter a skill name.", "error");
      return;
    }

    const newSkill = {
      id: Date.now(),
      name: skillName,
      category: offerSkill.category,
      level: offerSkill.level,
      teacher: currentUser.name,
    };

    // Attempt backend persistence if authenticated
    try {
      await api.createSkill(newSkill);
    } catch {
      // Local addition remains operational if offline
    }

    setSkills((prev) => [...prev, newSkill]);
    setOfferSkill({ name: "", category: "Coding", level: "Beginner" });
    showToast(`"${skillName}" has been added to your offerings!`, "success");
  };

  // =========================================================
  // SESSIONS
  // =========================================================
  const handleBookingChange = (requestId, field, value) => {
    setBookingInputs((prev) => ({
      ...prev,
      [requestId]: {
        ...(prev[requestId] || {}),
        [field]: value,
      },
    }));
  };

  const bookSession = (requestId) => {
    const request = requests.find((r) => r.id === requestId);
    if (!request) {
      showToast("Associated request not found.", "error");
      return;
    }

    const input = bookingInputs[requestId] || {};
    const date = input.date;
    const time = input.time;

    if (!date || !time) {
      showToast("Please select both a date and time for your session.", "error");
      return;
    }

    const alreadyBooked = sessions.some((s) => s.requestId === requestId);
    if (alreadyBooked) {
      showToast("A session has already been scheduled for this request.", "info");
      return;
    }

    const newSession = {
      id: Date.now(),
      requestId,
      student: request.student,
      teacher: request.teacher,
      skill: request.skill,
      date,
      time,
      status: "Upcoming",
    };

    setSessions((prev) => [...prev, newSession]);
    showToast(`Session successfully booked for ${date} at ${time}!`, "success");
  };

  const completeSession = (sessionId) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: "Completed" } : s))
    );
    showToast("Session marked as completed! Great job learning together.", "success");
  };

  // =========================================================
  // FILTERED SKILLS
  // =========================================================
  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      const matchesSearch = skill.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || skill.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [skills, search, category]);

  // Unread pending requests for the logged-in user (as teacher)
  const unreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return requests.filter(
      (r) => r.teacher?.toLowerCase() === currentUser.name?.toLowerCase() && r.status === "Pending"
    ).length;
  }, [currentUser, requests]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="app">
      {/* Toast Notification Container */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* ================= NAVBAR ================= */}
      <header className="navbar">
        <div className="brand-section" onClick={() => setPage("home")}>
          <h1>VESIT Skill Exchange</h1>
          <span
            className={`backend-badge ${backendOnline ? "connected" : ""}`}
            title={`API: ${API_BASE_URL}`}
          >
            {backendOnline ? "● API Live" : "○ Local Mode"}
          </span>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-btn ${page === "home" ? "active" : ""}`}
            onClick={() => setPage("home")}
          >
            Home
          </button>

          <button
            className={`nav-btn ${page === "skills" ? "active" : ""}`}
            onClick={() => setPage("skills")}
          >
            Skills
          </button>

          {currentUser ? (
            <>
              <button
                className={`nav-btn ${page === "dashboard" ? "active" : ""}`}
                onClick={() => setPage("dashboard")}
              >
                Dashboard
              </button>

              {currentUser.role === "admin" && (
                <button
                  className={`nav-btn ${page === "admin" ? "active" : ""}`}
                  onClick={() => setPage("admin")}
                >
                  Admin
                </button>
              )}

              {unreadCount > 0 && (
                <button
                  className="notif-badge"
                  onClick={() => setPage("dashboard")}
                  title={`${unreadCount} pending request(s)`}
                >
                  🔔 {unreadCount}
                </button>
              )}

              <span className="nav-user">Hi, {currentUser.name}</span>

              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="nav-btn" onClick={() => setShowLogin(true)}>
                Login
              </button>
              <button className="nav-btn" onClick={() => setShowRegister(true)}>
                Register
              </button>
            </>
          )}
        </nav>
      </header>

      {/* ================= HOME PAGE ================= */}
      {page === "home" && (
        <main>
          <section className="hero">
            <h2>Find a Skill. Share a Skill.</h2>
            <p>
              Connect with VESIT students to learn and teach skills across campus.
              Peer-to-peer learning, verified student profiles, and collaborative growth.
            </p>
            <div className="hero-actions">
              <button className="hero-btn-primary" onClick={() => setPage("skills")}>
                Explore Skills
              </button>
              {currentUser ? (
                <button className="hero-btn-secondary" onClick={() => setPage("dashboard")}>
                  Go to Dashboard
                </button>
              ) : (
                <button className="hero-btn-secondary" onClick={() => setShowRegister(true)}>
                  Join Campus Exchange
                </button>
              )}
            </div>
          </section>

          <section className="features">
            <h3>Why Campus Skill Exchange?</h3>
            <div className="feature-grid">
              <div className="feature-box">🤝 Peer-to-Peer Learning</div>
              <div className="feature-box">🎓 Verified Student Profiles</div>
              <div className="feature-box">⚡ Real-Time Skill Requests</div>
              <div className="feature-box">💡 Free Knowledge Sharing</div>
            </div>
          </section>
        </main>
      )}

      {/* ================= SKILLS PAGE ================= */}
      {page === "skills" && (
        <main className="skills-page">
          <h2 className="page-title">Popular Skills</h2>

          <div className="filters">
            <input
              type="text"
              placeholder="Search skills (e.g. React, Java, Canva)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search skills"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="All">All Categories</option>
              <option value="Coding">Coding</option>
              <option value="Design">Design</option>
              <option value="Business">Business</option>
              <option value="Communication">Communication</option>
            </select>
          </div>

          <div className="skills-grid">
            {filteredSkills.length === 0 ? (
              <div className="empty-state">
                <p>No skills found matching your search. Try adjusting your query or category.</p>
              </div>
            ) : (
              filteredSkills.map((skill) => {
                const isRequested =
                  currentUser &&
                  requests.some(
                    (r) =>
                      r.student === currentUser.name &&
                      r.skill === skill.name &&
                      r.teacher === skill.teacher
                  );
                const isOwnSkill = currentUser && skill.teacher === currentUser.name;

                return (
                  <article key={skill.id} className="skill-card">
                    <div>
                      <h3>{skill.name}</h3>
                      <div className="skill-meta">
                        <span className="badge badge-level">Level: {skill.level}</span>
                        <span className="badge badge-cat">Category: {skill.category}</span>
                        <span>Offered by: <strong>{skill.teacher}</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => sendRequest(skill)}
                      disabled={Boolean(isRequested || isOwnSkill)}
                    >
                      {isOwnSkill
                        ? "Your Skill"
                        : isRequested
                        ? "Requested ✓"
                        : "Request to Learn"}
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </main>
      )}

      {/* ================= DASHBOARD ================= */}
      {page === "dashboard" && currentUser && (
        <main className="dashboard">
          <h2 className="dashboard-title">{currentUser.name}'s Dashboard</h2>

          {/* Quick Stats */}
          <div className="stats">
            <div className="stat-box">
              <h3>{skills.filter((s) => s.teacher === currentUser.name).length}</h3>
              <p>Skills Offered</p>
            </div>

            <div className="stat-box">
              <h3>{requests.filter((r) => r.student === currentUser.name).length}</h3>
              <p>Requests Sent</p>
            </div>

            <div className="stat-box">
              <h3>{unreadCount}</h3>
              <p>Pending Requests</p>
            </div>
          </div>

          {/* Offer a New Skill Panel */}
          <section className="panel">
            <h3>Offer a New Skill</h3>
            <div className="offer-form">
              <input
                type="text"
                placeholder="Skill name (e.g. Flutter, Next.js, Public Speaking)"
                value={offerSkill.name}
                onChange={(e) => setOfferSkill({ ...offerSkill, name: e.target.value })}
                aria-label="Skill name"
              />

              <select
                value={offerSkill.category}
                onChange={(e) => setOfferSkill({ ...offerSkill, category: e.target.value })}
                aria-label="Category"
              >
                <option value="Coding">Coding</option>
                <option value="Design">Design</option>
                <option value="Business">Business</option>
                <option value="Communication">Communication</option>
              </select>

              <select
                value={offerSkill.level}
                onChange={(e) => setOfferSkill({ ...offerSkill, level: e.target.value })}
                aria-label="Proficiency level"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              <button onClick={addSkill}>Add Skill</button>
            </div>
          </section>

          {/* Requests Grid: Received & Sent */}
          <div className="dashboard-grid">
            {/* Requests Received */}
            <section className="panel">
              <h3>Requests Received</h3>
              {requests.filter((r) => r.teacher === currentUser.name).length === 0 ? (
                <p className="empty-state">No requests received yet.</p>
              ) : (
                requests
                  .filter((r) => r.teacher === currentUser.name)
                  .map((r) => (
                    <div key={r.id} className="request-card">
                      <strong>{r.skill}</strong>
                      <p>Requested by: <strong>{r.student}</strong></p>
                      <p>Status: <span className="badge badge-level">{r.status}</span></p>

                      {r.status === "Pending" ? (
                        <div className="actions">
                          <button
                            className="btn-accept"
                            onClick={() => updateRequestStatus(r.id, "Accepted")}
                          >
                            Accept
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => updateRequestStatus(r.id, "Rejected")}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div style={{ marginTop: "10px", fontSize: "0.9rem" }}>
                          <p>📞 Phone: {r.phone || "N/A"}</p>
                          <p>✉️ Email: {r.email || "N/A"}</p>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </section>

            {/* My Requests Sent */}
            <section className="panel">
              <h3>My Requests</h3>
              {requests.filter((r) => r.student === currentUser.name).length === 0 ? (
                <p className="empty-state">No requests sent yet.</p>
              ) : (
                requests
                  .filter((r) => r.student === currentUser.name)
                  .map((r) => {
                    const sessionBooked = sessions.some((s) => s.requestId === r.id);
                    return (
                      <div key={r.id} className="request-card">
                        <strong>{r.skill}</strong>
                        <p>Teacher: <strong>{r.teacher}</strong></p>
                        <p>Status: <span className="badge badge-level">{r.status}</span></p>

                        {r.status === "Accepted" && (
                          <div className="booking-controls">
                            <p>📞 Teacher Phone: {r.phone || "N/A"}</p>
                            <p>✉️ Teacher Email: {r.email || "N/A"}</p>

                            {!sessionBooked ? (
                              <div style={{ marginTop: "10px" }}>
                                <p style={{ fontWeight: 600, marginBottom: "6px" }}>Schedule a Session:</p>
                                <div className="booking-inputs">
                                  <input
                                    type="date"
                                    min={todayStr}
                                    value={bookingInputs[r.id]?.date || ""}
                                    onChange={(e) => handleBookingChange(r.id, "date", e.target.value)}
                                    aria-label="Session date"
                                  />
                                  <input
                                    type="time"
                                    value={bookingInputs[r.id]?.time || ""}
                                    onChange={(e) => handleBookingChange(r.id, "time", e.target.value)}
                                    aria-label="Session time"
                                  />
                                </div>
                                <button className="btn-book" onClick={() => bookSession(r.id)}>
                                  Book Session
                                </button>
                              </div>
                            ) : (
                              <p style={{ marginTop: "8px", color: "#059669", fontWeight: 600 }}>
                                ✓ Session Scheduled
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </section>
          </div>

          {/* Upcoming Sessions Panel */}
          <section className="panel">
            <h3>Upcoming Sessions</h3>
            {sessions.filter(
              (s) =>
                s.status === "Upcoming" &&
                (s.student === currentUser.name || s.teacher === currentUser.name)
            ).length === 0 ? (
              <p className="empty-state">No upcoming sessions scheduled.</p>
            ) : (
              sessions
                .filter(
                  (s) =>
                    s.status === "Upcoming" &&
                    (s.student === currentUser.name || s.teacher === currentUser.name)
                )
                .map((s) => (
                  <div key={s.id} className="session-card">
                    <div className="session-info">
                      <strong>{s.skill}</strong>
                      <p>📅 Date: {s.date} | ⏰ Time: {s.time}</p>
                      <p>👥 Teacher: {s.teacher} ↔ Student: {s.student}</p>
                    </div>
                    <button className="btn-complete" onClick={() => completeSession(s.id)}>
                      Mark Completed
                    </button>
                  </div>
                ))
            )}
          </section>

          {/* Completed Sessions Panel */}
          <section className="panel">
            <h3>Completed Sessions</h3>
            {sessions.filter(
              (s) =>
                s.status === "Completed" &&
                (s.student === currentUser.name || s.teacher === currentUser.name)
            ).length === 0 ? (
              <p className="empty-state">No completed sessions yet.</p>
            ) : (
              sessions
                .filter(
                  (s) =>
                    s.status === "Completed" &&
                    (s.student === currentUser.name || s.teacher === currentUser.name)
                )
                .map((s) => (
                  <div key={s.id} className="session-card">
                    <div className="session-info">
                      <strong>{s.skill}</strong>
                      <p>📅 Date: {s.date} | ⏰ Time: {s.time}</p>
                      <p>👥 Teacher: {s.teacher} ↔ Student: {s.student}</p>
                    </div>
                    <span style={{ color: "#059669", fontWeight: 600 }}>✅ Completed</span>
                  </div>
                ))
            )}
          </section>
        </main>
      )}

      {/* ================= ADMIN VIEW ================= */}
      {page === "admin" && currentUser?.role === "admin" && (
        <main className="admin-section">
          <h2 className="dashboard-title">Admin Management Panel</h2>

          <div className="stats">
            <div className="stat-box">
              <h3>{adminData.totalStudents || adminData.students?.length || 0}</h3>
              <p>Total Registered Students</p>
            </div>
            <div className="stat-box">
              <h3>{skills.length}</h3>
              <p>Active Skills</p>
            </div>
            <div className="stat-box">
              <h3>{adminLogs.length}</h3>
              <p>Audit Log Records</p>
            </div>
          </div>

          <section className="panel">
            <h3>Registered Students Directory</h3>
            {adminLoading ? (
              <p>Loading student directory...</p>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(adminData.students.length > 0 ? adminData.students : users).map((s) => (
                      <tr key={s._id || s.id || s.studentId}>
                        <td>{s.studentId || s.id}</td>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{s.phone || "—"}</td>
                        <td>
                          <span className="badge badge-level">{s.role || "student"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {adminLogs.length > 0 && (
            <section className="panel">
              <h3>Recent Security & Authentication Logs</h3>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Student ID</th>
                      <th>Email</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminLogs.slice(0, 15).map((log) => (
                      <tr key={log._id || Math.random()}>
                        <td><strong>{log.action}</strong></td>
                        <td>{log.studentId || "—"}</td>
                        <td>{log.email || "—"}</td>
                        <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      )}

      {/* ================= LOGIN MODAL ================= */}
      {showLogin && (
        <div
          className="modal-overlay"
          onClick={() => setShowLogin(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Student Login</h2>
            <form className="modal-form" onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Student ID (e.g. 2023D101)"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                autoFocus
                disabled={isSubmitting}
                aria-label="Student ID"
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                required
                disabled={isSubmitting}
                aria-label="Password"
              />
              <div className="modal-actions">
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? "Logging in..." : "Login"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowLogin(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= REGISTER MODAL ================= */}
      {showRegister && (
        <div
          className="modal-overlay"
          onClick={() => setShowRegister(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Student Registration</h2>
            <form className="modal-form" onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Student ID (e.g. 2024D202)"
                value={newUser.id}
                onChange={(e) => setNewUser({ ...newUser, id: e.target.value })}
                required
                autoFocus
                disabled={isSubmitting}
                aria-label="Student ID"
              />
              <input
                type="text"
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
                disabled={isSubmitting}
                aria-label="Full Name"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                required
                disabled={isSubmitting}
                aria-label="Phone Number"
              />
              <input
                type="email"
                placeholder="Email (e.g. student@ves.ac.in)"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
                disabled={isSubmitting}
                aria-label="Email"
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
                disabled={isSubmitting}
                aria-label="Password"
              />
              <div className="modal-actions">
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? "Registering..." : "Register"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowRegister(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= FOOTER ================= */}
      <footer className="footer">
        © 2026 VESIT Skill Exchange • Designed for Collaborative Campus Learning
      </footer>
    </div>
  );
}
