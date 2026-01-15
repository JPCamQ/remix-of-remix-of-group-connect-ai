import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export interface Message {
  id: string;
  group_id: string;
  user_id: string | null;
  content: string;
  is_ai: boolean;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    display_name: string;
    avatar_url: string | null;
  };
  reply_to?: {
    content: string;
    author_name: string;
  };
}

export function useMessages(groupId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", groupId],
    queryFn: async () => {
      if (!groupId) return [];

      // Get messages
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get all unique user IDs
      const userIds = [...new Set((messagesData || []).map(m => m.user_id).filter(Boolean))] as string[];
      
      // Get profiles for these users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Get reply-to messages
      const replyIds = [...new Set((messagesData || []).map(m => m.reply_to_id).filter(Boolean))] as string[];
      const { data: replyMessages } = await supabase
        .from("messages")
        .select("id, content, user_id")
        .in("id", replyIds.length > 0 ? replyIds : ['00000000-0000-0000-0000-000000000000']);

      const replyMap = new Map(replyMessages?.map(m => [m.id, m]) || []);

      return (messagesData || []).map((msg) => {
        const profile = msg.user_id ? profileMap.get(msg.user_id) : null;
        const replyMsg = msg.reply_to_id ? replyMap.get(msg.reply_to_id) : null;
        const replyProfile = replyMsg?.user_id ? profileMap.get(replyMsg.user_id) : null;

        return {
          ...msg,
          author: profile ? {
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          } : msg.is_ai ? { display_name: "IA", avatar_url: null } : undefined,
          reply_to: replyMsg ? {
            content: replyMsg.content,
            author_name: replyProfile?.display_name || "Usuario",
          } : undefined,
        };
      }) as Message[];
    },
    enabled: !!groupId && !!user,
  });

  useEffect(() => {
    if (!groupId || !user) return;

    const channel = supabase
      .channel(`messages-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
        () => { queryClient.invalidateQueries({ queryKey: ["messages", groupId] }); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId, user, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async ({ content, replyToId }: { content: string; replyToId?: string }) => {
      if (!groupId || !user) throw new Error("No group or user");
      const { data, error } = await supabase
        .from("messages")
        .insert({ group_id: groupId, user_id: user.id, content, reply_to_id: replyToId || null, is_ai: false })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["messages", groupId] }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const sendAIMessage = useMutation({
    mutationFn: async ({ content, triggerMessage }: { content: string; triggerMessage: string }) => {
      if (!groupId || !user) throw new Error("No group or user");
      const recentMessages = (messages || []).slice(-10).map((msg) => ({
        author: msg.author?.display_name || "Usuario",
        content: msg.content,
        is_ai: msg.is_ai,
      }));

      const response = await supabase.functions.invoke("chat-ai", {
        body: { groupId, userMessage: triggerMessage, recentMessages },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      const aiResponse = response.data?.response;
      if (!aiResponse) throw new Error("No response from AI");

      const { data, error } = await supabase
        .from("messages")
        .insert({ group_id: groupId, user_id: user.id, content: aiResponse, is_ai: true })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["messages", groupId] }); },
    onError: (error: Error) => { toast({ title: "Error de IA", description: error.message, variant: "destructive" }); },
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase.from("messages").delete().eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["messages", groupId] }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  return { messages, isLoading, sendMessage, sendAIMessage, deleteMessage };
}
