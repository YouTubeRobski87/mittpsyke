export async function GET() {
  // Här listar du alla dina offentliga sidor
  const pages = [
    "", 
    "trauma", 
    "dagbok", 
    "om-mittpsyke",
    "kontakt"
  ];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8" ?>
    <urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
      ${pages
        .map((page) => `
          <url>
            <loc>https://mittpsyke.se/${page}</loc>
            <changefreq>weekly</changefreq>
            <priority>${page === "" ? "1.0" : "0.8"}</priority>
          </url>
        `)
        .join("")}
    </urlset>`.trim();

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
