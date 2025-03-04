import type { Points } from "../utils/types";

import React, {
  ChangeEventHandler,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { simplify } from "../utils/douglas-peucker";
// import { simplify } from "../utils/visvalingam";
import { DrawToolbar } from "./toolbar/draw-toolbar";
import { OverlayToolbar } from "./toolbar/overlay-toolbar";
import { ConfigToolbar } from "./toolbar/config-toolbar";
import "./map.css";

const initialCoordinateDecimals = 6;
const initialZoomLevel = 21;
const initialMapCenter = { lat: -33.438236, lng: -70.61582 };
const initialRDPTolerance = 0.00008;

interface MapState {
  library: google.maps.MapsLibrary | null;
  map: google.maps.Map | null;
  drawable: boolean;
  hasPolygon: boolean;
  coordinateDecimals: number;
  RDPTolerance: number;
  coordinates: google.maps.LatLng[] | null;
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
    center: initialMapCenter,
    zoom: initialZoomLevel,
    fullscreenControl: false,
  });
};

const toFixedDecimals = (num: number, fixed: number): number => {
  const re = new RegExp("^-?\\d+(?:.\\d{0," + (fixed || -1) + "})?");
  return parseFloat(num.toString().match(re)![0]);
};

export const Map = () => {
  const [
    {
      library,
      map,
      drawable,
      hasPolygon,
      coordinateDecimals,
      RDPTolerance,
      coordinates,
    },
    dispatch,
  ] = useReducer(reducer, {
    drawable: false,
    map: null,
    library: null,
    hasPolygon: false,
    coordinateDecimals: initialCoordinateDecimals,
    RDPTolerance: initialRDPTolerance,
    coordinates: null,
  });

  const ref = useRef<{
    polygon: google.maps.Polygon | null;
    simplified: google.maps.Polygon | null;
    reducedPrecision: google.maps.Polygon | null;
  }>({
    polygon: null,
    simplified: null,
    reducedPrecision: null,
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

  useEffect(() => {
    if (hasPolygon) {
      renderSimplifiedPolygon();
    }
  }, [hasPolygon, RDPTolerance, coordinateDecimals]);

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

  const clearAllPolygons = () => {
    ref.current.polygon?.setMap(null);
    clearSimplifiedPolygons();
    dispatch({ hasPolygon: false });
  };

  const clearSimplifiedPolygons = () => {
    ref.current.simplified?.setMap(null);
    ref.current.reducedPrecision?.setMap(null);
  };

  const enableDrawableHelper = () => {
    if (map) {
      removeListener("mousedown");
      map.addListener("mousedown", drawFreeHand);
    }
  };

  const getTolerance = (
    totalPoints: number,
    maxPoints: number,
    zoom: number
  ): number => {
    // more points results in a smaller tolerance factor
    const factor = Math.exp(0.01 * (totalPoints / maxPoints - 1));

    // google map resolution in meters based on zoom level
    const baseResolution = (156543.0339 * Math.cos(0)) / Math.pow(2, zoom);

    // smaller tolerance means more points
    const tolerance = RDPTolerance * baseResolution * factor;

    // console.log(zoom, baseResolution, tolerance);
    return tolerance;
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
    // const simp = simplify(bounds.map(b => ([b.x, b.y])), 30).map(b => ({ x: b[0], y: b[1] }));

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

  const renderSimplifiedPolygon = () => {
    clearSimplifiedPolygons();

    const polygon: google.maps.Polygon | null = ref.current.polygon;

    if (map && polygon) {
      const simplified: Points = simplifyPath({
        polygon,
        tolerance: getTolerance(
          polygon.getPaths().getLength(),
          30,
          map.getZoom()!
        ),
      });

      const simplifiedPath = simplified.map(
        ({ x, y }) => new google.maps.LatLng(y, x)
      );

      const reducedPrecisionPath = simplified.map(
        ({ x, y }) =>
          new google.maps.LatLng(
            toFixedDecimals(y, coordinateDecimals),
            toFixedDecimals(x, coordinateDecimals)
          )
      );

      const simplifiedPolygon = createPolygon({
        map,
        paths: simplifiedPath,
        color: "#ff5733",
      });

      const reducedPrecisionPolygon = createPolygon({
        map,
        paths: reducedPrecisionPath,
        color: "#f7dc6f",
      });

      ref.current.simplified = simplifiedPolygon;
      ref.current.reducedPrecision = reducedPrecisionPolygon;

      dispatch({ hasPolygon: true, coordinates: reducedPrecisionPath });
    }
  };

  const drawFreeHand = async () => {
    clearAllPolygons();

    const { Polyline } = library!;

    const drawPolyline = new Polyline({
      clickable: false,
      map,
      strokeColor: "#42A5F5",
      strokeWeight: 2,
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

        ref.current.polygon = polygon;

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
    clearAllPolygons();
    disableDrawing();
  };

  const handleCancelDrawable = () => {
    dispatch({ drawable: false });
    clearAllPolygons();
  };

  const handleDecimalsChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    dispatch({ coordinateDecimals: parseInt(e.target.value, 10) });
  };

  const handleRDPToleranceChange: ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    dispatch({ RDPTolerance: parseFloat(e.target.value) });
  };

  return (
    <>
      {drawable ? (
        <div className="fixed-toolbar no-mobile">
          <DrawToolbar
            hasPolygon={hasPolygon}
            handleCancelDrawable={handleCancelDrawable}
            applyPolygon={applyPolygon}
          />
          <ConfigToolbar
            coordinateDecimals={coordinateDecimals}
            onDecimalsChange={handleDecimalsChange}
            RDPTolerance={RDPTolerance}
            onRDPToleranceChange={handleRDPToleranceChange}
            coordinates={coordinates}
          />
        </div>
      ) : (
        <OverlayToolbar
          drawable={drawable}
          hasPolygon={hasPolygon}
          handleClearMap={handleClearMap}
          handleDrawable={handleDrawable}
        />
      )}
      <div id="map" />
    </>
  );
};
