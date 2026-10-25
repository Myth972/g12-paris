import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Bandeau « mode hors connexion ».
 *
 * S'affiche uniquement quand le réseau est perdu : le service worker
 * sert alors les dernières données API mises en cache (articles, galeries,
 * annonces, versets) et les visiteurs consultent le dernier contenu connu.
 */
export default function OfflineBanner() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" && !navigator.onLine
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          role="status"
          className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-zinc-900 py-2 px-4 text-xs sm:text-sm font-medium text-white shadow-lg"
        >
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t("offline.banner")}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
