import { useState, useRef, useEffect } from "react";
import { Message } from "@/hooks/useMessages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X, Bot } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  replyTo: Message | null;
  onCancelReply: () => void;
  disabled?: boolean;
  aiName: string;
}

export function ChatInput({ onSend, replyTo, onCancelReply, disabled, aiName }: ChatInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyTo) {
      textareaRef.current?.focus();
    }
  }, [replyTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || disabled) return;

    const message = content.trim();
    setContent("");
    await onSend(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const insertAIMention = () => {
    const mention = `@${aiName} `;
    setContent((prev) => prev + mention);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t bg-card p-4">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-muted rounded-lg text-sm">
          <div className="flex-1 min-w-0">
            <span className="font-medium text-xs text-muted-foreground">
              Respondiendo a {replyTo.is_ai ? aiName : replyTo.author?.display_name}
            </span>
            <p className="truncate text-foreground">{replyTo.content}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancelReply}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="flex-shrink-0 h-10 w-10"
          onClick={insertAIMention}
          title={`Mencionar a ${aiName}`}
        >
          <Bot className="h-4 w-4" />
        </Button>
        
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            className="min-h-[44px] max-h-[120px] resize-none pr-12"
            rows={1}
            disabled={disabled}
          />
        </div>

        <Button
          type="submit"
          size="icon"
          className="flex-shrink-0 h-10 w-10"
          disabled={!content.trim() || disabled}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <p className="text-xs text-muted-foreground mt-2 text-center">
        Escribe <span className="font-mono bg-muted px-1 rounded">@{aiName}</span> para llamar al asistente
      </p>
    </div>
  );
}
