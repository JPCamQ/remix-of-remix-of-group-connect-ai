import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Group } from "@/hooks/useGroups";
import { useGroupMembers, useAccessRequests, GroupMember, AccessRequest } from "@/hooks/useGroupMembers";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  X, Users, Clock, Shield, Settings, LogOut, UserMinus, UserPlus,
  Check, XIcon, Bot, Loader2, Globe, Lock
} from "lucide-react";

interface GroupInfoPanelProps {
  group: Group;
  onClose: () => void;
}

export function GroupInfoPanel({ group, onClose }: GroupInfoPanelProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { members, isLoading: membersLoading } = useGroupMembers(group.id);
  const { requests, approveRequest, rejectRequest, removeMember, promoteToAdmin } = useAccessRequests(group.id);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const handleLeaveGroup = async () => {
    setLeaving(true);
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", group.id)
        .eq("user_id", user?.id);

      if (error) throw error;
      
      toast({ title: "Has abandonado el grupo" });
      navigate("/");
    } catch (error) {
      toast({ title: "Error", description: "No se pudo abandonar el grupo", variant: "destructive" });
    } finally {
      setLeaving(false);
      setShowLeaveConfirm(false);
    }
  };

  return (
    <>
      <div className="w-80 border-l bg-card flex flex-col animate-slide-in-right">
        <div className="h-16 border-b flex items-center justify-between px-4">
          <h3 className="font-semibold">Info del grupo</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Group info */}
            <div className="text-center space-y-2">
              <div className="w-20 h-20 rounded-full bg-gradient-primary mx-auto flex items-center justify-center text-3xl font-bold text-primary-foreground">
                {group.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="font-semibold text-lg">{group.name}</h4>
              <Badge variant={group.access_type === "open" ? "secondary" : "outline"}>
                {group.access_type === "open" ? (
                  <><Globe className="w-3 h-3 mr-1" /> Abierto</>
                ) : (
                  <><Lock className="w-3 h-3 mr-1" /> Cerrado</>
                )}
              </Badge>
              {group.description && (
                <p className="text-sm text-muted-foreground">{group.description}</p>
              )}
            </div>

            {group.rules && (
              <>
                <Separator />
                <div>
                  <h5 className="font-medium mb-2">Reglas</h5>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{group.rules}</p>
                </div>
              </>
            )}

            <Separator />

            {/* AI Info */}
            <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-chat-ai flex items-center justify-center">
                <Bot className="w-5 h-5 text-chat-ai-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">{group.ai_name || "Asistente"}</p>
                <p className="text-xs text-muted-foreground">
                  {group.ai_only_when_tagged ? "Responde cuando lo etiquetan" : "Participa activamente"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Tabs for Members/Requests */}
            <Tabs defaultValue="members">
              <TabsList className="w-full">
                <TabsTrigger value="members" className="flex-1">
                  <Users className="w-4 h-4 mr-1" />
                  Miembros
                </TabsTrigger>
                {group.is_admin && requests && requests.length > 0 && (
                  <TabsTrigger value="requests" className="flex-1">
                    <Clock className="w-4 h-4 mr-1" />
                    Solicitudes
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5">
                      {requests.length}
                    </Badge>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="members" className="mt-3 space-y-2">
                {membersLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </div>
                ) : (
                  members?.map((member) => (
                    <MemberItem
                      key={member.id}
                      member={member}
                      isAdmin={group.is_admin || false}
                      currentUserId={user?.id || ""}
                      onRemove={() => removeMember.mutate(member.id)}
                      onPromote={() => promoteToAdmin.mutate(member.id)}
                    />
                  ))
                )}
              </TabsContent>

              {group.is_admin && (
                <TabsContent value="requests" className="mt-3 space-y-2">
                  {requests?.map((request) => (
                    <RequestItem
                      key={request.id}
                      request={request}
                      onApprove={() => approveRequest.mutate(request.id)}
                      onReject={() => rejectRequest.mutate(request.id)}
                      loading={approveRequest.isPending || rejectRequest.isPending}
                    />
                  ))}
                </TabsContent>
              )}
            </Tabs>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              {group.is_admin && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración del grupo
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setShowLeaveConfirm(true)}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Abandonar grupo
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Settings Dialog */}
      <GroupSettingsDialog
        group={group}
        open={showSettings}
        onOpenChange={setShowSettings}
      />

      {/* Leave Confirmation */}
      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Abandonar grupo?</DialogTitle>
            <DialogDescription>
              Ya no podrás ver los mensajes ni participar en "{group.name}".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleLeaveGroup} disabled={leaving}>
              {leaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Abandonar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MemberItem({
  member,
  isAdmin,
  currentUserId,
  onRemove,
  onPromote,
}: {
  member: GroupMember;
  isAdmin: boolean;
  currentUserId: string;
  onRemove: () => void;
  onPromote: () => void;
}) {
  const isCurrentUser = member.user_id === currentUserId;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50">
      <Avatar className="w-8 h-8">
        <AvatarImage src={member.profile?.avatar_url || undefined} />
        <AvatarFallback>{member.profile?.display_name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {member.profile?.display_name}
          {isCurrentUser && <span className="text-muted-foreground"> (tú)</span>}
        </p>
        {member.role === "admin" && (
          <Badge variant="secondary" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        )}
      </div>
      {isAdmin && !isCurrentUser && (
        <div className="flex gap-1">
          {member.role !== "admin" && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPromote} title="Hacer admin">
              <UserPlus className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onRemove} title="Expulsar">
            <UserMinus className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function RequestItem({
  request,
  onApprove,
  onReject,
  loading,
}: {
  request: AccessRequest;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  return (
    <div className="p-3 rounded-lg border space-y-2">
      <div className="flex items-center gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={request.profile?.avatar_url || undefined} />
          <AvatarFallback>{request.profile?.display_name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{request.profile?.display_name}</p>
        </div>
      </div>
      {request.message && (
        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">"{request.message}"</p>
      )}
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={onApprove} disabled={loading}>
          <Check className="w-4 h-4 mr-1" />
          Aprobar
        </Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={onReject} disabled={loading}>
          <XIcon className="w-4 h-4 mr-1" />
          Rechazar
        </Button>
      </div>
    </div>
  );
}

function GroupSettingsDialog({
  group,
  open,
  onOpenChange,
}: {
  group: Group;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [rules, setRules] = useState(group.rules || "");
  const [aiName, setAiName] = useState(group.ai_name || "Asistente");
  const [aiPrompt, setAiPrompt] = useState(group.ai_system_prompt || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("groups")
        .update({
          name,
          description: description || null,
          rules: rules || null,
          ai_name: aiName,
          ai_system_prompt: aiPrompt || null,
        })
        .eq("id", group.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["group", group.id] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Cambios guardados" });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron guardar los cambios", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración del grupo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nombre del grupo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Reglas</Label>
            <Textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={2} />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Nombre del asistente IA
            </Label>
            <Input value={aiName} onChange={(e) => setAiName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Instrucciones para la IA</Label>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              placeholder="Ej: En este grupo somos una comunidad de desarrolladores..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
