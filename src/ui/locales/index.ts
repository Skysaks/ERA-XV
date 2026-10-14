import enBase from './en';
import frBase from './fr';
import esBase from './es';
import en2 from './v2/en';
import fr2 from './v2/fr';
import es2 from './v2/es';
import en3 from './v3/en';
import fr3 from './v3/fr';
import es3 from './v3/es';

/** Base dictionaries with the 2.0 then 2.1 strings merged over them (the later layer wins on shared keys). */
export const en: Record<string, string> = { ...enBase, ...en2, ...en3 };
export const fr: Record<string, string> = { ...frBase, ...fr2, ...fr3 };
export const es: Record<string, string> = { ...esBase, ...es2, ...es3 };
