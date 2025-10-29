import { useEffect, useMemo, useState } from "react";
import { addDays, endOfDay, format, startOfDay, subDays } from "date-fns";
import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Separator } from "../components/ui/separator";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { Loader2, BarChart3, CalendarDays } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import type { DateRange } from "react-day-picker";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  CartesianGrid,
} from "recharts";

interface ReportEntry {
  id: string;
  codigoLoja: string;
  durationMinutes: number;
  archivedAt: Date;
  status: string;
  fsa?: string;
}

const defaultRange: DateRange = {
  from: subDays(new Date(), 30),
  to: new Date(),
};

const ReportsPage = () => {
  const { user, loadingAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultRange);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) {
        setEntries([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const reportsCollection = collection(db, "serviceReports");
        const reportsQuery = query(
          reportsCollection,
          where("userId", "==", user.uid),
          orderBy("archivedAt", "desc"),
        );
        const snapshot = await getDocs(reportsQuery);
        const mapped = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          const timestamp = data.archivedAt as Timestamp | undefined;
          return {
            id: docSnapshot.id,
            codigoLoja: typeof data.codigoLoja === "string" ? data.codigoLoja : "-",
            durationMinutes:
              typeof data.durationMinutes === "number" ? data.durationMinutes : 0,
            status: typeof data.status === "string" ? data.status : "archived",
            fsa: typeof data.fsa === "string" ? data.fsa : undefined,
            archivedAt: timestamp ? timestamp.toDate() : new Date(),
          } satisfies ReportEntry;
        });
        setEntries(mapped);
      } catch (fetchError) {
        console.error("Erro ao carregar relatórios pessoais:", fetchError);
        setError("Não foi possível carregar os relatórios. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    if (!loadingAuth) {
      void fetchReports();
    }
  }, [loadingAuth, user]);

  const filteredEntries = useMemo(() => {
    if (!dateRange?.from && !dateRange?.to) {
      return entries;
    }
    const from = dateRange?.from ? startOfDay(dateRange.from) : startOfDay(subDays(new Date(), 365));
    const to = dateRange?.to ? endOfDay(dateRange.to) : endOfDay(addDays(new Date(), 1));

    return entries.filter((entry) => {
      const archivedAt = entry.archivedAt ?? new Date();
      return archivedAt >= from && archivedAt <= to;
    });
  }, [dateRange, entries]);

  const totals = useMemo(() => {
    const totalCalls = filteredEntries.length;
    const totalMinutes = filteredEntries.reduce(
      (sum, entry) => sum + (entry.durationMinutes ?? 0),
      0,
    );
    const averageMinutes = totalCalls ? Math.round(totalMinutes / totalCalls) : 0;
    const byStore = filteredEntries.reduce<Record<string, number>>((acc, entry) => {
      const store = entry.codigoLoja || "-";
      acc[store] = (acc[store] ?? 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(byStore).map(([store, count]) => ({
      store,
      chamados: count,
    }));

    return {
      totalCalls,
      totalMinutes,
      averageMinutes,
      byStore,
      chartData,
    };
  }, [filteredEntries]);

  if (loadingAuth || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-primary">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-primary px-4 py-8 pt-24">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="space-y-3 text-center">
            <div className="flex justify-center">
              <div className="rounded-2xl bg-secondary p-3 shadow-glow">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Relatórios de Performance Pessoal
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Acompanhe o volume de chamados, tempo investido e principais lojas atendidas.
            </p>
          </header>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {dateRange?.from && dateRange?.to
                      ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                      : "Selecionar período"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                onClick={() => setDateRange(defaultRange)}
                className="text-sm"
              >
                Últimos 30 dias
              </Button>
            </div>
          </div>

          {error && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardHeader>
                <CardTitle className="text-destructive">{error}</CardTitle>
              </CardHeader>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="bg-background/80 shadow-sm">
              <CardHeader>
                <CardTitle>Total de chamados</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <span className="text-4xl font-bold text-foreground">
                  {totals.totalCalls}
                </span>
                <p className="text-xs text-muted-foreground">
                  Considerando o período selecionado.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background/80 shadow-sm">
              <CardHeader>
                <CardTitle>Tempo acumulado</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <span className="text-4xl font-bold text-foreground">
                  {totals.totalMinutes} min
                </span>
                <p className="text-xs text-muted-foreground">
                  Média de {totals.averageMinutes} min por chamado.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background/80 shadow-sm">
              <CardHeader>
                <CardTitle>Lojas atendidas</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {Object.entries(totals.byStore).length ? (
                  Object.entries(totals.byStore)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([store, count]) => (
                      <Badge key={store} variant="secondary" className="text-xs">
                        Loja {store}: {count}
                      </Badge>
                    ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Nenhum registro no período filtrado.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-background/80 shadow-sm">
            <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Distribuição por loja</CardTitle>
              <span className="text-xs text-muted-foreground">
                {totals.chartData.length} loja(s) com atendimentos registrados
              </span>
            </CardHeader>
            <CardContent className="h-72">
              {totals.chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={totals.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="store" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip formatter={(value: number) => `${value} chamados`} />
                    <Bar dataKey="chamados" fill="#22c55e" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Nenhum dado para o período informado.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-background/80 shadow-sm">
            <CardHeader>
              <CardTitle>Histórico detalhado</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <div className="divide-y divide-border text-sm">
                  {filteredEntries.length ? (
                    filteredEntries.map((entry) => (
                      <div key={entry.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            Loja {entry.codigoLoja} {entry.fsa ? `• FSA ${entry.fsa}` : ""}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(entry.archivedAt, "dd/MM/yyyy HH:mm")} • {entry.durationMinutes} min
                          </span>
                        </div>
                        <Badge variant="outline" className="self-start sm:self-auto">
                          {entry.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Nenhum chamado registrado para o filtro aplicado.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ReportsPage;
