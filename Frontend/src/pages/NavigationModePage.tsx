import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Map, Smartphone, Wifi, WifiOff, Camera } from "lucide-react";

export default function NavigationModePage() {
  const navigate = useNavigate();

  return (
    <PageLayout showNav={false}>
      <div className="min-h-screen bg-[image:var(--gradient-hero)] px-4">
        {/* Header */}
        <div className="flex items-center gap-3 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Choose Navigation Mode</h1>
        </div>

        {/* Content */}
        <div className="pt-8">
          <div className="text-center mb-8 animate-fade-up">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              How would you like to navigate?
            </h2>
            <p className="text-muted-foreground">
              Choose the navigation experience that works best for you
            </p>
          </div>

          {/* Navigation Options */}
          <div className="space-y-4 animate-fade-up stagger-1 opacity-0">
            {/* 2D Offline Map */}
            <button
              onClick={() => navigate("/navigation-2d")}
              className="w-full p-6 rounded-3xl bg-card border border-border/50 shadow-card hover:shadow-elevated hover:border-primary/20 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Map className="w-7 h-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      Offline Indoor Map
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                      Recommended
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    Classic 2D map with step-by-step directions
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <WifiOff className="w-4 h-4" />
                    <span>Works without internet</span>
                  </div>
                </div>
              </div>
            </button>

            {/* AR Navigation */}
            <button
              onClick={() => navigate("/navigation-ar")}
              className="w-full p-6 rounded-3xl bg-card border border-border/50 shadow-card hover:shadow-elevated hover:border-primary/20 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-7 h-7 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      AR Navigation
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 text-xs font-medium">
                      3D
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    Follow arrows in real space using your camera
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Smartphone className="w-4 h-4" />
                    <span>Requires camera access</span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Info Note */}
          <div className="mt-8 p-4 rounded-2xl bg-secondary/50 animate-fade-up stagger-2 opacity-0">
            <p className="text-sm text-muted-foreground text-center">
              Both modes will guide you to <span className="font-medium text-foreground">Room 302, Block A</span>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}


