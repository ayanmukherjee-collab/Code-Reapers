import { Home, Map, Search, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Map, label: "Map", path: "/map" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: MessageCircle, label: "AI", path: "/chat" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="mx-4 mb-4">
        <div className="glass-card rounded-3xl px-2 py-2">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "nav-item",
                    isActive && "nav-item-active"
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}


