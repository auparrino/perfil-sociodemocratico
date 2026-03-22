/**
 * Utilities for ordinal sorting and short-label extraction of Latinobarómetro responses.
 */

// ─── Short labels ────────────────────────────────────────────────────────────
// Many response labels have a short form in braces: "La democracia es preferible... {Democracia}"
// Extract the short form if present, otherwise return the original.

// Known abbreviations for common long Latinobarómetro response labels.
// Key: substring to match (case-insensitive). Value: short display name.
const KNOWN_SHORT: [string, string][] = [
  // Apoyo a la democracia
  ['La democracia es preferible a cualquier otra forma de gobierno', 'Democracia preferible'],
  ['un gobierno autoritario puede ser preferible', 'Gob. autoritario preferible'],
  ['nos da lo mismo un régimen democrático', 'Da lo mismo'],
  // Confianza interpersonal
  ['Se puede confiar en la mayoría de las personas', 'Se puede confiar'],
  ['Uno nunca es lo suficientemente cuidadoso', 'Nunca sufic. cuidadoso'],
  // EEUU
  ['EE.UU está tratando de dominar el mundo', 'Dominar el mundo'],
  ['EE.UU juega un rol constructivo', 'Rol constructivo'],
  // Democracia sin partidos / Congreso
  ['Sin partidos políticos no puede haber democracia', 'No puede sin partidos'],
  ['La democracia puede funcionar sin partidos', 'Puede sin partidos'],
  ['Sin Congreso Nacional no puede haber democracia', 'No puede sin Congreso'],
  ['La democracia puede funcionar sin Congreso', 'Puede sin Congreso'],
  // Gob. militar
  ['Apoyaría a un gobierno militar en reemplazo', 'Apoyaría gob. militar'],
  ['En ninguna circunstancia apoyaría a un gobierno militar', 'No apoyaría gob. militar'],
  // Bienestar
  ['El gobierno debe asumir la responsabilidad del bienestar', 'Responsabilidad del gob.'],
  ['Cada cual se debe hacer cargo de su propia bienestar', 'Responsabilidad individual'],
  // Voto
  ['La manera como uno vota puede hacer que las cosas sean', 'El voto hace diferencia'],
  ['No importa como uno vote, no hará que las cosas sean mejor', 'El voto no importa'],
  // Redes sociales
  ['Las redes sociales permiten que uno participe en política', 'Redes: permiten participar'],
  ['Las redes sociales crean la ilusión que uno está participando', 'Redes: ilusión'],
  ['Las redes sociales  no sirven para participar', 'Redes: no sirven'],
  // Libertad de expresión vs info falsa
  ['Hay que controlar la publicación de información falsa', 'Controlar info falsa'],
  ['Se debe garantizar la libertad de expresión sin importar', 'Garantizar lib. expresión'],
  // Medio ambiente vs economía
  ['A la lucha contra el cambio climático', 'Prioridad clima'],
  ['Al crecimiento económico sin importar', 'Prioridad economía'],
  // Integración
  ['Todos los grupos y partidos tienen iguales posibilidades', 'Iguales posibilidades'],
  ['Todos los grupos y partidos no tienen iguales posibilidades', 'Sin iguales posibilidades'],
  // Credibilidad
  ['La política ha perdido credibilidad y no la recuperara', 'Perdió credibilidad'],
  ['Cada cual tiene la oportunidad de recuperar la credibilidad', 'Puede recuperar'],
  // Política complicada
  ['La política es tan complicada que no se entiende', 'No se entiende'],
  ['La política no es tan complicada y se entiende', 'Se entiende'],
  // Democracia indispensable
  ['Democracia es indispensable para ser país desarrollado', 'Democracia indispensable'],
  ['No es indispensable', 'No es indispensable'],
  // Ley
  ['El Estado logra que se cumplan todas las leyes', 'Se cumplen las leyes'],
  ['El estado logra que se cumplan todas las leyes', 'Se cumplen las leyes'],
  ['El Estado no logra que se cumpla ninguna ley', 'No se cumplen'],
  ['El estado no logra que se cumpla ninguna ley', 'No se cumplen'],
  // Sociedad ordenada vs libertades
  ['Prefiero vivir en una sociedad donde se respeten todos los derechos', 'Derechos y libertades'],
  ['Prefiero vivir en una sociedad ordenada aunque se limiten', 'Sociedad ordenada'],
];

export function shortLabel(s: string): string {
  // 1. Check for {braces} short form
  const m = s.match(/\{([^}]+)\}\s*$/);
  if (m) return m[1].trim();

  // 2. Check known abbreviations
  const lower = s.toLowerCase();
  for (const [pattern, short] of KNOWN_SHORT) {
    if (lower.includes(pattern.toLowerCase())) return short;
  }

  return s;
}

// ─── NS/NC detection ─────────────────────────────────────────────────────────
const NS_NC_PATTERNS = [
  'No sabe', 'No contesta', 'No responde', 'NS/NR', 'No sabe/No contesta',
  'No sabe / No contesta', 'No answer', 'No aplicable', 'Refused',
];

export function isNsNc(key: string): boolean {
  const norm = key.replace(/\s*\{[^}]*\}\s*$/, '').trim();
  return NS_NC_PATTERNS.some(p => norm === p || norm.includes(p));
}

// ─── Ordinal scale definitions ───────────────────────────────────────────────
// Each scale defines keywords in order from "most positive" to "most negative".
// We match response keys by checking if they contain/start with these keywords.

interface OrdinalScale {
  id: string;
  /** Ordered keywords (positive → negative). Each is matched case-insensitively. */
  keywords: string[];
}

const ORDINAL_SCALES: OrdinalScale[] = [
  // Confianza institucional (full form)
  { id: 'trust', keywords: ['Mucha confianza', 'Algo de confianza', 'Poca confianza', 'Ninguna confianza'] },
  // Confianza (short form: Mucha/Algo/Poca/Ninguna)
  { id: 'trust_short', keywords: ['Mucha', 'Algo', 'Poca', 'Ninguna'] },
  // Economía: Muy buena → Muy mala (5 niveles con Regular)
  { id: 'economy_5', keywords: ['Muy buena', 'Buena', 'Regular', 'Mala', 'Muy mala'] },
  // Economía: Buena/Mala (4 niveles sin Regular)
  { id: 'economy_4', keywords: ['Muy buena', 'Buena', 'Mala', 'Muy mala'] },
  // Satisfacción (variantes: Bastante/Más bien)
  { id: 'satisfaction', keywords: ['Muy satisfecho', 'Bastante satisfecho', 'Más bien satisfecho', 'No muy satisfecho', 'Nada satisfecho', 'Para nada satisfecho'] },
  // Cambio temporal: Mucho mejor → Mucho peor
  { id: 'change', keywords: ['Mucho mejor', 'Un poco mejor', 'Igual', 'Casi igual', 'Un poco peor', 'Mucho peor'] },
  // Acuerdo/Desacuerdo
  { id: 'agreement', keywords: ['Muy de acuerdo', 'De acuerdo', 'En desacuerdo', 'Muy en desacuerdo'] },
  // Progreso del país
  { id: 'progress', keywords: ['Está progresando', 'Está estancado', 'Está en retroceso'] },
  // Relaciones internacionales (Más bien buenas/malas)
  { id: 'relations', keywords: ['Muy buenas', 'Más bien buenas', 'Más bien malas', 'Muy malas'] },
  // Favorable/Desfavorable (opinión EEUU, China, UE)
  { id: 'favorable', keywords: ['Muy favorable', 'Algo favorable', 'Algo desfavorable', 'Muy desfavorable'] },
  // Interés en la política
  { id: 'interested', keywords: ['Muy interesado', 'Algo interesado', 'Poco interesado', 'Nada Interesado', 'Nada interesado'] },
  // Justicia distribución del ingreso
  { id: 'justice', keywords: ['Muy justa', 'Justa', 'Injusta', 'Muy injusta'] },
  // Garantías (libertad de expresión etc.)
  { id: 'guarantees', keywords: ['Completamente garantizadas', 'Algo garantizadas', 'Poco garantizadas', 'Para nada garantizadas'] },
  // A favor / en contra (integración LA)
  { id: 'favor', keywords: ['Muy a favor', 'Algo a favor', 'Algo en contra', 'Muy en contra', 'Muy en Contra'] },
  // Intensidad: Mucho/Bastante/Poco/Nada (ciudadanos cumplen ley, corrupción, etc.)
  { id: 'intensity', keywords: ['Mucho', 'Bastante', 'Algo', 'Poco', 'Nada'] },
  // Variación corrupción
  { id: 'variation', keywords: ['Aumentó mucho', 'Aumentó algo', 'Se ha mantenido igual', 'Disminuyó algo', 'Disminuyó mucho'] },
  // Más/Igual/Menos (democrático, corrupto, etc.)
  { id: 'more_less', keywords: ['Más', 'Igual', 'Menos'] },
  // Necesidad de mejora
  { id: 'reform', keywords: ['Está bien como está', 'Puede mejorarse con pequeños cambios', 'Necesita reformas profundas', 'Debe cambiarse radicalmente'] },
];

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/**
 * Try to detect an ordinal scale from a set of response keys.
 * Returns ordered keys (substantive first, then NS/NC) or null if no scale detected.
 */
export function detectOrdinalOrder(keys: string[]): string[] | null {
  // Separate NS/NC from substantive keys
  const substantive = keys.filter(k => !isNsNc(k));
  const nsNc = keys.filter(k => isNsNc(k));

  if (substantive.length < 2) return null;

  // Check numeric scale first (1-10 etc.) - handles "1", "2", ... "10" and "1 No es democrático"
  const parseLeadingNum = (s: string) => { const m = s.match(/^(\d+)/); return m ? parseInt(m[1]) : NaN; };
  const numericKeys = substantive.filter(k => !isNaN(parseLeadingNum(k)));
  if (numericKeys.length > substantive.length / 2) {
    const sorted = [...substantive].sort((a, b) => {
      const na = parseLeadingNum(a), nb = parseLeadingNum(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      if (!isNaN(na)) return -1;
      if (!isNaN(nb)) return 1;
      return a.localeCompare(b);
    });
    return [...sorted, ...nsNc];
  }

  // Try each ordinal scale
  for (const scale of ORDINAL_SCALES) {
    const matched = tryMatchScale(substantive, scale.keywords);
    if (matched) {
      return [...matched, ...nsNc];
    }
  }

  return null;
}

function tryMatchScale(keys: string[], scaleKeywords: string[]): string[] | null {
  // For each scale keyword, find the matching response key
  const orderedMatches: string[] = [];
  const usedKeys = new Set<string>();

  for (const keyword of scaleKeywords) {
    const normKw = normalize(keyword);
    const match = keys.find(k => {
      if (usedKeys.has(k)) return false;
      const normK = normalize(k.replace(/\s*\{[^}]*\}\s*$/, ''));
      return normK === normKw || normK.startsWith(normKw) || normK.includes(normKw);
    });
    if (match) {
      orderedMatches.push(match);
      usedKeys.add(match);
    }
  }

  // Need at least 50% of scale keywords to match for it to count
  if (orderedMatches.length < Math.ceil(scaleKeywords.length * 0.5)) return null;
  // Also need to cover most of the substantive keys
  if (orderedMatches.length < keys.length * 0.5) return null;

  // Add any unmatched substantive keys at the end
  const unmatched = keys.filter(k => !usedKeys.has(k));
  return [...orderedMatches, ...unmatched];
}

/**
 * Order response keys: ordinal if detected, otherwise by value descending.
 * NS/NC always goes to the end.
 */
export function orderResponseKeys(
  keys: string[],
  getAvgValue?: (key: string) => number,
): string[] {
  const ordinal = detectOrdinalOrder(keys);
  if (ordinal) return ordinal;

  // Fallback: sort substantive by value desc, NS/NC at end
  const substantive = keys.filter(k => !isNsNc(k));
  const nsNc = keys.filter(k => isNsNc(k));

  if (getAvgValue) {
    substantive.sort((a, b) => getAvgValue(b) - getAvgValue(a));
  }

  return [...substantive, ...nsNc];
}
