import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGroup } from "@/hooks/useGroups";
import { useMessages, Message } from "@/hooks/useMessages";
import { useAuth } from "@/lib/auth";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "./ChatHeader";
import { GroupInfoPanel } from "./GroupInfoPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield } from "lucide-react";

export function ChatView() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: group, isLoading: groupLoading } = useGroup(groupId);
  const { messages, isLoading: messagesLoading, sendMessage, sendAIMessage, deleteMessage } = useMessages(groupId);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check access
  useEffect(() => {
    if (!groupLoading && group && !group.is_member) {
      navigate("/");
    }
  }, [group, groupLoading, navigate]);

  const handleSendMessage = async (content: string) => {
    await sendMessage.mutateAsync({ content, replyToId: replyTo?.id });
    setReplyTo(null);

    // Check if AI should respond
    const aiMentionPattern = /@(ia|asistente|ai)/i;
    if (aiMentionPattern.test(content)) {
      setAiLoading(true);
      try {
        await sendAIMessage.mutateAsync({ content: content, triggerMessage: content });
      } finally {
        setAiLoading(false);
      }
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage.mutate(messageId);
  };

  if (groupLoading || messagesLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b bg-card flex items-center px-4">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
              <Skeleton className="h-16 w-64" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Acceso denegado</h2>
          <p className="text-muted-foreground mt-2">No eres miembro de este grupo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader group={group} onInfoClick={() => setShowInfo(!showInfo)} showingInfo={showInfo} />
        
        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-1 bg-gradient-hero">
          {messages?.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p className="text-lg">¡Bienvenido al grupo!</p>
                <p className="text-sm mt-1">Envía el primer mensaje para iniciar la conversación.</p>
                <p className="text-sm mt-4 bg-accent/50 p-3 rounded-lg inline-block">
                  💡 Escribe <span className="font-mono bg-background px-1 rounded">@IA</span> para llamar al asistente
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages?.map((message, index) => {
                const prevMessage = messages[index - 1];
                const showAuthor = !prevMessage || 
                  prevMessage.user_id !== message.user_id ||
                  prevMessage.is_ai !== message.is_ai;
                
                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isOwn={message.user_id === user?.id && !message.is_ai}
                    showAuthor={showAuthor}
                    onReply={() => setReplyTo(message)}
                    onDelete={
                      (message.user_id === user?.id || group.is_admin) && !message.is_ai
                        ? () => handleDeleteMessage(message.id)
                        : undefined
                    }
                    aiName={group.ai_name || "Asistente"}
                  />
                );
              })}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="chat-bubble-ai flex items-center gap-2">
                    <span className="text-sm">{group.ai_name || "Asistente"} está escribiendo</span>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-current rounded-full typing-dot" />
                      <span className="w-2 h-2 bg-current rounded-full typing-dot" />
                      <span className="w-2 h-2 bg-current rounded-full typing-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSendMessage}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          disabled={sendMessage.isPending || aiLoading}
          aiName={group.ai_name || "Asistente"}
        />
      </div>

      {/* Info Panel */}
      {showInfo && (
        <GroupInfoPanel group={group} onClose={() => setShowInfo(false)} />
      )}
    </div>
  );
}
