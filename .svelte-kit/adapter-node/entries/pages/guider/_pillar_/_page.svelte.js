import { h as head, e as escape_html, b as ensure_array_like, a as attr, d as derived } from "../../../../chunks/index.js";
import { h as html } from "../../../../chunks/html.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const pillarUpdatedAt = "2026-03-08";
    const jsonLd = derived(() => ({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              position: 1,
              name: "Hem",
              item: "https://mittpsyke.se"
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Guider",
              item: "https://mittpsyke.se/guider"
            },
            {
              "@type": "ListItem",
              position: 3,
              name: data.pillar.title,
              item: `https://mittpsyke.se/guider/${data.pillar.slug}`
            }
          ]
        },
        {
          "@type": "Article",
          headline: data.pillar.title,
          description: data.pillar.description,
          image: "https://mittpsyke.se/og-image.png",
          author: {
            "@type": "Organization",
            name: "MittPsyke",
            url: "https://mittpsyke.se/om-mittpsyke"
          },
          publisher: {
            "@type": "Organization",
            name: "MittPsyke",
            logo: {
              "@type": "ImageObject",
              url: "https://mittpsyke.se/favicon.png"
            }
          },
          datePublished: pillarUpdatedAt,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://mittpsyke.se/guider/${data.pillar.slug}`
          }
        }
      ]
    }));
    head("1misdmc", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(data.pillar.title)} | Guider | MittPsyke</title>`);
      });
      $$renderer3.push(`<meta name="description"${attr("content", data.pillar.description)}/> <meta property="og:title"${attr("content", `${data.pillar.title} | Guider | MittPsyke`)}/> <meta property="og:description"${attr("content", data.pillar.description)}/> <link rel="canonical"${attr("href", `https://mittpsyke.se/guider/${data.pillar.slug}`)}/> ${html(`<script type="application/ld+json">${JSON.stringify(jsonLd())}<\/script>`)}`);
    });
    $$renderer2.push(`<main class="container pillar-page svelte-1misdmc"><nav class="crumbs svelte-1misdmc" aria-label="Breadcrumb"><a href="/">Hem</a> <span>/</span> <a href="/guider">Guider</a> <span>/</span> <span>${escape_html(data.pillar.title)}</span></nav> <header class="intro svelte-1misdmc"><h1 class="svelte-1misdmc">${escape_html(data.pillar.title)}</h1> <p class="svelte-1misdmc">${escape_html(data.pillar.description)}</p></header> <section class="info-box svelte-1misdmc" aria-label="Om innehållet"><p class="svelte-1misdmc"><strong>Uppdaterad 8 mars 2026.</strong> Guiden är sammanställd av MittPsyke.</p> <p class="svelte-1misdmc">Den är tänkt som stöd för reflektion och ökad förståelse. Den ersätter inte vård, diagnos eller behandling.</p></section> <section class="block svelte-1misdmc" aria-label="Artiklar i guiden"><h2 class="svelte-1misdmc">Artiklar i guiden</h2> <ul class="stack-list svelte-1misdmc"><!--[-->`);
    const each_array = ensure_array_like(data.pillar.clusterTopics);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let topic = each_array[$$index];
      $$renderer2.push(`<li class="svelte-1misdmc">${escape_html(topic)}</li>`);
    }
    $$renderer2.push(`<!--]--></ul></section> <section class="block svelte-1misdmc" aria-label="Övningar i samma område"><h2 class="svelte-1misdmc">Övningar i samma område</h2> <div class="tool-grid svelte-1misdmc"><!--[-->`);
    const each_array_1 = ensure_array_like(data.tools);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let tool = each_array_1[$$index_1];
      $$renderer2.push(`<a class="tool-card svelte-1misdmc"${attr("href", `/ovningar/${tool.slug}`)}><h3 class="svelte-1misdmc">${escape_html(tool.title)}</h3> <p class="svelte-1misdmc">${escape_html(tool.description)}</p></a>`);
    }
    $$renderer2.push(`<!--]--></div></section> `);
    if (data.pillar.relatedArticles?.length) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<section class="block svelte-1misdmc" aria-label="Relaterade artiklar"><h2 class="svelte-1misdmc">Relaterade artiklar</h2> <ul class="stack-list stack-list-links stack-list-choices svelte-1misdmc"><!--[-->`);
      const each_array_2 = ensure_array_like(data.pillar.relatedArticles);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let article = each_array_2[$$index_2];
        $$renderer2.push(`<li class="svelte-1misdmc"><a${attr("href", article.href)} class="svelte-1misdmc">${escape_html(article.title)}</a></li>`);
      }
      $$renderer2.push(`<!--]--></ul></section>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.pillar.slug === "angest") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<section class="block svelte-1misdmc" aria-label="Nästa steg vid ångest"><h2 class="svelte-1misdmc">Nästa steg vid ångest</h2> <p class="block-note svelte-1misdmc">Om du vill ta det vidare kan du välja det som känns mest hjälpsamt just nu.</p> <ul class="stack-list stack-list-links stack-list-choices svelte-1misdmc"><li class="svelte-1misdmc"><a href="/chat/a" class="svelte-1misdmc">Starta samtal om ångest</a></li> <li class="svelte-1misdmc"><a href="/hjalp-vid-angest-online" class="svelte-1misdmc">Läs mer om hjälp vid ångest online</a></li> <li class="svelte-1misdmc"><a href="/andningsovningar-mot-angest" class="svelte-1misdmc">Se andningsövningar mot ångest</a></li> <li class="svelte-1misdmc"><a href="/ovningar-mot-angest-online" class="svelte-1misdmc">Utforska övningar mot ångest online</a></li> <li class="svelte-1misdmc"><a href="/ovningar/cbt-katastroftankar" class="svelte-1misdmc">Prova övning mot katastroftankar</a></li> <li class="svelte-1misdmc"><a href="/dagbok" class="svelte-1misdmc">Skriv i dagboken</a></li> <li class="svelte-1misdmc"><a href="/framsteg" class="svelte-1misdmc">Följ mönster över tid</a></li></ul></section>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.pillar.slug === "depression") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<section class="block svelte-1misdmc" aria-label="Nästa steg vid nedstämdhet"><h2 class="svelte-1misdmc">Nästa steg vid nedstämdhet</h2> <p class="block-note svelte-1misdmc">Du kan börja lugnt och välja det som känns möjligt just idag.</p> <ul class="stack-list stack-list-links stack-list-choices svelte-1misdmc"><li class="svelte-1misdmc"><a href="/chat/b" class="svelte-1misdmc">Starta samtal om nedstämdhet</a></li> <li class="svelte-1misdmc"><a href="/hjalp-vid-depression-online" class="svelte-1misdmc">Läs mer om hjälp vid depression online</a></li> <li class="svelte-1misdmc"><a href="/dagbok" class="svelte-1misdmc">Skriv i dagboken</a></li> <li class="svelte-1misdmc"><a href="/framsteg" class="svelte-1misdmc">Följ förändring över tid</a></li> <li class="svelte-1misdmc"><a href="/om-mittpsyke" class="svelte-1misdmc">Läs om hur MittPsyke fungerar</a></li></ul></section>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.pillar.slug === "stress-utmattning") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<section class="block svelte-1misdmc" aria-label="Nästa steg vid stress"><h2 class="svelte-1misdmc">Nästa steg vid stress</h2> <p class="block-note svelte-1misdmc">När belastningen är hög kan det hjälpa att välja ett litet nästa steg.</p> <ul class="stack-list stack-list-links stack-list-choices svelte-1misdmc"><li class="svelte-1misdmc"><a href="/chat/e" class="svelte-1misdmc">Starta samtal om stress</a></li> <li class="svelte-1misdmc"><a href="/stod-vid-stress-online" class="svelte-1misdmc">Läs mer om stöd vid stress online</a></li> <li class="svelte-1misdmc"><a href="/ovningar/daglig-reflektionsmall" class="svelte-1misdmc">Prova daglig reflektionsmall</a></li> <li class="svelte-1misdmc"><a href="/dagbok" class="svelte-1misdmc">Skriv i dagboken</a></li> <li class="svelte-1misdmc"><a href="/framsteg" class="svelte-1misdmc">Följ återkommande mönster</a></li></ul></section>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.pillar.slug === "overtankande") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<section class="block svelte-1misdmc" aria-label="Nästa steg vid oro och grubblande"><h2 class="svelte-1misdmc">Nästa steg vid oro och grubblande</h2> <p class="block-note svelte-1misdmc">Om tankarna går runt kan det hjälpa att växla från analys till ett lugnt nästa steg.</p> <ul class="stack-list stack-list-links svelte-1misdmc"><li class="svelte-1misdmc"><a href="/chat/e" class="svelte-1misdmc">Starta samtal om oro</a></li> <li class="svelte-1misdmc"><a href="/hjalp-mot-oro-online" class="svelte-1misdmc">Läs mer om hjälp mot oro online</a></li> <li class="svelte-1misdmc"><a href="/andningsovningar-mot-angest" class="svelte-1misdmc">Se andningsövningar mot ångest</a></li> <li class="svelte-1misdmc"><a href="/ovningar-mot-angest-online" class="svelte-1misdmc">Utforska övningar mot ångest online</a></li> <li class="svelte-1misdmc"><a href="/guider/existentiell-oro" class="svelte-1misdmc">Läs vidare om existentiell oro</a></li> <li class="svelte-1misdmc"><a href="/dagbok" class="svelte-1misdmc">Skriv i dagboken</a></li> <li class="svelte-1misdmc"><a href="/ovningar" class="svelte-1misdmc">Prova en övning</a></li></ul></section>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <section class="cta-section svelte-1misdmc" aria-label="Kom igång"><h2 class="svelte-1misdmc">Redo att ta nästa steg?</h2> <p class="svelte-1misdmc">Välj det som känns hjälpsamt just nu: skriv i dagboken eller prata anonymt i din egen takt.</p> <div class="cta-buttons svelte-1misdmc"><a href="/dagbok" class="cta-primary svelte-1misdmc">Starta din dagbok</a> <a href="/prata-anonymt-online" class="cta-secondary svelte-1misdmc">Prata med någon</a></div></section></main>`);
  });
}
export {
  _page as default
};
