import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";



function BurstTrigger({ trigger }: { trigger: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const m = (window as any).mojs;
    if (!trigger || !containerRef.current || !m) return;

    const burst = new m.Burst({
      parent: containerRef.current,
      radius: { 0: 200 },
      count: 20,
      degree: 360,
      isShowEnd: false,
      children: {
        shape: ["circle", "polygon", "cross"],
        points: 5,
        radius: { 20: 0 },
        fill: ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff"],
        stroke: "transparent",
        duration: 2000,
        easing: "cubic.out",
      },
    });

    const text = new m.Html({
      el: (() => {
        const el = document.createElement("div");
        el.innerHTML = "❤️ I Love You Jésus ❤️";
        el.style.cssText = `
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
          text-shadow: 0 0 40px #ff6b6b, 0 0 80px #ff6b6b;
          pointer-events: none;
          white-space: nowrap;
        `;
        return el;
      })(),
      parent: containerRef.current,
      y: { 0: -160 },
      opacity: { 1: 0 },
      scale: { 0.8: 1.2 },
      duration: 2000,
      easing: "elastic.out",
    });

    const ring = new m.Transit({
      parent: containerRef.current,
      type: "circle",
      radius: { 0: 200 },
      stroke: "#ff6b6b",
      strokeWidth: { 6: 0 },
      opacity: { 0.8: 0 },
      duration: 1500,
      easing: "quad.out",
    });

    const timeline = new m.Timeline();
    timeline.add(burst, text, ring).play();

    console.log("[mojs] Animation created & playing");

    return () => {
      timeline.stop();
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [trigger]);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-50" />
  );
}

function Option1Button() {
  const [trigger, setTrigger] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setTrigger(t => !t)}
        className="group px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
      >
        🎉 Déclencher l'Animation (Clic)
      </button>
      <BurstTrigger trigger={trigger} />
    </div>
  );
}
function ILoveYouJesusAnimation() {
  const [trigger, setTrigger] = useState(false);
  return (
    <div className="relative flex flex-col items-center">
      <button
        onClick={() => setTrigger(t => !t)}
        className="mt-4 px-6 py-2 bg-pink-600 text-white rounded-full hover:bg-pink-500 transition"
      >
        ❤️ I Love You Jésus ❤️
      </button>
      <BurstTrigger trigger={trigger} />
    </div>
  );
}

function useScrollAnimation(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function Option2Scroll() {
  const { ref, visible } = useScrollAnimation(0.2);
  return (
    <div ref={ref} className="min-h-[300px] flex items-center justify-center">
      <div className="text-center p-8 bg-gradient-to-br from-pink-50 via-white to-red-50 rounded-2xl border border-pink-100 max-w-md mx-4">
        <h3 className="text-2xl font-bold text-pink-700 mb-4">📜 Option 2 : Au Scroll</h3>
        <p className="text-gray-600 mb-6">Descends jusqu'ici pour déclencher l'animation automatiquement.</p>
        <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          visible ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
        }`}>
          {visible ? "✅ Déclenché !" : "⏳ En attente de scroll..."}
        </div>
      </div>
      <BurstTrigger trigger={visible} />
    </div>
  );
}

function useKonamiCode() {
  const [trigger, setTrigger] = useState(false);
  const buffer = useRef<string[]>([]);
  const sequence = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","KeyB","KeyA"];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      buffer.current.push(e.code);
      if (buffer.current.length > sequence.length) buffer.current.shift();
      if (buffer.current.join(",") === sequence.join(",")) {
        setTrigger(true);
        setTimeout(() => setTrigger(false), 2500);
        buffer.current = [];
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return trigger;
}

function Option3Konami() {
  const trigger = useKonamiCode();
  return (
    <div className="relative min-h-[200px] flex items-center justify-center">
      <div className="text-center p-8 bg-gradient-to-br from-yellow-50 via-white to-orange-50 rounded-2xl border border-yellow-100 max-w-md mx-4">
        <h3 className="text-2xl font-bold text-yellow-700 mb-4">🎮 Option 3 : Code Konami</h3>
        <p className="text-gray-600 mb-4">Entre le code classique :</p>
        <kbd className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-yellow-200 rounded text-sm font-mono text-yellow-800 shadow-sm">
          ↑ ↑ ↓ ↓ ← → ← → B A
        </kbd>
        <div className={`mt-4 inline-block px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          trigger ? "bg-yellow-100 text-yellow-800 animate-pulse" : "bg-gray-100 text-gray-500"
        }`}>
          {trigger ? "🎊 EASTER EGG ACTIVÉ !" : "🔒 En attente..."}
        </div>
      </div>
      <BurstTrigger trigger={trigger} />
    </div>
  );
}

export default function MoJSTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-red-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-600 via-red-600 to-yellow-500 bg-clip-text text-transparent mb-4">
            mo.js Animation Test
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Trois façons de déclencher l'animation <strong>"I Love You Jésus"</strong> avec mo.js
          </p>
        </header>

        <nav className="flex justify-center gap-4 mb-12 flex-wrap">
          <Link href="#option1" className="px-4 py-2 bg-white border border-pink-200 rounded-lg text-pink-700 hover:bg-pink-50 transition">Option 1</Link>
          <Link href="#option2" className="px-4 py-2 bg-white border border-yellow-200 rounded-lg text-yellow-700 hover:bg-yellow-50 transition">Option 2</Link>
          <Link href="#option3" className="px-4 py-2 bg-white border border-orange-200 rounded-lg text-orange-700 hover:bg-orange-50 transition">Option 3</Link>
        </nav>

        <section id="option1" className="mb-20 scroll-mt-24">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-pink-100">
            <h2 className="text-2xl font-bold text-pink-700 mb-6 text-center">🖱️ Option 1 : Déclencheur Manuel (Clic Bouton)</h2>
            <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
              Idéal pour un bouton <strong>"J'aime Jésus"</strong>, une action utilisateur explicite,
              ou une célébration après une action (prière envoyée, témoignage partagé, etc.)
            </p>
            <div className="flex justify-center min-h-[200px]">
              <Option1Button />
            </div>
          </div>
        </section>

        <section id="option2" className="mb-20 scroll-mt-24">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-yellow-100">
            <h2 className="text-2xl font-bold text-yellow-700 mb-6 text-center">📜 Option 2 : Au Scroll (IntersectionObserver)</h2>
            <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
              Parfait pour une section héro, un témoignage, ou un verset clé.
              L'animation se déclenche <strong>une seule fois</strong> quand l'élément devient visible.
            </p>
            <Option2Scroll />
          </div>
        </section>

        <section id="option3" className="mb-20 scroll-mt-24">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-orange-100">
            <h2 className="text-2xl font-bold text-orange-700 mb-6 text-center">🎮 Option 3 : Easter Egg (Code Konami)</h2>
            <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
              Amusant pour une surprise cachée ! Le code classique ↑↑↓↓←→←→BA
              déclenche l'animation n'importe où sur la page.
            </p>
            <Option3Konami />
          </div>
        </section>

                <section id="option4" className="mb-20 scroll-mt-24">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-pink-100">
            <h2 className="text-2xl font-bold text-pink-700 mb-6 text-center">💖 I Love You Jésus Animation</h2>
            <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
              Cliquez le bouton pour déclencher une animation mo.js pleine d'amour.
            </p>
            <ILoveYouJesusAnimation />
          </div>
        </section>
        <footer className="text-center text-gray-500 mt-12 pt-8 border-t border-pink-100">
          <p className="mb-2">Intégration mo.js dans <strong>G12 Paris Infos Médias</strong></p>
          <p className="text-sm">React 19 + TypeScript + Tailwind CSS 4 + Vite 7</p>
        </footer>
      </div>
    </div>
  );
}