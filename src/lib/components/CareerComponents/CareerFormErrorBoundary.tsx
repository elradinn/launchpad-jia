"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import styles from "@/lib/styles/screens/careerForm.module.scss";

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary for Career Form
 * Catches errors in the form and displays a user-friendly fallback UI
 * Logs errors for debugging and provides recovery options
 */
class CareerFormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error("Career Form Error Boundary caught an error:", error, errorInfo);
    
    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundaryContainer}>
          <div className={styles.errorBoundaryCard}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <i 
                className="la la-exclamation-triangle" 
                style={{ 
                  fontSize: 64, 
                  color: "#EF4444",
                  marginBottom: 16,
                  display: "block"
                }}
              ></i>
              <h2 style={{ fontSize: 24, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
                Something went wrong
              </h2>
              <p style={{ fontSize: 16, color: "#6B7280", marginBottom: 24 }}>
                We encountered an unexpected error while processing your career form.
                Don't worry, your progress may have been auto-saved.
              </p>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div 
                style={{ 
                  background: "#FEF2F2", 
                  border: "1px solid #FCA5A5",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 24,
                  maxHeight: 200,
                  overflow: "auto"
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 600, color: "#991B1B", marginBottom: 8 }}>
                  Error Details (Development Only):
                </p>
                <pre style={{ fontSize: 12, color: "#7F1D1D", margin: 0, whiteSpace: "pre-wrap" }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {"\n\n"}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={this.handleReset}
                style={{
                  background: "#000",
                  color: "#fff",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <i className="la la-redo" style={{ fontSize: 16 }}></i>
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  background: "#fff",
                  color: "#414651",
                  border: "1px solid #D5D7DA",
                  padding: "12px 24px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <i className="la la-sync" style={{ fontSize: 16 }}></i>
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = "/recruiter-dashboard/careers"}
                style={{
                  background: "#fff",
                  color: "#414651",
                  border: "1px solid #D5D7DA",
                  padding: "12px 24px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <i className="la la-arrow-left" style={{ fontSize: 16 }}></i>
                Back to Careers
              </button>
            </div>

            <div 
              style={{ 
                marginTop: 24, 
                padding: 16, 
                background: "#F9FAFB", 
                borderRadius: 8,
                textAlign: "center"
              }}
            >
              <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
                <i className="la la-info-circle" style={{ marginRight: 8 }}></i>
                If this problem persists, please contact support with the error details above.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CareerFormErrorBoundary;
