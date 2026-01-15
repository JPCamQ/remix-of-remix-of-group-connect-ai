import { useAuth } from "@/lib/auth";
import { AuthForm } from "@/components/auth/AuthForm";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChatView } from "@/components/chat/ChatView";
import { Loader2 } from "lucide-react";

const GroupChat = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <MainLayout>
      <ChatView />
    </MainLayout>
  );
};

export default GroupChat;
