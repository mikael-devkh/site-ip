import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface SearchFormProps {
  onSearch: (store: string, tipo: string, numeroPDV?: string) => void;
}

export const SearchForm = ({ onSearch }: SearchFormProps) => {
  const [store, setStore] = useState("");
  const [tipo, setTipo] = useState<string>("PDV");
  const [numeroPDV, setNumeroPDV] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (store.trim() && tipo) {
      if (tipo === "PDV" && !numeroPDV.trim()) {
        return;
      }
      onSearch(store.trim(), tipo, numeroPDV.trim() || undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="store" className="text-foreground">
          Loja
        </Label>
        <Input
          id="store"
          type="text"
          placeholder="Ex: 001 ou Loja Centro"
          value={store}
          onChange={(e) => setStore(e.target.value)}
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipo" className="text-foreground">
          Tipo de Dispositivo
        </Label>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="bg-secondary border-border text-foreground">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PDV">PDV</SelectItem>
            <SelectItem value="Impressora Zebra 1">Impressora Zebra 1</SelectItem>
            <SelectItem value="Impressora Zebra 2">Impressora Zebra 2</SelectItem>
            <SelectItem value="Impressora Laser">Impressora Laser</SelectItem>
            <SelectItem value="Desktop">Desktop</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tipo === "PDV" && (
        <div className="space-y-2">
          <Label htmlFor="pdv" className="text-foreground">
            Número do PDV
          </Label>
          <Input
            id="pdv"
            type="number"
            placeholder="Ex: 300"
            value={numeroPDV}
            onChange={(e) => setNumeroPDV(e.target.value)}
            min="300"
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all hover:shadow-glow"
      >
        <Search className="mr-2 h-4 w-4" />
        Gerar Configuração de IP
      </Button>
    </form>
  );
};
