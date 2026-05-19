import { useState } from "react";
import { trpc } from "@/lib/trpc";
import MainLayout from "@/components/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function MotoristaPage() {
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

  const { data: motoristas, isLoading, refetch } = trpc.drivers.list.useQuery();
  const createMutation = trpc.drivers.create.useMutation();
  const updateMutation = trpc.drivers.update.useMutation();
  const deactivateMutation = trpc.drivers.deactivate.useMutation();

  // Validar formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    } else if (formData.nome.length < 3) {
      newErrors.nome = "Nome deve ter pelo menos 3 caracteres";
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (formData.cpf.length !== 11) {
      newErrors.cpf = "CPF deve ter 11 dígitos";
    }

    if (!formData.cnh.trim()) {
      newErrors.cnh = "CNH é obrigatória";
    } else if (formData.cnh.length < 11 || formData.cnh.length > 20) {
      newErrors.cnh = "CNH deve ter entre 11 e 20 dígitos";
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = "Telefone é obrigatório";
    } else if (formData.telefone.length < 10 || formData.telefone.length > 11) {
      newErrors.telefone = "Telefone deve ter 10 ou 11 dígitos";
    }

    if (formData.email && !formData.email.includes("@")) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Formatar CPF (apenas números)
  const handleCpfChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    setFormData({ ...formData, cpf: digits });
    if (errors.cpf) setErrors({ ...errors, cpf: "" });
  };

  // Formatar CNH (apenas números)
  const handleCnhChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 20);
    setFormData({ ...formData, cnh: digits });
    if (errors.cnh) setErrors({ ...errors, cnh: "" });
  };

  // Formatar Telefone (apenas números)
  const handleTelefoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    setFormData({ ...formData, telefone: digits });
    if (errors.telefone) setErrors({ ...errors, telefone: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Verifique os campos obrigatórios");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          nome: formData.nome,
          cpf: formData.cpf,
          cnh: formData.cnh,
          telefone: formData.telefone,
          email: formData.email || null,
        });
        toast.success("Motorista atualizado com sucesso");
      } else {
        await createMutation.mutateAsync({
          nome: formData.nome,
          cpf: formData.cpf,
          cnh: formData.cnh,
          telefone: formData.telefone,
          email: formData.email || null,
        });
        toast.success("Motorista cadastrado com sucesso");
      }

      setFormData({ nome: "", cpf: "", cnh: "", telefone: "", email: "" });
      setEditingId(null);
      setIsDialogOpen(false);
      setErrors({});
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar motorista");
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
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm("Tem certeza que deseja inativar este motorista?")) return;

    try {
      await deactivateMutation.mutateAsync({ id });
      toast.success("Motorista inativado com sucesso");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao inativar motorista");
    }
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
                {/* Nome */}
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => {
                      setFormData({ ...formData, nome: e.target.value });
                      if (errors.nome) setErrors({ ...errors, nome: "" });
                    }}
                    placeholder="João Silva"
                    className={errors.nome ? "border-red-500" : ""}
                  />
                  {errors.nome && (
                    <p className="text-sm text-red-600 mt-1">{errors.nome}</p>
                  )}
                </div>

                {/* CPF */}
                <div>
                  <Label htmlFor="cpf">CPF (apenas números) *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    placeholder="12345678901"
                    maxLength={11}
                    className={errors.cpf ? "border-red-500" : ""}
                  />
                  {errors.cpf && (
                    <p className="text-sm text-red-600 mt-1">{errors.cpf}</p>
                  )}
                </div>

                {/* CNH */}
                <div>
                  <Label htmlFor="cnh">CNH (apenas números) *</Label>
                  <Input
                    id="cnh"
                    value={formData.cnh}
                    onChange={(e) => handleCnhChange(e.target.value)}
                    placeholder="12345678901234"
                    maxLength={20}
                    className={errors.cnh ? "border-red-500" : ""}
                  />
                  {errors.cnh && (
                    <p className="text-sm text-red-600 mt-1">{errors.cnh}</p>
                  )}
                </div>

                {/* Telefone */}
                <div>
                  <Label htmlFor="telefone">Telefone (apenas números) *</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleTelefoneChange(e.target.value)}
                    placeholder="11999999999"
                    maxLength={11}
                    className={errors.telefone ? "border-red-500" : ""}
                  />
                  {errors.telefone && (
                    <p className="text-sm text-red-600 mt-1">{errors.telefone}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                    placeholder="joao@example.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-4">
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

        {/* Motoristas List */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Nome</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">CPF</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">CNH</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Telefone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    </tr>
                  ))
                ) : motoristas?.data && motoristas.data.length > 0 ? (
                  motoristas.data.map((motorista: any) => (
                    <tr key={motorista.id} className="border-b hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">{motorista.nome}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{motorista.cpf}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{motorista.cnh}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{motorista.telefone || "-"}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          motorista.ativo
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {motorista.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(motorista)}
                          >
                            <Edit2 size={16} />
                          </Button>
                          {motorista.ativo && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeactivate(motorista.id)}
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
                      Nenhum motorista cadastrado
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
