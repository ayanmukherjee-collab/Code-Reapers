import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft, MapPin, Share2, PartyPopper } from "lucide-react";

export default function ArrivedPage() {
  const navigate = useNavigate();

  return (
    <PageLayout showNav={false}>
      <div className="min-h-screen bg-[image:var(--gradient-hero)] flex flex-col items-center justify-center px-4">
        {/* Celebration */}
        <div className="text-center animate-scale-in">
          {/* Success Icon */}
          <div className="relative mb-8">
            <div className="w-28 h-28 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                  <Check className="w-8 h-8 text-primary-foreground" strokeWidth={3} />
                </div>
              </div>
            </div>
            
            {/* Confetti elements */}
            <PartyPopper className="absolute -top-2 -right-2 w-8 h-8 text-yellow-500 animate-bounce-soft" />
            <div className="absolute -bottom-1 -left-4 w-3 h-3 rounded-full bg-primary animate-ping" />
            <div className="absolute top-4 -left-8 w-2 h-2 rounded-full bg-green-500 animate-ping" style={{ animationDelay: '0.2s' }} />
            <div className="absolute -top-4 left-8 w-2 h-2 rounded-full bg-purple-500 animate-ping" style={{ animationDelay: '0.4s' }} />
          </div>

          {/* Message */}
          <h1 className="text-3xl font-bold text-foreground mb-2 animate-fade-up stagger-1 opacity-0">
            You've Arrived! 🎉
          </h1>
          <p className="text-muted-foreground mb-8 animate-fade-up stagger-2 opacity-0">
            Welcome to your destination
          </p>

          {/* Destination Card */}
          <div className="bg-card rounded-2xl shadow-card p-6 mb-8 animate-fade-up stagger-2 opacity-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-7 h-7 text-primary" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-foreground">Room 302</h2>
                <p className="text-muted-foreground">3rd Floor, Block A</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Dr. Sarah Chen • Computer Science
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full max-w-sm space-y-3 animate-fade-up stagger-3 opacity-0">
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full"
            onClick={() => navigate("/home")}
          >
            <ArrowLeft className="w-5 h-5" />
            Navigate Back
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => navigate("/search")}
            >
              <MapPin className="w-5 h-5" />
              Nearby
            </Button>
            <Button variant="secondary" size="lg">
              <Share2 className="w-5 h-5" />
              Share
            </Button>
          </div>
          
          <Button 
            variant="hero" 
            size="lg" 
            className="w-full"
            onClick={() => navigate("/home")}
          >
            Done
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}


