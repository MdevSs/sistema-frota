import { useState } from "react";
import { trpc } from "@/lib/trpc";
import MainLayout from "@/components/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

export default function RotaPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [numeroPedido, setNumeroPedido] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [pedidosBuscados, setPedidosBuscados] = useState<any[]>([]);
  const [searchingPedido, setSearchingPedido] = useState(false);

  const { data: drivers } = trpc.drivers.list.useQuery();
  const { data: vehicles } = trpc.vehicles.list.useQuery();
  const { data: rotas, isLoading, refetch } = trpc.routes.list.useQuery({ status: undefined });
  const createRouteMutation = trpc.routes.create.useMutation();

  const handleSearchPedido = async () => {
    if (!numeroPedido) {
      toast.error("Digite o número do pedido");
      return;
    }

    setSearchingPedido(true);
    try {
      const result = await fetch(`/api/trpc/erp.getPedido?input=${JSON.stringify({ numeroPedido: parseInt(numeroPedido) })}`)
        .then(r => r.json());
      if (result?.data) {
        const pedido = result.data.pedido;
        const endereco = result.data.endereco;
        
        setPedidosBuscados([
          ...pedidosBuscados,
          {
            numeroPedido: pedido.numero,
            nomeCliente: pedido.cliente_nome || "Cliente",
            telefone: endereco?.telefone || "",
            rua: endereco?.rua || "",
            numero: endereco?.numero || "",
            bairro: endereco?.bairro || "",
            cidade: endereco?.cidade || "",
            estado: endereco?.estado || "",
            cep: endereco?.cep || "",
            sequencia: pedidosBuscados.length + 1,
          },
        ]);
        setNumeroPedido("");
        toast.success("Pedido adicionado à rota");
      }
    } catch (error: any) {
      toast.error(error?.message || "Pedido não encontrado");
    } finally {
      setSearchingPedido(false);
    }
  };

  const handleCreateRoute = async () => {
    if (!selectedDriver || !selectedVehicle || pedidosBuscados.length === 0) {
      toast.error("Selecione motorista, veículo e adicione pedidos");
      return;
    }

    try {
      await createRouteMutation.mutateAsync({
        motoristaId: parseInt(selectedDriver),
        veiculoId: parseInt(selectedVehicle),
        dataRota: new Date(),
        pedidos: pedidosBuscados,
      });
      toast.success("Rota criada com sucesso");
      setPedidosBuscados([]);
      setSelectedDriver("");
      setSelectedVehicle("");
      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar rota");
    }
  };

  const handleRemovePedido = (index: number) => {
    setPedidosBuscados(pedidosBuscados.filter((_, i) => i !== index));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Rotas</h1>
            <p className="text-slate-600 mt-2">Gerenciar rotas de entrega</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus size={20} />
            Nova Rota
          </Button>
        </div>

        {/* Create Route Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Rota</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Motorista e Veículo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Motorista *</Label>
                  <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um motorista" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers?.data?.map((driver: any) => (
                        <SelectItem key={driver.id} value={driver.id.toString()}>
                          {driver.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Veículo *</Label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles?.data?.map((vehicle: any) => (
                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                          {vehicle.placa} - {vehicle.modelo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Buscar Pedidos */}
              <div className="space-y-2">
                <Label>Adicionar Pedidos</Label>
                <div className="flex gap-2">
                  <Input
                    value={numeroPedido}
                    onChange={(e) => setNumeroPedido(e.target.value)}
                    placeholder="Número do pedido"
                    onKeyPress={(e) => e.key === "Enter" && handleSearchPedido()}
                  />
                  <Button
                    onClick={handleSearchPedido}
                    disabled={searchingPedido}
                    className="gap-2"
                  >
                    <Search size={16} />
                    Buscar
                  </Button>
                </div>
              </div>

              {/* Pedidos Adicionados */}
              {pedidosBuscados.length > 0 && (
                <div className="space-y-2">
                  <Label>Pedidos na Rota ({pedidosBuscados.length})</Label>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {pedidosBuscados.map((pedido, index) => (
                      <div key={index} className="flex items-start justify-between bg-slate-50 p-3 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">Pedido #{pedido.numeroPedido}</p>
                          <p className="text-xs text-slate-600">{pedido.nomeCliente}</p>
                          <p className="text-xs text-slate-500">
                            {pedido.rua}, {pedido.numero} - {pedido.cidade}/{pedido.estado}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemovePedido(index)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setPedidosBuscados([]);
                    setSelectedDriver("");
                    setSelectedVehicle("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateRoute}
                  disabled={createRouteMutation.isPending || !selectedDriver || !selectedVehicle || pedidosBuscados.length === 0 || searchingPedido}
                  className="gap-2"
                >
                  <Check size={16} />
                  Criar Rota
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rotas List */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Data</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Motorista</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Veículo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-8" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    </tr>
                  ))
                ) : rotas?.data && rotas.data.length > 0 ? (
                  rotas.data.map((rota: any) => (
                    <tr key={rota.id} className="border-b hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">#{rota.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(rota.dataRota).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">-</td>
                      <td className="px-6 py-4 text-sm text-slate-600">-</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          rota.status === "planejada"
                            ? "bg-blue-100 text-blue-700"
                            : rota.status === "em_rota"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {rota.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Nenhuma rota criada
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
