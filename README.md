# Portfolio Website

Moderne single-page portfolio van Xander, gebouwd met een onderhoudbare structuur en duidelijke scheiding tussen content, styling en gedrag.

## Structuur

```text
.
├── CNAME
├── htaccess
├── index.html, projects.html, blog.html   # portfolio-pagina's
├── assets/                                # alleen portfolio (css, js, blog-afbeeldingen, video's)
├── arcade/         # zelfstandig subproject (index.html, rummikub, uno, css/, js/)
├── cohousing/      # zelfstandig subproject (index.html, cheques, notes, css/, js/)
├── deathcounter/   # zelfstandig subproject (index.html, spelers, css/, js/)
├── luna/           # zelfstandig subproject (index.html, 4 pagina's, css/, js/, images/)
├── x/              # geheime navigatiepagina (/x/): knoppen naar alle subprojecten, noindex, niet gelinkt
└── arcade.html, cohousing.html, ...       # redirect-stubs naar de nieuwe locaties
```

Elk subproject heeft zijn eigen assets en deelt niets met het portfolio. Alleen de Firebase-database (project `co-housing-e2c00`) wordt door de subprojecten gedeeld; de URL's staan in hun eigen JS.

## Architectuur

- `index.html`
	- Semantische layout met secties: Home, Over Mij, Skills, Projecten, Contact
	- Toegankelijke navigatie met skip-link en duidelijke landmarks
- `assets/css/style.css`
	- Design tokens via CSS variabelen (`:root`)
	- Responsieve layout, herbruikbare component classes, animatie states
- `assets/js/main.js`
	- Gedragslaag voor navigatie, actieve sectie, reveal animaties, skills progress en contactformulier
	- Centraal `portfolioProfile` object voor naam, e-mail, LinkedIn, GitHub, locatie en CV-link
	- Motion laag met staged hero-intro, scroll reveal stagger en subtiele hero parallax

## Onderhoud Tips

- Kleuren, radius, schaduwen en spacing pas je centraal aan in `:root` variabelen.
- Nieuwe sectie toevoegen:
	1. Voeg een nieuwe `<section id="...">` toe in `index.html`
	2. Voeg een nav-link toe die verwijst naar hetzelfde id
	3. Gebruik bestaande utility/component classes om stijl consistent te houden
- Contactgegevens en projectteksten staan op 1 plek in `index.html` en zijn daardoor snel aanpasbaar.
- Persoonlijke gegevens (naam, links, e-mail, CV) beheer je centraal in `assets/js/main.js` in `portfolioProfile`.

## Lokale Preview

Open `index.html` direct in de browser of gebruik een simpele static server (bijv. VS Code Live Server).
