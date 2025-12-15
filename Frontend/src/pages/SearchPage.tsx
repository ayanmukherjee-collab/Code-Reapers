import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Search, ArrowLeft, Clock, Navigation, Building2, User, BookOpen, Users as UsersIcon, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const filters = [
  { id: "all", label: "All", icon: Search },
  { id: "faculty", label: "Faculty", icon: User },
  { id: "rooms", label: "Rooms", icon: Building2 },
  { id: "departments", label: "Departments", icon: BookOpen },
  { id: "clubs", label: "Clubs", icon: UsersIcon },
  { id: "events", label: "Events", icon: Calendar },
];

const mockResults = [
  { id: 1, name: "Dr. Sarah Chen", type: "Faculty", department: "Computer Science", room: "Room 302, Block A", floor: "3rd Floor" },
  { id: 2, name: "Prof. Michael Johnson", type: "Faculty", department: "Mathematics", room: "Room 415, Block B", floor: "4th Floor" },
  { id: 3, name: "Computer Lab A", type: "Room", department: "CS Department", room: "Room 101, Block C", floor: "1st Floor" },
  { id: 4, name: "Main Library", type: "Building", department: "Central Campus", room: "Building D", floor: "4 Floors" },
  { id: 5, name: "AI Research Lab", type: "Room", department: "CS Department", room: "Room 501, Block A", floor: "5th Floor" },
];

const recentSearches = ["Library", "Dr. Chen", "Computer Lab", "Cafeteria"];

export default function SearchPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(true);
    }
  };

  return (
    <PageLayout>
      <div className="px-4 pt-4">
        {/* Header with Search */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty, rooms, classes..."
              className="search-input"
              autoFocus
            />
          </form>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "chip whitespace-nowrap",
                activeFilter === filter.id && "chip-active"
              )}
            >
              <filter.icon className="w-4 h-4" />
              {filter.label}
            </button>
          ))}
        </div>

        {!showResults ? (
          /* Recent Searches */
          <div className="animate-fade-up">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Searches
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSearchQuery(search);
                    setShowResults(true);
                  }}
                  className="chip"
                >
                  <Clock className="w-3 h-3" />
                  {search}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Search Results */
          <div className="space-y-3 animate-fade-up">
            <p className="text-sm text-muted-foreground mb-4">
              {mockResults.length} results found
            </p>
            
            {mockResults.map((result) => (
              <button
                key={result.id}
                onClick={() => navigate("/details", { state: result })}
                className="action-card w-full"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  {result.type === "Faculty" ? (
                    <User className="w-5 h-5 text-primary" />
                  ) : (
                    <Building2 className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">{result.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {result.type} • {result.department}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {result.room} • {result.floor}
                  </p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/navigation-mode");
                  }}
                  className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}


