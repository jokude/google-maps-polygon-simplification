import type { Points } from "../utils/types";

import React, { useEffect, useReducer, useRef } from "react";
import { simplify } from "../utils/simplify";
import { Toolbar } from "./toolbar";
import "./map.css";

interface MapState {
  library: google.maps.MapsLibrary | null;
  map: google.maps.Map | null;
  drawable: boolean;
  hasPolygon: boolean;
}

const reducer = (state: MapState, action: Partial<MapState>) => ({
  ...state,
  ...action,
});

const initLibrary = async (
  onLoad: (library: google.maps.MapsLibrary) => void
): Promise<void> => {
  const library = (await google.maps.importLibrary(
    "maps"
  )) as google.maps.MapsLibrary;

  onLoad(library);
};

const initMap = ({ Map }: google.maps.MapsLibrary): google.maps.Map => {
  return new Map(document.getElementById("map") as HTMLElement, {
    center: { lat: -33.438236, lng: -70.61582 },
    zoom: 12,
    fullscreenControl: false,
  });
};

export const Map = () => {
  const [{ library, map, drawable, hasPolygon }, dispatch] = useReducer(
    reducer,
    {
      drawable: false,
      map: null,
      library: null,
      hasPolygon: false,
    }
  );

  const ref = useRef<{
    polygon: google.maps.Polygon | null;
    simplified: google.maps.Polygon | null;
  }>({
    polygon: null,
    simplified: null,
  });

  useEffect(() => {
    initLibrary((library) => dispatch({ library }));
  }, []);

  useEffect(() => {
    if (library) {
      dispatch({ map: initMap(library) });
    }
  }, [library]);

  useEffect(() => {
    if (drawable) {
      enableDrawableHelper();
    } else {
      removeListener("mousedown");
      removeListener("mouseup");
    }
    toggleInteractions(!drawable);
  }, [drawable]);

  const toggleInteractions = (enable: boolean): void => {
    map?.setOptions({
      draggable: enable,
      disableDefaultUI: !enable,
    });
  };

  const removeListener = (eventName: string) => {
    if (map) {
      google.maps.event.clearListeners(map, eventName);
    }
  };

  const clearPolygon = () => {
    ref.current.polygon?.setMap(null);
    ref.current.simplified?.setMap(null);
    dispatch({ hasPolygon: false });
  };

  const enableDrawableHelper = () => {
    if (map) {
      removeListener("mousedown");
      map.addListener("mousedown", drawFreeHand);
    }
  };

  const getTolerance = (zoom: number) => {
    const baseTolerance = 1e-12;
    const circumference = 40075017 / 10;
    const maxZoomLevel = 22;
    return baseTolerance * circumference * 2 ** (maxZoomLevel - zoom);
  };

  const simplifyPath = ({
    polygon,
    tolerance,
  }: {
    polygon: google.maps.Polygon;
    tolerance: number;
  }): Points => {
    const bounds: Points = [];
    const paths = polygon.getPaths();

    paths.forEach((path) => {
      const coords = path.getArray();
      const total = coords.length;
      for (let i = 0, l = total; i < l; i++) {
        bounds.push({ x: coords[i].lng(), y: coords[i].lat() });
      }
      // Appending the first coords as last to make a complete polygon
      if (coords[0]) {
        bounds.push({ x: coords[0].lng(), y: coords[0].lat() });
      }
    });

    const simp = simplify(bounds, tolerance, false);
    console.log(bounds.length, simp.length);
    return simp;
  };

  const createPolygon = ({
    map,
    paths,
    color,
  }: {
    map: google.maps.Map;
    paths: google.maps.PolygonOptions["paths"];
    color: string;
  }): google.maps.Polygon => {
    const { Polygon } = library!;

    return new Polygon({
      clickable: false,
      fillColor: color,
      fillOpacity: 0.25,
      geodesic: true,
      map,
      paths,
      strokeColor: color,
      strokeWeight: 3,
    });
  };

  const drawFreeHand = async () => {
    clearPolygon();

    const { Polyline } = library!;

    const drawPolyline = new Polyline({
      clickable: false,
      map,
      strokeColor: "#42A5F5",
      strokeWeight: 3,
    });

    if (map) {
      map.addListener("mousemove", (e: google.maps.MapMouseEvent) => {
        drawPolyline.getPath().push(e.latLng!);
      });

      map.addListener("mouseup", () => {
        removeListener("mousemove");
        removeListener("mouseup");

        const drawPath = drawPolyline.getPath();
        drawPolyline.setMap(null);

        const polygon = createPolygon({
          map,
          paths: drawPath,
          color: "#42A5F5",
        });

        const simplified: Points = simplifyPath({
          polygon,
          tolerance: getTolerance(map.getZoom()!),
        });

        const simplifiedPath = simplified.map(
          ({ x, y }) => new google.maps.LatLng(y, x)
        );

        const simplifiedPolygon = createPolygon({
          map,
          paths: simplifiedPath,
          color: "#ff5733",
        });

        ref.current.polygon = polygon;
        ref.current.simplified = simplifiedPolygon;

        dispatch({ hasPolygon: true });
      });
    }
  };

  const handleDrawable = () => {
    dispatch({ drawable: true });
  };

  const disableDrawing = () => {
    removeListener("mousedown");
    removeListener("mouseup");
  };

  const applyPolygon = () => {
    dispatch({ drawable: false });
    disableDrawing();
  };

  const handleClearMap = () => {
    clearPolygon();
    disableDrawing();
  };

  const handleCancelDrawable = () => {
    dispatch({ drawable: false });
    clearPolygon();
  };

  return (
    <>
      {map && (
        <Toolbar
          drawable={drawable}
          hasPolygon={hasPolygon}
          handleClearMap={handleClearMap}
          handleDrawable={handleDrawable}
          handleCancelDrawable={handleCancelDrawable}
          applyPolygon={applyPolygon}
        />
      )}
      <div id="map" />
    </>
  );
};
