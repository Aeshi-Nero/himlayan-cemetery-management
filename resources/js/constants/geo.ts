/**
 * Shared geometry constants for the Engineer workspace map.
 * Kept in one module so every coordinate/zoom/duration value has a name and a single source of truth.
 */

/** Default cemetery id used when a plot/map has no cemetery assignment. */
export const DEFAULT_CEMETERY_ID = 'default-himlayan';

/** Default map view center (Himlayan Memorial Park). */
export const DEFAULT_MAP_CENTER: [number, number] = [14.671, 121.0415];

/** Default polygon corner coords for a new Himlayan cemetery. */
export const DEFAULT_HIMLAYAN_POLYGON: [number, number][] = [
  [14.675, 121.037],
  [14.675, 121.045],
  [14.665, 121.045],
  [14.665, 121.037],
];

/** Fallback latitude used when a plot has no coordinates yet. */
export const FALLBACK_PLOT_LAT = 14.672;

/** Fallback longitude used when a plot has no coordinates yet. */
export const FALLBACK_PLOT_LNG = 121.041;

/** Zoom level used by map.flyTo() when focusing a cemetery or plot. */
export const FOCUS_ZOOM_LEVEL = 17;

/** Default zoom level when the map first loads. */
export const DEFAULT_MAP_ZOOM = 16;

/** Distance (degrees) under which a drawn point snaps to an existing path node. */
export const PATH_SNAP_THRESHOLD = 0.003;

/** Duration (seconds) of map.flyTo() animations. */
export const FLY_DURATION_SECONDS = 0.4;

/** Coordinate offset (degrees) applied when duplicating a single plot. */
export const DUPLICATE_SINGLE_OFFSET = 0.0012;

/** Coordinate offset (degrees) applied when duplicating many plots. */
export const DUPLICATE_MULTI_OFFSET = 0.003;

/** Base number used when generating a next plot number (e.g. "A-101"). */
export const PLOT_NUMBER_BASE = 101;

/** Minimum number of border nodes required to form a boundary polygon. */
export const MIN_BORDER_PLOTS = 3;

/** Minimum number of polygon corners required to render a boundary. */
export const MIN_POLYGON_POINTS = 3;
