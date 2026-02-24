# 🎨 Guide d'Utilisation SimpleLayoutCustomizer

## Vue d'ensemble

SimpleLayoutCustomizer est un outil de personnalisation **ultra-simplifié** pour les débutants. Il permet de créer et gérer les mises en page du tableau de bord en seulement **4 étapes simples**.

### 📊 Complexité vs Puissance

```
SimpleLayoutCustomizer (Mode Débutant)
  Complexité: 2/10  ⭐⭐
  Apprentissage: ~2 minutes
  Cas d'usage: Débutants, utilisation basique

LayoutEditor (Mode Expert)
  Complexité: 6.5/10  ⭐⭐⭐⭐⭐⭐
  Apprentissage: ~10 minutes
  Cas d'usage: Utilisateurs avancés, personnalisation fine
```

---

## 🚀 Accès au SimpleLayoutCustomizer

### Via le menu utilisateur
1. Cliquez sur votre **profil** (en haut à droite)
2. Sélectionnez **🎨 Personnalisation**
3. Vous arrivez sur la page SimpleLayoutCustomizer

### Lien direct
```
http://localhost:3001/personalization-simple
```

---

## 📝 Les 4 Étapes pour Créer un Layout

### **Étape 1️⃣: Nom du Layout**

Donnez un nom descriptif à votre mise en page.

**Exemples:**
- "Ma mise en page quotidienne"
- "Vue compacte des articles"
- "Galerie photos"

```
✅ Bon: "Actualités principales"
❌ Mauvais: "xyz" (trop vague)
```

---

### **Étape 2️⃣: Sélectionner un Template**

Choisissez parmi 4 templates pré-conçus:

#### 🎯 **Grid** (Grille)
- Affiche les articles en **grille de cartes**
- Idéal pour: articles avec images
- Vue: 3-4 colonnes par défaut

```
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Article │ │ Article │ │ Article │
│  avec   │ │  avec   │ │  avec   │
│ image   │ │ image   │ │ image   │
└─────────┘ └─────────┘ └─────────┘
```

#### 📋 **List** (Listе)
- Affiche les articles en **liste verticale**
- Idéal pour: articles texte-heavy
- Vue: titre + description condensée

```
▶ Titre article 1
  Description courte...

▶ Titre article 2
  Description courte...
```

#### 📰 **Magazine** (Magazine)
- Affiche un **grand article principal** + grille d'articles secondaires
- Idéal pour: faire ressortir une article vedette
- Vue: 1 gros + plusieurs petits

```
┌────────────────────────┐
│  ARTICLE PRINCIPAL     │
│      (large)           │
└────────────────────────┘
┌────────┐ ┌────────┐
│Article │ │Article │
└────────┘ └────────┘
```

#### 📺 **Timeline** (Chronologie)
- Affiche les articles en **ordre chronologique**
- Idéal pour: suivre les événements dans le temps
- Vue: frise chronologique verticale

```
● Aujourd'hui
  └─ Article 1

● Hier
  └─ Article 2
  └─ Article 3
```

---

### **Étape 3️⃣: Options de Personnalisation**

Ajustez 3 paramètres simples:

#### **Mode d'affichage** 🎨
```
○ Cartes   → Affiche chaque article en carte (défaut)
○ Liste    → Affiche en liste simple
○ Minimaliste → Affiche titre + date seulement
```

#### **Nombre de colonnes** 📏
```
1 colonne    → Plein écran, articles géants
2 colonnes   → Vue paire/pair
3 colonnes   → Vue équilibrée
4 colonnes   → Vue compacte (petits écrans)
```

#### **Articles par page** 📄
```
6  articles  → Une page légère
12 articles  → Vue standard
24 articles  → Vue chargée (scroll important)
```

---

### **Étape 4️⃣: Résumé et Confirmation**

Vérifiez avant de sauvegarder:

```
📋 Résumé de votre layout

Nom:  "Actualités principales"
Template: Grid
Mode: Cartes
Colonnes: 3
Articles/page: 12

[✅ Sauvegarder]  [❌ Annuler]
```

---

## 💾 Gérer vos Layouts

### Sur la page de Personnalisation

#### **Affichage des Layouts**
Tous vos layouts créés s'affichent sous forme de cartes:

```
┌─────────────────────────┐
│ 🎨 Actualités principales
│
│ Grid • 3 colonnes • 12/page
│
│ [★ Activer]  [🗑 Supprimer]
└─────────────────────────┘
```

#### **Actions disponibles**

✅ **Activer** (★)
- Rend ce layout actif pour votre tableau de bord
- Charge vos paramètres personnalisés
- Vous voyez le dashboard avec ce layout

❌ **Supprimer** (🗑)
- Supprime définitivement ce layout
- ⚠️ Action irréversible
- Confirmation demandée

---

## 🎯 Cas d'Usage & Exemples

### Cas 1️⃣: Je suis pressé et je veux juste lire les titres
```
Template: List
Mode: Minimaliste
Colonnes: 1
Articles/page: 6
```

### Cas 2️⃣: Je veux une vue galerie avec beaucoup de visuels
```
Template: Grid
Mode: Cartes
Colonnes: 4
Articles/page: 24
```

### Cas 3️⃣: Je veux une mise en avant une article importante
```
Template: Magazine
Mode: Cartes
Colonnes: 3
Articles/page: 12
```

### Cas 4️⃣: Je suis adepte de la chronologie
```
Template: Timeline
Mode: Cartes
Colonnes: 1
Articles/page: 12
```

---

## ❓ FAQ

### Q: Comment puis-je avoir plusieurs layouts?
**R:** Créez autant de layouts que vous voulez! Vous pouvez en avoir 5, 10, ou plus. Cliquez sur "Créer un nouveau layout" chaque fois.

### Q: Puis-je modifier un layout après l'avoir créé?
**R:** Actuellement, vous devez le supprimer et en créer un nouveau. (Amélioration prévue pour plus tard)

### Q: Comment activer un layout?
**R:** Cliquez sur le bouton **★ Activer** sur la carte du layout.

### Q: Quel est le layout par défaut?
**R:** Le dernier layout que vous avez marqué comme "actif". Sinon, Grid 3 colonnes.

### Q: Puis-je exporter mes layouts?
**R:** Non actuellement, mais c'est prévu! (Feature future)

### Q: Que se passe-t-il si je supprime tous mes layouts?
**R:** Le système revient au layout par défaut (Grid).

---

## 🔧 Réglages Avancés (Mode Expert)

Si vous trouvez SimpleLayoutCustomizer trop basique, vous pouvez accéder au mode expert:

```
http://localhost:3001/personalization
```

⚠️ **Attention:** Mode Expert beaucoup plus complexe (drag-drop, configuration fine, etc.)

---

## 💡 Conseils & Bonnes Pratiques

### ✅ À faire
- Créez des noms descriptifs pour vos layouts
- Commencez simple, puis ajustez les paramètres
- Testez différents templates pour voir lequel vous convient
- Activez un layout différent selon votre besoin du moment

### ❌ À éviter
- Ne pas créer 50+ layouts inutiles
- Ne pas utiliser 24 articles/page si vous avez une petite batterie 🔋
- Ne pas créer une layout et l'oublier sans l'activer

---

## 🐛 Troubleshooting

### Le bouton "Sauvegarder" ne répond pas
**Solution:** Vérifiez que vous avez rempli **tous les champs** (nom, template, options)

### Je ne vois pas le layout que j'ai créé
**Solution:** Rechargez la page (F5 ou Ctrl+R)

### Le layout n'apparaît pas sur le dashboard
**Solution:** Assurez-vous de l'avoir **activé** (bouton ★)

### Mon layout est trop chargé
**Solution:** Réduisez le nombre d'articles par page ou le nombre de colonnes

---

## 📞 Support

Besoin d'aide? Contactez l'équipe développement avec:
- Le nom de votre layout
- Les paramètres que vous avez choisis
- Ce que vous essayiez de faire

---

**Version:** 1.0  
**Dernière mise à jour:** 23 Février 2026  
**Complexité:** Débutant (2/10)

Bon layout! 🎨✨
