import { useAuth } from "@/lib/auth";
import { AuthForm } from "@/components/auth/AuthForm";
import { MainLayout } from "@/components/layout/MainLayout";
import { GroupList } from "@/components/groups/GroupList";
import { Loader2 } from "lucide-react";

const Index = () => {
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
      <GroupList />
    </MainLayout>
  );
};

export default Index;
