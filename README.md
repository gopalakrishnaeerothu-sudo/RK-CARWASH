# R.K CAR WASH

Promotional website for **R.K CAR WASH** — car, bike, SUV, lorry and commercial vehicle washing by Krishnam Raju.
Call / WhatsApp: 9676467987 · Instagram: [@krishnamrajukshatriyas](https://www.instagram.com/krishnamrajukshatriyas)

## Stack
Vite + React 18 + TypeScript, plain CSS (`src/index.css`), Lucide icons. No backend.

The hero water / foam / shine effect is a real-time canvas particle simulation
(`src/components/WaterCanvas.tsx`) drawn over the photo, using coordinates in image
percentages so it stays aligned at every screen size.

## Develop
```sh
npm install
npm run dev      # http://127.0.0.1:5220
npm run build    # type-check + production build to dist/
```

## Editing content
- All text, phone numbers, services, steps and gallery entries live in `src/data.ts`.
- **Adding real work photos:** put the originals in `raw/` (not committed), add them to
  `scripts/optimize-images.mjs`, run `npm run images`, then list them in `gallery` in
  `src/data.ts` with a category of `Cars`, `Bikes`, `Lorries` or `Others`. The gallery
  filter buttons appear automatically for every category that has photos.
- The address, map and business hours are deliberately not filled in. Add them in
  `src/components/Sections.tsx` (`Contact`) once confirmed.

## Images
- `owner-*.webp` — real photographs of the owner.
- `promo-*.webp` — promotional visuals. They are labelled "Promotional visual" on the
  page and must not be presented as completed customer work.

## Deployment
Hosted on Vercel; pushes to `main` deploy automatically.

## Credits
Interface design language (Space Grotesk, studio palette, framed media plane, hotspots,
detail zoom) adapted from [VEYRA interactive car](https://github.com/amirmushichge/veyra-interactive-car)
by Amir Mušić, MIT License.
