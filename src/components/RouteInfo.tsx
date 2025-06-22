
import { Bus, Sun, Moon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RouteInfoProps {
  stationId: string;
}

export const RouteInfo = ({ stationId }: RouteInfoProps) => {
  // Routes for Vozovna Motol - only trams
  const vozovnaRoutes = [
    // Tramvaje
    { short_name: "9", type: 0 },   
    { short_name: "10", type: 0 },  
    { short_name: "15", type: 0 },  
    { short_name: "16", type: 0 },  
    { short_name: "98", type: 0, isNight: true },  
    { short_name: "99", type: 0, isNight: true },  
  ];

  // Routes for Motol - only buses
  const motolRoutes = [
    // Autobusy městské
    { short_name: "168", type: 3 },
    { short_name: "174", type: 3 },
    { short_name: "180", type: 3 },
    { short_name: "184", type: 3 },
    { short_name: "902", type: 3, isNight: true }, // Noční linka (9XX)
    
    // Příměstské autobusy (3XX)
    { short_name: "304", type: 3, isSuburban: true },
    { short_name: "347", type: 3, isSuburban: true },
    { short_name: "365", type: 3, isSuburban: true },
    { short_name: "380", type: 3, isSuburban: true },
  ];

  // Determine which routes to show based on station ID
  const isVozovnaMotol = stationId.includes("U865"); // Vozovna Motol station IDs
  const routes = isVozovnaMotol ? vozovnaRoutes : motolRoutes;

  const getRouteTypeIcon = (routeType: number) => {
    switch (routeType) {
      case 0: return <i className="fa-solid fa-train-tram text-xl"></i>; // Tramvaj
      case 3: return <Bus className="w-6 h-6" />; // Autobus
      case 1: return <i className="fa-solid fa-train-tram text-xl"></i>; // Metro
      case 2: return <i className="fa-solid fa-train-tram text-xl"></i>; // Vlak
      default: return <Bus className="w-6 h-6" />;
    }
  };

  const getRouteColor = (route: any) => {
    if (route.isNight) {
      return "bg-black text-white"; // Noční linky - černá
    }
    if (route.type === 0) {
      return "bg-red-600 text-white"; // Tramvaje - červená
    }
    if (route.type === 3 && route.isSuburban) {
      return "bg-purple-600 text-white"; // Příměstské autobusy (3XX) - fialová
    }
    if (route.type === 3) {
      return "bg-blue-600 text-white"; // Městské autobusy - modrá
    }
    return "bg-gray-600 text-white"; // Ostatní
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-100 h-full">
      <CardHeader className="pb-3 p-4">
        <CardTitle className="flex items-center gap-2 text-2xl text-gray-800">
          Linky
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 flex flex-col">
        <div className="grid grid-cols-4 gap-2 mb-6 max-h-80 overflow-y-auto">
          {routes.map((route, index) => (
            <div key={`${route.short_name}-${index}`} className="flex flex-col items-center gap-2">
              <div className="text-gray-600 text-sm">
                {getRouteTypeIcon(route.type)}
              </div>
              <div className={`w-12 h-10 rounded-lg flex items-center justify-center ${getRouteColor(route)}`}>
                <span className="text-sm font-bold">
                  {route.short_name}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex-1"></div>
        
        {/* Legend - conditional based on what routes are shown */}
        <div className="border-t border-orange-200 pt-4">
          <div className="flex flex-col gap-2 text-xs">
            {isVozovnaMotol ? (
              // Legend for trams only
              <div className="flex justify-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span className="text-gray-600">=</span>
                  <Sun className="w-3 h-3 text-yellow-500" />
                  <span className="text-gray-600">Tramvaj</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-black rounded-full"></div>
                  <span className="text-gray-600">=</span>
                  <Moon className="w-3 h-3 text-blue-500" />
                  <span className="text-gray-600">Noční</span>
                </div>
              </div>
            ) : (
              // Legend for buses only
              <div className="flex justify-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-600">= Autobus</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-600">= Příměstský</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-black rounded-full"></div>
                  <span className="text-gray-600">=</span>
                  <Moon className="w-3 h-3 text-blue-500" />
                  <span className="text-gray-600">Noční</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
