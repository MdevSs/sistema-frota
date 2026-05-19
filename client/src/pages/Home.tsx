import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Truck } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // MVP Mode: Redirecionar direto para dashboard
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Truck className="text-blue-600" size={32} />
          <h1 className="text-3xl font-bold text-slate-900">Logistica</h1>
        </div>
        
        <p className="text-center text-slate-600 mb-8">
          Sistema de Logistica e Roteirizacao para Veiculos Urbanos de Carga
        </p>
        
        <Button
          onClick={() => setLocation('/dashboard')}
          className="w-full py-6 text-lg font-semibold"
        >
          Entrar no Sistema
        </Button>
        
        <div className="mt-8 pt-8 border-t border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Funcionalidades:</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>✓ Gerenciamento de motoristas</li>
            <li>✓ Controle de frota</li>
            <li>✓ Planejamento de rotas</li>
            <li>✓ Rastreamento de entregas</li>
            <li>✓ Relatorios e analises</li>
          </ul>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500">
          <p>MVP Mode: Acesso sem autenticação para testes</p>
        </div>
      </Card>
    </div>
  );
}
