import { deepMerge } from "../merge";
import type { Locale } from "../config";
import type { Messages } from "./en";
import { en } from "./en";
import { hi as hiOverrides } from "./hi";
import { hiExtended } from "./hi-extended";
import { mr as mrOverrides } from "./mr";
import { bn as bnOverrides } from "./bn";
import { ta as taOverrides } from "./ta";
import { te as teOverrides } from "./te";
import { gu as guOverrides } from "./gu";
import { ml as mlOverrides } from "./ml";

const catalogs: Record<Locale, Messages> = {
  en,
  hi: deepMerge(en, deepMerge(hiOverrides, hiExtended) as Record<string, unknown>) as Messages,
  mr: deepMerge(en, mrOverrides as Record<string, unknown>) as Messages,
  bn: deepMerge(en, bnOverrides as Record<string, unknown>) as Messages,
  ta: deepMerge(en, taOverrides as Record<string, unknown>) as Messages,
  te: deepMerge(en, teOverrides as Record<string, unknown>) as Messages,
  gu: deepMerge(en, guOverrides as Record<string, unknown>) as Messages,
  ml: deepMerge(en, mlOverrides as Record<string, unknown>) as Messages,
};

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? en;
}

export type { Messages };
