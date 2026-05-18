"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="container mt-5">
          <div className="card border-danger">
            <div className="card-body text-center p-5">
              <i className="la la-exclamation-triangle text-danger fs-60 mb-3"></i>
              <h2 className="text-danger">Ups! Terjadi Kesalahan Teknis</h2>
              <p className="lead">Aplikasi mengalami kendala saat memuat halaman ini. Jangan panik bro, tim IT sudah mencatat kejadian ini.</p>
              <button 
                className="btn btn-primary mt-3"
                onClick={() => window.location.reload()}
              >
                Coba Muat Ulang Halaman
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
