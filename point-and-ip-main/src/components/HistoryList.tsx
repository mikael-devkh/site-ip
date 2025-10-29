import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { IPConfig } from "@/utils/ipCalculator";

export interface HistoryItem extends IPConfig {
  tipo: string;
  numeroPDV?: string;
  timestamp: number;
}

interface HistoryListProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

export const HistoryList = ({ history, onSelect }: HistoryListProps) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Nenhuma consulta recente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Consultas Recentes
      </h3>
      {history.map((item, index) => (
        <Card
          key={index}
          onClick={() => onSelect(item)}
          className="p-4 bg-secondary border-border cursor-pointer hover:bg-secondary/80 transition-colors"
        >
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                {item.nomeLoja} - {item.tipo} {item.numeroPDV ? `#${item.numeroPDV}` : ""}
              </p>
              <p className="text-sm text-primary">{item.ip}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(item.timestamp).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};
