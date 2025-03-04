import type { FC } from "react";
import React from "react";

interface DrawToolbarProps {
  hasPolygon: boolean;
  handleCancelDrawable: () => void;
  applyPolygon: () => void;
}

export const DrawToolbar: FC<DrawToolbarProps> = ({
  hasPolygon,
  handleCancelDrawable,
  applyPolygon,
}) => (
  <div className="draw-toolbar-container">
    <div>
      <p>Draw a shape to search a specific area</p>
    </div>
    <div className="fixed-toolbar-button-container">
      <button
        className="common-button fixed-toolbar-button"
        onClick={handleCancelDrawable}
      >
        CANCEL
      </button>
      <button
        className="common-button fixed-toolbar-button"
        onClick={applyPolygon}
        disabled={!hasPolygon}
      >
        APPLY
      </button>
    </div>
  </div>
);
