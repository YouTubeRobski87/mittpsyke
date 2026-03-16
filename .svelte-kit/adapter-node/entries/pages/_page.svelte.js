import { e as escape_html, h as head, c as ensure_array_like, a as attr } from "../../chunks/index2.js";
import "clsx";
import { p as portals } from "../../chunks/portals.js";
import "retell-client-js-sdk";
import { C as ConsentGate } from "../../chunks/ConsentGate.js";
import { g as grantSensitiveConsent } from "../../chunks/consent.js";
function HomeSafetyStrip($$renderer) {
  $$renderer.push(`<section class="safety-strip svelte-14b60qd" aria-label="Trygghetsinformation"><ul class="safety-list svelte-14b60qd"><li class="safety-item svelte-14b60qd"><p class="safety-label svelte-14b60qd">Inte vård</p> <p class="safety-copy svelte-14b60qd">För stöd och reflektion i vardagen, inte vård eller akuthjälp.</p></li> <li class="safety-item svelte-14b60qd"><p class="safety-label svelte-14b60qd">Börja anonymt</p> <p class="safety-copy svelte-14b60qd">Du kan skriva direkt utan konto och ta ett steg i taget, i din egen takt.</p></li> <li class="safety-item svelte-14b60qd"><p class="safety-label svelte-14b60qd">Akut fara?</p> <p class="safety-copy svelte-14b60qd"><a href="tel:112" class="svelte-14b60qd">Ring 112</a>, kontakta <a href="https://www.1177.se" target="_blank" rel="noopener noreferrer" class="svelte-14b60qd">1177</a> eller se <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="svelte-14b60qd">stödlinjer</a>.</p></li></ul></section>`);
}
function VoiceSupport($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let hasSensitiveDataConsent = false;
    function acceptSensitiveConsent() {
      grantSensitiveConsent();
      hasSensitiveDataConsent = true;
    }
    $$renderer2.push(`<section class="voice-support svelte-xjv7oj"><h2 class="svelte-xjv7oj">Prata direkt här</h2> <p class="svelte-xjv7oj">Du kan också prata direkt med MittPsykes AI-baserade samtalsstöd här på sidan.</p> <p class="svelte-xjv7oj">Det är till för reflektion och stöd i vardagen. Det ersätter inte vård eller ställer diagnos.</p> <p class="voice-support-note svelte-xjv7oj">Om du hellre vill prata med en människa finns <a href="https://stodlinjer.se" rel="noopener noreferrer" target="_blank" class="svelte-xjv7oj">Stödlinjer</a>. Vid akut fara, ring 112.</p> `);
    if (hasSensitiveDataConsent) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button aria-label="Starta röstsamtal med MittPsyke" class="svelte-xjv7oj">${escape_html("Prata med MittPsyke")}</button>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="voice-support-consent svelte-xjv7oj">`);
      ConsentGate($$renderer2, {
        title: "Samtycke innan röstsamtal",
        dataLabel: "Det du säger i röstsamtalet",
        serviceLabel: "AI-, röst- och tredjepartstjänster",
        onAccept: acceptSensitiveConsent
      });
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]--></section>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const entryPaths = [
      {
        title: "Jag behöver stöd nu",
        description: "Få ett lugnt första steg direkt, utan att behöva formulera allt perfekt.",
        href: "/skriv",
        cta: "Börja anonymt"
      },
      {
        title: "Jag vill förstå mitt mående",
        description: "Läs guider om ångest, stress, trauma och andra vanliga tillstånd.",
        href: "/guider",
        cta: "Läs guider"
      },
      {
        title: "Jag vill ha konkreta steg",
        description: "Börja med enkla övningar och små handlingar som går att göra idag.",
        href: "/ovningar",
        cta: "Se övningar"
      },
      {
        title: "Jag vill följa min utveckling",
        description: "Skriv dagbok, spara reflektioner och se din resa över tid.",
        href: "/register",
        cta: "Skapa konto"
      }
    ];
    head("1uha8ag", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Psykiskt stöd online i lugn takt | MittPsyke</title>`);
      });
      $$renderer3.push(`<meta name="description" content="Börja utan konto, skriv dagbok och följ ditt mående över tid. MittPsyke är ett AI-baserat samtalsstöd för reflektion och stöd i vardagen."/> <meta property="og:title" content="Psykiskt stöd online i lugn takt | MittPsyke"/> <meta property="og:description" content="Ett tryggt digitalt stödrum för samtal, dagbok, reflektion och nästa steg när du behöver stöd."/> <meta property="og:type" content="website"/> <meta name="twitter:card" content="summary"/> <link rel="canonical" href="https://mittpsyke.se/"/>`);
    });
    $$renderer2.push(`<main class="staging-look svelte-1uha8ag"><section class="hero-section hero svelte-1uha8ag" aria-label="Introduktion till MittPsyke"><img class="hero-bg svelte-1uha8ag" src="/assets/home/MittpsykeTree.jpg" alt="" aria-hidden="true" decoding="async" fetchpriority="high"/> <div class="hero-content svelte-1uha8ag"><p class="hero-eyebrow svelte-1uha8ag">Om du mår dåligt och inte vet var du ska börja</p> <h1 class="svelte-1uha8ag">MittPsyke är en lugn plats att börja.</h1> <p class="svelte-1uha8ag">Skriv av dig direkt — inget konto, ingen registrering. Skapa ett konto om du vill spara din dagbok och kunna återvända över tid.</p> <div class="hero-actions svelte-1uha8ag"><a href="/skriv" class="hero-cta hero-cta-primary svelte-1uha8ag">Börja skriva anonymt</a> <a href="/register" class="hero-cta hero-cta-secondary svelte-1uha8ag">Skapa din egen plats</a></div> <p class="hero-trust-note svelte-1uha8ag">Ingen registrering krävs. Du kan börja skriva direkt.</p> `);
    HomeSafetyStrip($$renderer2);
    $$renderer2.push(`<!----> <div class="mode-compare svelte-1uha8ag" aria-label="Vad är skillnaden?"><div class="mode-col svelte-1uha8ag"><p class="mode-label svelte-1uha8ag">Anonymt läge</p> <ul class="mode-list svelte-1uha8ag"><li class="svelte-1uha8ag">Ingen registrering</li> <li class="svelte-1uha8ag">Ingen profil skapas</li> <li class="svelte-1uha8ag">Börja direkt</li></ul></div> <div class="mode-col svelte-1uha8ag"><p class="mode-label svelte-1uha8ag">Med konto</p> <ul class="mode-list svelte-1uha8ag"><li class="svelte-1uha8ag">Spara dagbok och reflektioner</li> <li class="svelte-1uha8ag">Följ ditt mående över tid</li> <li class="svelte-1uha8ag">Fortsätt där du slutade</li></ul></div></div></div></section> <section class="entry-paths svelte-1uha8ag" aria-labelledby="entry-paths-title"><div class="cards-narrow entry-inner svelte-1uha8ag"><p class="entry-eyebrow svelte-1uha8ag">Välj din väg in</p> <h2 id="entry-paths-title" class="svelte-1uha8ag">Det finns olika sätt att börja.</h2> <p class="entry-intro svelte-1uha8ag">Välj det som känns mest hjälpsamt just nu. Du kan alltid byta väg senare.</p> <div class="entry-grid svelte-1uha8ag"><!--[-->`);
    const each_array = ensure_array_like(entryPaths);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let path = each_array[$$index];
      $$renderer2.push(`<a class="entry-card svelte-1uha8ag"${attr("href", path.href)}><h3 class="svelte-1uha8ag">${escape_html(path.title)}</h3> <p class="svelte-1uha8ag">${escape_html(path.description)}</p> <span class="entry-card-cta svelte-1uha8ag">${escape_html(path.cta)}</span></a>`);
    }
    $$renderer2.push(`<!--]--></div></div></section> <section class="video-section svelte-1uha8ag"><div class="video-inner svelte-1uha8ag"><h2 class="svelte-1uha8ag">Se hur MittPsyke fungerar</h2> <p class="svelte-1uha8ag">En kort introduktion till dagboken, framsteg och AI-chatten.</p> <div class="video-wrapper svelte-1uha8ag"><video controls="" preload="none" poster="/og-image.png" class="svelte-1uha8ag"><source src="/intro.mp4" type="video/mp4"/> Din webbläsare stöder inte videouppspelning.</video></div></div></section> <section id="fokusomraden" class="focus-section svelte-1uha8ag"><div class="narrow cards-narrow focus-content svelte-1uha8ag"><header class="focus-header svelte-1uha8ag"><h2 class="svelte-1uha8ag">Välj fokusområde</h2> <p class="svelte-1uha8ag">Välj det som känns närmast just nu. Det hjälper MittPsyke att öppna rätt samtalsstöd.</p></header> <div class="focus-cards svelte-1uha8ag"><!--[-->`);
    const each_array_1 = ensure_array_like(portals);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let portal = each_array_1[$$index_1];
      $$renderer2.push(`<a class="focus-card svelte-1uha8ag"${attr("href", `/chat/${portal.key}`)}><img class="focus-cover svelte-1uha8ag"${attr("src", portal.image)}${attr("alt", `Bild for ${portal.title}`)} loading="lazy"/> <div class="focus-body svelte-1uha8ag"><span class="focus-icon svelte-1uha8ag">${escape_html(portal.icon)}</span> <h3 class="svelte-1uha8ag">${escape_html(portal.title)}</h3> <p class="svelte-1uha8ag">${escape_html(portal.description)}</p> <span class="focus-cta svelte-1uha8ag">Börja skriva</span></div></a>`);
    }
    $$renderer2.push(`<!--]--></div></div></section> `);
    VoiceSupport($$renderer2);
    $$renderer2.push(`<!----> <section class="band band-olive svelte-1uha8ag"><div class="narrow intro-grid svelte-1uha8ag"><img src="/assets/home/Tryggplats.png" alt="Trygg plats" loading="lazy" class="svelte-1uha8ag"/> <div><h2 class="svelte-1uha8ag">Tryggt, varsamt och tydligt avgränsat</h2> <p class="svelte-1uha8ag">MittPsyke är byggt för lugn reflektion i egen takt. Det är inte vård eller behandling, men kan vara en första plats att landa innan du tar nästa steg.</p></div></div></section></main>`);
  });
}
export {
  _page as default
};
