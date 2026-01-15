import { useState } from "react";
import { useGroups, Group } from "@/hooks/useGroups";
import { GroupCard } from "./GroupCard";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Users, Globe, Lock } from "lucide-react";

export function GroupList() {
  const { groups, isLoading } = useGroups();
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filteredGroups = groups?.filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase()) ||
    group.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const myGroups = filteredGroups.filter((g) => g.is_member);
  const openGroups = filteredGroups.filter((g) => !g.is_member && g.access_type === "open");
  const closedGroups = filteredGroups.filter((g) => !g.is_member && g.access_type === "approval_required");

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-card space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Grupos</h1>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Crear grupo
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar grupos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="my-groups" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-groups" className="gap-2">
              <Users className="w-4 h-4" />
              Mis grupos
              {myGroups.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {myGroups.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="open" className="gap-2">
              <Globe className="w-4 h-4" />
              Abiertos
            </TabsTrigger>
            <TabsTrigger value="closed" className="gap-2">
              <Lock className="w-4 h-4" />
              Cerrados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-groups">
            {myGroups.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No tienes grupos"
                description="Únete a un grupo o crea uno nuevo para empezar a chatear."
              />
            ) : (
              <GroupGrid groups={myGroups} />
            )}
          </TabsContent>

          <TabsContent value="open">
            {openGroups.length === 0 ? (
              <EmptyState
                icon={Globe}
                title="No hay grupos abiertos"
                description="Los grupos abiertos aparecerán aquí."
              />
            ) : (
              <GroupGrid groups={openGroups} />
            )}
          </TabsContent>

          <TabsContent value="closed">
            {closedGroups.length === 0 ? (
              <EmptyState
                icon={Lock}
                title="No hay grupos cerrados"
                description="Los grupos que requieren aprobación aparecerán aquí."
              />
            ) : (
              <GroupGrid groups={closedGroups} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateGroupDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}

function GroupGrid({ groups }: { groups: Group[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
