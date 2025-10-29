import { Card } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ResultCardProps {
  nomeLoja: string;
  tipo: string;
  numeroPDV?: string;
  ip: string;
  mascara: string;
  gateway: string;
  broadcast: string;
  dns1: string;
  dns2: string;
}

export const ResultCard = ({ 
  nomeLoja, 
  tipo, 
  numeroPDV,
  ip, 
  mascara, 
  gateway, 
  broadcast, 
  dns1, 
  dns2 
}: ResultCardProps) => {
  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copiado!`);
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-foreground font-medium">{value}</span>
        <Button
          onClick={() => handleCopy(value, label)}
          size="icon"
          variant="ghost"
          className="h-8 w-8 hover:bg-secondary"
        >
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="p-6 bg-gradient-card border-border">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Loja</p>
          <p className="text-xl font-bold text-foreground">{nomeLoja}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-primary/20 rounded-md">
            <span className="text-sm font-medium text-primary">{tipo}</span>
          </div>
          {numeroPDV && (
            <div className="px-3 py-1 bg-secondary rounded-md">
              <span className="text-sm font-medium text-foreground">PDV {numeroPDV}</span>
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-1">
          <InfoRow label="IP" value={ip} />
          <InfoRow label="Máscara" value={mascara} />
          <InfoRow label="Gateway" value={gateway} />
          {broadcast !== "N/A" && <InfoRow label="Broadcast" value={broadcast} />}
          <InfoRow label="DNS Primário" value={dns1} />
          <InfoRow label="DNS Secundário" value={dns2} />
        </div>
      </div>
    </Card>
  );
};
