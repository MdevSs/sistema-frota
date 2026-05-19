import { useState } from "react";
import MainLayout from "@/components/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function MotoristaPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    cnh: "",
    telefone: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hooks do TanStack Query integrados com o Axios (FastAPI)
  const { data: motoristas, isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const response = await api.get('/drivers/');
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (newDriver: any) => api.post('/drivers/', newDriver),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("Motorista cadastrado com sucesso");
      handleCloseDialog();
    },
    onError: () => toast.error("Erro ao cadastrar motorista")
  });

  const updateMutation = useMutation({
    mutationFn: (updatedDriver: any) => api.put(`/drivers/${editingId}`, updatedDriver),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("Motorista atualizado com sucesso");
      handleCloseDialog();
    },
    onError: () => toast.error("Erro ao atualizar motorista")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/drivers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success("Motorista removido com sucesso");
    },
    onError: () => toast.error("Erro ao remover motorista")
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!formData.cpf.trim()) newErrors.cpf = "CPF é obrigatório";
    if (!formData.cnh.trim()) newErrors.cnh = "CNH é obrigatória";
    if (!formData.telefone.trim()) newErrors.telefone = "Telefone é obrigatório";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      ...formData,
      email: formData.email || null
    };

    if (editingId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (motorista: any) => {
    setFormData({
      nome: motorista.nome,
      cpf: motorista.cpf,
      cnh: motorista.cnh,
      telefone: motorista.telefone || "",
      email: motorista.email || "",
    });
    setEditingId(motorista.id);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ nome: "", cpf: "", cnh: "", telefone: "", email: "" });
    setErrors({});
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Motoristas</h1>
            <p className="text-slate-600 mt-2">Gerenciar motoristas do sistema</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={20} />
                Novo Motorista
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Motorista" : "Cadastrar Motorista"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  {errors.nome && <p className="text-sm text-red-600">{errors.nome}</p>}
                </div>
                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input id="cpf" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
                  {errors.cpf && <p className="text-sm text-red-600">{errors.cpf}</p>}
                </div>
                <div>
                  <Label htmlFor="cnh">CNH *</Label>
                  <Input id="cnh" value={formData.cnh} onChange={e => setFormData({...formData, cnh: e.target.value})} />
                  {errors.cnh && <p className="text-sm text-red-600">{errors.cnh}</p>}
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input id="telefone" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
                  {errors.telefone && <p className="text-sm text-red-600">{errors.telefone}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left">Nome</th>
                <th className="px-6 py-3 text-left">CPF</th>
                <th className="px-6 py-3 text-left">CNH</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : motoristas && motoristas.length > 0 ? (
                motoristas.map((motorista: any) => (
                  <tr key={motorista.id} className="border-b hover:bg-slate-50">
                    <td className="px-6 py-4">{motorista.nome}</td>
                    <td className="px-6 py-4">{motorista.cpf}</td>
                    <td className="px-6 py-4">{motorista.cnh}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(motorista)}><Edit2 size={16} /></Button>
                        <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(motorista.id)}><Trash2 size={16} /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Nenhum motorista cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </MainLayout>
  );
}
