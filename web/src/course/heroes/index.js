// Custom hero stages, only for chapters whose idea needs a picture. Every other
// chapter uses FramePlayer's default metric tiles. Add one here per flagship chapter.
import { lazy } from "react";

export const HEROES = {
  b04: lazy(() => import("./B04Hero.jsx")),
};
