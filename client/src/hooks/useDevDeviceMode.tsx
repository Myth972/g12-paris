import { useEffect, useState } from "react";

const STORAGE_KEY = "g12-dev-device-mode";

export type DevDeviceMode = "auto" | "desktop" | "mobile";

function readMode(): DevDeviceMode {
  if (typeof window === "undefined") return "auto";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "desktop" || raw === "mobile" || raw === "auto") return raw;
  return "auto";
}

export function setDevDeviceMode(mode: DevDeviceMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, mode);
  window.dispatchEvent(
    new CustomEvent("g12:dev-device-change", { detail: mode })
  );
}

export function useDevDeviceMode() {
  const [mode, setMode] = useState<DevDeviceMode>("auto");

  useEffect(() => {
    setMode(readMode());
    const root = document.documentElement;
    const applyDataset = (value: DevDeviceMode) => {
      if (value === "auto") root.removeAttribute("data-dev-device");
      else root.setAttribute("data-dev-device", value);
    };
    applyDataset(readMode());

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        const next = readMode();
        setMode(next);
        applyDataset(next);
      }
    };

    const onCustom = (event: Event) => {
      const custom = event as CustomEvent<DevDeviceMode>;
      const next = custom.detail || readMode();
      setMode(next);
      applyDataset(next);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("g12:dev-device-change", onCustom);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("g12:dev-device-change", onCustom);
    };
  }, []);

  const update = (next: DevDeviceMode) => {
    setMode(next);
    const root = document.documentElement;
    if (next === "auto") root.removeAttribute("data-dev-device");
    else root.setAttribute("data-dev-device", next);
    setDevDeviceMode(next);
  };

  return { mode, setMode: update };
}
