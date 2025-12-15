import { useNavigate, useLocation } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Navigation, Heart, MessageCircle, MapPin, Building2, Briefcase, GraduationCap, Mail, Phone } from "lucide-react";

export default function DetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state || {
    name: "Dr. Sarah Chen",
    type: "Faculty",
    department: "Computer Science",
    room: "Room 302",
    floor: "3rd Floor",
    building: "Block A",
  };

  const isFaculty = data.type === "Faculty";

  return (
    <PageLayout showNav={false}>
      <div className="min-h-screen bg-[image:var(--gradient-hero)]">
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Details</h1>
        </div>

        {/* Profile Card */}
        <div className="px-4 animate-fade-up">
          <div className="bg-card rounded-3xl shadow-card overflow-hidden">
            {/* Avatar Section */}
            <div className="bg-primary/5 p-6 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {isFaculty ? (
                  <GraduationCap className="w-12 h-12 text-primary" />
                ) : (
                  <Building2 className="w-12 h-12 text-primary" />
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground">{data.name}</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {data.type} • {data.department}
              </p>
            </div>

            {/* Info Grid */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Room</p>
                  <p className="font-medium text-foreground">{data.room}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <Building2 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">{data.floor}, {data.building || "Block A"}</p>
                </div>
              </div>

              {isFaculty && (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Designation</p>
                      <p className="font-medium text-foreground">Associate Professor</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground">s.chen@university.edu</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 mt-6 space-y-3 animate-fade-up stagger-1 opacity-0">
          <Button 
            variant="hero" 
            size="lg" 
            className="w-full"
            onClick={() => navigate("/navigation-mode")}
          >
            <Navigation className="w-5 h-5" />
            Navigate There
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg">
              <Heart className="w-5 h-5" />
              Favorite
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate("/chat")}
            >
              <MessageCircle className="w-5 h-5" />
              Ask AI
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}


