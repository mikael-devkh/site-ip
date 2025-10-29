import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Navigation } from "../components/Navigation";
import { RatHistoryList, RatHistoryEntry } from "../components/RatHistoryList";
import { FileText, History, Printer, RotateCcw, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { generateRatPdf } from "../utils/ratPdfGenerator";
import { RatFormData } from "../types/rat";
import {
  cloneRatFormData,
  createEmptyRatFormData,
  origemEquipamentoOptions,
} from "../data/ratOptions";
import { useHapticFeedback } from "../hooks/use-haptic-feedback";
import { useRatAutofill } from "../context/RatAutofillContext";
import { useAuth } from "../context/AuthContext";

const RAT_HISTORY_STORAGE_KEY = "ratHistory";
const RAT_DRAFT_STORAGE_KEY = "ratFormDraft";

const RatForm = () => {
  const { profile } = useAuth();
  const getInitialFormData = useCallback(() => {
    const base = createEmptyRatFormData();
    if (profile?.nome) {
      base.prestadorNome = profile.nome;
    }
    if (profile?.matricula) {
      base.prestadorRgMatricula = profile.matricula;
    }
    return base;
  }, [profile]);

  const [formData, setFormData] = useState<RatFormData>(() => getInitialFormData());
  const [ratHistory, setRatHistory] = useState<RatHistoryEntry[]>([]);
  const { trigger: triggerHaptic } = useHapticFeedback();
  const { autofillData, clearAutofillData } = useRatAutofill();
  const [draftAvailable, setDraftAvailable] = useState(false);
  const draftLoadedRef = useRef(false);
  const skipDraftSaveRef = useRef(false);
  const draftSaveTimeoutRef = useRef<number | null>(null);

  const handleHouveTrocaChange = (value: string) => {
    setFormData((previous) => {
      if (value === "sim") {
        return { ...previous, houveTroca: value };
      }

      return {
        ...previous,
        houveTroca: value,
        origemEquipamento: "",
        numeroSerieTroca: "",
        equipNovoRecond: "",
        marcaTroca: "",
        modeloTroca: "",
      };
    });
  };

  const loadDraftFromStorage = useCallback(
    (showToast: boolean) => {
      if (typeof window === "undefined") {
        return false;
      }

      try {
        const stored = window.localStorage.getItem(RAT_DRAFT_STORAGE_KEY);
        if (!stored) {
          setDraftAvailable(false);
          return false;
        }

        const parsed = JSON.parse(stored) as Partial<RatFormData>;
        skipDraftSaveRef.current = true;
        setFormData((previous) => ({ ...previous, ...parsed }));
        setDraftAvailable(true);
        if (showToast) {
          toast.info("Rascunho da RAT recuperado automaticamente.");
        }
        return true;
      } catch (error) {
        console.error("Não foi possível recuperar o rascunho da RAT:", error);
        return false;
      }
      return false;
    },
    [],
  );

  const handleApplyAutofill = () => {
    if (!autofillData.isAvailable) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      defeitoProblema: autofillData.defeito,
      diagnosticoTestes: autofillData.diagnostico,
      solucao: autofillData.solucao,
    }));
    toast.success(
      autofillData.title
        ? `Laudo "${autofillData.title}" aplicado ao formulário.`
        : "Laudo sugerido aplicado ao formulário.",
    );
    triggerHaptic(70);
    clearAutofillData();
  };

  const handleResetForm = () => {
    skipDraftSaveRef.current = true;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(RAT_DRAFT_STORAGE_KEY);
    }
    setDraftAvailable(false);
    setFormData(getInitialFormData());
    toast.info("Formulário limpo.");
    triggerHaptic(40);
  };

  useEffect(() => {
    if (!draftLoadedRef.current) {
      draftLoadedRef.current = true;
      loadDraftFromStorage(true);
    }
  }, [loadDraftFromStorage]);

  useEffect(() => {
    if (profile) {
      setFormData((previous) => {
        const shouldUpdate =
          (!!profile.nome && !previous.prestadorNome) ||
          (!!profile.matricula && !previous.prestadorRgMatricula);
        if (!shouldUpdate) {
          return previous;
        }
        return {
          ...previous,
          prestadorNome: previous.prestadorNome || profile.nome || "",
          prestadorRgMatricula:
            previous.prestadorRgMatricula || profile.matricula || "",
        };
      });
    }
  }, [profile]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (skipDraftSaveRef.current) {
      skipDraftSaveRef.current = false;
      return;
    }

    if (draftSaveTimeoutRef.current) {
      window.clearTimeout(draftSaveTimeoutRef.current);
    }

    draftSaveTimeoutRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          RAT_DRAFT_STORAGE_KEY,
          JSON.stringify(formData),
        );
        setDraftAvailable(true);
      } catch (error) {
        console.error("Não foi possível salvar o rascunho da RAT:", error);
      }
    }, 600);

    return () => {
      if (draftSaveTimeoutRef.current) {
        window.clearTimeout(draftSaveTimeoutRef.current);
        draftSaveTimeoutRef.current = null;
      }
    };
  }, [formData]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = localStorage.getItem(RAT_HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed: RatHistoryEntry[] = JSON.parse(stored);
        setRatHistory(parsed);
      }
    } catch (error) {
      console.error("Não foi possível carregar o histórico de RAT:", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (ratHistory.length === 0) {
      localStorage.removeItem(RAT_HISTORY_STORAGE_KEY);
      return;
    }

    try {
      localStorage.setItem(RAT_HISTORY_STORAGE_KEY, JSON.stringify(ratHistory));
    } catch (error) {
      console.error("Não foi possível salvar o histórico de RAT:", error);
    }
  }, [ratHistory]);

  const handleGeneratePDF = async () => {
    try {
      await generateRatPdf(formData);
      setRatHistory((previous) => {
        const entry: RatHistoryEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: Date.now(),
          fsa: formData.fsa?.trim() || undefined,
          codigoLoja: formData.codigoLoja?.trim() || undefined,
          pdv: formData.pdv?.trim() || undefined,
          defeitoProblema: formData.defeitoProblema?.trim() || undefined,
          formData: cloneRatFormData(formData),
        };

        const nextHistory = [entry, ...previous];
        return nextHistory.slice(0, 30);
      });
      toast.success("PDF gerado com sucesso!");
      triggerHaptic(80);
      skipDraftSaveRef.current = true;
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(RAT_DRAFT_STORAGE_KEY);
      }
      setDraftAvailable(false);
    } catch (error) {
      toast.error("Erro ao gerar PDF");
      console.error(error);
    }
  };

  const handleRatHistorySelect = (entry: RatHistoryEntry) => {
    const restored = { ...createEmptyRatFormData(), ...cloneRatFormData(entry.formData) };
    setFormData(restored);
    toast.info("Dados da RAT carregados do histórico.");
    triggerHaptic(50);
  };

  const handleRatHistoryClear = () => {
    setRatHistory([]);
    toast.info("Histórico de RAT limpo.");
    triggerHaptic(50);
  };

  const handleRestoreDraft = () => {
    const restored = loadDraftFromStorage(false);
    if (restored) {
      toast.success("Rascunho recuperado.");
    } else {
      toast.info("Nenhum rascunho salvo disponível.");
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-primary px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto space-y-6">
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

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <Card className="relative overflow-hidden p-4 sm:p-6 space-y-6">
              <span
                className="pointer-events-none select-none absolute -top-6 -right-4 text-5xl font-black tracking-tight text-primary/10 sm:-top-8 sm:-right-6 sm:text-6xl"
                aria-hidden="true"
              >
                WT Tecnologia
              </span>
              <div className="flex flex-wrap justify-end gap-2">
                {autofillData.isAvailable && (
                  <Button type="button" variant="secondary" onClick={handleApplyAutofill}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Aplicar Laudo Sugerido
                    {autofillData.title ? ` (${autofillData.title})` : ""}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRestoreDraft}
                  disabled={!draftAvailable}
                >
                  <History className="mr-2 h-4 w-4" /> Recuperar rascunho
                </Button>
                <Button type="button" variant="outline" onClick={handleResetForm}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Limpar formulário
                </Button>
              </div>

              <Accordion
                type="multiple"
                defaultValue={["identificacao", "equipamento", "laudo", "contatos"]}
                className="space-y-4"
              >
                <AccordionItem value="identificacao">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    1. Identificação
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="codigoLoja">Código da Loja</Label>
                          <Input
                            id="codigoLoja"
                            value={formData.codigoLoja}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            onChange={(e) => setFormData({ ...formData, codigoLoja: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pdv">PDV</Label>
                          <Input
                            id="pdv"
                            value={formData.pdv}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            onChange={(e) => setFormData({ ...formData, pdv: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fsa">FSA</Label>
                          <Input
                            id="fsa"
                            value={formData.fsa}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            onChange={(e) => setFormData({ ...formData, fsa: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
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
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="equipamento">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    2. Dados do Equipamento
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="serial">Número Série ATIVO</Label>
                          <Input
                            id="serial"
                            value={formData.serial}
                            onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="patrimonio">Patrimônio</Label>
                          <Input
                            id="patrimonio"
                            value={formData.patrimonio}
                            onChange={(e) => setFormData({ ...formData, patrimonio: e.target.value })}
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

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Houve troca de equipamento?</Label>
                          <RadioGroup
                            value={formData.houveTroca}
                            onValueChange={handleHouveTrocaChange}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="sim" id="houve-troca-sim" />
                                <Label htmlFor="houve-troca-sim" className="cursor-pointer">
                                  Sim
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="nao" id="houve-troca-nao" />
                                <Label htmlFor="houve-troca-nao" className="cursor-pointer">
                                  Não
                                </Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>

                        {formData.houveTroca === "sim" && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="origemEquipamento">Origem do equipamento</Label>
                              <Select
                                value={formData.origemEquipamento}
                                onValueChange={(value) => setFormData({ ...formData, origemEquipamento: value })}
                              >
                                <SelectTrigger id="origemEquipamento">
                                  <SelectValue placeholder="Selecione a origem" />
                                </SelectTrigger>
                                <SelectContent>
                                  {origemEquipamentoOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="numeroSerieTroca">Número de série (novo equipamento)</Label>
                                <Input
                                  id="numeroSerieTroca"
                                  value={formData.numeroSerieTroca}
                                  onChange={(e) => setFormData({ ...formData, numeroSerieTroca: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="equipNovoRecond">Equipamento novo/recondicionado</Label>
                                <Input
                                  id="equipNovoRecond"
                                  value={formData.equipNovoRecond}
                                  onChange={(e) => setFormData({ ...formData, equipNovoRecond: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="marcaTroca">Marca do novo equipamento</Label>
                                <Input
                                  id="marcaTroca"
                                  value={formData.marcaTroca}
                                  onChange={(e) => setFormData({ ...formData, marcaTroca: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="modeloTroca">Modelo do novo equipamento</Label>
                                <Input
                                  id="modeloTroca"
                                  value={formData.modeloTroca}
                                  onChange={(e) => setFormData({ ...formData, modeloTroca: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="observacoesPecas">Observações</Label>
                          <Textarea
                            id="observacoesPecas"
                            value={formData.observacoesPecas}
                            onChange={(e) => setFormData({ ...formData, observacoesPecas: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="laudo">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    3. Considerações Gerais – Laudo Técnico
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 pt-2">
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
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="sim" id="problema-sim" />
                                <Label htmlFor="problema-sim" className="cursor-pointer">
                                  Sim
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="nao" id="problema-nao" />
                                <Label htmlFor="problema-nao" className="cursor-pointer">
                                  Não
                              </Label>
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
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="sim" id="retorno-sim" />
                              <Label htmlFor="retorno-sim" className="cursor-pointer">
                                Sim
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="nao" id="retorno-nao" />
                              <Label htmlFor="retorno-nao" className="cursor-pointer">
                                Não
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
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
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="contatos">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    4. Dados do Cliente e Prestador
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 pt-2">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">Dados do Cliente</h3>
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
                              onChange={(e) =>
                                setFormData({ ...formData, clienteRgMatricula: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="clienteTelefone">Telefone</Label>
                            <Input
                              id="clienteTelefone"
                              value={formData.clienteTelefone}
                              onChange={(e) =>
                                setFormData({ ...formData, clienteTelefone: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">Dados do Prestador</h3>
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
                              onChange={(e) =>
                                setFormData({ ...formData, prestadorRgMatricula: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="prestadorTelefone">Telefone</Label>
                            <Input
                              id="prestadorTelefone"
                              value={formData.prestadorTelefone}
                              onChange={(e) =>
                                setFormData({ ...formData, prestadorTelefone: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex justify-center pt-2">
                <Button onClick={handleGeneratePDF} size="lg" className="gap-2">
                  <Printer className="h-5 w-5" />
                  Gerar e Imprimir RAT
                </Button>
              </div>
            </Card>
            <Card className="p-4 sm:p-6 space-y-4 h-fit">
              <RatHistoryList
                history={ratHistory}
                onSelect={handleRatHistorySelect}
                onClear={handleRatHistoryClear}
              />
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default RatForm;
