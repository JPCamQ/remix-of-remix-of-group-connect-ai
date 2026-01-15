import { useNavigate } from "react-router-dom";
import { Group } from "@/hooks/useGroups";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, Users, Shield } from "lucide-react";

interface ChatHeaderProps {
  group: Group;
  onInfoClick: () => void;
  showingInfo: boolean;
}

export function ChatHeader({ group, onInfoClick, showingInfo }: ChatHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="h-16 border-b bg-card flex items-center gap-3 px-4">
      <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
        <ArrowLeft className="w-5 h-5" />
      </Button>

      <div className="flex-1 min-w-0">
        <h2 className="font-semibold truncate flex items-center gap-2">
          {group.name}
          {group.is_admin && <Shield className="w-4 h-4 text-primary" />}
        </h2>
        <p className="text-sm text-muted-foreground truncate">
          {group.description || "Sin descripción"}
        </p>
      </div>

      <Button
        variant={showingInfo ? "secondary" : "ghost"}
        size="icon"
        onClick={onInfoClick}
      >
        <Info className="w-5 h-5" />
      </Button>
    </div>
  );
}
