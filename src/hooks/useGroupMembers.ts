import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "member" | "admin";
  joined_at: string;
  profile?: { display_name: string; avatar_url: string | null };
}

export interface AccessRequest {
  id: string;
  group_id: string;
  user_id: string;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profile?: { display_name: string; avatar_url: string | null };
}

export function useGroupMembers(groupId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const { data: membersData, error } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true });
      if (error) throw error;

      const userIds = (membersData || []).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (membersData || []).map((member) => ({
        ...member,
        profile: profileMap.get(member.user_id) || undefined,
      })) as GroupMember[];
    },
    enabled: !!groupId && !!user,
  });

  useEffect(() => {
    if (!groupId || !user) return;
    const channel = supabase
      .channel(`members-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members", filter: `group_id=eq.${groupId}` },
        () => { queryClient.invalidateQueries({ queryKey: ["group-members", groupId] }); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, user, queryClient]);

  return { members, isLoading };
}

export function useAccessRequests(groupId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["access-requests", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const { data: requestsData, error } = await supabase
        .from("access_requests")
        .select("*")
        .eq("group_id", groupId)
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;

      const userIds = (requestsData || []).map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (requestsData || []).map((request) => ({
        ...request,
        profile: profileMap.get(request.user_id) || undefined,
      })) as AccessRequest[];
    },
    enabled: !!groupId && !!user,
  });

  useEffect(() => {
    if (!groupId || !user) return;
    const channel = supabase
      .channel(`requests-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "access_requests", filter: `group_id=eq.${groupId}` },
        () => { queryClient.invalidateQueries({ queryKey: ["access-requests", groupId] }); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, user, queryClient]);

  const approveRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const request = requests?.find((r) => r.id === requestId);
      if (!request) throw new Error("Request not found");
      const { error: updateError } = await supabase
        .from("access_requests")
        .update({ status: "approved", reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq("id", requestId);
      if (updateError) throw updateError;
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({ group_id: request.group_id, user_id: request.user_id, role: "member" });
      if (memberError) throw memberError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-requests", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      toast({ title: "Solicitud aprobada" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const rejectRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("access_requests")
        .update({ status: "rejected", reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-requests", groupId] });
      toast({ title: "Solicitud rechazada" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("group_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["group-members", groupId] }); toast({ title: "Miembro eliminado" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const promoteToAdmin = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("group_members").update({ role: "admin" }).eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["group-members", groupId] }); toast({ title: "Miembro promovido" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  return { requests, isLoading, approveRequest, rejectRequest, removeMember, promoteToAdmin };
}
