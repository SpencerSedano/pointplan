# PointPlan

Plan trips day by day: stops, times, costs and a map, in one page that works offline.

## What it does

- **Itinerary** – day cards with times, numbered stops, drive times and distances. Drag stops to reorder them or move them to another day; times that no longer make sense turn red.
- **Map** – numbered markers in each day's colour, routes that link each day to the next, and markers in the same spot shown side by side.
- **Budget** – a budget sheet grouped by category (flights, stays, transport, ETC pass, tickets, food, SIM card, insurance…), with a column per currency, totals and per-person cost.
- **Checklist** – a to-do and packing list for each trip, with suggestions based on the trip.
- **Import and export** – bring in an Excel or CSV itinerary (English, Spanish and Chinese column names are recognised) and export a trip back to Excel.
- **Offline** – install it on your phone's home screen. It opens and saves without internet, and map areas you have viewed stay available.
- **Backup** – Settings → Your data: download all trips as one file, or restore them on another device.

## Where your trips are saved

Trips are saved on the device you use, in the browser. To move them to another phone or computer, use **Settings → Download backup**, then **Restore from backup** on the other device.

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
| `vendor/` | Leaflet (maps), topojson-client and SheetJS (Excel), with their licences in `vendor/licenses/` |

## Credits

- Map tiles: © OpenStreetMap contributors, © CARTO
- Country outlines: Natural Earth, via [world-atlas](https://github.com/topojson/world-atlas)
- Cities: GeoNames (CC BY 4.0), via [all-the-cities](https://github.com/zeke/all-the-cities)
- Online place search: OpenStreetMap Nominatim
