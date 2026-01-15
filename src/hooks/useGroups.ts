import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  access_type: "open" | "approval_required";
  rules: string | null;
  ai_name: string | null;
  ai_system_prompt: string | null;
  ai_only_when_tagged: boolean;
  created_by: string | null;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
  is_admin?: boolean;
  request_status?: "pending" | "approved" | "rejected" | null;
}

export function useGroups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: groups, isLoading, error } = useQuery({
    queryKey: ["groups", user?.id],
    queryFn: async () => {
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false });

      if (groupsError) throw groupsError;

      // Get membership info for current user
      const groupsWithInfo = await Promise.all(
        (groupsData || []).map(async (group) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id);

          let isMember = false;
          let isAdmin = false;
          let requestStatus = null;

          if (user) {
            // Check membership
            const { data: memberData } = await supabase
              .from("group_members")
              .select("role")
              .eq("group_id", group.id)
              .eq("user_id", user.id)
              .maybeSingle();

            if (memberData) {
              isMember = true;
              isAdmin = memberData.role === "admin";
            } else {
              // Check for pending request
              const { data: requestData } = await supabase
                .from("access_requests")
                .select("status")
                .eq("group_id", group.id)
                .eq("user_id", user.id)
                .maybeSingle();

              if (requestData) {
                requestStatus = requestData.status;
              }
            }
          }

          return {
            ...group,
            member_count: memberCount || 0,
            is_member: isMember,
            is_admin: isAdmin,
            request_status: requestStatus,
          };
        })
      );

      return groupsWithInfo as Group[];
    },
    enabled: !!user,
  });

  const createGroup = useMutation({
    mutationFn: async (data: { name: string; description?: string; access_type: "open" | "approval_required"; rules?: string }) => {
      const { data: group, error } = await supabase
        .from("groups")
        .insert({
          name: data.name,
          description: data.description || null,
          access_type: data.access_type,
          rules: data.rules || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Grupo creado", description: "Tu nuevo grupo está listo." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const joinGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: groupId, user_id: user?.id, role: "member" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "¡Bienvenido!", description: "Te has unido al grupo." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const requestAccess = useMutation({
    mutationFn: async ({ groupId, message }: { groupId: string; message?: string }) => {
      const { error } = await supabase
        .from("access_requests")
        .insert({ group_id: groupId, user_id: user?.id, message });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Solicitud enviada", description: "Un administrador revisará tu solicitud." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    groups,
    isLoading,
    error,
    createGroup,
    joinGroup,
    requestAccess,
  };
}

export function useGroup(groupId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["group", groupId, user?.id],
    queryFn: async () => {
      if (!groupId) return null;

      const { data: group, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (error) throw error;

      // Check membership
      let isMember = false;
      let isAdmin = false;

      if (user) {
        const { data: memberData } = await supabase
          .from("group_members")
          .select("role")
          .eq("group_id", groupId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (memberData) {
          isMember = true;
          isAdmin = memberData.role === "admin";
        }
      }

      return {
        ...group,
        is_member: isMember,
        is_admin: isAdmin,
      } as Group;
    },
    enabled: !!groupId && !!user,
  });
}
