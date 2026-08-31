import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    FB?: {
      init: (params: { xfbml: boolean; version: string }) => void;
      XFBML: { parse: (element?: HTMLElement) => void };
      Event?: { subscribe: (event: string, cb: (resp: any) => void) => void };
    };
    fbAsyncInit?: () => void;
  }
}

type LogEntry = { ts: string; type: "info" | "success" | "error" | "warn"; message: string };

export default function FacebookSdkTest() {
  const [url, setUrl] = useState("https://www.facebook.com/reel/1075974361641336/");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sdkReady, setSdkReady] = useState(false);
  const [parseCount, setParseCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const addLog = (type: LogEntry["type"], message: string) => {
    const entry = { ts: new Date().toLocaleTimeString(), type, message };
    setLogs((prev) => [...prev, entry]);
  };

  // Load SDK once on mount
  useEffect(() => {
    addLog("info", "Composant monté, chargement du SDK Facebook…");

    const previousInit = window.fbAsyncInit;
    window.fbAsyncInit = () => {
      if (previousInit) previousInit();
      if (window.FB) {
        window.FB.init({ xfbml: true, version: "v18.0" });
        addLog("success", "FB.init() appelé avec xfbml: true, version: v18.0");
        setSdkReady(true);
      } else {
        addLog("error", "window.FB indisponible après fbAsyncInit");
      }
    };

    const existing = document.getElementById("facebook-jssdk");
    if (existing) {
      addLog("warn", "Script SDK déjà présent dans le DOM (id=facebook-jssdk)");
      // Wait a bit in case it is still loading
      setTimeout(() => {
        if (window.FB) {
          addLog("success", "window.FB disponible après attente");
          setSdkReady(true);
        } else {
          addLog("error", "window.FB toujours indisponible après 500ms");
        }
      }, 500);
    } else {
      addLog("info", "Injection du script SDK Facebook…");
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/fr_FR/sdk.js#xfbml=1&version=v18.0";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.onload = () => addLog("success", "Script SDK chargé (onload)");
      script.onerror = () => addLog("error", "Échec du chargement du script SDK");
      document.head.appendChild(script);
    }

    // Check if SDK exists
    setTimeout(() => {
      addLog(window.FB ? "success" : "error", `État window.FB après 1s: ${window.FB ? "PRÉSENT" : "ABSENT"}`);
    }, 1000);
  }, []);

  const handleParse = () => {
    if (!window.FB) {
      addLog("error", "window.FB indisponible — appel de FB.XFBML.parse() impossible");
      return;
    }
    addLog("info", "Appel de FB.XFBML.parse()…");
    try {
      window.FB.XFBML.parse(containerRef.current ?? undefined);
      setParseCount((c) => c + 1);
      addLog("success", "FB.XFBML.parse() appelé avec succès");
      // Check what happened to the container
      setTimeout(() => {
        if (containerRef.current) {
          const iframes = containerRef.current.querySelectorAll("iframe");
          addLog(iframes.length > 0 ? "success" : "warn", `Conteneur contient ${iframes.length} iframe(s) après parse`);
          if (iframes.length > 0) {
            iframes.forEach((iframe, i) => {
              addLog("info", `  iframe[${i}].src: ${iframe.src.substring(0, 100)}...`);
            });
          }
        }
      }, 500);
    } catch (e) {
      addLog("error", `Erreur FB.XFBML.parse(): ${String(e)}`);
    }
  };

  const handleClear = () => {
    setLogs([]);
    addLog("info", "Logs effacés");
  };

  return (
    <div className="container py-10 max-w-4xl">
      <h1 className="text-2xl font-bold font-serif mb-2">Test Facebook SDK — Diagnostic</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Page de diagnostic pour vérifier le chargement du SDK Facebook et l'embed des vidéos (Reels inclus).
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: embed area */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Zone d'embed</h2>

          <div>
            <label className="text-sm font-medium">URL Facebook</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.facebook.com/reel/... ou /videos/..."
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleParse} disabled={!sdkReady}>
              Forcer FB.XFBML.parse()
            </Button>
            <Button variant="outline" onClick={() => { setParseCount((c) => c + 1); handleParse(); }}>
              Re-render
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            SDK prêt: {sdkReady ? "✅" : "⏳"} | Parse appelé: {parseCount}x
          </div>

          {/* Required by SDK */}
          <div id="fb-root" />

          <div
            ref={containerRef}
            className="rounded-xl overflow-hidden border bg-black min-h-[400px] flex items-center justify-center"
          >
            <div
              className="fb-video"
              data-href={url}
              data-width="500"
              data-show-text="false"
              data-allowfullscreen="true"
              data-lazy="false"
              style={{ display: "block", width: "100%" }}
            >
              <div className="fb-xfbml-parse-ignore p-6 text-center text-white">
                <p className="mb-2">Si le SDK ne charge pas, ce texte sera visible.</p>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">
                  Ouvrir sur Facebook
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right: logs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Logs ({logs.length})</h2>
            <Button variant="ghost" size="sm" onClick={handleClear}>Effacer</Button>
          </div>

          <div className="rounded-xl border bg-slate-50 dark:bg-slate-900 p-3 h-[600px] overflow-y-auto font-mono text-xs space-y-1">
            {logs.length === 0 && <p className="text-muted-foreground">Aucun log pour le moment…</p>}
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.type === "error" ? "text-red-600" :
                  log.type === "success" ? "text-green-600" :
                  log.type === "warn" ? "text-amber-600" :
                  "text-foreground"
                }
              >
                <span className="text-muted-foreground">[{log.ts}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 rounded-xl border bg-muted/30 text-sm space-y-2">
        <h3 className="font-semibold">Comment tester</h3>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Ouvre F12 (DevTools) → onglet <strong>Console</strong> et <strong>Network</strong></li>
          <li>Vérifie si le script <code>sdk.js</code> est chargé (status 200)</li>
          <li>Vérifie s'il y a des erreurs CORS ou de chargement</li>
          <li>Clique sur "Forcer FB.XFBML.parse()" et observe les logs</li>
          <li>Vérifie si un iframe apparaît dans la zone d'embed</li>
        </ol>
      </div>
    </div>
  );
}