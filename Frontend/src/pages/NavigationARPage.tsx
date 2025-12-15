import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { X, Crosshair, ArrowUp, MapPin } from "lucide-react";

export default function NavigationARPage() {
  const navigate = useNavigate();
  const [distance, setDistance] = useState(45);

  useEffect(() => {
    const timer = setInterval(() => {
      setDistance((d) => {
        if (d <= 5) {
          navigate("/arrived");
          return d;
        }
        return d - 1;
      });
    }, 500);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <PageLayout showNav={false}>
      <div className="min-h-screen bg-foreground/95 relative overflow-hidden">
        {/* Simulated Camera View */}
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/80 to-foreground/95">
          {/* Grid pattern to simulate camera */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--primary-foreground) / 0.1) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--primary-foreground) / 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        {/* AR Direction Arrow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce-soft">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 blur-xl bg-primary/50 rounded-full scale-150" />
            
            {/* Arrow */}
            <div className="relative w-24 h-24 rounded-full bg-primary/20 backdrop-blur border-2 border-primary flex items-center justify-center">
              <ArrowUp className="w-12 h-12 text-primary-foreground" strokeWidth={2.5} />
            </div>
          </div>
          
          <p className="text-center text-primary-foreground/80 font-medium mt-4 text-sm">
            Walk Straight
          </p>
        </div>

        {/* Floating Room Markers */}
        <div className="absolute top-1/4 right-8">
          <div className="px-3 py-2 rounded-xl bg-card/90 backdrop-blur shadow-card">
            <p className="text-xs text-muted-foreground">Room 301</p>
          </div>
        </div>
        
        <div className="absolute top-1/3 left-8">
          <div className="px-3 py-2 rounded-xl bg-card/90 backdrop-blur shadow-card">
            <p className="text-xs text-muted-foreground">Lab A</p>
          </div>
        </div>

        {/* Destination Marker */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-destructive/90 flex items-center justify-center animate-pulse-soft">
              <MapPin className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="mt-2 px-3 py-1.5 rounded-lg bg-card/90 backdrop-blur">
              <p className="text-sm font-semibold text-foreground">Room 302</p>
            </div>
          </div>
        </div>

        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button 
            onClick={() => navigate("/home")}
            className="w-10 h-10 rounded-xl bg-card/90 backdrop-blur shadow-card flex items-center justify-center"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
          
          <div className="px-4 py-2 rounded-xl bg-card/90 backdrop-blur shadow-card">
            <p className="text-sm font-medium text-foreground">AR Mode Active</p>
          </div>
        </div>

        {/* Distance Counter */}
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2">
          <div className="text-center">
            <div className="text-6xl font-bold text-primary-foreground mb-2">
              {distance}m
            </div>
            <p className="text-primary-foreground/70 text-sm">to destination</p>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-card/95 backdrop-blur rounded-2xl shadow-elevated p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-foreground">Room 302</p>
                <p className="text-sm text-muted-foreground">3rd Floor, Block A</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{Math.ceil(distance / 15)} min</p>
                <p className="text-xs text-muted-foreground">ETA</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/home")}>
                Stop Navigation
              </Button>
              <Button variant="soft" size="icon">
                <Crosshair className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}


