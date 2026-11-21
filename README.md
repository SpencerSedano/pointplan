# PointPlan

Plan trips day by day: stops, times, costs and a map, in one page that works offline.

## What it does

- **Itinerary** – day cards with times, numbered stops, drive times and distances. Drag stops to reorder them or move them to another day; times that no longer make sense turn red.
- **Map** – numbered markers in each day's colour, routes that link each day to the next, and markers in the same spot shown side by side.
- **Budget** – a budget sheet grouped by category (flights, stays, transport, ETC pass, tickets, food, SIM card, insurance…), with a column per currency, totals and per-person cost.
- **Driving & fuel** – turn it on in the Budget tab to see road kilometres per day and for the whole trip (OpenStreetMap routing), with a fuel cost estimate from your car's km/L and the price per litre. Add the estimate to the budget sheet in one tap.
- **Currencies** – every amount in the budget sheet is also shown in your other currency, with totals in each and a button to update to today's exchange rate.
- **Checklist** – a to-do and packing list for each trip, with suggestions based on the trip.
- **Import and export** – bring in an Excel or CSV itinerary (English, Spanish and Chinese column names are recognised) and export a trip back to Excel.
- **Offline** – install it on your phone's home screen. It opens and saves without internet, and map areas you have viewed stay available.
- **Backup** – Settings → Your data: download all trips as one file, or restore them on another device.

## Where your trips are saved

- **Without signing in:** on the device you use, in the browser. Move them with **Settings → Download backup** and **Restore from backup**.
- **Signed in with Google:** in your account (Firebase), synced to every device where you sign in. They stay available offline and sync when you're back online. The first time you sign in, PointPlan offers to copy the trips on that device into your account.
- **Sharing:** open a trip → **Trip settings** → **Shared with** → enter someone's Google account email. They sign in to PointPlan and the trip appears for them; you both see each other's changes live. Only the owner can invite, remove people or delete the trip; others can leave it.

## Firebase setup (already done for this project)

1. `firebase-config.js` holds the web config of the Firebase project. It is public by design.
2. Authentication → Sign-in method → **Google** enabled, and the site's domain under **Settings → Authorized domains**.
3. Firestore database with the rules in `firestore.rules` pasted into **Firestore → Rules** and published. Update them there whenever that file changes.

## Run it

It is a static site with no build step.

- **Online:** published with GitHub Pages from the `main` branch (see `.github/workflows/pages.yml`).
- **Locally:** from this folder run `python3 -m http.server 8000` and open http://localhost:8000. Opening `index.html` directly from disk works too, but offline mode needs it served over http(s).

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The whole app: markup, styles and script |
| `sw.js` | Service worker that keeps the app and viewed map tiles available offline |
| `manifest.webmanifest`, `icons/` | Lets the app be installed on a phone or computer |
| `data/world.json` | Country outlines used when street maps can't load |
| `data/cities.json` | Cities used for place search and map labels |
| `cloud.js`, `firebase-config.js`, `firestore.rules` | Sign-in, sync and sharing (Firebase), its config, and the database security rules |
| `vendor/` | Leaflet (maps), topojson-client, SheetJS (Excel) and the Firebase JS SDK, with their licences in `vendor/licenses/` |

## Credits

- Map tiles: © OpenStreetMap contributors, © CARTO
- Country outlines: Natural Earth, via [world-atlas](https://github.com/topojson/world-atlas)
- Cities: GeoNames (CC BY 4.0), via [all-the-cities](https://github.com/zeke/all-the-cities)
- Online place search: OpenStreetMap Nominatim
- Road distances: OSRM public routing server (OpenStreetMap data)
- Exchange rates: ExchangeRate-API open access (open.er-api.com)
