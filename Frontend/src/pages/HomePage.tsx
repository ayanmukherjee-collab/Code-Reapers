import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { SearchBar } from "@/components/common/SearchBar";
import { Map, MessageCircle, Users, Building2, Navigation, ArrowRight } from "lucide-react";

const quickActions = [
  { 
    icon: Map, 
    label: "Indoor Maps", 
    description: "2D & AR navigation",
    path: "/map",
    color: "bg-blue-500/10 text-blue-600"
  },
  { 
    icon: MessageCircle, 
    label: "Ask AI", 
    description: "Get instant help",
    path: "/chat",
    color: "bg-purple-500/10 text-purple-600"
  },
  { 
    icon: Users, 
    label: "Faculty Directory", 
    description: "Find professors",
    path: "/search?filter=faculty",
    color: "bg-green-500/10 text-green-600"
  },
  { 
    icon: Building2, 
    label: "Buildings & Floors", 
    description: "Explore campus",
    path: "/buildings",
    color: "bg-orange-500/10 text-orange-600"
  },
];

const recentSearches = [
  { name: "Dr. Sarah Chen", type: "Faculty", room: "Room 302" },
  { name: "Computer Lab A", type: "Room", room: "Building C" },
  { name: "Library", type: "Building", room: "Main Campus" },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="mb-6 animate-fade-up">
          <p className="text-muted-foreground text-sm font-medium">Good morning 👋</p>
          <h1 className="text-2xl font-bold text-foreground">Where to today?</h1>
        </div>

        {/* Search Bar */}
        <div className="mb-8 animate-fade-up stagger-1 opacity-0">
          <SearchBar readOnly />
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8 animate-fade-up stagger-2 opacity-0">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="action-card flex-col items-start text-left"
              >
                <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="mt-3">
                  <p className="font-semibold text-foreground text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Lost? Start Navigation */}
        <div className="mb-8 animate-fade-up stagger-3 opacity-0">
          <button 
            onClick={() => navigate("/navigation-mode")}
            className="w-full p-4 rounded-2xl bg-primary text-primary-foreground shadow-glow flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Navigation className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Lost? Start Navigation</p>
                <p className="text-sm text-primary-foreground/70">Get directions anywhere</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Recent Searches */}
        <div className="animate-fade-up stagger-4 opacity-0">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Recent Searches
          </h2>
          <div className="space-y-2">
            {recentSearches.map((item, i) => (
              <button
                key={i}
                onClick={() => navigate("/details")}
                className="action-card w-full"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.type} • {item.room}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}


