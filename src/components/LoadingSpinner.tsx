
import { Zap } from "lucide-react";

export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-200 rounded-full"></div>
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-600 rounded-full"></div>
        <div className="absolute inset-3 text-blue-600">
          <Zap className="w-6 h-6" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-600 font-medium">Načítání dat...</p>
        <p className="text-sm text-gray-500">Připojuji se k PID API</p>
      </div>
    </div>
  );
};
