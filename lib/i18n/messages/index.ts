import type { Locale } from "../config";
import type { Messages } from "./en";
import { en } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";
import { bn } from "./bn";
import { ta } from "./ta";
import { te } from "./te";
import { gu } from "./gu";
import { ml } from "./ml";

const catalogs: Record<Locale, Messages> = {
  en,
  hi,
  mr,
  bn,
  ta,
  te,
  gu,
  ml,
};

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? en;
}

export type { Messages };
