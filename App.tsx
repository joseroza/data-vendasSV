import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Clientes from "@/pages/Clientes";
import PerfumesVendas from "@/pages/perfumes/PerfumesVendas";
import NovaPerfumeVenda from "@/pages/perfumes/NovaPerfumeVenda";
import PerfumesCatalogo from "@/pages/perfumes/PerfumesCatalogo";
import EletronicosVendas from "@/pages/eletronicos/EletronicosVendas";
import NovaEletronicoVenda from "@/pages/eletronicos/NovaEletronicoVenda";
import EletronicosCatalogo from "@/pages/eletronicos/EletronicosCatalogo";
import Cobrancas from "@/pages/Cobrancas";
import Configuracoes from "@/pages/Configuracoes";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/perfumes/vendas" element={<PerfumesVendas />} />
            <Route path="/perfumes/nova-venda" element={<NovaPerfumeVenda />} />
            <Route path="/perfumes/catalogo" element={<PerfumesCatalogo />} />
            <Route path="/eletronicos/vendas" element={<EletronicosVendas />} />
            <Route path="/eletronicos/nova-venda" element={<NovaEletronicoVenda />} />
            <Route path="/eletronicos/catalogo" element={<EletronicosCatalogo />} />
            <Route path="/cobrancas" element={<Cobrancas />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
