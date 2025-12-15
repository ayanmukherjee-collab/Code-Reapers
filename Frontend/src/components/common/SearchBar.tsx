import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SearchBarProps {
  placeholder?: string;
  onClick?: () => void;
  readOnly?: boolean;
}

export function SearchBar({ 
  placeholder = "Search faculty, rooms, classes...", 
  onClick,
  readOnly = false 
}: SearchBarProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (readOnly) {
      navigate("/search");
    }
  };

  return (
    <div className="relative" onClick={readOnly ? handleClick : undefined}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        className="search-input"
        readOnly={readOnly}
        onClick={readOnly ? handleClick : undefined}
      />
    </div>
  );
}


