import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1800);
    const navTimer = setTimeout(() => navigate("/welcome"), 2300);
    
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <div 
      className={`min-h-screen flex flex-col items-center justify-center bg-primary transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-up">
        {/* Logo */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
            <MapPin className="w-12 h-12 text-primary-foreground" strokeWidth={1.5} />
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-3xl border-2 border-primary-foreground/30 animate-ping" />
        </div>

        {/* App Name */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-foreground tracking-tight">
            Campus Compass
          </h1>
          <p className="text-primary-foreground/70 text-sm mt-2 font-medium">
            Indoor Navigation System
          </p>
        </div>

        {/* Loading indicator */}
        <div className="mt-8 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary-foreground/50"
              style={{
                animation: "pulseSoft 1s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


