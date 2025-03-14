
// Main export file that re-exports all the translation utilities
import { Language } from "@/contexts/LanguageContext";
import { getTranslatedFactorName } from "./translations/factorNames";
import { getTranslatedDescription } from "./translations/descriptionTranslator";
import { getProgressColor } from "./progressColor";

export {
  getTranslatedFactorName,
  getTranslatedDescription,
  getProgressColor
};
