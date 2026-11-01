import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("token");
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Segoe UI', sans-serif",
          backgroundColor: "#eef2f7",
          color: "#111827",
          padding: "24px",
          textAlign: "center"
        }}>
          <div style={{
            background: "#ffffff",
            padding: "36px",
            borderRadius: "16px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            maxWidth: "480px",
            width: "100%"
          }}>
            <h2 style={{ color: "#1f3fa3", marginBottom: "12px", fontSize: "1.8rem" }}>
              Something went wrong
            </h2>
            <p style={{ color: "#42526b", marginBottom: "24px", fontSize: "1rem", lineHeight: "1.5" }}>
              The application encountered an unexpected error. You can refresh the page or reset cached session data.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: "#2f5fe3",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px 20px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  background: "#eef2f7",
                  color: "#1f3fa3",
                  border: "1px solid #cdd5e0",
                  borderRadius: "10px",
                  padding: "12px 20px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

