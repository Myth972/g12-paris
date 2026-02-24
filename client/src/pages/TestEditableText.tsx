import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditableText, EditableSection } from '@/components/EditableText';
import { useAuth } from '@/_core/hooks/useAuth';
import { AlertCircle } from 'lucide-react';

function TestEditableText() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Test EditableText - G12 Paris</title>
      </Helmet>

      <section className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">🧪 Test EditableText Component</h1>

        {!user ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Connexion requise</h3>
              <p className="text-amber-800">
                Veuillez vous connecter pour tester l'édition. Les admins verront l'icône d'édition ✏️
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Connecté en tant que: {user.email}</h3>
              <p className="text-blue-800">
                {user.role === 'admin' ? '✅ Vous êtes ADMIN - Vous pouvez éditer les textes!' : '❌ Vous êtes utilisateur - Édition désactivée'}
              </p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Test 1: Single-line EditableText */}
          <Card>
            <CardHeader>
              <CardTitle>Test 1: Single-line (as="h2")</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {user?.role === 'admin' ? 'Survolez le titre et cliquez sur ✏️ pour éditer' : 'Pas d\'accès en édition'}
              </p>
              <EditableText
                value="Ceci est un titre éditable"
                pageId="test"
                fieldName="singleLineTitle"
                as="h2"
                className="text-2xl font-bold mb-4"
              />
            </CardContent>
          </Card>

          {/* Test 2: Multi-line EditableText */}
          <Card>
            <CardHeader>
              <CardTitle>Test 2: Multi-line (rows=3)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {user?.role === 'admin' ? 'Cliquez sur ✏️ pour éditer sur plusieurs lignes' : 'Pas d\'accès en édition'}
              </p>
              <EditableText
                value="Ceci est un texte sur plusieurs lignes. Il peut contenir plusieurs phrases. Modifiez-le en tant qu'admin!"
                pageId="test"
                fieldName="multiLineText"
                as="p"
                rows={3}
                className="text-base leading-relaxed"
              />
            </CardContent>
          </Card>

          {/* Test 3: Paragraph */}
          <Card>
            <CardHeader>
              <CardTitle>Test 3: Paragraph (as="p")</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paragraphe éditable avec texte standard
              </p>
              <EditableText
                value="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                pageId="test"
                fieldName="paragraph"
                as="p"
                className="text-sm text-muted-foreground leading-relaxed"
              />
            </CardContent>
          </Card>

          {/* Test 4: Heading H1 */}
          <Card>
            <CardHeader>
              <CardTitle>Test 4: Heading (as="h1")</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Grand titre éditable
              </p>
              <EditableText
                value="Grand Titre Principal"
                pageId="test"
                fieldName="mainHeading"
                as="h1"
                className="text-5xl font-bold"
              />
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📋 Instructions de Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-1">✅ Cas de test 1: Édition Simple</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Survolez le "Ceci est un titre éditable" (Test 1)</li>
                <li>Cliquez sur l'icône ✏️ qui apparaît</li>
                <li>Modifiez le texte dans l'input</li>
                <li>Cliquez "Sauvegarder"</li>
                <li>Vérifiez que le toast "Texte mis à jour!" s'affiche</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-1">✅ Cas de test 2: Édition Multi-ligne</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Cliquez sur l'icône ✏️ du Test 2</li>
                <li>Modifiez le contenu sur plusieurs lignes</li>
                <li>Vérifiez que les sauts de ligne sont conservés</li>
                <li>Testez l'annulation (bouton ❌)</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-1">✅ Cas de test 3: Persistence</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Modifiez Test 1 et sauvegardez</li>
                <li>Rafraîchissez la page (F5)</li>
                <li>Vérifiez que vos modifications persistent (Note: actuellement en-mémoire)</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default TestEditableText;
