# Final svensk URL-hierarki

```txt
/                                # Hem
/guider/                         # Pillar-översikt
/guider/{pillar-slug}/           # Pillar-sida
/guider/{pillar-slug}/{slug}/    # Klusterartikel
/ovningar/                       # Verktygsöversikt
/ovningar/{tool-slug}/           # Verktygssida
/om/                             # Om MittPsyke
/kontakt/                        # Kontakt
/faq/                            # Vanliga frågor
```

# Exakt mapp- och slugstruktur

```txt
content/
  sv/
    guider/
      _index.mdx

      angest/
        _index.mdx
        vad-hander-i-kroppen.mdx
        ar-angest-farligt.mdx
        andningsovningar.mdx
        oro-vs-angest.mdx
        exponering-undvikande.mdx
        angest-pa-kvallen.mdx
        fysisk-aktivitet.mdx
        acceptans-angest.mdx

      stress-utmattning/
        _index.mdx
        stresshormon.mdx
        burnout-test.mdx
        aterhamtning.mdx
        granssattning.mdx
        work-life.mdx
        mini-pauser.mdx
        stress-somn.mdx
        nar-hjalp.mdx

      sjalvkansla/
        _index.mdx
        inre-kritiker.mdx
        perfektionism.mdx
        jamforelse-sociala-medier.mdx
        sjalvmedkansla.mdx
        skam-skuld.mdx
        imposter-syndrom.mdx
        bekraftelser.mdx

      depression/
        _index.mdx
        symptom.mdx
        energi-motivation.mdx
        negativa-tankar.mdx
        sma-steg.mdx
        traning-rorelse.mdx
        isolering.mdx
        hopp-aterhamtning.mdx

      overtankande/
        _index.mdx
        grubblande-loser-inte-problem.mdx
        mental-rumination.mdx
        radsla-for-egna-tankar.mdx
        slappa-tanken-act.mdx
        mindfulness.mdx
        nattligt-overtankande.mdx
        fokus-pa-nuet.mdx

      social-angest/
        _index.mdx
        fysiska-symptom.mdx
        fysiska-reaktioner.mdx
        exponering.mdx
        sociala-fardigheter.mdx
        introvert-vs-social-angest.mdx
        overvinna-gruppangest.mdx

      relationsproblem/
        _index.mdx
        kommunikationsmonster.mdx
        svara-samtal.mdx
        granssattning-i-relationer.mdx
        anknytningsmonster.mdx
        forlatelse.mdx
        ensamhet-i-relationer.mdx
        beroende-eller-narhet.mdx
        lamna-eller-stanna.mdx

      existentiell-oro/
        _index.mdx
        dodsangest.mdx
        livsmening.mdx
        livsforandringar-identitet.mdx
        tomhet-efter-mal.mdx
        absurditet-och-humor.mdx
        acceptans-av-osakerhet.mdx

    ovningar/
      _index.mdx
      skrivovningar-sjalvkansla.mdx
      cbt-katastroftankar.mdx
      daglig-reflektionsmall.mdx
      sju-fragor-vid-oro.mdx
      sjalvmedkansla-ovning.mdx
      grounding-5-4-3-2-1.mdx
      tankefallor-kartlaggning.mdx
      icke-valdsam-kommunikation.mdx
      vardekartlaggning.mdx
      4-7-8-andning.mdx
      body-scan.mdx
      katastrofgranskning.mdx
      tacksamhetsovning.mdx
      dagens-avslut-reflektion.mdx
      trygghetscirkel-exponering.mdx
```

# Internlänkningskarta (pillar ↔ cluster ↔ tools)

| Pillar | Kluster (egna) | Primära verktyg | Korslänkade pillars |
|---|---|---|---|
| `/guider/angest/` | 8 st under `/guider/angest/*` | `/ovningar/grounding-5-4-3-2-1/`, `/ovningar/4-7-8-andning/`, `/ovningar/cbt-katastroftankar/` | `/guider/stress-utmattning/`, `/guider/overtankande/`, `/guider/social-angest/` |
| `/guider/stress-utmattning/` | 8 st under `/guider/stress-utmattning/*` | `/ovningar/dagens-avslut-reflektion/`, `/ovningar/tacksamhetsovning/`, `/ovningar/daglig-reflektionsmall/` | `/guider/angest/`, `/guider/depression/`, `/guider/relationsproblem/` |
| `/guider/sjalvkansla/` | 7 st under `/guider/sjalvkansla/*` | `/ovningar/skrivovningar-sjalvkansla/`, `/ovningar/sjalvmedkansla-ovning/`, `/ovningar/vardekartlaggning/` | `/guider/depression/`, `/guider/relationsproblem/`, `/guider/overtankande/` |
| `/guider/depression/` | 7 st under `/guider/depression/*` | `/ovningar/daglig-reflektionsmall/`, `/ovningar/tacksamhetsovning/`, `/ovningar/body-scan/` | `/guider/stress-utmattning/`, `/guider/sjalvkansla/`, `/guider/overtankande/` |
| `/guider/overtankande/` | 7 st under `/guider/overtankande/*` | `/ovningar/tankefallor-kartlaggning/`, `/ovningar/cbt-katastroftankar/`, `/ovningar/body-scan/` | `/guider/angest/`, `/guider/depression/`, `/guider/existentiell-oro/` |
| `/guider/social-angest/` | 6 st under `/guider/social-angest/*` | `/ovningar/trygghetscirkel-exponering/`, `/ovningar/grounding-5-4-3-2-1/`, `/ovningar/4-7-8-andning/` | `/guider/angest/`, `/guider/relationsproblem/`, `/guider/sjalvkansla/` |
| `/guider/relationsproblem/` | 8 st under `/guider/relationsproblem/*` | `/ovningar/icke-valdsam-kommunikation/`, `/ovningar/vardekartlaggning/`, `/ovningar/sju-fragor-vid-oro/` | `/guider/social-angest/`, `/guider/sjalvkansla/`, `/guider/stress-utmattning/` |
| `/guider/existentiell-oro/` | 6 st under `/guider/existentiell-oro/*` | `/ovningar/vardekartlaggning/`, `/ovningar/body-scan/`, `/ovningar/daglig-reflektionsmall/` | `/guider/overtankande/`, `/guider/depression/`, `/guider/angest/` |

| Verktyg | Länkar till pillar | Länkar till kluster |
|---|---|---|
| `skrivovningar-sjalvkansla` | `sjalvkansla` | `inre-kritiker`, `sjalvmedkansla` |
| `cbt-katastroftankar` | `angest` | `oro-vs-angest`, `ar-angest-farligt` |
| `daglig-reflektionsmall` | `stress-utmattning` | `mini-pauser`, `aterhamtning` |
| `sju-fragor-vid-oro` | `overtankande` | `grubblande-loser-inte-problem`, `fokus-pa-nuet` |
| `sjalvmedkansla-ovning` | `sjalvkansla` | `sjalvmedkansla`, `skam-skuld` |
| `grounding-5-4-3-2-1` | `angest` | `vad-hander-i-kroppen`, `angest-pa-kvallen` |
| `tankefallor-kartlaggning` | `overtankande` | `mental-rumination`, `slappa-tanken-act` |
| `icke-valdsam-kommunikation` | `relationsproblem` | `svara-samtal`, `kommunikationsmonster` |
| `vardekartlaggning` | `existentiell-oro` | `livsmening`, `acceptans-av-osakerhet` |
| `4-7-8-andning` | `angest` | `andningsovningar`, `angest-pa-kvallen` |
| `body-scan` | `stress-utmattning` | `stress-somn`, `aterhamtning` |
| `katastrofgranskning` | `angest` | `ar-angest-farligt`, `oro-vs-angest` |
| `tacksamhetsovning` | `depression` | `negativa-tankar`, `sma-steg` |
| `dagens-avslut-reflektion` | `stress-utmattning` | `stress-somn`, `mini-pauser` |
| `trygghetscirkel-exponering` | `social-angest` | `exponering`, `overvinna-gruppangest` |

# Breadcrumb-struktur

```txt
Hem
Hem > Guider
Hem > Guider > {Pillar}
Hem > Guider > {Pillar} > {Klusterartikel}
Hem > Övningar
Hem > Övningar > {Verktyg}
Hem > Om
Hem > Kontakt
Hem > FAQ
```

# Schema-typer per sidtyp

| Sidtyp | Primär schema | Sekundär schema |
|---|---|---|
| Hem (`/`) | `WebSite` | `Organization`, `WebPage` |
| Guider index (`/guider/`) | `CollectionPage` | `ItemList`, `BreadcrumbList` |
| Pillar (`/guider/{pillar}/`) | `Article` | `FAQPage`, `BreadcrumbList` |
| Kluster (`/guider/{pillar}/{slug}/`) | `Article` | `BreadcrumbList` |
| Övningar index (`/ovningar/`) | `CollectionPage` | `ItemList`, `BreadcrumbList` |
| Verktyg (`/ovningar/{tool}/`) | `HowTo` | `FAQPage`, `BreadcrumbList` |
| Om (`/om/`) | `AboutPage` | `BreadcrumbList` |
| Kontakt (`/kontakt/`) | `ContactPage` | `BreadcrumbList` |
| FAQ (`/faq/`) | `FAQPage` | `BreadcrumbList` |

# Pillar-sidmall (svenska rubriker)

```md
# {Primärt ämne} – komplett guide

## Kort sammanfattning
## Vad är {ämne}?
## Hur känns {ämne} i kropp och tanke?
## Vanliga symtom
## Vanliga orsaker och utlösare
## Vad som brukar hjälpa
## Praktiska steg du kan testa idag
## När du bör söka professionellt stöd
## Vanliga frågor om {ämne}
## Relaterade artiklar i serien
## Relaterade övningar
## Nästa steg i MittPsyke
```

# Klusterartikelmall (svenska rubriker)

```md
# {Specifik fråga/problem}

## Snabbt svar
## Varför händer det här?
## Tecken att känna igen
## Vad du kan göra steg för steg
## Vanliga misstag att undvika
## När du bör söka mer stöd
## Relaterat: läs vidare i {pillar}
## Prova en övning
## Nästa steg i MittPsyke
```

# Verktygssidemall (svenska rubriker)

```md
# {Övningsnamn}

## När övningen passar
## Vad du behöver
## Så gör du – steg för steg
## Vanliga hinder och justeringar
## Reflektionsfrågor efter övningen
## Spara/skriv ut mall
## Relaterade guider
## Relaterade övningar
## Gör övningen i MittPsyke
```

# CTA-placeringsstrategi

| Sidtyp | CTA 1 (hero) | CTA 2 (mitt i innehåll) | CTA 3 (slut) | Sticky CTA |
|---|---|---|---|---|
| Pillar | `Börja reflektera i MittPsyke` | Efter sektionen `Vad som brukar hjälpa` | `Skapa konto och fortsätt` | Desktop: ja, Mobile: nej |
| Kluster | `Prova övningen i MittPsyke` | Efter `Vad du kan göra steg för steg` | `Fortsätt i huvudguiden` | Desktop: nej, Mobile: nej |
| Verktyg | `Starta övningen i MittPsyke` | Efter steg 3 i `Så gör du` | `Spara framsteg i MittPsyke` | Desktop: ja, Mobile: ja |
| Indexsidor | `Hitta rätt guide` / `Se alla övningar` | Mellan sektioner | `Kom igång med MittPsyke` | Desktop: nej, Mobile: nej |

| CTA-textbibliotek (standard) | Användning |
|---|---|
| `Börja reflektera` | Pillar hero |
| `Prova övningen` | Kluster + verktyg |
| `Spara dina svar` | Verktyg efter interaktion |
| `Fortsätt i guiden` | Kluster slut |
| `Skapa konto gratis` | Sidfot och slutblock |
