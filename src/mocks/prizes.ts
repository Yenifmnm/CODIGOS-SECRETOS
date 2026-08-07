import type { Prize } from '../types/promo';

import premio1 from '../assets/prizes/premio-1.webp';
import premio2 from '../assets/prizes/premio-2.webp';
import premio3 from '../assets/prizes/premio-3.webp';
import premio4 from '../assets/prizes/premio-4.webp';
import premio5 from '../assets/prizes/premio-5.webp';
import nintendoSwitch from '../assets/prizes/nintendo-switch.webp';
import playstation from '../assets/prizes/playstation.webp';
import auriculares from '../assets/prizes/auriculares.webp';

/**
 * MOCK. El backend expondrá este catálogo vía `promoApi.getPrizes()`.
 * Las imágenes son los assets originales del Figma.
 */
export const MOCK_PRIZES: Prize[] = [
  { id: 'nintendo-switch', name: 'Nintendo Switch', image: premio1 },
  { id: 'playstation-5', name: 'PlayStation 5', image: premio2 },
  { id: 'viaje-caribe', name: 'Viaje al Caribe', image: premio3 },
  { id: 'bicicleta', name: 'Bicicleta', image: premio4 },
  { id: 'auriculares', name: 'Auriculares gamer', image: premio5 },
];

/** Premios que asoman del cofre en el hover del Home (sólo decorativo). */
export const MOCK_CHEST_PREVIEW: Prize[] = [
  { id: 'preview-switch', name: 'Nintendo Switch', image: nintendoSwitch },
  { id: 'preview-ps', name: 'PlayStation', image: playstation },
  { id: 'preview-auris', name: 'Auriculares', image: auriculares },
];
