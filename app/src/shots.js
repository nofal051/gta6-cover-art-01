// Vice Nights Cover Press — screenshot scenes.
// Each shot is a URL query the app understands (?shot=<name>), so a
// headless browser can render the exact scene for the dossier. The cover
// shot shows the exported wide cover full-frame; the editor shot shows
// the app at work with a photo loaded; the portrait and square shots show
// the other two export sizes. The diagonal layout and the Candy Floss
// grade get exercised here so the screenshots prove they exist.

export const VICE_SHOTS = [
  {
    name: "cover",
    file: "1-cover.jpg",
    w: 1280,
    h: 720,
    query: "?shot=cover&layout=diagonal&grade=candy&title=VICE%20NIGHTS&subtitle=chase%20the%20sunset",
    note: "Exported wide cover, Diagonal Split layout, Candy Floss grade.",
  },
  {
    name: "editor",
    file: "2-editor.jpg",
    w: 1280,
    h: 720,
    query: "?shot=editor&layout=hero&grade=sunset&title=NEON%20COAST&subtitle=drive%20all%20night&size=wide",
    note: "Editor in the browser with a sample photo loaded.",
  },
  {
    name: "portrait",
    file: "3-cover-portrait.jpg",
    w: 1024,
    h: 1280,
    query: "?shot=cover&layout=grid&grade=neon&title=MIDNIGHT%20RUN&subtitle=no%20maps%2C%20just%20lights&size=portrait",
    note: "Exported portrait cover, 2 x 2 grid, Neon Night grade.",
  },
  {
    name: "square",
    file: "4-cover-square.jpg",
    w: 1024,
    h: 1024,
    query: "?shot=cover&layout=strip&grade=golden&title=GOLDEN%20HOUR&subtitle=last%20light%2C%20first%20gear&size=square",
    note: "Exported square cover, Triple Strip layout, Golden Hour grade.",
  },
];

export function shotByName(name) {
  return VICE_SHOTS.find((s) => s.name === name) || VICE_SHOTS[0];
}
