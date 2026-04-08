/**
 * Utilities for ordinal sorting and short-label extraction of Latinobarómetro responses.
 */

// ─── Short labels ────────────────────────────────────────────────────────────
// Many response labels have a short form in braces: "La democracia es preferible... {Democracia}"
// Extract the short form if present, otherwise return the original.

// Known abbreviations for common long Latinobarómetro response labels.
// Key: substring to match (case-insensitive). Value: short display name.
const KNOWN_SHORT: [string, string][] = [
  // Democracy support (English)
  ['Democracy is preferable to any other form of government', 'Democracy preferable'],
  ['an authoritarian government may be preferable', 'Authoritarian pref.'],
  ['it makes no difference whether we have a democratic', 'Indifferent'],
  // Democracy support (Spanish fallback)
  ['La democracia es preferible a cualquier otra forma de gobierno', 'Democracy preferable'],
  ['un gobierno autoritario puede ser preferible', 'Authoritarian pref.'],
  ['nos da lo mismo un régimen democrático', 'Indifferent'],
  // Interpersonal trust
  ['Se puede confiar en la mayoría de las personas', 'Can trust most people'],
  ['Uno nunca es lo suficientemente cuidadoso', 'Never careful enough'],
  // US
  ['EE.UU está tratando de dominar el mundo', 'Dominate the world'],
  ['EE.UU juega un rol constructivo', 'Constructive role'],
  // Democracy without parties / Congress
  ['Sin partidos políticos no puede haber democracia', 'Cannot without parties'],
  ['La democracia puede funcionar sin partidos', 'Can without parties'],
  ['Sin Congreso Nacional no puede haber democracia', 'Cannot without Congress'],
  ['La democracia puede funcionar sin Congreso', 'Can without Congress'],
  // Military gov
  ['Apoyaría a un gobierno militar en reemplazo', 'Would support military gov.'],
  ['En ninguna circunstancia apoyaría a un gobierno militar', 'Would not support military gov.'],
  // Welfare
  ['El gobierno debe asumir la responsabilidad del bienestar', 'Gov. responsibility'],
  ['Cada cual se debe hacer cargo de su propia bienestar', 'Individual responsibility'],
  // Vote
  ['La manera como uno vota puede hacer que las cosas sean', 'Vote makes a difference'],
  ['No importa como uno vote, no hará que las cosas sean mejor', 'Vote doesn\'t matter'],
  // Social media
  ['Las redes sociales permiten que uno participe en política', 'Social media: enables participation'],
  ['Las redes sociales crean la ilusión que uno está participando', 'Social media: illusion'],
  ['Las redes sociales  no sirven para participar', 'Social media: useless'],
  // Freedom of expression vs fake news
  ['Hay que controlar la publicación de información falsa', 'Control fake info'],
  ['Se debe garantizar la libertad de expresión sin importar', 'Guarantee free speech'],
  // Environment vs economy
  ['A la lucha contra el cambio climático', 'Climate priority'],
  ['Al crecimiento económico sin importar', 'Economy priority'],
  // Integration
  ['Todos los grupos y partidos tienen iguales posibilidades', 'Equal opportunities'],
  ['Todos los grupos y partidos no tienen iguales posibilidades', 'Unequal opportunities'],
  // Credibility
  ['La política ha perdido credibilidad y no la recuperara', 'Lost credibility'],
  ['Cada cual tiene la oportunidad de recuperar la credibilidad', 'Can recover'],
  // Politics complicated
  ['La política es tan complicada que no se entiende', 'Too complicated'],
  ['La política no es tan complicada y se entiende', 'Understandable'],
  // Democracy indispensable
  ['Democracia es indispensable para ser país desarrollado', 'Democracy indispensable'],
  ['No es indispensable', 'Not indispensable'],
  // Law
  ['El Estado logra que se cumplan todas las leyes', 'Laws enforced'],
  ['El estado logra que se cumplan todas las leyes', 'Laws enforced'],
  ['El Estado no logra que se cumpla ninguna ley', 'Laws not enforced'],
  ['El estado no logra que se cumpla ninguna ley', 'Laws not enforced'],
  // Ordered society vs freedoms
  ['Prefiero vivir en una sociedad donde se respeten todos los derechos', 'Rights & freedoms'],
  ['Prefiero vivir en una sociedad ordenada aunque se limiten', 'Ordered society'],
  // English translated long responses
  ['Most people can be trusted', 'Can trust most'],
  ['One can never be too careful', 'Never careful enough'],
  ['US is trying to dominate the world', 'Dominate world'],
  ['US plays a constructive role', 'Constructive role'],
  ['Without political parties there can be no democracy', 'Cannot without parties'],
  ['Democracy can function without political parties', 'Can without parties'],
  ['Democracy can function without parties', 'Can without parties'],
  ['Without Congress there can be no democracy', 'Cannot without Congress'],
  ['Democracy can function without Congress', 'Can without Congress'],
  ['Would support military gov. if things get very difficult', 'Would support military'],
  ['Would never support a military government', 'Would not support military'],
  ['Government should be responsible for welfare', 'Gov. responsibility'],
  ['Everyone should be responsible for their own welfare', 'Individual responsibility'],
  ['Social media enables political participation', 'Enables participation'],
  ['Social media creates an illusion of participation', 'Illusion of participation'],
  ['Social media is useless for participation', 'Useless for participation'],
  ['Fake info should be controlled even if it limits free speech', 'Control fake info'],
  ['Free speech must be guaranteed regardless', 'Guarantee free speech'],
  ['Fight climate change even if it hurts growth', 'Climate priority'],
  ['Economic growth even if it hurts climate', 'Economy priority'],
  ['All groups have equal opportunities', 'Equal opportunities'],
  ['Groups do not have equal opportunities', 'Unequal opportunities'],
  ['Politics lost credibility', 'Lost credibility'],
  ['Everyone can recover credibility', 'Can recover'],
  ['Politics is too complicated to understand', 'Too complicated'],
  ['Politics is not too complicated', 'Understandable'],
  ['Democracy is indispensable for development', 'Democracy indispensable'],
  ['The State enforces all laws', 'Laws enforced'],
  ['The State enforces no law', 'Laws not enforced'],
  ['Prefer a society respecting all rights', 'Rights & freedoms'],
  ['Prefer an ordered society even if limited', 'Ordered society'],
  ['The way one votes can make things', 'Vote makes a difference'],
  ["It doesn't matter how you vote", "Vote doesn't matter"],
  ['Only protest, voting is useless', 'Protest only'],
  ['Vote but also protest', 'Vote and protest'],
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

// ─── NS/NC and residual response detection ──────────────────────────────────
const NS_NC_PATTERNS = [
  'No sabe', 'No contesta', 'No responde', 'NS/NR', 'No sabe/No contesta',
  'No sabe / No contesta', 'No answer', 'No aplicable', 'Refused',
  "Don't know", "Don't know/No answer",
  'DK', 'NA', 'DK/NA',
];

const RESIDUAL_PATTERNS = [
  'Otras respuestas', 'Ninguno', 'Ninguna de las anteriores',
  'Other responses', 'None', 'None of the above',
];

export function isNsNc(key: string): boolean {
  const norm = key.replace(/\s*\{[^}]*\}\s*$/, '').trim();
  return NS_NC_PATTERNS.some(p => {
    // Short abbreviations (DK, NA, ...) must match exactly to avoid false
    // positives in unrelated words.
    if (p.length <= 3) return norm === p;
    return norm === p || norm.includes(p);
  });
}

export function isResidual(key: string): boolean {
  const norm = key.replace(/\s*\{[^}]*\}\s*$/, '').trim();
  return RESIDUAL_PATTERNS.some(p => norm === p || norm.includes(p));
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
  // Trust
  { id: 'trust_en', keywords: ['A Lot of Trust', 'Some Trust', 'Little Trust', 'No Trust'] },
  { id: 'trust', keywords: ['Mucha confianza', 'Algo de confianza', 'Poca confianza', 'Ninguna confianza'] },
  { id: 'trust_short', keywords: ['Mucha', 'Algo', 'Poca', 'Ninguna'] },
  // Satisfaction
  { id: 'satisfaction_en', keywords: ['Very Satisfied', 'Fairly Satisfied', 'Rather Satisfied', 'Not Very Satisfied', 'Not At All Satisfied', 'Not Satisfied At All'] },
  { id: 'satisfaction', keywords: ['Muy satisfecho', 'Bastante satisfecho', 'Más bien satisfecho', 'No muy satisfecho', 'Nada satisfecho', 'Para nada satisfecho'] },
  // Economy
  { id: 'economy_5_en', keywords: ['Very Good', 'Good', 'Average', 'Bad', 'Very Bad'] },
  { id: 'economy_5', keywords: ['Muy buena', 'Buena', 'Regular', 'Mala', 'Muy mala'] },
  { id: 'economy_4', keywords: ['Muy buena', 'Buena', 'Mala', 'Muy mala'] },
  // Agreement
  { id: 'agreement_en', keywords: ['Strongly agree', 'Agree', 'Disagree', 'Strongly disagree'] },
  { id: 'agreement', keywords: ['Muy de acuerdo', 'De acuerdo', 'En desacuerdo', 'Muy en desacuerdo'] },
  // Progress
  { id: 'progress_en', keywords: ['Is progressing', 'Is stagnant', 'Is in decline'] },
  { id: 'progress', keywords: ['Está progresando', 'Está estancado', 'Está en retroceso'] },
  // Favorable
  { id: 'favorable_en', keywords: ['Very favorable', 'Somewhat favorable', 'Somewhat unfavorable', 'Very unfavorable'] },
  { id: 'favorable', keywords: ['Muy favorable', 'Algo favorable', 'Algo desfavorable', 'Muy desfavorable'] },
  // Interest
  { id: 'interested_en', keywords: ['Very interested', 'Somewhat interested', 'Not very interested', 'Not interested at all'] },
  { id: 'interested', keywords: ['Muy interesado', 'Algo interesado', 'Poco interesado', 'Nada Interesado', 'Nada interesado'] },
  // Justice
  { id: 'justice_en', keywords: ['Very fair', 'Fair', 'Unfair', 'Very unfair'] },
  { id: 'justice', keywords: ['Muy justa', 'Justa', 'Injusta', 'Muy injusta'] },
  // Guarantees
  { id: 'guarantees_en', keywords: ['Fully guaranteed', 'Somewhat guaranteed', 'Poorly guaranteed', 'Not guaranteed at all'] },
  { id: 'guarantees', keywords: ['Completamente garantizadas', 'Algo garantizadas', 'Poco garantizadas', 'Para nada garantizadas'] },
  // Favor
  { id: 'favor_en', keywords: ['Strongly in favor', 'Somewhat in favor', 'Somewhat against', 'Strongly against'] },
  { id: 'favor', keywords: ['Muy a favor', 'Algo a favor', 'Algo en contra', 'Muy en contra', 'Muy en Contra'] },
  // Change
  { id: 'change_en', keywords: ['Much better', 'A little better', 'Same', 'About the same', 'A little worse', 'Much worse'] },
  { id: 'change', keywords: ['Mucho mejor', 'Un poco mejor', 'Igual', 'Casi igual', 'Un poco peor', 'Mucho peor'] },
  // Variation
  { id: 'variation_en', keywords: ['Increased a lot', 'Increased somewhat', 'Has remained the same', 'Decreased somewhat', 'Decreased a lot'] },
  { id: 'variation', keywords: ['Aumentó mucho', 'Aumentó algo', 'Se ha mantenido igual', 'Disminuyó algo', 'Disminuyó mucho'] },
  // Intensity
  { id: 'intensity_en', keywords: ['A lot', 'Quite a bit', 'Somewhat', 'Little', 'Nothing'] },
  { id: 'intensity', keywords: ['Mucho', 'Bastante', 'Algo', 'Poco', 'Nada'] },
  // Reform
  { id: 'reform_en', keywords: ['Is fine as it is', 'Can be improved with small changes', 'Needs deep reforms', 'Must be radically changed'] },
  { id: 'reform', keywords: ['Está bien como está', 'Puede mejorarse con pequeños cambios', 'Necesita reformas profundas', 'Debe cambiarse radicalmente'] },
  // More/Same/Less
  { id: 'more_less_en', keywords: ['More', 'Same', 'Less'] },
  { id: 'more_less', keywords: ['Más', 'Igual', 'Menos'] },
  // Relations
  { id: 'relations', keywords: ['Muy buenas', 'Más bien buenas', 'Más bien malas', 'Muy malas'] },
];

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/**
 * Try to detect an ordinal scale from a set of response keys.
 * Returns ordered keys (substantive first, then NS/NC) or null if no scale detected.
 */
/** Parse leading number from response key like "5" or "10 Derecha" */
const parseLeadingNum = (s: string) => { const m = s.match(/^(\d+)/); return m ? parseInt(m[1]) : NaN; };

/** Check if a set of keys represents a numeric scale (1-10, 0-10, etc.) */
export function isNumericScale(keys: string[]): boolean {
  const substantive = keys.filter(k => !isNsNc(k) && !isResidual(k));
  const numericKeys = substantive.filter(k => !isNaN(parseLeadingNum(k)));
  return numericKeys.length > substantive.length / 2;
}

export function detectOrdinalOrder(keys: string[]): string[] | null {
  // Separate NS/NC and residual responses from substantive keys
  const substantive = keys.filter(k => !isNsNc(k) && !isResidual(k));
  const residual = keys.filter(k => isResidual(k));
  const nsNc = keys.filter(k => isNsNc(k));

  if (substantive.length < 2) return null;

  // Check numeric scale first (1-10 etc.) - handles "1", "2", ... "10" and "1 No es democrático"
  const numericKeys = substantive.filter(k => !isNaN(parseLeadingNum(k)));
  if (numericKeys.length > substantive.length / 2) {
    const sorted = [...substantive].sort((a, b) => {
      const na = parseLeadingNum(a), nb = parseLeadingNum(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      if (!isNaN(na)) return -1;
      if (!isNaN(nb)) return 1;
      return a.localeCompare(b);
    });
    return [...sorted, ...residual, ...nsNc];
  }

  // Try each ordinal scale
  for (const scale of ORDINAL_SCALES) {
    const matched = tryMatchScale(substantive, scale.keywords);
    if (matched) {
      return [...matched, ...residual, ...nsNc];
    }
  }

  return null;
}

function normalizeKey(k: string): string {
  return normalize(k.replace(/\s*\{[^}]*\}\s*$/, ''));
}

function tryMatchScale(keys: string[], scaleKeywords: string[]): string[] | null {
  // For each scale keyword, find the best matching response key.
  // Priority: exact match > startsWith > includes (shortest key wins).
  // This prevents "Muy satisfecho" from greedily matching "No muy satisfecho".
  const orderedMatches: string[] = [];
  const usedKeys = new Set<string>();

  for (const keyword of scaleKeywords) {
    const normKw = normalize(keyword);
    const available = keys.filter(k => !usedKeys.has(k));

    // Priority 1: exact match
    let match = available.find(k => normalizeKey(k) === normKw);

    // Priority 2: key starts with keyword
    if (!match) {
      match = available.find(k => normalizeKey(k).startsWith(normKw));
    }

    // Priority 3: key includes keyword — pick the shortest match to avoid
    // greedy collisions (e.g. "Justa" should match "Justa" not "Injusta")
    if (!match) {
      const candidates = available.filter(k => normalizeKey(k).includes(normKw));
      if (candidates.length > 0) {
        // Prefer shortest key to avoid "Muy satisfecho" matching "No muy satisfecho"
        candidates.sort((a, b) => a.length - b.length);
        match = candidates[0];
      }
    }

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
 * Build a 0-10 score map for an ordinal scale.
 *
 * - For ordinal scales (e.g. "Muy satisfecho"..."Nada satisfecho"), linearly maps
 *   the most-positive answer to 10 and the most-negative answer to 0.
 * - For numeric scales (1-10, 0-10, 1 Nothing...10 A lot), uses the leading number.
 * - Returns null if no ordinal/numeric order can be detected (keys would be
 *   unordered, so a "how satisfied overall" score would be meaningless).
 *
 * NS/NC and residual keys are excluded: they don't represent a position on the
 * scale so they must not drag the score toward the middle.
 */
export function buildOrdinalScoreMap(keys: string[]): Record<string, number> | null {
  const ordered = detectOrdinalOrder(keys);
  if (!ordered) return null;
  const substantive = ordered.filter(k => !isNsNc(k) && !isResidual(k));
  if (substantive.length < 2) return null;

  // Numeric scales: use the leading number directly (preserves native range)
  if (isNumericScale(keys)) {
    const map: Record<string, number> = {};
    for (const k of substantive) {
      const n = parseLeadingNum(k);
      if (!isNaN(n)) map[k] = n;
    }
    return Object.keys(map).length >= 2 ? map : null;
  }

  // Ordinal scale: integer steps 0..N-1. First key (most positive) → N-1, last → 0.
  // This keeps the scale "one unit per step" so the mean reads as an ordinal position.
  const map: Record<string, number> = {};
  const n = substantive.length;
  substantive.forEach((k, i) => {
    map[k] = n - 1 - i;
  });
  return map;
}

/** Return [min, max] of a score map's values, used for display formatting. */
export function getScoreRange(scoreMap: Record<string, number>): [number, number] {
  const values = Object.values(scoreMap);
  if (values.length === 0) return [0, 0];
  return [Math.min(...values), Math.max(...values)];
}

/**
 * Compute a weighted 0-10 score from a distribution given a score map.
 * Proportions for non-scored keys (NS/NC, residual) are excluded from the denominator.
 * Returns null if no scored response has any mass.
 */
export function computeScore(
  distribution: Record<string, number>,
  scoreMap: Record<string, number>,
): number | null {
  let weightedSum = 0;
  let totalProp = 0;
  for (const [key, score] of Object.entries(scoreMap)) {
    const p = distribution[key] ?? 0;
    weightedSum += score * p;
    totalProp += p;
  }
  if (totalProp === 0) return null;
  return weightedSum / totalProp;
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

  // Fallback: sort substantive by value desc, residual + NS/NC at end
  const substantive = keys.filter(k => !isNsNc(k) && !isResidual(k));
  const residual = keys.filter(k => isResidual(k));
  const nsNc = keys.filter(k => isNsNc(k));

  if (getAvgValue) {
    substantive.sort((a, b) => getAvgValue(b) - getAvgValue(a));
  }

  return [...substantive, ...residual, ...nsNc];
}
