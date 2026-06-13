// mojs est chargé depuis un script CDN dans index.html.
// window.mojs est null au moment de l'import — les composants
// utilisent un polling pour attendre le chargement (voir ILoveYouJesus.tsx).

const mojs = typeof window !== "undefined" ? (window as any).mojs : null;

export default mojs;
