import { useState, useEffect } from "react";
import { SearchForm } from "@/components/SearchForm";
import { ResultCard } from "@/components/ResultCard";
import { HistoryList, HistoryItem } from "@/components/HistoryList";
import { Navigation } from "@/components/Navigation";
import { Network } from "lucide-react";
import { toast } from "sonner";
import { calcularIP, IPConfig } from "@/utils/ipCalculator";
import { getStoreData } from "@/data/storesData";

interface ResultData extends IPConfig {
  tipo: string;
  numeroPDV?: string;
}

const Index = () => {
  const [result, setResult] = useState<ResultData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleSearch = (lojaDigitada: string, tipo: string, numeroPDV?: string) => {
    try {
      // Formatar loja removendo zeros à esquerda
      const lojaFormatada = String(parseInt(lojaDigitada.replace(/^0+/, ""), 10));

      // Buscar loja na base de dados embutida
      const lojaEncontrada = getStoreData(lojaFormatada);

      if (!lojaEncontrada) {
        toast.error("Loja não encontrada.");
        setResult(null);
        return;
      }

      // Determinar IP base
      const ipBase = tipo === "PDV" ? lojaEncontrada.ipPDV : lojaEncontrada.ipDesktop;

      // Calcular configuração de IP
      const config = calcularIP(ipBase, tipo, numeroPDV);
      
      const resultData: ResultData = {
        ...config,
        nomeLoja: lojaEncontrada.nomeLoja,
        tipo,
        numeroPDV
      };

      setResult(resultData);

      // Salvar no histórico
      const newHistoryItem: HistoryItem = { ...resultData, timestamp: Date.now() };
      const newHistory = [newHistoryItem, ...history.slice(0, 9)];
      setHistory(newHistory);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
      
      toast.success("Configuração de IP gerada!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar IP");
      setResult(null);
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setResult(item);
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-primary px-4 py-8 pt-24">
        <div className="max-w-md mx-auto space-y-8">
        <header className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-3 bg-secondary rounded-2xl shadow-glow">
              <Network className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Gerador de IP
          </h1>
          <p className="text-muted-foreground">
            Configure IPs para PDVs, impressoras e desktops
          </p>
        </header>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <SearchForm onSearch={handleSearch} />
          </div>

          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <ResultCard
                nomeLoja={result.nomeLoja}
                tipo={result.tipo}
                numeroPDV={result.numeroPDV}
                ip={result.ip}
                mascara={result.mascara}
                gateway={result.gateway}
                broadcast={result.broadcast}
                dns1={result.dns1}
                dns2={result.dns2}
              />
            </div>
          )}

          {history.length > 0 && (
            <HistoryList history={history} onSelect={handleHistorySelect} />
          )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
