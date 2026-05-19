import { useState } from "react";
import { trpc } from "@/lib/trpc";
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

export default function VeiculoPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    placa: "",
    modelo: "Hyundai HR",
    tipo: "VUC",
    capacidadeKg: "",
    capacidadeM3: "",
  });

  const { data: veiculos, isLoading, refetch } = trpc.vehicles.list.useQuery();
  const createMutation = trpc.vehicles.create.useMutation();
  const updateMutation = trpc.vehicles.update.useMutation();
  const deactivateMutation = trpc.vehicles.deactivate.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        capacidadeKg: parseFloat(formData.capacidadeKg),
        capacidadeM3: parseFloat(formData.capacidadeM3),
      };

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: payload as any,
        });
        toast.success("Veículo atualizado com sucesso");
      } else {
        await createMutation.mutateAsync(payload as any);
        toast.success("Veículo cadastrado com sucesso");
      }

      setFormData({ placa: "", modelo: "Hyundai HR", tipo: "VUC", capacidadeKg: "", capacidadeM3: "" });
      setEditingId(null);
      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar veículo");
    }
  };

  const handleEdit = (veiculo: any) => {
    setFormData({
      placa: veiculo.placa,
      modelo: veiculo.modelo,
      tipo: veiculo.tipo,
      capacidadeKg: veiculo.capacidadeKg,
      capacidadeM3: veiculo.capacidadeM3,
    });
    setEditingId(veiculo.id);
    setIsDialogOpen(true);
  };

  const handleDeactivate = async (id: number) => {
    try {
      await deactivateMutation.mutateAsync({ id });
      toast.success("Veículo inativado");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao inativar veículo");
    }
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
                <DialogTitle>
                  {editingId ? "Editar Veículo" : "Cadastrar Veículo"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="placa">Placa *</Label>
                  <Input
                    id="placa"
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                    placeholder="ABC1234"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="modelo">Modelo *</Label>
                  <Select value={formData.modelo} onValueChange={(value) => setFormData({ ...formData, modelo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hyundai HR">Hyundai HR</SelectItem>
                      <SelectItem value="Iveco Daily">Iveco Daily</SelectItem>
                      <SelectItem value="Fiat Ducato">Fiat Ducato</SelectItem>
                      <SelectItem value="Mercedes Sprinter">Mercedes Sprinter</SelectItem>
                      <SelectItem value="Renault Master">Renault Master</SelectItem>
                      <SelectItem value="Kia Bongo">Kia Bongo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VUC">VUC</SelectItem>
                      <SelectItem value="VAN">VAN</SelectItem>
                      <SelectItem value="CAMINHAO">CAMINHÃO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="capacidadeKg">Capacidade (kg) *</Label>
                  <Input
                    id="capacidadeKg"
                    type="number"
                    value={formData.capacidadeKg}
                    onChange={(e) => setFormData({ ...formData, capacidadeKg: e.target.value })}
                    placeholder="1500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="capacidadeM3">Capacidade (m³) *</Label>
                  <Input
                    id="capacidadeM3"
                    type="number"
                    step="0.1"
                    value={formData.capacidadeM3}
                    onChange={(e) => setFormData({ ...formData, capacidadeM3: e.target.value })}
                    placeholder="8.5"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Veículos List */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Placa</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Modelo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Tipo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Capacidade</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    </tr>
                  ))
                ) : veiculos?.data && veiculos.data.length > 0 ? (
                  veiculos.data.map((veiculo: any) => (
                    <tr key={veiculo.id} className="border-b hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{veiculo.placa}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{veiculo.modelo}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{veiculo.tipo}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {veiculo.capacidadeKg}kg / {veiculo.capacidadeM3}m³
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          veiculo.ativo
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {veiculo.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(veiculo)}
                          >
                            <Edit2 size={16} />
                          </Button>
                          {veiculo.ativo && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeactivate(veiculo.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Nenhum veículo cadastrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
