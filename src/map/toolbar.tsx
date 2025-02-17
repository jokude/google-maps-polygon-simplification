import type { FC } from "react";
import React from "react";

interface ToolbarProps {
  drawable: boolean;
  hasPolygon: boolean;
  handleClearMap: () => void;
  handleDrawable: () => void;
  handleCancelDrawable: () => void;
  applyPolygon: () => void;
}

export const Toolbar: FC<ToolbarProps> = ({
  drawable,
  hasPolygon,
  handleClearMap,
  handleDrawable,
  handleCancelDrawable,
  applyPolygon,
}) =>
  drawable ? (
    <div className="fixed-toolbar no-mobile">
      <div style={{ paddingLeft: 25 }}>
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
  ) : (
    <div className="overlay-toolbar">
      {hasPolygon && (
        <button
          className="common-button overlay-toolbar-button"
          onClick={handleClearMap}
          style={{ margin: "0 5px" }}
        >
          CLEAR
        </button>
      )}
      <button
        className="common-button overlay-toolbar-button"
        onClick={handleDrawable}
        style={{ margin: "0 5px" }}
        disabled={drawable && hasPolygon && true}
      >
        DRAW ON MAP
      </button>
    </div>
  );
