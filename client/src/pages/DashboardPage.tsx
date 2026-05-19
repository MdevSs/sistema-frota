import { trpc } from "@/lib/trpc";
import MainLayout from "@/components/MainLayout";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Truck, MapPin, Package, CheckCircle2, Clock } from "lucide-react";

export default function DashboardPage() {
  const { data, isLoading, error } = trpc.dashboard.getSummary.useQuery();

  if (error) {
    return (
      <MainLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Erro ao carregar dashboard: {error.message}
        </div>
      </MainLayout>
    );
  }

  const stats = [
    {
      icon: Users,
      label: "Motoristas",
      value: data?.data?.motoristas || 0,
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Truck,
      label: "Veículos",
      value: data?.data?.veiculos || 0,
      color: "bg-green-100 text-green-600",
    },
    {
      icon: MapPin,
      label: "Rotas",
      value: data?.data?.rotas || 0,
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: Package,
      label: "Entregas",
      value: data?.data?.entregas || 0,
      color: "bg-orange-100 text-orange-600",
    },
    {
      icon: Clock,
      label: "Pendentes",
      value: data?.data?.entregasPendentes || 0,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      icon: CheckCircle2,
      label: "Concluídas",
      value: data?.data?.entregasConcluidas || 0,
      color: "bg-emerald-100 text-emerald-600",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-2">Visão geral do sistema de logística</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 mt-2" />
                    ) : (
                      <p className="text-3xl font-bold text-slate-900 mt-2">
                        {stat.value}
                      </p>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Atividades Recentes</h2>
          <div className="text-center py-8 text-slate-500">
            <p>Nenhuma atividade registrada ainda</p>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
