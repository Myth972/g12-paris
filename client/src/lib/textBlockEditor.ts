/**
 * Contrat des éditeurs de textes de la page Convention.
 *
 * Ces panneaux ne s'enregistrent pas eux-mêmes : ils détiennent leur état et
 * exposent `save()`, appelé par le bouton unique de la section Convention
 * (Admin → Design). Une seule action pour les réglages et les textes.
 */
export type TextBlockEditorHandle = { save: () => Promise<void> };
