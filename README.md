# KT815 JSON Test — Screw Recipe Viewer

Live app: [hm-info.github.io/KT815-json-test](https://hm-info.github.io/KT815-json-test/).

Open `index.html` in Edge, Chrome or Firefox. No installation, build, server or internet connection is needed. The interface and drawing are in English. This standalone tool does not change the HMI application.

- Load the built-in example or open/drop one JSON recipe.
- Select a screw or register row to inspect every original record at that edge position. Filter the register by edge.
- Export the diagram as SVG or 2× PNG. Use **Print / PDF** for the diagram, profile reference and full register (choose Save as PDF in the browser).
- Exported SVG/PNG contains the plan, position labels and an edge parameter summary when space permits. Individual height/depth records and the schematic profile reference are in the interactive panel and printed report.

Coordinates follow the supplied machine reference: top and bottom positions are measured from the right end towards the left; left and right positions are measured from the bottom end upwards. Geometry preserves the width/height ratio. Labels may be displaced with leader lines for readability. Multiple source records at the same edge/position share one marker; different depth/height values remain available individually.

`Width` and `Height` must be positive JSON numbers. `espagnoletteData` must include `topScrews`, `bottomScrews`, `leftScrews`, `rightScrews` arrays (empty arrays are allowed). Each record requires finite numeric `screwingPos`, `screwingHeight`, `screwingDepth`. Positions outside their edge length are rejected without replacing the current drawing. Files are limited to 5 MB and 10,000 records. Large files can be slow to render.

Units are assumed to be mm. Operation order and opening direction are not inferred. Mullion geometry is not defined in the supplied schema; when enabled, the viewer displays a warning and draws the perimeter only. The profile section is schematic, not a production profile drawing. Files are processed in the browser and are never uploaded or persisted.

Validation: `node --test recipe.test.cjs` from this directory.

## GitHub Pages

This is a buildless static app. Publish the `main` branch root with GitHub Pages (Settings → Pages → Deploy from a branch → main / root). All assets use relative paths so the app works under the repository URL as well as from a local file. No dependencies or server-side services are required.
