import type { FC, ChangeEventHandler } from "react";

import React from "react";
import { encode } from "../../utils/encoding";

interface ConfigToolbarProps {
  coordinateDecimals: number;
  RDPTolerance: number;
  onDecimalsChange: ChangeEventHandler<HTMLInputElement>;
  onRDPToleranceChange: ChangeEventHandler<HTMLInputElement>;
  coordinates?: google.maps.LatLng[] | null;
}

export const ConfigToolbar: FC<ConfigToolbarProps> = ({
  coordinateDecimals,
  RDPTolerance,
  onDecimalsChange,
  onRDPToleranceChange,
  coordinates,
}) => {
  const encoding = coordinates
    ? encode(
        coordinates.map((b) => [b.lat(), b.lng()]),
        coordinateDecimals
      )
    : null;
  return (
    <div className="config-toolbar-container">
      <div className="config-toolbar config-toolbar-tolerance">
        <span className="config-toolbar-label">RDP Tolerance</span>
        <input
          type="number"
          min="0"
          max="1"
          step="0.00001"
          value={RDPTolerance}
          onChange={onRDPToleranceChange}
        />
      </div>
      <div className="config-toolbar config-toolbar-decimals">
        <span className="config-toolbar-label">
          Coordinates decimal precision
        </span>
        <input
          type="number"
          min="1"
          max="8"
          step="1"
          value={coordinateDecimals}
          onChange={onDecimalsChange}
        />
      </div>
      {coordinates && encoding && (
        <div className="config-toolbar config-toolbar-encoding">
          <div className="config-toolbar-section">
            <span className="config-toolbar-label">
              <strong className="config-toolbar-label-title">
                Coordinates
              </strong>
              : {coordinates.length} length
            </span>
            <div className="config-toolbar-label-result">
              {coordinates.toString()}
            </div>
          </div>
          <div className="config-toolbar-section">
            <span className="config-toolbar-label">
              <strong className="config-toolbar-label-title">Encoding</strong>:{" "}
              {encoding.length} characters
            </span>
            <div className="config-toolbar-label-result">{encoding}</div>
          </div>
          <div className="config-toolbar-section">
            <span className="config-toolbar-label">
              <strong className="config-toolbar-label-title">URL</strong>:{" "}
              {encodeURIComponent(encoding).length} characters
            </span>
            <div className="config-toolbar-label-result">
              {encodeURIComponent(encoding)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
