const portals = [
  {
    key: "a",
    title: "Ångest",
    description: "Trygghet, lugn och att landa i kroppen",
    icon: "💙",
    image: "/assets/home/Angest.jpg",
    category: "A"
  },
  {
    key: "b",
    title: "Depression",
    description: "Varsam kontakt, energi och självvärde",
    icon: "🌧️",
    image: "/assets/home/Depression.jpg",
    category: "B"
  },
  {
    key: "e",
    title: "Trauma",
    description: "Kontroll, gränser och säkerhet",
    icon: "🛡️",
    image: "/assets/home/Trauma.jpg",
    category: "E"
  }
];
function getPortalByKey(key) {
  return portals.find((p) => p.key === key);
}

export { getPortalByKey as g, portals as p };
//# sourceMappingURL=portals-dDiiJZBT.js.map
