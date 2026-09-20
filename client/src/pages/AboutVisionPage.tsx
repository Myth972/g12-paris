import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Reveal, staggerContainer, staggerItem } from "@/components/Reveal";
import { motion } from "framer-motion";
import { Eye, Target, Heart, BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AboutVisionPage() {
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const s = settingsQuery.data || {};

  const heroTitle = (s["vision.heroTitle"] as string) || "Équiper les croyants par la force de la Parole";
  const heroSubtitle = (s["vision.heroSubtitle"] as string) || "Nous croyons que chaque livre, chaque étude, chaque Bible que nous diffusons est une semence pour l'éternité.";
  const heroBadge = (s["vision.heroBadge"] as string) || "Notre Vision";
  const heroBg = (s["vision.heroBg"] as string) || "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=2000";

  const missionTitle = (s["vision.missionTitle"] as string) || "Notre Mission";
  const missionText = (s["vision.missionText"] as string) || "Notre mission n'est pas simplement de vendre des livres, mais de fournir des ressources spirituelles de haute qualité qui transforment les vies, renouvellent les intelligences et affermissent la foi de l'Église francophone.";
  const missionWhyTitle = (s["vision.whyTitle"] as string) || "Pourquoi proposer ces livres ?";
  const missionWhyText = (s["vision.whyText"] as string) || "Dans un monde saturé d'informations, il est crucial de s'ancrer dans la vérité. Nous sélectionnons rigoureusement chaque ouvrage de notre bibliothèque pour son orthodoxie biblique, sa profondeur spirituelle et son utilité pratique pour la vie chrétienne.";
  const missionImage = (s["vision.missionImage"] as string) || "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1000";

  const valuesTitle = (s["vision.valuesTitle"] as string) || "Nos Valeurs Fondamentales";

  const value1Title = (s["vision.value1Title"] as string) || "Fidélité Biblique";
  const value1Text = (s["vision.value1Text"] as string) || "Nous nous engageons à diffuser des ressources qui respectent l'autorité et l'inerrance de la Parole de Dieu. La Bible est notre boussole absolue.";
  const value1Color = (s["vision.value1Color"] as string) || "blue";

  const value2Title = (s["vision.value2Title"] as string) || "Excellence";
  const value2Text = (s["vision.value2Text"] as string) || "Que ce soit dans le choix du cuir d'une Bible ou dans le service client, nous visons l'excellence pour honorer Dieu dans tout ce que nous faisons.";
  const value2Color = (s["vision.value2Color"] as string) || "amber";

  const value3Title = (s["vision.value3Title"] as string) || "Cœur pour l'Église";
  const value3Text = (s["vision.value3Text"] as string) || "Notre but ultime est d'édifier le Corps du Christ. Nous travaillons en partenariat avec les églises locales pour équiper les saints.";
  const value3Color = (s["vision.value3Color"] as string) || "red";

  const ctaTitle = (s["vision.ctaTitle"] as string) || "Prêt à approfondir votre foi ?";
  const ctaText = (s["vision.ctaText"] as string) || "Parcourez notre catalogue et découvrez les ressources que nous avons soigneusement sélectionnées pour vous.";

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-500",
    amber: "bg-amber-500/10 text-amber-500",
    red: "bg-red-500/10 text-red-500",
    green: "bg-green-500/10 text-green-500",
    purple: "bg-purple-500/10 text-purple-500",
    primary: "bg-primary/10 text-primary",
  };

  const valueIcons = [BookOpen, Eye, Heart];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <Reveal variant="fadeDown" duration={0.7}>
      <section className="relative py-24 lg:py-32 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=2000')] bg-cover bg-center opacity-30 mix-blend-overlay" style={heroBg ? { backgroundImage: `url('${heroBg}')` } : undefined} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
        
        <div className="container relative z-10 text-center text-white">
          <span className="text-amber-400 font-bold tracking-widest uppercase text-sm mb-6 block">
            {heroBadge}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 max-w-4xl mx-auto leading-tight">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
            {heroSubtitle}
          </p>
        </div>
      </section>
      </Reveal>

      {/* Mission & Pourquoi */}
      <Reveal variant="fadeUp" delay={0.1}>
      <section className="py-20">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-serif font-bold">{missionTitle}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {missionText}
              </p>
              
              <h3 className="text-xl font-bold mt-8 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> {missionWhyTitle}
              </h3>
              <p className="text-muted-foreground">
                {missionWhyText}
              </p>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-2xl transform translate-x-4 translate-y-4" />
              <img 
                src={missionImage} 
                alt="Bible ouverte sur une table" 
                className="relative z-10 rounded-2xl shadow-xl w-full object-cover aspect-[4/5]"
              />
            </div>
          </div>
        </div>
      </section>
      </Reveal>

      {/* Nos Valeurs */}
      <Reveal variant="fadeUp" delay={0.1}>
      <section className="py-20 bg-muted/30 border-t">
        <div className="container max-w-6xl text-center">
          <h2 className="text-3xl font-serif font-bold mb-16">{valuesTitle}</h2>
          
          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {[
              { title: value1Title, text: value1Text, color: value1Color, Icon: valueIcons[0] },
              { title: value2Title, text: value2Text, color: value2Color, Icon: valueIcons[1] },
              { title: value3Title, text: value3Text, color: value3Color, Icon: valueIcons[2] },
            ].map((v, i) => (
              <motion.div key={i} className="bg-card p-8 rounded-2xl border shadow-sm hover:border-primary/50 transition-colors" variants={staggerItem}>
                <div className={`w-16 h-16 ${colorMap[v.color] || colorMap.blue} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                  <v.Icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-4">{v.title}</h3>
                <p className="text-muted-foreground">{v.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      </Reveal>

      {/* CTA */}
      <Reveal variant="fadeUp" delay={0.1}>
      <section className="py-24 relative text-center">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-serif font-bold mb-6">{ctaTitle}</h2>
          <p className="text-lg text-muted-foreground mb-8">
            {ctaText}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild className="rounded-full px-8 shadow-lg shadow-primary/20">
              <Link href="/bibliotheque/catalogue">Explorer la bibliothèque</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full px-8 backdrop-blur-sm">
              <Link href="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </section>
      </Reveal>
    </div>
  );
}
