# Publicera artiklar via Pages CMS

MittPsykes `main` är skyddad. Artiklar ska därför sparas på en separat branch och granskas i en pull request innan de mergas. Pages CMS får inte skriva direkt till `main`.

## Ny artikel

1. Öppna repositorymenyn i Pages CMS och välj **Manage branches**.
2. Skapa en branch från `main` med namnet `cms/artikel-<slug>`, till exempel `cms/artikel-somn-och-oro`.
3. Byt till den nya branchen. Kontrollera att branchnamnet, inte `main`, visas i repositorymenyn.
4. Skapa artikeln och ladda upp bilderna. Bilder ska ligga under `static/uploads` och visas som `/uploads/...` i artikeln.
5. Spara artikeln.
6. Öppna branchen på GitHub och kontrollera att både Markdown-filen och alla nya bilder finns i ändringarna.
7. Öppna en pull request mot `main` på GitHub. Merga inte förrän `check-and-build` är grön och innehållet är granskat.

Pages CMS öppnar inte pull requesten automatiskt. Ingen automatisk merge eller deployment ingår i det här flödet.

## Om ett sparande misslyckas

Försök inte spara eller ladda upp samma innehåll direkt igen om det är oklart om GitHub tog emot den första begäran. Pages CMS kan annars skapa en ny fil med suffix som `-1`.

1. Ladda om sidan.
2. Kontrollera att rätt `cms/artikel-...`-branch är vald.
3. Kontrollera på GitHub om artikeln eller bilden redan finns på branchen.
4. Försök igen endast om filen verkligen saknas.

## Begripliga fel

### Repositoryt kräver pull request

Engelskt meddelande:

> This repository requires changes through a pull request.

Det betyder normalt att `main` är vald. Skapa eller välj en `cms/artikel-...`-branch och spara där. Skyddet för `main` ska inte ändras.

### Filen har ändrats

Engelskt meddelande:

> File has changed since you last loaded it.

Ladda om artikeln innan du fortsätter. Kontrollera ändringarna innan du sparar igen, så att någon annans arbete inte skrivs över.

### Filen finns redan eller har fått ett nytt namn

Kontrollera branchen på GitHub innan du försöker igen. Om Pages CMS har skapat exempelvis `artikel-1.md` ska pull requesten inte mergas förrän det är fastställt vilken fil som är den avsedda artikeln.

### Bilden saknas

Pull requestens tester blir röda om en artikel hänvisar till en lokal `/uploads/...`-bild som inte finns i repositoryt. Lägg till den saknade bilden på samma branch och kör kontrollerna igen.

## Vad pull requesten ska innehålla

- En avsedd artikel under `src/content/articles`.
- Alla nya bilder som artikeln hänvisar till under `static/uploads`.
- Inga suffigerade återförsökskopior som `artikel-1.md` med samma titel som originalet.
- Inga orelaterade ändringar.

Publiceringen sker först när pull requesten har granskats och mergats manuellt enligt repositoryts regler.
