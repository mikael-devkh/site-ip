import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Navigation } from "@/components/Navigation";
import { FileText, Printer, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateRatPDF } from "@/utils/ratPdfGenerator";
import { RatFormData } from "@/types/rat";
import {
  cloneRatFormData,
  createEmptyRatFormData,
  equipamentoOptions,
  origemEquipamentoOptions,
  pecasCabosOptions,
  pecasImpressoraOptions,
  sampleRatFormData,
} from "@/data/ratOptions";

const RatForm = () => {
  const [formData, setFormData] = useState<RatFormData>(() => createEmptyRatFormData());

  const toggleListValue = (list: string[], value: string, checked: boolean) => {
    if (checked) {
      return Array.from(new Set([...list, value]));
    }
    return list.filter((item) => item !== value);
  };

  const buildCheckboxId = (prefix: string, value: string) =>
    `${prefix}-${value}`.replace(/[^a-zA-Z0-9-_]/g, "-");

  const handleUseSampleData = () => {
    setFormData(cloneRatFormData(sampleRatFormData));
    toast.success("Formulário preenchido com dados de teste.");
  };

  const handleResetForm = () => {
    setFormData(createEmptyRatFormData());
    toast.info("Formulário limpo.");
  };

  // >>>>>>> ALTERADO: agora aceita 'calibration = true' para abrir o painel de calibração
  const handleGeneratePDF = async (calibration = false) => {
    try {
      await generateRatPDF(formData, calibration ? { calibrationMode: true } : undefined);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar PDF");
      console.error(error);
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-primary px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-secondary rounded-2xl shadow-glow">
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Relatório de Atendimento Técnico - RAT
            </h1>
            <p className="text-muted-foreground">
              Preencha os dados para gerar a RAT
            </p>
          </header>

          <Card className="p-6 space-y-8">
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleResetForm}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpar formulário
              </Button>
              <Button type="button" variant="secondary" onClick={handleUseSampleData}>
                <Sparkles className="mr-2 h-4 w-4" />
                Preencher com exemplo
              </Button>
            </div>

            {/* Identificação */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                Identificação
              </h2>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoLoja">Código da Loja</Label>
                  <Input
                    id="codigoLoja"
                    value={formData.codigoLoja}
                    onChange={(e) => setFormData({ ...formData, codigoLoja: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdv">PDV</Label>
                  <Input
                    id="pdv"
                    value={formData.pdv}
                    onChange={(e) => setFormData({ ...formData, pdv: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fsa">FSA</Label>
                  <Input
                    id="fsa"
                    value={formData.fsa}
                    onChange={(e) => setFormData({ ...formData, fsa: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Input
                    id="uf"
                    maxLength={2}
                    value={formData.uf}
                    onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomeSolicitante">Nome do Solicitante</Label>
                <Input
                  id="nomeSolicitante"
                  value={formData.nomeSolicitante}
                  onChange={(e) => setFormData({ ...formData, nomeSolicitante: e.target.value })}
                />
              </div>
            </section>

            {/* Equipamentos Envolvidos */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Equipamentos Envolvidos</h2>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {equipamentoOptions.map((equip) => {
                  const checkboxId = buildCheckboxId("equip", equip.value);
                  return (
                    <div key={equip.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={checkboxId}
                        checked={formData.equipamentos.includes(equip.value)}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            equipamentos: toggleListValue(
                              formData.equipamentos,
                              equip.value,
                              checked as boolean
                            ),
                          })
                        }
                      />
                      <label htmlFor={checkboxId} className="text-sm cursor-pointer">
                        {equip.label}
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="patrimonioNumeroSerie">Patrimônio/Número Série ATIVO</Label>
                  <Input
                    id="patrimonioNumeroSerie"
                    value={formData.patrimonioNumeroSerie}
                    onChange={(e) => setFormData({ ...formData, patrimonioNumeroSerie: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipComDefeito">Equip. com defeito</Label>
                  <Input
                    id="equipComDefeito"
                    value={formData.equipComDefeito}
                    onChange={(e) => setFormData({ ...formData, equipComDefeito: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Input
                    id="marca"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Origem do Equipamento</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {origemEquipamentoOptions.map((origem) => {
                    const checkboxId = buildCheckboxId("origem", origem.value);
                    return (
                      <div key={origem.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={checkboxId}
                          checked={formData.origemEquipamento === origem.value}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              origemEquipamento: checked ? origem.value : "",
                            })
                          }
                        />
                        <label htmlFor={checkboxId} className="text-sm cursor-pointer">
                          {origem.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroSerieTroca">Número Série Troca</Label>
                  <Input
                    id="numeroSerieTroca"
                    value={formData.numeroSerieTroca}
                    onChange={(e) => setFormData({ ...formData, numeroSerieTroca: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipNovoRecond">Equip. Novo/Recond.</Label>
                  <Input
                    id="equipNovoRecond"
                    value={formData.equipNovoRecond}
                    onChange={(e) => setFormData({ ...formData, equipNovoRecond: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marcaTroca">Marca (Troca)</Label>
                  <Input
                    id="marcaTroca"
                    value={formData.marcaTroca}
                    onChange={(e) => setFormData({ ...formData, marcaTroca: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modeloTroca">Modelo (Troca)</Label>
                  <Input
                    id="modeloTroca"
                    value={formData.modeloTroca}
                    onChange={(e) => setFormData({ ...formData, modeloTroca: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* Peças/Cabos */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Peças/Cabos</h2>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pecasCabosOptions.map((peca) => {
                  const checkboxId = buildCheckboxId("peca-cabo", peca.value);
                  return (
                    <div key={peca.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={checkboxId}
                        checked={formData.pecasCabos.includes(peca.value)}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            pecasCabos: toggleListValue(
                              formData.pecasCabos,
                              peca.value,
                              checked as boolean
                            ),
                          })
                        }
                      />
                      <label htmlFor={checkboxId} className="text-sm cursor-pointer">
                        {peca.label}
                      </label>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Peças Impressora Térmica */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Peças Imp. Térmica – Zebra/Printronix/Outras</h2>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pecasImpressoraOptions.map((peca) => {
                  const checkboxId = buildCheckboxId("peca-imp", peca.value);
                  return (
                    <div key={peca.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={checkboxId}
                        checked={formData.pecasImpressora.includes(peca.value)}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            pecasImpressora: toggleListValue(
                              formData.pecasImpressora,
                              peca.value,
                              checked as boolean
                            ),
                          })
                        }
                      />
                      <label htmlFor={checkboxId} className="text-sm cursor-pointer">
                        {peca.label}
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Label>Mau uso</Label>
                <RadioGroup value={formData.mauUso} onValueChange={(value) => setFormData({ ...formData, mauUso: value })}>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sim" id="mau-uso-sim" />
                      <Label htmlFor="mau-uso-sim" className="cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="mau-uso-nao" />
                      <Label htmlFor="mau-uso-nao" className="cursor-pointer">Não</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoesPecas">Observações</Label>
                <Textarea
                  id="observacoesPecas"
                  value={formData.observacoesPecas}
                  onChange={(e) => setFormData({ ...formData, observacoesPecas: e.target.value })}
                  rows={3}
                />
              </div>
            </section>

            {/* Laudo Técnico */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Considerações Gerais – Laudo Técnico</h2>
              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defeitoProblema">Defeito/Problema</Label>
                  <Textarea
                    id="defeitoProblema"
                    value={formData.defeitoProblema}
                    onChange={(e) => setFormData({ ...formData, defeitoProblema: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diagnosticoTestes">Diagnóstico/Testes realizados</Label>
                  <Textarea
                    id="diagnosticoTestes"
                    value={formData.diagnosticoTestes}
                    onChange={(e) => setFormData({ ...formData, diagnosticoTestes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="solucao">Solução</Label>
                  <Textarea
                    id="solucao"
                    value={formData.solucao}
                    onChange={(e) => setFormData({ ...formData, solucao: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Problema resolvido?</Label>
                  <RadioGroup
                    value={formData.problemaResolvido}
                    onValueChange={(value) => setFormData({ ...formData, problemaResolvido: value })}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="problema-sim" />
                        <Label htmlFor="problema-sim" className="cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="problema-nao" />
                        <Label htmlFor="problema-nao" className="cursor-pointer">Não</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {formData.problemaResolvido === "nao" && (
                  <div className="space-y-2">
                    <Label htmlFor="motivoNaoResolvido">Caso não, descreva o motivo</Label>
                    <Textarea
                      id="motivoNaoResolvido"
                      value={formData.motivoNaoResolvido}
                      onChange={(e) => setFormData({ ...formData, motivoNaoResolvido: e.target.value })}
                      rows={2}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Haverá retorno?</Label>
                  <RadioGroup
                    value={formData.haveraRetorno}
                    onValueChange={(value) => setFormData({ ...formData, haveraRetorno: value })}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="retorno-sim" />
                        <Label htmlFor="retorno-sim" className="cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="retorno-nao" />
                        <Label htmlFor="retorno-nao" className="cursor-pointer">Não</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="horaInicio">Hora início</Label>
                    <Input
                      id="horaInicio"
                      type="time"
                      value={formData.horaInicio}
                      onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horaTermino">Hora término</Label>
                    <Input
                      id="horaTermino"
                      type="time"
                      value={formData.horaTermino}
                      onChange={(e) => setFormData({ ...formData, horaTermino: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data">Data</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Cliente e Prestador */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Dados do Cliente</h2>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clienteNome">Nome Legível</Label>
                  <Input
                    id="clienteNome"
                    value={formData.clienteNome}
                    onChange={(e) => setFormData({ ...formData, clienteNome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clienteRgMatricula">RG ou Matrícula</Label>
                  <Input
                    id="clienteRgMatricula"
                    value={formData.clienteRgMatricula}
                    onChange={(e) => setFormData({ ...formData, clienteRgMatricula: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clienteTelefone">Telefone</Label>
                  <Input
                    id="clienteTelefone"
                    value={formData.clienteTelefone}
                    onChange={(e) => setFormData({ ...formData, clienteTelefone: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Dados do Prestador</h2>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prestadorNome">Nome Legível</Label>
                  <Input
                    id="prestadorNome"
                    value={formData.prestadorNome}
                    onChange={(e) => setFormData({ ...formData, prestadorNome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prestadorRgMatricula">RG ou Matrícula</Label>
                  <Input
                    id="prestadorRgMatricula"
                    value={formData.prestadorRgMatricula}
                    onChange={(e) => setFormData({ ...formData, prestadorRgMatricula: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prestadorTelefone">Telefone</Label>
                  <Input
                    id="prestadorTelefone"
                    value={formData.prestadorTelefone}
                    onChange={(e) => setFormData({ ...formData, prestadorTelefone: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* Botões Gerar PDF */}
            <div className="flex justify-center gap-2 pt-4">
              {/* Botão de calibração */}
              <Button
                onClick={() => handleGeneratePDF(true)}
                variant="outline"
                size="lg"
                className="gap-2"
                title="Abre o painel de calibração e a pré-visualização"
              >
                <Sparkles className="h-5 w-5" />
                Pré-visualizar (calibrar)
              </Button>

              {/* Botão final */}
              <Button
                onClick={() => handleGeneratePDF(false)}
                size="lg"
                className="gap-2"
              >
                <Printer className="h-5 w-5" />
                Gerar e Imprimir RAT
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default RatForm;
