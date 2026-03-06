import { error } from "@sveltejs/kit";
import { b as getToolBySlug, g as getPillarBySlug } from "../../../../chunks/seo-architecture.js";
function load({ params }) {
  const tool = getToolBySlug(params.tool);
  if (!tool) {
    throw error(404, "Övningen hittades inte");
  }
  const pillar = getPillarBySlug(tool.pillarSlug);
  if (!pillar) {
    throw error(500, "Kunde inte hitta tillhörande guide");
  }
  return {
    tool,
    pillar
  };
}
export {
  load
};
