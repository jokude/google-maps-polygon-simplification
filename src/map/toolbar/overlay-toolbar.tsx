import type { FC } from "react";
import React from "react";

interface OverlayToolbarProps {
  drawable: boolean;
  hasPolygon: boolean;
  handleClearMap: () => void;
  handleDrawable: () => void;
}

export const OverlayToolbar: FC<OverlayToolbarProps> = ({
  drawable,
  hasPolygon,
  handleClearMap,
  handleDrawable,
}) => (
  <div className="overlay-toolbar">
    {hasPolygon && (
      <button
        className="common-button overlay-toolbar-button"
        onClick={handleClearMap}
      >
        CLEAR
      </button>
    )}
    <button
      className="common-button overlay-toolbar-button"
      onClick={handleDrawable}
      disabled={drawable && hasPolygon && true}
    >
      DRAW ON MAP
    </button>
  </div>
);
