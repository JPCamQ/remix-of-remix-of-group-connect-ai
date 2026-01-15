import { useState } from "react";
import { useGroups } from "@/hooks/useGroups";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Globe, Lock, Loader2 } from "lucide-react";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const { createGroup } = useGroups();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accessType, setAccessType] = useState<"open" | "approval_required">("approval_required");
  const [rules, setRules] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createGroup.mutateAsync({
      name,
      description: description || undefined,
      access_type: accessType,
      rules: rules || undefined,
    });

    // Reset form
    setName("");
    setDescription("");
    setAccessType("approval_required");
    setRules("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear nuevo grupo</DialogTitle>
            <DialogDescription>
              Crea un espacio para que tu comunidad pueda comunicarse.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del grupo *</Label>
              <Input
                id="name"
                placeholder="Ej: Desarrolladores React"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="¿De qué trata este grupo?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <Label>Tipo de acceso</Label>
              <RadioGroup value={accessType} onValueChange={(v) => setAccessType(v as typeof accessType)}>
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="open" id="open" className="mt-0.5" />
                  <div className="flex-1">
                    <label htmlFor="open" className="flex items-center gap-2 font-medium cursor-pointer">
                      <Globe className="w-4 h-4 text-primary" />
                      Grupo abierto
                    </label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Cualquiera puede unirse sin aprobación.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="approval_required" id="closed" className="mt-0.5" />
                  <div className="flex-1">
                    <label htmlFor="closed" className="flex items-center gap-2 font-medium cursor-pointer">
                      <Lock className="w-4 h-4 text-primary" />
                      Requiere aprobación
                    </label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Los usuarios deben solicitar acceso y un admin aprueba.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules">Reglas del grupo (opcional)</Label>
              <Textarea
                id="rules"
                placeholder="Escribe las reglas o normas del grupo..."
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || createGroup.isPending}>
              {createGroup.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear grupo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
