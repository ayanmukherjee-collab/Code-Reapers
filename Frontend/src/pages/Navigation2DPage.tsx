import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { X, ChevronUp, ChevronRight, RotateCcw, MapPin, Navigation } from "lucide-react";

const steps = [
  { instruction: "Start at the Main Entrance", distance: "0m", completed: true },
  { instruction: "Walk straight through the lobby", distance: "15m", completed: true },
  { instruction: "Turn right at the elevator", distance: "8m", completed: false },
  { instruction: "Take the stairs to Floor 3", distance: "2 floors", completed: false },
  { instruction: "Turn left and walk 20m", distance: "20m", completed: false },
  { instruction: "Room 302 is on your right", distance: "5m", completed: false },
];

export default function Navigation2DPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(2);
  const [progress, setProgress] = useState(33);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (progress < 100) {
        setProgress((p) => Math.min(p + 1, 100));
        if (progress >= 60 && currentStep < steps.length - 1) {
          setCurrentStep((s) => s + 1);
        }
        if (progress >= 95) {
          navigate("/arrived");
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [progress, navigate, currentStep]);

  return (
    <PageLayout showNav={false}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Map Area */}
        <div className="flex-1 relative bg-secondary/30 overflow-hidden">
          {/* Mock Floor Plan */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
            {/* Building outline */}
            <rect x="50" y="30" width="300" height="240" fill="none" stroke="hsl(var(--border))" strokeWidth="2" rx="8" />
            
            {/* Rooms */}
            <rect x="60" y="40" width="80" height="60" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1" rx="4" />
            <rect x="150" y="40" width="80" height="60" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1" rx="4" />
            <rect x="240" y="40" width="100" height="60" fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary))" strokeWidth="2" rx="4" />
            
            <rect x="60" y="120" width="120" height="80" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1" rx="4" />
            <rect x="200" y="120" width="140" height="80" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1" rx="4" />
            
            <rect x="60" y="220" width="80" height="40" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1" rx="4" />
            
            {/* Corridor */}
            <rect x="180" y="200" width="160" height="60" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" rx="4" />
            
            {/* Navigation path */}
            <path 
              d="M 200 260 L 200 160 L 290 160 L 290 100 L 290 70" 
              fill="none" 
              stroke="hsl(var(--primary))" 
              strokeWidth="4" 
              strokeLinecap="round"
              strokeDasharray="8 4"
              className="animate-pulse"
            />
            
            {/* You are here marker */}
            <circle cx="200" cy="160" r="8" fill="hsl(var(--primary))" />
            <circle cx="200" cy="160" r="12" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" className="animate-ping" />
            
            {/* Destination marker */}
            <circle cx="290" cy="70" r="10" fill="hsl(var(--destructive) / 0.2)" stroke="hsl(var(--destructive))" strokeWidth="2" />
            
            {/* Room labels */}
            <text x="100" y="75" fill="hsl(var(--muted-foreground))" fontSize="10" textAnchor="middle">301</text>
            <text x="190" y="75" fill="hsl(var(--muted-foreground))" fontSize="10" textAnchor="middle">Lab A</text>
            <text x="290" y="75" fill="hsl(var(--primary))" fontSize="12" fontWeight="bold" textAnchor="middle">302</text>
          </svg>

          {/* Floor indicator */}
          <div className="absolute top-4 left-4 px-3 py-2 rounded-xl bg-card/90 backdrop-blur shadow-card">
            <p className="text-xs text-muted-foreground">Floor</p>
            <p className="text-lg font-bold text-foreground">3</p>
          </div>

          {/* Close button */}
          <button 
            onClick={() => navigate("/home")}
            className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-card/90 backdrop-blur shadow-card flex items-center justify-center"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex items-center gap-4 px-3 py-2 rounded-xl bg-card/90 backdrop-blur shadow-card">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">You</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-destructive" />
              <span className="text-xs text-muted-foreground">Destination</span>
            </div>
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="bg-card border-t border-border rounded-t-3xl shadow-elevated">
          {/* Progress Bar */}
          <div className="h-1 bg-secondary mx-4 mt-4 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Current Step */}
          <div className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Navigation className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {steps[currentStep].instruction}
                </p>
                <p className="text-sm text-muted-foreground">
                  {steps[currentStep].distance} • Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>

            {/* All Steps (collapsed) */}
            <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
              {steps.map((step, i) => (
                <div 
                  key={i}
                  className={`flex items-center gap-3 p-2 rounded-xl ${
                    i === currentStep ? "bg-primary/10" : 
                    i < currentStep ? "opacity-50" : ""
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    i < currentStep ? "bg-primary text-primary-foreground" :
                    i === currentStep ? "bg-primary text-primary-foreground" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {i < currentStep ? "✓" : i + 1}
                  </div>
                  <span className={`text-sm ${i === currentStep ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {step.instruction}
                  </span>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/home")}>
                <X className="w-4 h-4" />
                End Navigation
              </Button>
              <Button variant="soft" size="icon">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}


