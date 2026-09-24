// Custom hero stages, only for chapters whose idea needs a picture. Every other
// chapter uses FramePlayer's default metric tiles. Add one here per flagship chapter.
import { lazy } from "react";

export const HEROES = {
  b04: lazy(() => import("./B04Hero.jsx")),
  b05: lazy(() => import("./B05Hero.jsx")),
  e01: lazy(() => import("./E01Hero.jsx")),
  p03: lazy(() => import("./P03Hero.jsx")),
  p13: lazy(() => import("./P13Hero.jsx")),
};
