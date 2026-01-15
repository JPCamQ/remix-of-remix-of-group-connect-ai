import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Group, useGroups } from "@/hooks/useGroups";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Users, Lock, Globe, MessageCircle, Clock, Check, X, Shield } from "lucide-react";

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const navigate = useNavigate();
  const { joinGroup, requestAccess } = useGroups();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  const handleClick = () => {
    if (group.is_member) {
      navigate(`/group/${group.id}`);
    }
  };

  const handleJoin = () => {
    if (group.access_type === "open") {
      joinGroup.mutate(group.id);
    } else {
      setShowRequestDialog(true);
    }
  };

  const handleRequestAccess = () => {
    requestAccess.mutate({ groupId: group.id, message: requestMessage || undefined });
    setShowRequestDialog(false);
    setRequestMessage("");
  };

  return (
    <>
      <Card
        className={`transition-all duration-200 hover:shadow-card ${
          group.is_member ? "cursor-pointer hover:border-primary/50" : ""
        }`}
        onClick={handleClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate flex items-center gap-2">
                {group.name}
                {group.is_admin && (
                  <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {group.description || "Sin descripción"}
              </CardDescription>
            </div>
            <Badge variant={group.access_type === "open" ? "secondary" : "outline"} className="flex-shrink-0">
              {group.access_type === "open" ? (
                <>
                  <Globe className="w-3 h-3 mr-1" />
                  Abierto
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 mr-1" />
                  Cerrado
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {group.member_count} miembros
            </span>
            {group.is_member && (
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                Entrar al chat
              </span>
            )}
          </div>

          {!group.is_member && (
            <div className="pt-2" onClick={(e) => e.stopPropagation()}>
              {group.request_status === "pending" ? (
                <Button variant="outline" className="w-full" disabled>
                  <Clock className="w-4 h-4 mr-2" />
                  Solicitud pendiente
                </Button>
              ) : group.request_status === "rejected" ? (
                <Button variant="outline" className="w-full" disabled>
                  <X className="w-4 h-4 mr-2" />
                  Solicitud rechazada
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleJoin}
                  disabled={joinGroup.isPending || requestAccess.isPending}
                >
                  {group.access_type === "open" ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Unirse
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Solicitar acceso
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar acceso</DialogTitle>
            <DialogDescription>
              Envía una solicitud para unirte a "{group.name}". Un administrador revisará tu solicitud.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="¿Por qué quieres unirte a este grupo? (opcional)"
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRequestAccess} disabled={requestAccess.isPending}>
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
