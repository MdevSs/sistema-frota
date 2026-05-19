import { trpc } from "@/lib/trpc";
import MainLayout from "@/components/MainLayout";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function EntregaPage() {
  const { data: rotas, isLoading } = trpc.routes.list.useQuery({ status: undefined });

  // Extrair entregas de todas as rotas
  const allDeliveries = rotas?.data?.flatMap((rota: any) => 
    (rota.deliveries || []).map((delivery: any) => ({
      ...delivery,
      rotaId: rota.id,
      dataRota: rota.dataRota,
    }))
  ) || [] as any[];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-100 text-yellow-700";
      case "em_rota":
        return "bg-blue-100 text-blue-700";
      case "entregue":
        return "bg-green-100 text-green-700";
      case "nao_entregue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Entregas</h1>
          <p className="text-slate-600 mt-2">Acompanhar status de todas as entregas</p>
        </div>

        {/* Entregas List */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Pedido</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Cliente</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Endereço</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Telefone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Data</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    </tr>
                  ))
                ) : (allDeliveries as any[]).length > 0 ? (
                  (allDeliveries as any[]).map((delivery: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        #{delivery.numeroPedido}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{delivery.nomeCliente}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {delivery.rua}, {delivery.numero} - {delivery.cidade}/{delivery.estado}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{delivery.telefonecliente || "-"}</td>
                      <td className="px-6 py-4 text-sm">
                        <Badge className={`${getStatusColor(delivery.status)}`}>
                          {delivery.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(delivery.dataRota).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Nenhuma entrega registrada
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
