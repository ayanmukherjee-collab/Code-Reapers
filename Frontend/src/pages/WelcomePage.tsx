import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Map, QrCode, MapPin, Sparkles } from "lucide-react";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[image:var(--gradient-hero)] flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
        {/* Floating elements for visual interest */}
        <div className="absolute top-20 left-8 w-16 h-16 rounded-full bg-primary/5 blur-2xl" />
        <div className="absolute top-40 right-12 w-24 h-24 rounded-full bg-primary/10 blur-3xl" />
        
        {/* Logo Badge */}
        <div className="mb-8 animate-fade-up">
          <div className="w-20 h-20 rounded-3xl bg-primary shadow-glow flex items-center justify-center">
            <MapPin className="w-10 h-10 text-primary-foreground" strokeWidth={1.5} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8 animate-fade-up stagger-1 opacity-0">
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-3">
            Campus Compass
          </h1>
          <p className="text-muted-foreground text-lg max-w-xs mx-auto leading-relaxed">
            Find people, rooms, classes & navigate your campus easily
          </p>
        </div>

        {/* Features */}
        <div className="flex gap-6 mb-12 animate-fade-up stagger-2 opacity-0">
          {[
            { icon: Map, label: "Indoor Maps" },
            { icon: Sparkles, label: "AI Powered" },
            { icon: QrCode, label: "QR Quick Start" },
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 pb-12 space-y-3 animate-fade-up stagger-3 opacity-0">
        <Button 
          variant="hero" 
          size="lg" 
          className="w-full"
          onClick={() => navigate("/search")}
        >
          <Search className="w-5 h-5" />
          Start Searching
        </Button>
        
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full"
          onClick={() => navigate("/map")}
        >
          <Map className="w-5 h-5" />
          Open Map
        </Button>
        
        <Button 
          variant="ghost" 
          size="lg" 
          className="w-full text-muted-foreground"
          onClick={() => navigate("/home")}
        >
          <QrCode className="w-5 h-5" />
          Scan QR for Quick Start
        </Button>
      </div>
    </div>
  );
}


