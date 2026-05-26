'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl dark:bg-red-900/30">
            ⚠️
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            문제가 발생했습니다
          </h2>
          <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            예상치 못한 오류가 생겼어요. 페이지를 새로고침하거나 다시 시도해주세요.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              다시 시도
            </button>
            <button
              onClick={() => window.location.assign('/')}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              홈으로
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
