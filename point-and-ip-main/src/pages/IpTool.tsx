import React, { useEffect, useMemo, useState } from "react";

/** ---------- Utils de IP ---------- */
function parseCidr(cidr: string) {
  const [net, bitsStr] = cidr.trim().split("/");
  if (!net || !bitsStr) throw new Error("CIDR inválido");
  const oct = net.split(".").map(Number);
  const bits = parseInt(bitsStr, 10);
  if (
    oct.length !== 4 ||
    oct.some((n) => isNaN(n) || n < 0 || n > 255) ||
    isNaN(bits) ||
    bits < 0 ||
    bits > 32
  ) {
    throw new Error("CIDR inválido");
  }
  const netInt =
    ((oct[0] << 24) >>> 0) +
    ((oct[1] << 16) >>> 0) +
    ((oct[2] << 8) >>> 0) +
    (oct[3] >>> 0);
  const mask = bits === 0 ? 0 : ((~0 << (32 - bits)) >>> 0) >>> 0;
  const network = netInt & mask;
  const broadcast = network | (~mask >>> 0);
  return { network, broadcast, maskBits: bits };
}
function intToIp(n: number) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}
/** ---------- Plano WT (ajustável) ---------- */
type DeviceType = "PDV" | "Impressora" | "Desktop";
const DEVICE_TYPES: { value: DeviceType; label: string }[] = [
  { value: "PDV", label: "PDV" },
  { value: "Impressora", label: "Impressora" },
  { value: "Desktop", label: "Desktop" },
];

/** offsets por tipo, pode ajustar como quiser */
const HOST_OFFSETS: Record<DeviceType, number> = {
  PDV: 100,
  Impressora: 150,
  Desktop: 200,
};

/** gateway e broadcast “convencionais” de /24 */
function defaultGateway(hostPart: number) {
  return 254; // .254
}
function defaultBroadcast(hostPart: number) {
  return 255; // .255
}

/** Persistência simples das sub-redes por loja */
const PLAN_STORAGE_KEY = "wt_ip_plan_by_store";
type StorePlan = Record<string, string>; // { "317": "10.25.221.0/24" }

function loadPlans(): StorePlan {
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StorePlan) : {};
  } catch {
    return {};
  }
}
function savePlans(plans: StorePlan) {
  localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plans));
}

/** Caso queira calcular subnet automaticamente pela loja, ajuste aqui */
function getSubnetForStore(store: string, plans: StorePlan): string {
  return plans[store] ?? "";
}

export default function IpTool() {
  const [plans, setPlans] = useState<StorePlan>(() => loadPlans());

  const [store, setStore] = useState<string>("317");
  const [deviceType, setDeviceType] = useState<DeviceType>("PDV");
  const [number, setNumber] = useState<number>(303);

  // subnet por loja (memorizada)
  const [subnet, setSubnet] = useState<string>("");

  // resultados
  const [ip, setIp] = useState<string>("");
  const [mask, setMask] = useState<string>("255.255.255.0");
  const [gateway, setGateway] = useState<string>("");
  const [broadcast, setBroadcast] = useState<string>("");
  const [error, setError] = useState<string>("");

  // carrega subnet ao trocar loja
  useEffect(() => {
    const s = getSubnetForStore(store, plans);
    setSubnet(s);
  }, [store, plans]);

  // salva subnet da loja quando o usuário editar
  useEffect(() => {
    if (!store) return;
    setPlans((prev) => {
      const next = { ...prev, [store]: subnet };
      savePlans(next);
      return next;
    });
  }, [store, subnet]);

  const networkInfo = useMemo(() => {
    if (!subnet) return null;
    try {
      return parseCidr(subnet);
    } catch {
      return null;
    }
  }, [subnet]);

  function compute() {
    setError("");
    try {
      if (!store) throw new Error("Informe a loja.");
      if (!networkInfo) throw new Error("Informe uma sub-rede válida (ex.: 10.25.221.0/24).");
      if (!Number.isFinite(number) || number < 0) throw new Error("Número inválido.");

      // host = offset(tipo) + (numero % 100)  → PDV 303 => 100 + 3 => .103
      const baseHost = HOST_OFFSETS[deviceType] ?? 100;
      const host = baseHost + (number % 100);

      // /24 (máscara 255.255.255.0)
      if (networkInfo.maskBits !== 24) {
        // você pode suportar /23, /25 etc depois; por ora focamos /24
        throw new Error("Este gerador assume /24. Use uma sub-rede /24.");
      }

      const ipInt = networkInfo.network + host;
      const gwInt = networkInfo.network + defaultGateway(host);
      const brInt = networkInfo.network + defaultBroadcast(host);

      setIp(intToIp(ipInt));
      setMask("255.255.255.0");
      setGateway(intToIp(gwInt));
      setBroadcast(intToIp(brInt));
    } catch (e: any) {
      setError(e.message || "Erro ao gerar IP");
      setIp("");
      setGateway("");
      setBroadcast("");
    }
  }

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
  }

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-wt-green-100/70 shadow-glow">
          <span className="inline-block w-6 h-6 text-center">🧩</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground leading-tight">
            Gerador de IP
          </h2>
          <p className="text-muted text-sm">
            Configure IPs para PDVs, impressoras e desktops.
          </p>
        </div>
      </div>

      {/* Loja + Sub-rede */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="text-sm text-muted">Loja</label>
          <input
            value={store}
            onChange={(e) => setStore(e.target.value.replace(/\D/g, ""))}
            className="mt-1 w-full border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:border-wt-green-600 focus:ring-2 focus:ring-wt-green-500/30"
            placeholder="ex.: 317"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm text-muted">Sub-rede da Loja (CIDR)</label>
          <input
            value={subnet}
            onChange={(e) => setSubnet(e.target.value)}
            className="mt-1 w-full border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:border-wt-green-600 focus:ring-2 focus:ring-wt-green-500/30"
            placeholder="ex.: 10.25.221.0/24"
          />
          <p className="text-xs text-muted mt-1">
            Dica: defina uma vez por loja; o app memoriza automaticamente.
          </p>
        </div>
      </div>

      {/* Tipo + Número */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-sm text-muted">Tipo de Dispositivo</label>
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value as DeviceType)}
            className="mt-1 w-full border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:border-wt-green-600 focus:ring-2 focus:ring-wt-green-500/30"
          >
            {DEVICE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted mt-1">
            Regra padrão: PDV=&gt;100+, Impressora=&gt;150+, Desktop=&gt;200+.
          </p>
        </div>
        <div>
          <label className="text-sm text-muted">Número do {deviceType}</label>
          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(parseInt(e.target.value || "0", 10))}
            className="mt-1 w-full border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:border-wt-green-600 focus:ring-2 focus:ring-wt-green-500/30"
            placeholder="ex.: 303"
          />
          <p className="text-xs text-muted mt-1">
            O host vira: <code>{HOST_OFFSETS[deviceType]} + (n % 100)</code>.
          </p>
        </div>
        <div className="flex items-end">
          <button
            onClick={compute}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-wt-green-700 shadow-glow"
          >
            Gerar Configuração de IP
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      {/* Resultado */}
      {ip && (
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted">Loja</div>
                <div className="text-lg font-semibold">Loja {store}</div>
              </div>
              <div className="flex gap-2">
                <span className="text-xs bg-wt-green-600/15 text-wt-green-800 dark:text-wt-green-100 px-2 py-1 rounded-md border border-wt-green-600/30">
                  {deviceType}
                </span>
                <span className="text-xs bg-wt-green-600/15 text-wt-green-800 dark:text-wt-green-100 px-2 py-1 rounded-md border border-wt-green-600/30">
                  Nº {number}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="IP" value={ip} onCopy={copy} />
              <Field label="Máscara" value={mask} onCopy={copy} />
              <Field label="Gateway" value={gateway} onCopy={copy} />
              <Field label="Broadcast" value={broadcast} onCopy={copy} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/** Componente de linha com botão copiar */
function Field({ label, value, onCopy }: { label: string; value: string; onCopy: (t: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 border border-border rounded-md px-3 py-2 bg-background">
      <div>
        <div className="text-xs text-muted">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
      <button
        onClick={() => onCopy(value)}
        className="text-sm px-2 py-1 rounded-md border border-border hover:bg-wt-green-50/60 dark:hover:bg-wt-green-900/20"
        title="Copiar"
      >
        📋
      </button>
    </div>
  );
}
