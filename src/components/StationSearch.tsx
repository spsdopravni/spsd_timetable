
import { useState, useEffect } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { searchStations } from "@/utils/pidApi";
import type { Station } from "@/types/pid";

interface StationSearchProps {
  onStationSelect: (station: Station) => void;
  setLoading: (loading: boolean) => void;
}

export const StationSearch = ({ onStationSelect, setLoading }: StationSearchProps) => {
  const [query, setQuery] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (query.length >= 3) {
        setSearching(true);
        try {
          const results = await searchStations(query);
          setStations(results.filter(station => 
            station.modes?.includes("tram") || 
            station.modes?.includes("metro")
          ));
          setShowResults(true);
        } catch (error) {
          setStations([]);
        }
        setSearching(false);
      } else {
        setStations([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [query]);

  const handleStationSelect = (station: Station) => {
    setLoading(true);
    onStationSelect(station);
    setShowResults(false);
    setQuery(station.name);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Zadejte název zastávky (např. Národní třída, Anděl...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-lg"
        />
      </div>

      {showResults && stations.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 border-0 shadow-xl bg-white">
          <CardContent className="p-0 max-h-80 overflow-y-auto">
            {stations.map((station, index) => (
              <button
                key={`${station.id}-${index}`}
                onClick={() => handleStationSelect(station)}
                className="w-full text-left p-4 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{station.name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {station.municipality || "Praha"}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {station.modes?.map((mode, i) => (
                      <span
                        key={i}
                        className={`px-2 py-1 text-xs rounded-full ${
                          mode === "tram" 
                            ? "bg-red-100 text-red-800" 
                            : mode === "metro"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {mode === "tram" ? "🚋" : mode === "metro" ? "🚇" : "🚌"}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {searching && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <Card className="border-0 shadow-xl bg-white">
            <CardContent className="p-4 text-center text-gray-600">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              Hledání zastávek...
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
