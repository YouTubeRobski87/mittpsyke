import { error } from "@sveltejs/kit";
import { g as getPillarBySlug, a as getToolsForPillar } from "../../../../chunks/seo-architecture.js";
function load({ params }) {
  const pillar = getPillarBySlug(params.pillar);
  if (!pillar) {
    throw error(404, "Guiden hittades inte");
  }
  return {
    pillar,
    tools: getToolsForPillar(pillar.slug)
  };
}
export {
  load
};
