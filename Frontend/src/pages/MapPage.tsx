import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { SearchBar } from "@/components/common/SearchBar";
import { Button } from "@/components/ui/button";
import { Layers, Navigation, Plus, Minus, MapPin, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buildings = [
  { id: 1, name: "Block A", x: 100, y: 80, type: "academic" },
  { id: 2, name: "Block B", x: 220, y: 120, type: "academic" },
  { id: 3, name: "Library", x: 160, y: 200, type: "facility" },
  { id: 4, name: "Cafeteria", x: 280, y: 60, type: "facility" },
  { id: 5, name: "Sports Complex", x: 60, y: 180, type: "recreation" },
];

const floors = ["Ground", "1st", "2nd", "3rd", "4th", "5th"];

export default function MapPage() {
  const navigate = useNavigate();
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);

  return (
    <PageLayout>
      <div className="relative h-[calc(100vh-7rem)]">
        {/* Search Overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-background via-background/90 to-transparent pb-12">
          <SearchBar readOnly />
        </div>

        {/* Map Canvas */}
        <div className="absolute inset-0 bg-secondary/30 overflow-hidden">
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px'
            }}
          />

          {/* Buildings */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 350">
            {/* Campus boundary */}
            <rect x="40" y="40" width="320" height="270" fill="none" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="8 4" rx="16" />
            
            {/* Paths/Roads */}
            <path d="M 60 160 L 340 160" stroke="hsl(var(--muted-foreground))" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
            <path d="M 200 60 L 200 290" stroke="hsl(var(--muted-foreground))" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
            
            {/* Buildings */}
            {buildings.map((building) => (
              <g key={building.id}>
                <rect
                  x={building.x - 30}
                  y={building.y - 20}
                  width="60"
                  height="40"
                  rx="8"
                  fill={selectedBuilding === building.id ? "hsl(var(--primary))" : "hsl(var(--card))"}
                  stroke={selectedBuilding === building.id ? "hsl(var(--primary))" : "hsl(var(--border))"}
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => setSelectedBuilding(building.id)}
                />
                <text
                  x={building.x}
                  y={building.y + 4}
                  textAnchor="middle"
                  fill={selectedBuilding === building.id ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))"}
                  fontSize="10"
                  fontWeight="600"
                >
                  {building.name}
                </text>
              </g>
            ))}
            
            {/* Current location marker */}
            <circle cx="160" cy="160" r="8" fill="hsl(var(--primary))" />
            <circle cx="160" cy="160" r="16" fill="hsl(var(--primary) / 0.2)" className="animate-ping" />
          </svg>

          {/* You are here label */}
          <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-full">
            <div className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium shadow-lg">
              You are here
            </div>
          </div>
        </div>

        {/* Floor Selector */}
        <div className="absolute top-24 right-4 z-10">
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-1.5">
            <div className="flex flex-col gap-1">
              {floors.map((floor, i) => (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(i)}
                  className={cn(
                    "w-10 h-10 rounded-xl text-xs font-medium transition-all",
                    selectedFloor === i
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {floor === "Ground" ? "G" : floor.replace("st", "").replace("nd", "").replace("rd", "").replace("th", "")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-28 right-4 z-10">
          <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
            <button className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors border-b border-border">
              <Plus className="w-5 h-5 text-foreground" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors">
              <Minus className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Layer Toggle */}
        <div className="absolute bottom-28 left-4 z-10">
          <button className="w-12 h-12 rounded-2xl bg-card shadow-card border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors">
            <Layers className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Selected Building Panel */}
        {selectedBuilding && (
          <div className="absolute bottom-28 left-4 right-4 z-10 animate-fade-up">
            <div className="bg-card rounded-2xl shadow-elevated border border-border/50 p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {buildings.find(b => b.id === selectedBuilding)?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">6 floors • CS Department</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => navigate("/navigation-mode")}
                >
                  <Navigation className="w-4 h-4" />
                  Go
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Navigate Button */}
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10">
          <Button 
            variant="hero" 
            size="lg" 
            className="shadow-glow"
            onClick={() => navigate("/search")}
          >
            <MapPin className="w-5 h-5" />
            Navigate to...
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}


