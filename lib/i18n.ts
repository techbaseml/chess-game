/** Language adapters are independent of chess rules and algebraic notation. */
export type Locale = 'en';
export type Messages = Record<string,string>;
export const catalogs: Record<Locale,Messages>={en:{home:'Home',play:'Play',computer:'Computer',online:'Online Friend',analysis:'Game Analysis',customize:'Customize',settings:'Settings'}};
export function translate(key:string,locale:Locale='en',fallback=key){return catalogs[locale]?.[key]??catalogs.en[key]??fallback;}
