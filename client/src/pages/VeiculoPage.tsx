import { useState } from "react";
import MainLayout from "@/components/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function VeiculoPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    placa: "",
    modelo: "Hyundai HR",
    tipo: "VUC",
    capacidadeKg: "",
    capacidadeM3: "",
  });

  const { data: veiculos, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const response = await api.get('/vehicles/');
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (newVehicle: any) => api.post('/vehicles/', newVehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success("Veículo cadastrado com sucesso");
      handleCloseDialog();
    },
    onError: () => toast.error("Erro ao cadastrar veículo")
  });

  const updateMutation = useMutation({
    mutationFn: (updatedVehicle: any) => api.put(`/vehicles/${editingId}`, updatedVehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success("Veículo atualizado com sucesso");
      handleCloseDialog();
    },
    onError: () => toast.error("Erro ao atualizar veículo")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success("Veículo removido com sucesso");
    },
    onError: () => toast.error("Erro ao remover veículo")
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      capacidadeKg: parseFloat(formData.capacidadeKg),
      capacidadeM3: parseFloat(formData.capacidadeM3),
    };

    if (editingId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (veiculo: any) => {
    setFormData({
      placa: veiculo.placa,
      modelo: veiculo.modelo,
      tipo: veiculo.tipo,
      capacidadeKg: veiculo.capacidadeKg.toString(),
      capacidadeM3: veiculo.capacidadeM3.toString(),
    });
    setEditingId(veiculo.id);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ placa: "", modelo: "Hyundai HR", tipo: "VUC", capacidadeKg: "", capacidadeM3: "" });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Veículos</h1>
            <p className="text-slate-600 mt-2">Gerenciar frota de veículos</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={20} />
                Novo Veículo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Veículo" : "Cadastrar Veículo"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="placa">Placa *</Label>
                  <Input id="placa" value={formData.placa} onChange={e => setFormData({...formData, placa: e.target.value.toUpperCase()})} required />
                </div>
                <div>
                  <Label htmlFor="modelo">Modelo *</Label>
                  <Select value={formData.modelo} onValueChange={value => setFormData({...formData, modelo: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Hyundai HR", "Iveco Daily", "Fiat Ducato", "Mercedes Sprinter", "Renault Master", "Kia Bongo"].map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={value => setFormData({...formData, tipo: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["VUC", "VAN", "CAMINHAO"].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="capacidadeKg">Capacidade (kg) *</Label>
                  <Input id="capacidadeKg" type="number" value={formData.capacidadeKg} onChange={e => setFormData({...formData, capacidadeKg: e.target.value})} required />
                </div>
                <div>
                  <Label htmlFor="capacidadeM3">Capacidade (m³) *</Label>
                  <Input id="capacidadeM3" type="number" step="0.1" value={formData.capacidadeM3} onChange={e => setFormData({...formData, capacidadeM3: e.target.value})} required />
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
                <th className="px-6 py-3 text-left">Placa</th>
                <th className="px-6 py-3 text-left">Modelo</th>
                <th className="px-6 py-3 text-left">Capacidade</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : veiculos && veiculos.length > 0 ? (
                veiculos.map((veiculo: any) => (
                  <tr key={veiculo.id} className="border-b hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold">{veiculo.placa}</td>
                    <td className="px-6 py-4">{veiculo.modelo}</td>
                    <td className="px-6 py-4">{veiculo.capacidadeKg}kg / {veiculo.capacidadeM3}m³</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(veiculo)}><Edit2 size={16} /></Button>
                        <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(veiculo.id)}><Trash2 size={16} /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Nenhum veículo cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </MainLayout>
  );
}
