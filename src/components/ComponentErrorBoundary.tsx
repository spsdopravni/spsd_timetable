import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.componentName || 'Component'}:`, error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ error });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm h-full border-2 border-red-300 dark:border-red-700">
          <CardContent className="p-4 text-center h-full flex flex-col items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400 mb-2" />
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
              Chyba komponenty
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {this.props.componentName || 'Komponenta'} se nepodařila načíst.
            </p>
            <Button onClick={this.handleRetry} size="sm" variant="outline">
              <RefreshCcw className="h-3 w-3 mr-2" />
              Zkusit znovu
            </Button>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-left w-full">
                <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400">
                  Debug info
                </summary>
                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded overflow-auto max-h-20">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}