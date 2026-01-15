import { Message } from "@/hooks/useMessages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bot, MoreVertical, Reply, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  showAuthor: boolean;
  onReply: () => void;
  onDelete?: () => void;
  aiName: string;
}

export function ChatMessage({ message, isOwn, showAuthor, onReply, onDelete, aiName }: ChatMessageProps) {
  const authorName = message.is_ai ? aiName : message.author?.display_name || "Usuario";
  const authorInitial = authorName.charAt(0).toUpperCase();
  const time = format(new Date(message.created_at), "HH:mm", { locale: es });

  return (
    <div className={`flex gap-2 group animate-message-in ${isOwn ? "flex-row-reverse" : ""} ${showAuthor ? "mt-4" : "mt-0.5"}`}>
      {/* Avatar */}
      {showAuthor ? (
        <Avatar className={`w-8 h-8 flex-shrink-0 ${message.is_ai ? "ring-2 ring-chat-ai" : ""}`}>
          {message.is_ai ? (
            <AvatarFallback className="bg-chat-ai text-chat-ai-foreground">
              <Bot className="w-4 h-4" />
            </AvatarFallback>
          ) : (
            <>
              <AvatarImage src={message.author?.avatar_url || undefined} />
              <AvatarFallback className={isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}>
                {authorInitial}
              </AvatarFallback>
            </>
          )}
        </Avatar>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Content */}
      <div className={`flex flex-col max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
        {showAuthor && (
          <span className={`text-xs font-medium mb-1 ${message.is_ai ? "text-chat-ai" : "text-muted-foreground"}`}>
            {authorName}
          </span>
        )}

        {/* Reply reference */}
        {message.reply_to && (
          <div className={`text-xs px-3 py-1.5 mb-1 rounded-lg bg-muted/50 border-l-2 ${isOwn ? "border-primary" : "border-muted-foreground"}`}>
            <span className="font-medium">{message.reply_to.author_name}</span>
            <p className="truncate opacity-75">{message.reply_to.content}</p>
          </div>
        )}

        <div className="flex items-end gap-1">
          <div className={message.is_ai ? "chat-bubble-ai" : isOwn ? "chat-bubble-own" : "chat-bubble-other"}>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOwn ? "end" : "start"}>
              <DropdownMenuItem onClick={onReply}>
                <Reply className="w-4 h-4 mr-2" />
                Responder
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <span className="text-[10px] text-muted-foreground mt-0.5 px-1">{time}</span>
      </div>
    </div>
  );
}
