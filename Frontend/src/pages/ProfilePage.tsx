import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Heart, Moon, Download, Info, Trash2, ChevronRight, User, MapPin } from "lucide-react";

const menuItems = [
  { icon: Heart, label: "Saved Places", description: "Your favorite locations", path: "/saved" },
  { icon: Moon, label: "Dark / Light Theme", description: "Toggle appearance", isToggle: true },
  { icon: Download, label: "Offline Building Packs", description: "Download maps for offline use", path: "/offline" },
  { icon: Info, label: "About the Team", description: "Meet the hackathon crew", path: "/about" },
  { icon: Trash2, label: "Clear App Data", description: "Reset all preferences", isDestructive: true },
];

export default function ProfilePage() {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <div className="px-4 pt-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8 animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Guest User</h1>
          <p className="text-muted-foreground text-sm">Tech University</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8 animate-fade-up stagger-1 opacity-0">
          {[
            { value: "12", label: "Navigations" },
            { value: "5", label: "Saved" },
            { value: "3", label: "Buildings" },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-2xl p-4 text-center shadow-soft">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Menu Items */}
        <div className="space-y-2 animate-fade-up stagger-2 opacity-0">
          {menuItems.map((item, i) => (
            <button
              key={i}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all ${
                item.isDestructive ? "hover:border-destructive/20" : ""
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                item.isDestructive ? "bg-destructive/10" : "bg-secondary"
              }`}>
                <item.icon className={`w-5 h-5 ${
                  item.isDestructive ? "text-destructive" : "text-primary"
                }`} />
              </div>
              <div className="flex-1 text-left">
                <p className={`font-medium ${
                  item.isDestructive ? "text-destructive" : "text-foreground"
                }`}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              {item.isToggle ? (
                <div className="w-12 h-6 rounded-full bg-secondary relative">
                  <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-primary" />
                </div>
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>

        {/* App Info */}
        <div className="mt-8 text-center animate-fade-up stagger-3 opacity-0">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">Campus Compass</span>
          </div>
          <p className="text-xs text-muted-foreground">Version 1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">
            Built with ❤️ for Hackathon 2024
          </p>
        </div>
      </div>
    </PageLayout>
  );
}


