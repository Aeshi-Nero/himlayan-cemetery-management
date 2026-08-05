import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navbar } from '@/Components/Engineer/Navbar';
import { Plot } from '@/types';
import type { AuthUser } from '@/types/inertia';
import {
  DEFAULT_CEMETERY_ID,
  DEFAULT_MAP_CENTER,
  DEFAULT_HIMLAYAN_POLYGON,
  FALLBACK_PLOT_LAT,
  FALLBACK_PLOT_LNG,
  FOCUS_ZOOM_LEVEL,
  FLY_DURATION_SECONDS,
  PLOT_NUMBER_BASE,
  MIN_BORDER_PLOTS,
  MIN_POLYGON_POINTS,
  DEFAULT_MAP_ZOOM,
  PATH_SNAP_THRESHOLD,
} from '@/constants/geo';
import {
  Wrench,
  Save,
  ArrowRight,
  Layers,
  Compass,
  CheckCircle2,
  Globe,
  Sliders,
  MapPin,
  X,
  Edit3,
  RefreshCw,
  Search,
  Plus,
  Building2,
  ChevronUp,
  ChevronDown,
  Hand,
  User,
  Copy,
  Trash2,
  Settings,
  RotateCw,
  Pencil,
  Clock,
  LogOut,
  Check,
  DoorOpen,
  Share2,
  Unlink,
} from 'lucide-react';

// Fix Leaflet icon URLs
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Business rule: maximum number of deceased-name stacks per apartment lot
const MAX_STACKS = 5;

const MapResizer: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const useMapZoom = (map: L.Map | null) => {
  const [zoom, setZoom] = useState(map ? map.getZoom() : 16);
  useEffect(() => {
    if (!map) return;
    setZoom(map.getZoom());
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoom', onZoom);
    return () => { map.off('zoom', onZoom); }
  }, [map]);
  return zoom;
};

// Helper: point-in-polygon algorithm for cemetery boundary check
const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
  if (!polygon || polygon.length < 3) return true;
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Helper: extract the sequential numeric suffix from a border plot number (e.g. "E-3" -> 3)
const getBorderSeqNumber = (plot: Plot): number => {
  const m = /-(\d+)$/.exec(plot.plot_number || '');
  return m ? parseInt(m[1], 10) : 0;
};

// Helper: compute the active boundary polygon (from placed border nodes, falling back to drawn boundary coords)
const getActiveBoundaryPolygon = (
  plots: Plot[],
  activeCemeteryId: string,
  polygonCoords: [number, number][]
): [number, number][] => {
  const activeBorders = plots.filter((p) => p.lot_type === 'border' && (p.cemetery_id || DEFAULT_CEMETERY_ID) === activeCemeteryId);
  if (activeBorders.length >= MIN_BORDER_PLOTS) {
    return sortBorderPlotsByPlacement(activeBorders).map((p) => [p.lat || FALLBACK_PLOT_LAT, p.lng || FALLBACK_PLOT_LNG] as [number, number]);
  }
  if (activeBorders.length === 0 && polygonCoords.length >= MIN_POLYGON_POINTS) {
    return polygonCoords;
  }
  return [];
};

// Helper: order border plots by their sequential placement number (placement order)
const sortBorderPlotsByPlacement = (borderPlots: Plot[]): Plot[] => {
  return [...borderPlots].sort((a, b) => getBorderSeqNumber(a) - getBorderSeqNumber(b));
};

// Helper: compute the boundary polygon as it would be if a given border node moved to `proposed`
const getProposedBoundaryPolygon = (
  plots: Plot[],
  activeCemeteryId: string,
  movedBorderId: string,
  proposed: [number, number]
): [number, number][] => {
  const activeBorders = plots.filter((p) => p.lot_type === 'border' && (p.cemetery_id || DEFAULT_CEMETERY_ID) === activeCemeteryId);
  if (activeBorders.length < MIN_BORDER_PLOTS) return [];
  return sortBorderPlotsByPlacement(activeBorders).map((p) =>
    p.id === movedBorderId ? proposed : ([p.lat || FALLBACK_PLOT_LAT, p.lng || FALLBACK_PLOT_LNG] as [number, number])
  );
};

// Helper: compute the next sequential border number for a cemetery
const nextBorderNumber = (plots: Plot[], cemeteryId: string): number => {
  const borders = plots.filter(
    (p) => p.lot_type === 'border' && (p.cemetery_id || DEFAULT_CEMETERY_ID) === cemeteryId
  );
  const max = borders.reduce((m, p) => Math.max(m, getBorderSeqNumber(p)), 0);
  return max + 1;
};

// Helper: parse deceased occupant names array from plot object or notes
const getPlotDeceasedNames = (plot: Plot): string[] => {
  if (plot.deceased_names && Array.isArray(plot.deceased_names) && plot.deceased_names.length > 0) {
    return plot.deceased_names;
  }
  if (plot.notes) {
    try {
      const parsed = JSON.parse(plot.notes);
      if (parsed && Array.isArray(parsed.deceased_names) && parsed.deceased_names.length > 0) {
        return parsed.deceased_names;
      }
    } catch {
      // not json
    }
  }
  return Array(plot.capacity || 1).fill('');
};

// Helper: extract raw user notes from plot notes JSON, or return plot notes as-is if not JSON
const getPlotUserNotes = (notes: string | undefined): string => {
  if (!notes) return '';
  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed === 'object') {
      if ('user_notes' in parsed) {
        return parsed.user_notes || '';
      }
    }
  } catch {
    // not json
  }
  return notes;
};

// Helper: compute zoom-clamped screen dimensions so plots and nodes never get oversized when zooming in
const calcPlotDimensions = (plot: Plot, zoomLevel: number) => {
  const { lot_type: lotType, width, height } = plot;
  const scale = Math.pow(1.22, Math.max(0, zoomLevel - 16));

  const baseW = width || (lotType === 'single' ? 14 : lotType === 'path' || lotType === 'border' || lotType === 'entrance' ? 12 : 18);
  const baseH = height || (lotType === 'single' ? 18 : lotType === 'path' || lotType === 'border' || lotType === 'entrance' ? 12 : 24);

  let w = baseW * scale;
  let h = baseH * scale;

  // Keep path, border, and entrance nodes compact while plots can expand without limits
  if (lotType === 'path' || lotType === 'border' || lotType === 'entrance') {
    w = Math.min(w, 20);
    h = Math.min(h, 20);
  }

  return { w, h, scale, baseW, baseH };
};

const PlotEditorOverlay: React.FC<{ 
  plot: Plot, 
  map: L.Map | null, 
  onUpdate: (id: string, updates: Partial<Plot>) => void,
  zoomLevel: number,
  onDelete?: (plot: Plot) => void,
  ignoreMapClickRef?: React.MutableRefObject<boolean>,
  hideControls?: boolean,
  marker?: L.Marker | null,
  activeGisTool?: string
}> = ({ plot, map, onUpdate, zoomLevel, onDelete, ignoreMapClickRef, hideControls = false, marker = null, activeGisTool }) => {
  const [pos, setPos] = useState({ x: -9999, y: -9999 });

  useEffect(() => {
    if (!map) return;

    let targetMarker: L.Marker | null = marker;

    const findMarker = () => {
      if (targetMarker) return targetMarker;
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker && (layer as any).plotId === plot.id) {
          targetMarker = layer as L.Marker;
        }
      });
      return targetMarker;
    };

    const updatePos = () => {
      const activeMarker = findMarker();
      const latlng = activeMarker ? activeMarker.getLatLng() : L.latLng(plot.lat || 0, plot.lng || 0);
      const pt = map.latLngToContainerPoint(latlng);
      setPos({ x: pt.x, y: pt.y });
    };

    updatePos();

    map.on('zoom move zoomend moveend', updatePos);

    const activeMarker = findMarker();
    if (activeMarker) {
      activeMarker.on('drag', updatePos);
      activeMarker.on('dragend', updatePos);
    } else {
      const timer = setTimeout(() => {
        const m = findMarker();
        if (m) {
          m.on('drag', updatePos);
          m.on('dragend', updatePos);
          updatePos();
        }
      }, 50);
      return () => {
        clearTimeout(timer);
        map.off('zoom move zoomend moveend', updatePos);
        if (targetMarker) {
          (targetMarker as L.Marker).off('drag', updatePos);
          (targetMarker as L.Marker).off('dragend', updatePos);
        }
      };
    }

    return () => {
      map.off('zoom move zoomend moveend', updatePos);
      if (targetMarker) {
        (targetMarker as L.Marker).off('drag', updatePos);
        (targetMarker as L.Marker).off('dragend', updatePos);
      }
    };
  }, [map, plot.id, plot.lat, plot.lng]);

  if (!map) return null;

  const { w, h, scale, baseW, baseH } = calcPlotDimensions(plot, zoomLevel);
  const r = plot.rotation || 0;
  const isNode = plot.lot_type === 'path' || plot.lot_type === 'border' || plot.lot_type === 'entrance';

  const handleMouseEnter = () => {
    if (map && map.dragging) {
      map.dragging.disable();
    }
  };

  const handleMouseLeave = () => {
    if (map && map.dragging && activeGisTool === 'pan') {
      map.dragging.enable();
    }
  };

  const startDrag = (e: React.MouseEvent, type: 'resize' | 'rotate', corner?: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (map && map.dragging) {
      map.dragging.disable();
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const startBaseW = baseW;
    const startBaseH = baseH;
    const startR = r;

    // Use getBoundingClientRect to calculate true centers
    const rect = map.getContainer().getBoundingClientRect();
    const centerX = rect.left + pos.x;
    const centerY = rect.top + pos.y;

    let finalW = startBaseW;
    let finalH = startBaseH;
    let finalR = startR;
    let finalLat = plot.lat ?? FALLBACK_PLOT_LAT;
    let finalLng = plot.lng ?? FALLBACK_PLOT_LNG;

    const onMove = (me: MouseEvent) => {
      me.stopPropagation();
      me.preventDefault();

      if (type === 'resize') {
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;

        const rad = startR * Math.PI / 180;
        const cos = Math.cos(-rad);
        const sin = Math.sin(-rad);

        const rotDx = dx * cos - dy * sin;
        const rotDy = dx * sin + dy * cos;

        const baseDx = rotDx / scale;
        const baseDy = rotDy / scale;

        let signX = 0;
        let signY = 0;

        if (corner === 'se') { signX = 1; signY = 1; }
        else if (corner === 'sw') { signX = -1; signY = 1; }
        else if (corner === 'ne') { signX = 1; signY = -1; }
        else if (corner === 'nw') { signX = -1; signY = -1; }
        else if (corner === 'n') { signY = -1; }
        else if (corner === 's') { signY = 1; }
        else if (corner === 'w') { signX = -1; }
        else if (corner === 'e') { signX = 1; }

        finalW = Math.max(10, startBaseW + signX * baseDx);
        finalH = Math.max(10, startBaseH + signY * baseDy);

        // Anchor the opposite edge: shift the center by half the actual screen change,
        // along the dragged edge direction (compensating for plot rotation).
        const actW = finalW - startBaseW;
        const actH = finalH - startBaseH;
        const lx = (signX * actW * scale) / 2;
        const ly = (signY * actH * scale) / 2;

        const shiftX = lx * Math.cos(rad) - ly * Math.sin(rad);
        const shiftY = lx * Math.sin(rad) + ly * Math.cos(rad);

        const newCenter = map.containerPointToLatLng(L.point(pos.x + shiftX, pos.y + shiftY));
        finalLat = newCenter.lat;
        finalLng = newCenter.lng;

        onUpdate(plot.id, { width: finalW, height: finalH, lat: finalLat, lng: finalLng });
      } else if (type === 'rotate') {
        const angle = Math.atan2(me.clientY - centerY, me.clientX - centerX);
        const startAngle = Math.atan2(startY - centerY, startX - centerX);
        const delta = (angle - startAngle) * 180 / Math.PI;
        finalR = startR + delta;

        onUpdate(plot.id, { rotation: finalR });
      }
    };

    const onUp = (ue?: MouseEvent) => {
      if (ue) {
        ue.stopPropagation();
        ue.preventDefault();
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      if (map && map.dragging && activeGisTool === 'pan') {
        map.dragging.enable();
      }

      if (type === 'resize') {
         onUpdate(plot.id, { width: finalW, height: finalH, lat: finalLat, lng: finalLng, _isFinal: true } as any);
      } else {
         onUpdate(plot.id, { rotation: finalR, _isFinal: true } as any);
      }
    };
    
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div 
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: 0,
        height: 0,
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      <div 
        style={{
          position: 'absolute',
          left: -w/2,
          top: -h/2,
          width: w,
          height: h,
          transform: `rotate(${r}deg)`,
          border: '1.5px solid #8b5cf6',
          pointerEvents: 'none'
        }}
      >
        {/* Resize Handles */}
        {!hideControls && !isNode && ['nw', 'ne', 'sw', 'se'].map(corner => (
          <div
            key={corner}
            onMouseDown={(e) => startDrag(e, 'resize', corner)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              position: 'absolute',
              width: 12,
              height: 6,
              backgroundColor: 'white',
              border: '1.5px solid #8b5cf6',
              borderRadius: '3px',
              pointerEvents: 'auto',
              cursor: 'pointer',
              ...(corner === 'nw' ? { top: -3, left: -6, width: 6, height: 6, borderRadius: '50%' } : {}),
              ...(corner === 'ne' ? { top: -3, right: -6, width: 6, height: 6, borderRadius: '50%' } : {}),
              ...(corner === 'sw' ? { bottom: -3, left: -6, width: 6, height: 6, borderRadius: '50%' } : {}),
              ...(corner === 'se' ? { bottom: -3, right: -6, width: 6, height: 6, borderRadius: '50%' } : {}),
              ...(corner === 'nw' && { boxShadow: '0 0 4px rgba(0,0,0,0.2)' }),
            }}
          />
        ))}
        {/* Mid-point width/height handles */}
        {!hideControls && !isNode && (
          <>
            <div onMouseDown={(e) => startDrag(e, 'resize', 'n')} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 12, height: 6, backgroundColor: 'white', border: '1.5px solid #8b5cf6', borderRadius: '4px', pointerEvents: 'auto', cursor: 'pointer' }} />
            <div onMouseDown={(e) => startDrag(e, 'resize', 's')} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 12, height: 6, backgroundColor: 'white', border: '1.5px solid #8b5cf6', borderRadius: '4px', pointerEvents: 'auto', cursor: 'pointer' }} />
            <div onMouseDown={(e) => startDrag(e, 'resize', 'w')} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', width: 6, height: 12, backgroundColor: 'white', border: '1.5px solid #8b5cf6', borderRadius: '4px', pointerEvents: 'auto', cursor: 'pointer' }} />
            <div onMouseDown={(e) => startDrag(e, 'resize', 'e')} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', width: 6, height: 12, backgroundColor: 'white', border: '1.5px solid #8b5cf6', borderRadius: '4px', pointerEvents: 'auto', cursor: 'pointer' }} />
          </>
        )}
        
        {/* Rotate Handle */}
        {!hideControls && (
          <div 
            onMouseDown={(e) => startDrag(e, 'rotate')}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              position: 'absolute',
              bottom: -32,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 24,
              height: 24,
              backgroundColor: 'white',
              border: '1.5px solid #cbd5e1',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
              cursor: 'grab',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            title="Rotate Lot"
          >
            <RotateCw size={14} className="text-slate-700" />
          </div>
        )}

        {/* Delete Handle - Centered at Top */}
        {!hideControls && onDelete && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (ignoreMapClickRef) ignoreMapClickRef.current = true;
              onDelete(plot);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (ignoreMapClickRef) ignoreMapClickRef.current = true;
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              if (ignoreMapClickRef) ignoreMapClickRef.current = true;
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (ignoreMapClickRef) ignoreMapClickRef.current = true;
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              position: 'absolute',
              top: -32,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 26,
              height: 26,
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              zIndex: 10000
            }}
            title="Delete Lot"
          >
            <Trash2 size={13} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

const MultiSelectOverlay: React.FC<{
  plots: Plot[];
  map: L.Map | null;
  zoomLevel: number;
  ignoreMapClickRef?: React.MutableRefObject<boolean>;
  onDelete: () => void;
  onUpdate: (id: string, updates: any) => void;
}> = ({ plots, map, zoomLevel, ignoreMapClickRef, onDelete, onUpdate }) => {
  const isRotatingRef = useRef(false);
  const rotationRef = useRef(0);
  const baseBoundsRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const selectionKey = plots.map((p) => p.id).sort().join('|');

  useEffect(() => {
    isRotatingRef.current = false;
    rotationRef.current = 0;
    baseBoundsRef.current = null;
  }, [selectionKey]);

  if (!map || plots.length < 2) return null;

  const PAD = 6;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  plots.forEach((p) => {
    const pt = map.latLngToContainerPoint(L.latLng(p.lat || 0, p.lng || 0));
    const { w, h } = calcPlotDimensions(p, zoomLevel);
    const rad = ((p.rotation || 0) * Math.PI) / 180;
    const hx = (w * Math.abs(Math.cos(rad)) + h * Math.abs(Math.sin(rad))) / 2 + PAD;
    const hy = (w * Math.abs(Math.sin(rad)) + h * Math.abs(Math.cos(rad))) / 2 + PAD;
    if (pt.x - hx < minX) minX = pt.x - hx;
    if (pt.x + hx > maxX) maxX = pt.x + hx;
    if (pt.y - hy < minY) minY = pt.y - hy;
    if (pt.y + hy > maxY) maxY = pt.y + hy;
  });

  const cur = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };

  if (!isRotatingRef.current) {
    baseBoundsRef.current = cur;
  }
  const base = baseBoundsRef.current || cur;
  const rot = isRotatingRef.current ? rotationRef.current : 0;
  const cx = base.x + base.w / 2;
  const cy = base.y + base.h / 2;

  // Anchor buttons to the frozen bounds so they do not drift with rotation.
  const btnCx = base.x + base.w / 2;
  const rotateBtnTop = base.y + base.h;
  const deleteBtnTop = base.y;

  const anchorId = plots[0].id;

  const handleMouseEnter = () => {
    if (map && map.dragging) map.dragging.disable();
  };

  const handleMouseLeave = () => {
    if (map && map.dragging) map.dragging.enable();
  };

  const startRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (map && map.dragging) map.dragging.disable();

    isRotatingRef.current = true;
    rotationRef.current = 0;
    baseBoundsRef.current = cur;

    const rect = map.getContainer().getBoundingClientRect();
    const centerX = rect.left + cx;
    const centerY = rect.top + cy;
    const startX = e.clientX;
    const startY = e.clientY;
    const startR = plots[0].rotation || 0;
    let currentRotation = startR;

    const onMove = (me: MouseEvent) => {
      me.stopPropagation();
      me.preventDefault();
      const angle = Math.atan2(me.clientY - centerY, me.clientX - centerX);
      const startAngle = Math.atan2(startY - centerY, startX - centerX);
      const delta = (angle - startAngle) * 180 / Math.PI;
      currentRotation = startR + delta;
      rotationRef.current = delta;
      onUpdate(anchorId, { rotation: currentRotation });
    };

    const onUp = (ue?: MouseEvent) => {
      if (ue) {
        ue.stopPropagation();
        ue.preventDefault();
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (map && map.dragging) map.dragging.enable();
      isRotatingRef.current = false;
      rotationRef.current = 0;
      onUpdate(anchorId, { rotation: currentRotation, _isFinal: true });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  return (
    <div className="multi-select-overlay" style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, zIndex: 9998, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: cx,
          top: cy,
          width: base.w,
          height: base.h,
          transform: `translate(-50%, -50%) rotate(${rot}deg)`,
          transformOrigin: 'center',
          border: '2px dashed #8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.08)',
          borderRadius: 4,
          pointerEvents: 'none',
        }}
      />

      <div
        onMouseDown={startRotate}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'absolute',
          left: btnCx,
          top: rotateBtnTop,
          transform: 'translate(-50%, -50%)',
          width: 28,
          height: 28,
          backgroundColor: 'white',
          border: '2px solid #8b5cf6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          cursor: 'grab',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}
        title="Rotate selection"
      >
        <RotateCw size={15} className="text-violet-700" />
      </div>

      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (ignoreMapClickRef) ignoreMapClickRef.current = true;
          onDelete();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (ignoreMapClickRef) ignoreMapClickRef.current = true;
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          if (ignoreMapClickRef) ignoreMapClickRef.current = true;
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (ignoreMapClickRef) ignoreMapClickRef.current = true;
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'absolute',
          left: btnCx,
          top: deleteBtnTop,
          transform: 'translate(-50%, -50%)',
          width: 30,
          height: 30,
          backgroundColor: '#ef4444',
          color: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          zIndex: 10001,
        }}
        title="Delete selection"
      >
        <Trash2 size={15} className="text-white" />
      </div>
    </div>
  );
};

const iconCache = new Map<string, L.DivIcon>();

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const createPlotIcon = (
  plot: Plot,
  isSelected?: boolean,
  zoomLevel: number = 16,
  isEntrance?: boolean
) => {
  const { id, status, lot_type: lotType, rotation, color: customColor, capacity } = plot;
  const key = `${id}_${status}_${lotType}_${plot.width}_${plot.height}_${rotation}_${customColor || ''}_${isSelected ? 1 : 0}_${zoomLevel}_${capacity}_${isEntrance ? 1 : 0}`;
  if (iconCache.has(key)) {
    return iconCache.get(key)!;
  }
  if (iconCache.size > 2000) {
    iconCache.clear();
  }

  let color = customColor || '#00c853'; // available (green)
  if (status === 'reserved') color = '#f59e0b'; // reserved (amber)
  if (status === 'occupied' || status === 'full') color = '#ff1744'; // occupied (red)

  const activeStyle = isSelected
    ? 'outline: 2px solid #3b82f6; z-index: 1000;'
    : '';

  const { w, h } = calcPlotDimensions(plot, zoomLevel);
  const r = rotation || 0;

  const styleStr = `width: ${w}px; height: ${h}px; transform: rotate(${r}deg); ${activeStyle}`;

  let icon: L.DivIcon;
  if (lotType === 'entrance' || (lotType === 'path' && isEntrance)) {
    const entW = Math.max(w, 24);
    const entH = Math.max(h, 24);
    const entStyle = `width: ${entW}px; height: ${entH}px; transform: rotate(${r}deg); ${activeStyle}`;
    icon = L.divIcon({
      className: 'custom-engineer-plot-marker',
      html: `<div style="background-color: #0d9488; border-radius: 50%; border: 2.5px solid #f59e0b; box-shadow: 0 0 10px #f59e0b, 0 0 5px #0d9488; cursor: pointer; display: flex; align-items: center; justify-content: center; ${entStyle}" title="${escapeHtml(plot.name || 'Main Entrance Node')}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/>
          <path d="M2 20h20"/>
          <path d="M14 12v.01"/>
        </svg>
      </div>`,
      iconSize: [entW, entH],
      iconAnchor: [entW / 2, entH / 2],
    });
  } else if (lotType === 'path') {
    icon = L.divIcon({
      className: 'custom-engineer-plot-marker',
      html: `<div style="background-color: #14b8a6; border-radius: 50%; border: 2.5px solid #0f766e; box-shadow: 0 0 8px #14b8a6; cursor: pointer; ${styleStr}"></div>`,
      iconSize: [w, h],
      iconAnchor: [w / 2, h / 2],
    });
  } else if (lotType === 'border') {
    icon = L.divIcon({
      className: 'custom-engineer-plot-marker',
      html: `<div style="background-color: #10b981; border-radius: 50%; border: 2.5px solid #047857; box-shadow: 0 0 8px #10b981; cursor: pointer; ${styleStr}"></div>`,
      iconSize: [w, h],
      iconAnchor: [w / 2, h / 2],
    });
  } else if (!lotType || lotType === 'single') {
    icon = L.divIcon({
      className: 'custom-engineer-plot-marker',
      html: `<div style="background-color: ${color}; border: 2px solid white; border-radius: 2px; box-shadow: 0 0 8px ${color}; cursor: pointer; ${styleStr}"></div>`,
      iconSize: [w, h],
      iconAnchor: [w / 2, h / 2],
    });
  } else if (lotType === 'apartment') {
    icon = L.divIcon({
      className: 'custom-engineer-plot-marker',
      html: `<div style="background-color: ${color}; border: 2px solid white; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; color: white; box-shadow: 0 0 8px ${color}; cursor: pointer; ${styleStr}">${capacity || 2}</div>`,
      iconSize: [w, h],
      iconAnchor: [w / 2, h / 2],
    });
  } else if (lotType === 'family') {
    icon = L.divIcon({
      className: 'custom-engineer-plot-marker',
      html: `<div style="background-color: ${color}; border: 2px solid white; border-radius: 3px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px ${color}; cursor: pointer; ${styleStr}"><div style="width: 6px; height: 6px; border: 1.5px solid white; transform: rotate(45deg);"></div></div>`,
      iconSize: [w, h],
      iconAnchor: [w / 2, h / 2],
    });
  } else {
    icon = L.divIcon({
      className: 'custom-engineer-plot-marker',
      html: `<div style="background-color: ${color}; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px ${color}; cursor: pointer; ${styleStr}"></div>`,
      iconSize: [w, h],
      iconAnchor: [w / 2, h / 2],
    });
  }

  iconCache.set(key, icon);
  return icon;
};

type TileProvider = 'osm' | 'satellite' | 'topo';

const TILE_URLS: Record<TileProvider, { url: string; attribution: string; name: string; maxNativeZoom: number }> = {
  osm: {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxNativeZoom: 19,
  },
  satellite: {
    name: 'Esri World Imagery (Satellite)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxNativeZoom: 17,
  },
  topo: {
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxNativeZoom: 17,
  },
};

const MapEventsCapture: React.FC<{
  setMapInstance: (map: L.Map) => void;
  onMapClick: (latlng: L.LatLng) => void;
  onDropTool: (tool: 'standard' | 'apartment' | 'ground' | 'entrance' | 'point' | 'border', latlng: L.LatLng) => void;
  activeGisTool: string;
  setActiveGisTool?: (tool: 'standard' | 'apartment' | 'ground' | 'entrance' | 'point' | 'border' | 'select' | 'pan' | 'fill') => void;
  plots: Plot[];
  onPlotsSelected: (selected: Plot[], isAppend?: boolean) => void;
  ignoreMapClickRef: React.MutableRefObject<boolean>;
}> = ({ setMapInstance, onMapClick, onDropTool, activeGisTool, setActiveGisTool, plots, onPlotsSelected, ignoreMapClickRef }) => {
  const map = useMap();
  
  useEffect(() => {
    setMapInstance(map);
  }, [map, setMapInstance]);

  // Right-click drag automatically equips hand pan tool
  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();

    let isRightClickPan = false;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        if (setActiveGisTool) {
          setActiveGisTool('pan');
        }
        map.dragging.enable();
        isRightClickPan = true;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (isRightClickPan) {
        e.preventDefault();
        isRightClickPan = false;
      }
    };

    container.addEventListener('mousedown', handleMouseDown, true);
    container.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown, true);
      container.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, [map, setActiveGisTool]);

  // Drag and drop support directly on Leaflet map container to prevent event absorption
  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDomDrop = (e: DragEvent) => {
      e.preventDefault();
      const tool = e.dataTransfer?.getData('text/plain') || '';
      if (!['standard', 'apartment', 'ground', 'entrance', 'point', 'border'].includes(tool)) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const latlng = map.containerPointToLatLng([x, y]);
      onDropTool(tool as any, latlng);
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDomDrop);

    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDomDrop);
    };
  }, [map, onDropTool]);

  useEffect(() => {
    if (!map) return;
    if (activeGisTool === 'pan') {
      map.dragging.enable();
    } else {
      map.dragging.disable();
    }
    if (map.scrollWheelZoom) map.scrollWheelZoom.enable();
  }, [map, activeGisTool]);

  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (ignoreMapClickRef.current) {
        ignoreMapClickRef.current = false;
        return;
      }
      onMapClick(e.latlng);
    };
    
    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onMapClick, activeGisTool, ignoreMapClickRef]);

  // Custom Shift + Drag or Select Map Tool Multi-Selection
  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();

    let startX = 0;
    let startY = 0;
    let isDrawing = false;
    let marquee: HTMLDivElement | null = null;
    let justFinishedDrag = false;

    const removeMarquee = () => {
      if (marquee) {
        marquee.remove();
        marquee = null;
      }
      isDrawing = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (activeGisTool !== 'select' && !e.shiftKey) return;

      // Ensure the click started inside the map container
      const rect = container.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }

      // If user clicked on a marker, path, handle, button, input, or other interactive element, do not intercept
      let curr = e.target as HTMLElement | null;
      let isInteractive = false;
      while (curr && curr !== container) {
        if (
          curr.classList.contains('leaflet-marker-icon') ||
          curr.classList.contains('custom-engineer-plot-marker') ||
          curr.classList.contains('leaflet-interactive') ||
          curr.tagName === 'BUTTON' ||
          curr.tagName === 'INPUT' ||
          curr.tagName === 'SELECT' ||
          curr.tagName === 'TEXTAREA' ||
          curr.style.pointerEvents === 'auto' ||
          curr.getAttribute('role') === 'button'
        ) {
          isInteractive = true;
          break;
        }
        curr = curr.parentElement;
      }
      if (isInteractive) return;

      // Intercept completely to block standard dragging/zooming/marker-dragging
      e.preventDefault();
      e.stopPropagation();

      isDrawing = true;
      startX = e.clientX;
      startY = e.clientY;
      justFinishedDrag = false;
      
      // Temporarily disable map interactions
      map.dragging.disable();
      if (map.scrollWheelZoom) map.scrollWheelZoom.disable();
      if (map.boxZoom) map.boxZoom.disable();

      // Create a selection marquee element
      marquee = document.createElement('div');
      marquee.style.position = 'fixed';
      marquee.style.border = '2px dashed #3b82f6';
      marquee.style.backgroundColor = 'rgba(59, 130, 246, 0.18)';
      marquee.style.pointerEvents = 'none';
      marquee.style.zIndex = '99999';
      marquee.style.left = `${startX}px`;
      marquee.style.top = `${startY}px`;
      marquee.style.width = '0px';
      marquee.style.height = '0px';
      marquee.style.borderRadius = '4px';
      document.body.appendChild(marquee);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing || !marquee) return;
      e.preventDefault();
      e.stopPropagation();

      const currentX = e.clientX;
      const currentY = e.clientY;

      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(startX - currentX);
      const height = Math.abs(startY - currentY);

      marquee.style.left = `${left}px`;
      marquee.style.top = `${top}px`;
      marquee.style.width = `${width}px`;
      marquee.style.height = `${height}px`;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDrawing) return;
      isDrawing = false;

      // Re-enable map interactions depending on active tool
      if (activeGisTool === 'pan') {
        map.dragging.enable();
      } else {
        map.dragging.disable();
      }
      if (map.scrollWheelZoom) map.scrollWheelZoom.enable();
      if (map.boxZoom) map.boxZoom.disable();

      removeMarquee();

      const endX = e.clientX;
      const endY = e.clientY;

      if (Math.abs(startX - endX) < 4 && Math.abs(startY - endY) < 4) {
        return;
      }

      justFinishedDrag = true;
      ignoreMapClickRef.current = true;
      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      const relativeStartX = startX - rect.left;
      const relativeStartY = startY - rect.top;
      const relativeEndX = endX - rect.left;
      const relativeEndY = endY - rect.top;

      const minX = Math.min(relativeStartX, relativeEndX);
      const maxX = Math.max(relativeStartX, relativeEndX);
      const minY = Math.min(relativeStartY, relativeEndY);
      const maxY = Math.max(relativeStartY, relativeEndY);

      // Select all plots and nodes inside boundary box
      const selected = plots.filter(plot => {
        const lat = plot.lat || FALLBACK_PLOT_LAT;
        const lng = plot.lng || FALLBACK_PLOT_LNG;
        const point = map.latLngToContainerPoint([lat, lng]);
        return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
      });

      onPlotsSelected(selected, e.shiftKey || activeGisTool === 'select');
    };

    // Capture and prevent trailing click from triggering click handler on map
    const handleCaptureClick = (e: MouseEvent) => {
      if (justFinishedDrag) {
        e.preventDefault();
        e.stopPropagation();
        justFinishedDrag = false;
        if (ignoreMapClickRef) ignoreMapClickRef.current = false;
      }
    };

    // Attach listeners with capturing enabled at container / window levels
    container.addEventListener('mousedown', handleMouseDown, true);
    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('mouseup', handleMouseUp, true);
    container.addEventListener('click', handleCaptureClick, true);

    return () => {
      removeMarquee();
      if (map.dragging) map.dragging.enable();
      container.removeEventListener('mousedown', handleMouseDown, true);
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mouseup', handleMouseUp, true);
      container.removeEventListener('click', handleCaptureClick, true);
    };
  }, [map, plots, onPlotsSelected, activeGisTool, ignoreMapClickRef]);

  return null;
};

export default function EngineerWorkspacePage() {
  const user = usePage().props.auth.user as AuthUser | null;

  const [map, setMap] = useState<L.Map | null>(null);
  const zoomLevel = useMapZoom(map);

  // Map Tile & Panel State
  const [activeTile, setActiveTile] = useState<TileProvider>('osm');
  const [showDrawer, setShowDrawer] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [activeGisTool, setActiveGisTool] = useState<'standard' | 'apartment' | 'ground' | 'entrance' | 'point' | 'border' | 'select' | 'pan' | 'fill'>('pan');
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [selectedPlots, setSelectedPlots] = useState<Plot[]>([]);
  const [plotContextMenu, setPlotContextMenu] = useState<{ x: number; y: number; plotId: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    plotsToDelete: Plot[];
    message: string;
  } | null>(null);

  const dragStartLatLngRef = useRef<L.LatLng | null>(null);
  const dragStartPlotsPositionsRef = useRef<Record<string, { lat: number; lng: number }>>({});
  const dragOtherMarkersRef = useRef<{ layer: L.Marker; initialLat: number; initialLng: number }[]>([]);
  const dragStartRotationsRef = useRef<Record<string, number>>({});
  const dragLastGoodPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const isDraggingRef = useRef(false);
  const ignoreMapClickRef = useRef(false);
  const lastFlownCemeteryRef = useRef<string | null>(null);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());

  // Keep the right-click inspector anchored to its plot while the map pans/zooms.
  const plotContextMenuPlotId = plotContextMenu?.plotId;
  useEffect(() => {
    if (!map || !plotContextMenuPlotId) return;
    const activePlot = plots.find((p) => p.id === plotContextMenuPlotId);
    if (!activePlot) return;
    if (activePlot.lat == null || activePlot.lng == null) return;
    const plotLat = activePlot.lat;
    const plotLng = activePlot.lng;

    const syncContextMenuPosition = () => {
      const container = map.getContainer();
      const rect = container.getBoundingClientRect();
      const pt = map.latLngToContainerPoint(L.latLng(plotLat, plotLng));
      setPlotContextMenu((prev) =>
        prev && prev.plotId === plotContextMenuPlotId
          ? { ...prev, x: rect.left + pt.x, y: rect.top + pt.y }
          : prev
      );
    };

    syncContextMenuPosition();
    map.on('zoom move zoomend moveend', syncContextMenuPosition);
    return () => {
      map.off('zoom move zoomend moveend', syncContextMenuPosition);
    };
  }, [map, plotContextMenuPlotId, plots]);

  const [undoStack, setUndoStack] = useState<Plot[][]>([]);
  const [redoStack, setRedoStack] = useState<Plot[][]>([]);

  const saveToUndoStack = () => {
    setUndoStack((prev) => [...prev.slice(-49), plots.map((p) => ({ ...p }))]);
    setRedoStack([]);
  };

  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    const previousPlots: Plot[] = undoStack[undoStack.length - 1]!;
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, plots.map((p) => ({ ...p }))]);

    const currentPlots = plots;
    const previousMap = new Map<string, Plot>(previousPlots.map((p) => [p.id, p]));
    const currentMap = new Map<string, Plot>(currentPlots.map((p) => [p.id, p]));

    setPlots(previousPlots);

    if (selectedPlot && !previousMap.has(selectedPlot.id)) {
      setSelectedPlot(null);
    } else if (selectedPlot) {
      const restored = previousMap.get(selectedPlot.id);
      if (restored) setSelectedPlot(restored);
    }

    setSelectedPlots((prev) =>
      prev.filter((p) => previousMap.has(p.id)).map((p) => previousMap.get(p.id)!)
    );

    try {
      const toDelete = currentPlots.filter((p) => !previousMap.has(p.id) && !p.id.startsWith('plot-new-'));
      const toRestore = previousPlots.filter((p) => !currentMap.has(p.id));
      const toUpdate = previousPlots.filter((prevP) => {
        const currP = currentMap.get(prevP.id);
        if (!currP) return false;
        return (
          prevP.lat !== currP.lat ||
          prevP.lng !== currP.lng ||
          prevP.status !== currP.status ||
          prevP.lot_type !== currP.lot_type ||
          prevP.capacity !== currP.capacity ||
          prevP.price !== currP.price
        );
      });

      await Promise.all([
        ...toDelete.map(async (p) => {
          try {
            await window.axios.delete('/api/plots/' + p.id);
          } catch (err) {
            console.error(`Undo error deleting plot ${p.id}:`, err);
          }
        }),
        ...toRestore.map(async (p) => {
          try {
            await window.axios.post('/api/plots', {
              id: p.id,
              plot_number: p.plot_number,
              section: p.section,
              lot_type: p.lot_type,
              capacity: p.capacity,
              price: p.price,
              status: p.status,
              lat: p.lat,
              lng: p.lng,
              notes: p.notes || 'Restored via Undo.'
            });
          } catch (err) {
            console.error(`Undo error restoring plot ${p.plot_number}:`, err);
          }
        }),
        ...toUpdate.map(async (p) => {
          try {
            if (!p.id.startsWith('plot-new-')) {
              await window.axios.put('/api/plots/' + p.id, {
                lat: p.lat,
                lng: p.lng,
                status: p.status,
                lot_type: p.lot_type,
                capacity: p.capacity,
                price: p.price,
              });
            }
          } catch (err) {
            console.error(`Undo error updating plot ${p.id}:`, err);
          }
        })
      ]);
    } catch (err) {
      console.error('Error syncing undo with server:', err);
    }
  };

  const handleRedo = async () => {
    if (redoStack.length === 0) return;
    const nextPlots: Plot[] = redoStack[redoStack.length - 1]!;
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, plots.map((p) => ({ ...p }))]);

    const currentPlots = plots;
    const nextMap = new Map<string, Plot>(nextPlots.map((p) => [p.id, p]));
    const currentMap = new Map<string, Plot>(currentPlots.map((p) => [p.id, p]));

    setPlots(nextPlots);

    if (selectedPlot && !nextMap.has(selectedPlot.id)) {
      setSelectedPlot(null);
    } else if (selectedPlot) {
      const restored = nextMap.get(selectedPlot.id);
      if (restored) setSelectedPlot(restored);
    }

    setSelectedPlots((prev) =>
      prev.filter((p) => nextMap.has(p.id)).map((p) => nextMap.get(p.id)!)
    );

    try {
      const toDelete = currentPlots.filter((p) => !nextMap.has(p.id) && !p.id.startsWith('plot-new-'));
      const toRestore = nextPlots.filter((p) => !currentMap.has(p.id));

      await Promise.all([
        ...toDelete.map(async (p) => {
          try {
            await window.axios.delete('/api/plots/' + p.id);
          } catch (err) {
            console.error(`Redo error deleting plot ${p.id}:`, err);
          }
        }),
        ...toRestore.map(async (p) => {
          try {
            await window.axios.post('/api/plots', {
              id: p.id,
              plot_number: p.plot_number,
              section: p.section,
              lot_type: p.lot_type,
              capacity: p.capacity,
              price: p.price,
              status: p.status,
              lat: p.lat,
              lng: p.lng,
              notes: p.notes || 'Restored via Redo.'
            });
          } catch (err) {
            console.error(`Redo error restoring plot ${p.plot_number}:`, err);
          }
        })
      ]);
    } catch (err) {
      console.error('Error syncing redo with server:', err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // If user is focused on an input/textarea, ignore Delete/Backspace and tool shortcuts
      const isTyping = document.activeElement && (
        document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' || 
        document.activeElement.tagName === 'SELECT' ||
        document.activeElement.getAttribute('contenteditable') === 'true'
      );
      if (isTyping) return;

      // Tool equipment shortcut commands (1-8)
      if (e.key === '1') {
        setActiveGisTool('standard');
      } else if (e.key === '2') {
        setActiveGisTool('apartment');
      } else if (e.key === '3') {
        setActiveGisTool('ground');
      } else if (e.key === '4') {
        setActiveGisTool('entrance');
      } else if (e.key === '5') {
        setActiveGisTool('point');
      } else if (e.key === '6') {
        setActiveGisTool('border');
      } else if (e.key === '7') {
        setActiveGisTool('select');
      } else if (e.key === '8' || e.key.toLowerCase() === 'v' || e.key.toLowerCase() === 'h') {
        setActiveGisTool('pan');
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPlots.length > 0) {
          removeMultiplePlots(selectedPlots);
        } else if (selectedPlot) {
          removePlot(selectedPlot);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };
    const handleBlur = () => {
      setIsShiftPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleBlur);
    };
  }, [selectedPlots, selectedPlot, plots, undoStack, redoStack]);

  // Right-click and Details States
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    plot: Plot;
    isMultiple?: boolean;
  } | null>(null);

  const [editingPlotDetails, setEditingPlotDetails] = useState<Plot | null>(null);

  useEffect(() => {
    const handleCloseContextMenu = () => {
      setContextMenu(null);
    };
    window.addEventListener('click', handleCloseContextMenu);
    return () => {
      window.removeEventListener('click', handleCloseContextMenu);
    };
  }, []);

  const duplicatePlot = async (plot: Plot) => {
    saveToUndoStack();
    // Place the duplicate beside the original (to its right) instead of a fixed degree offset,
    // so it stays near the source regardless of zoom level or border shape.
    const srcLat = plot.lat || DEFAULT_MAP_CENTER[0];
    const srcLng = plot.lng || DEFAULT_MAP_CENTER[1];
    let offsetLat = srcLat;
    let offsetLng = srcLng;
    if (map) {
      const { w } = calcPlotDimensions(plot, zoomLevel);
      const srcPt = map.latLngToContainerPoint(L.latLng(srcLat, srcLng));
      const dupPt = map.containerPointToLatLng(L.point(srcPt.x + Math.max(w + 10, 24), srcPt.y));
      offsetLat = dupPt.lat;
      offsetLng = dupPt.lng;
    }
    const nextPlotNumber = `${plot.section}-${plots.length + PLOT_NUMBER_BASE}`;
    const targetLotType = plot.lot_type === 'border' ? 'path' : plot.lot_type;
    try {
      const res = await window.axios.post('/api/plots', {
        plot_number: nextPlotNumber,
        section: plot.section,
        lot_type: targetLotType,
        capacity: plot.capacity,
        price: plot.price,
        status: plot.status,
        lat: offsetLat,
        lng: offsetLng,
        cemetery_id: plot.cemetery_id || activeCemeteryId,
        notes: `Duplicated from Lot #${plot.plot_number}`
      });
      if (res.data?.success && res.data.data) {
        setPlots((prev) => [res.data.data, ...prev]);
        setSelectedPlot(res.data.data);
      }
    } catch (err) {
      console.error('Error duplicating plot:', err);
    }
  };

  const executeDeletePlotsDirectly = async (plotsToRemove: Plot[]) => {
    if (plotsToRemove.length === 0) return;

    saveToUndoStack();

    const allIdsToRemove = new Set(plotsToRemove.map((p) => p.id));

    // Update UI state immediately for responsive feel
    setPlots((prev) => {
      const remaining = prev.filter((p) => !allIdsToRemove.has(p.id));
      const remainingBorderPlots = remaining.filter((p) => p.lot_type === 'border' && (p.cemetery_id || DEFAULT_CEMETERY_ID) === activeCemeteryId);

      if (remainingBorderPlots.length === 0) {
        setPolygonCoords([]);
        const emptyGeoJson = JSON.stringify({ type: 'FeatureCollection', features: [] }, null, 2);
        setGeojsonText(emptyGeoJson);
        setCemeteries((cPrev) =>
          cPrev.map((c) =>
            c.id === activeCemeteryId ? { ...c, polygonCoords: [], geojsonText: emptyGeoJson } : c
          )
        );
      } else if (remainingBorderPlots.length >= 3) {
        const sorted = sortBorderPlotsByPlacement(remainingBorderPlots);
        const updatedCoords = sorted.map((p) => [p.lat || 0, p.lng || 0] as [number, number]);
        setPolygonCoords(updatedCoords);
        setCemeteries((cPrev) =>
          cPrev.map((c) =>
            c.id === activeCemeteryId ? { ...c, polygonCoords: updatedCoords } : c
          )
        );
      } else {
        const updatedCoords = remainingBorderPlots.map((p) => [p.lat || 0, p.lng || 0] as [number, number]);
        setPolygonCoords(updatedCoords);
        setCemeteries((cPrev) =>
          cPrev.map((c) =>
            c.id === activeCemeteryId ? { ...c, polygonCoords: updatedCoords } : c
          )
        );
      }

      return remaining;
    });

    setSelectedPlots((prev) => prev.filter((p) => !allIdsToRemove.has(p.id)));
    if (selectedPlot && allIdsToRemove.has(selectedPlot.id)) {
      setSelectedPlot(null);
    }
    if (editingPlotDetails && allIdsToRemove.has(editingPlotDetails.id)) {
      setEditingPlotDetails(null);
    }
    setConnections((prev) => prev.filter((c) => !allIdsToRemove.has(c.fromId) && !allIdsToRemove.has(c.toId)));
    setPlotContextMenu(null);
    setContextMenu(null);

    // Fire off background deletion calls
    try {
      await Promise.all(
        plotsToRemove.map(async (plot) => {
          if (plot.id.startsWith('plot-new-')) {
            return;
          }
          try {
            await window.axios.delete('/api/plots/' + plot.id);
          } catch (err: any) {
            if (err?.response?.status === 404) {
              // Plot already deleted or never existed on server, ignore
              return;
            }
            console.error(`Error deleting plot ${plot.id}:`, err);
          }
        })
      );
    } catch (err) {
      console.error('Error deleting plots on server:', err);
    }
  };

  const removePlot = (plot: Plot) => {
    ignoreMapClickRef.current = true;
    if (selectedPlots.length > 1 && selectedPlots.some((p) => p.id === plot.id)) {
      removeMultiplePlots(selectedPlots);
      return;
    }

    // Single item deletion (box or path node): execute directly without modal prompt
    executeDeletePlotsDirectly([plot]);
  };

  const removeMultiplePlots = (plotsToRemove: Plot[]) => {
    ignoreMapClickRef.current = true;
    if (plotsToRemove.length === 0) return;

    if (plotsToRemove.length === 1) {
      executeDeletePlotsDirectly(plotsToRemove);
      return;
    }

    // Multiple items deletion: show confirmation modal dialog
    setDeleteConfirmState({
      isOpen: true,
      plotsToDelete: plotsToRemove,
      message: `Would you really like to delete these ${plotsToRemove.length} items?`,
    });
  };

  const executeDeleteConfirmed = async () => {
    if (!deleteConfirmState || deleteConfirmState.plotsToDelete.length === 0) return;
    const plotsToRemove = deleteConfirmState.plotsToDelete;
    setDeleteConfirmState(null);
    await executeDeletePlotsDirectly(plotsToRemove);
  };

  const duplicateMultiplePlots = async (plotsToDuplicate: Plot[]) => {
    try {
      saveToUndoStack();
      const idMap = new Map<string, string>();

      const promises = plotsToDuplicate.map(async (plot, index) => {
        // Place each copy beside its original (to its right) at the current zoom level.
        const srcLat = plot.lat || DEFAULT_MAP_CENTER[0];
        const srcLng = plot.lng || DEFAULT_MAP_CENTER[1];
        let offsetLat = srcLat;
        let offsetLng = srcLng;
        if (map) {
          const { w } = calcPlotDimensions(plot, zoomLevel);
          const srcPt = map.latLngToContainerPoint(L.latLng(srcLat, srcLng));
          const dupPt = map.containerPointToLatLng(L.point(srcPt.x + Math.max(w + 10, 24), srcPt.y));
          offsetLat = dupPt.lat;
          offsetLng = dupPt.lng;
        }
        const nextPlotNumber = plot.lot_type === 'border' ? `Border-${Date.now().toString().slice(-4)}-${index}` : `${plot.section}-${plots.length + PLOT_NUMBER_BASE + index}`;
        const res = await window.axios.post('/api/plots', {
          plot_number: nextPlotNumber,
          section: plot.section,
          lot_type: plot.lot_type,
          capacity: plot.capacity,
          price: plot.price,
          status: plot.status,
          lat: offsetLat,
          lng: offsetLng,
          rotation: plot.rotation,
          width: plot.width,
          height: plot.height,
          cemetery_id: plot.cemetery_id || activeCemeteryId,
          notes: plot.lot_type === 'border' ? 'Independent border node' : `Duplicated from Lot #${plot.plot_number}`
        });
        if (res.data?.success && res.data.data) {
          const newPlot = res.data.data;
          idMap.set(plot.id, newPlot.id);
          return newPlot;
        }
        return null;
      });
      const results = await Promise.all(promises);
      const validResults = results.filter((r): r is Plot => r !== null);
      if (validResults.length > 0) {
        setPlots((prev) => [...validResults, ...prev]);
        setSelectedPlots(validResults);

        const newConnections: Array<{ id: string; fromId: string; toId: string; cemetery_id?: string }> = [];
        connections.forEach((conn) => {
          if (idMap.has(conn.fromId) && idMap.has(conn.toId)) {
            newConnections.push({
              id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              fromId: idMap.get(conn.fromId)!,
              toId: idMap.get(conn.toId)!,
              cemetery_id: conn.cemetery_id || activeCemeteryId,
            });
          }
        });

        // Ensure duplicated border nodes are automatically connected to each other into an independent perimeter loop
        const duplicatedBorderPlots = validResults.filter(p => p.lot_type === 'border');
        if (duplicatedBorderPlots.length >= 2) {
          const sortedBorders = sortBorderPlotsByPlacement(duplicatedBorderPlots);

          for (let i = 0; i < sortedBorders.length; i++) {
            const curr = sortedBorders[i];
            const next = sortedBorders[(i + 1) % sortedBorders.length];
            const exists = newConnections.some(
              c => (c.fromId === curr.id && c.toId === next.id) || (c.fromId === next.id && c.toId === curr.id)
            );
            if (!exists) {
              newConnections.push({
                id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                fromId: curr.id,
                toId: next.id,
                cemetery_id: activeCemeteryId,
              });
            }
          }
        }

        if (newConnections.length > 0) {
          setConnections((prev) => [...prev, ...newConnections]);
        }
      }
    } catch (err) {
      console.error('Error duplicating multiple plots:', err);
    }
  };

  const updatePlotField = async (plotId: string, fields: Partial<Plot>) => {
    try {
      saveToUndoStack();
      const res = await window.axios.put('/api/plots/' + plotId, fields);
      if (res.data?.success && res.data.data) {
        const updated = res.data.data;
        setPlots((prev) => prev.map((p) => p.id === plotId ? updated : p));
        if (selectedPlot?.id === plotId) {
          setSelectedPlot(updated);
        }
        if (editingPlotDetails?.id === plotId) {
          setEditingPlotDetails(updated);
        }
      }
    } catch (err) {
      console.error('Error updating plot fields:', err);
    }
  };

  // Build and persist the deceased-names update payload for an apartment lot (shared by add/rename/remove stack).
  const applyDeceasedNamesUpdate = async (
    targetPlot: Plot,
    nextNames: string[],
    nextCapacity: number
  ) => {
    if (nextNames.length > MAX_STACKS) {
      nextNames = nextNames.slice(0, MAX_STACKS);
      nextCapacity = Math.min(nextCapacity, MAX_STACKS);
    }
    const filledCount = nextNames.filter((n) => n.trim().length > 0).length;
    const userNotes = getPlotUserNotes(targetPlot.notes);
    const updated = {
      deceased_names: nextNames,
      capacity: Math.max(1, nextCapacity),
      current_occupants: filledCount,
      notes: JSON.stringify({ deceased_names: nextNames, user_notes: userNotes }),
    };
    setPlots((prev) => prev.map((p) => p.id === targetPlot.id ? { ...p, ...updated } : p));
    setSelectedPlot((p) => p && p.id === targetPlot.id ? { ...p, ...updated } : p);
    if (!targetPlot.id.startsWith('plot-new-')) {
      try {
        await window.axios.put('/api/plots/' + targetPlot.id, updated);
      } catch (err) {
        console.error('Error saving deceased stack:', err);
      }
    }
  };

  const addPlotAtLocation = async (tool: 'standard' | 'apartment' | 'ground' | 'entrance' | 'point' | 'border', latlng: L.LatLng) => {
    // Check if plot is placed within boundary perimeter when perimeter nodes exist
    let activePolygonCheck: [number, number][] = [];
    const activeBordersForPlacementCheck = plots.filter((p) => p.lot_type === 'border' && (p.cemetery_id || DEFAULT_CEMETERY_ID) === activeCemeteryId);
    if (activeBordersForPlacementCheck.length >= 3) {
      const sorted = sortBorderPlotsByPlacement(activeBordersForPlacementCheck);
      activePolygonCheck = sorted.map((p) => [p.lat || FALLBACK_PLOT_LAT, p.lng || FALLBACK_PLOT_LNG] as [number, number]);
    } else if (activeBordersForPlacementCheck.length === 0 && polygonCoords.length >= 3) {
      activePolygonCheck = polygonCoords;
    }

    if (activePolygonCheck.length >= 3 && tool !== 'border') {
      const isInside = isPointInPolygon([latlng.lat, latlng.lng], activePolygonCheck);
      if (!isInside) {
        alert('Cannot place plot outside the created cemetery border perimeter.');
        return;
      }
    }

    saveToUndoStack();
    const totalCount = plots.length;
    let sec = 'A';
    let lotType: Plot['lot_type'] = 'single';
    let capacity = 1;
    let price = 85000;
    
    if (tool === 'apartment') {
      sec = 'C';
      lotType = 'apartment';
      capacity = 8;
      price = 60000;
    } else if (tool === 'ground') {
      sec = 'B';
      lotType = 'family';
      capacity = 4;
      price = 35000;
    } else if (tool === 'entrance') {
      sec = 'ENT';
      lotType = 'entrance';
      capacity = 1;
      price = 0;
    } else if (tool === 'point') {
      sec = 'D';
      lotType = 'path';
      capacity = 1;
      price = 15000;
    } else if (tool === 'border') {
      sec = 'E';
      lotType = 'border';
      capacity = 1;
      price = 20000;
    }
    
    const plotNumber = tool === 'border' ? `E-${nextBorderNumber(plots, activeCemeteryId)}` : `${sec}-${totalCount + PLOT_NUMBER_BASE}`;
    const tempId = `plot-new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticPlot: Plot = {
      id: tempId,
      plot_number: plotNumber,
      name: lotType === 'entrance' ? 'Main Entrance' : undefined,
      section: sec,
      lot_type: lotType,
      capacity,
      current_occupants: 0,
      status: 'available',
      price,
      lat: latlng.lat,
      lng: latlng.lng,
      cemetery_id: activeCemeteryId,
      notes: `Created via GIS ${tool} tool.`
    };

    // Optimistically update UI state immediately
    const updatedPlots = [optimisticPlot, ...plots];
    setPlots(updatedPlots);
    setSelectedPlot(optimisticPlot);

    if (tool === 'border') {
      const existingBorders = updatedPlots.filter((p) => p.lot_type === 'border' && (p.cemetery_id || DEFAULT_CEMETERY_ID) === activeCemeteryId);
      const allBorders = existingBorders;

      if (allBorders.length >= 3) {
        setNeedsBorderNode(false);
      }

      const nonBorderConnections = connections.filter(c => {
        if (c.cemetery_id && c.cemetery_id !== activeCemeteryId) return true;
        const f = updatedPlots.find(p => p.id === c.fromId);
        const t = updatedPlots.find(p => p.id === c.toId);
        const isBorderConn = f?.lot_type === 'border' && t?.lot_type === 'border';
        return !isBorderConn;
      });

      if (allBorders.length >= 2) {
        const sorted = sortBorderPlotsByPlacement(allBorders);

        const newBorderConns: Array<{ id: string; fromId: string; toId: string; cemetery_id: string }> = [];
        for (let i = 0; i < sorted.length; i++) {
          const curr = sorted[i];
          const next = sorted[(i + 1) % sorted.length];
          newBorderConns.push({
            id: `conn-border-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            fromId: curr.id,
            toId: next.id,
            cemetery_id: activeCemeteryId,
          });
        }
        setConnections([...nonBorderConnections, ...newBorderConns]);
        setPolygonCoords(sorted.map((b) => [b.lat || 0, b.lng || 0] as [number, number]));
      } else {
        setConnections(nonBorderConnections);
      }
    }

    // If placed node is a path or entrance node, check if it falls on any existing connection segment between two path nodes
    if (lotType === 'path' || lotType === 'entrance') {
      const existingPathNodes = plots.filter(
        (p) => (p.lot_type === 'path' || p.lot_type === 'entrance') && (p.cemetery_id || DEFAULT_CEMETERY_ID) === activeCemeteryId
      );
      
      connections.forEach((conn) => {
        if (conn.cemetery_id && conn.cemetery_id !== activeCemeteryId) return;
        const nodeA = existingPathNodes.find((p) => p.id === conn.fromId);
        const nodeB = existingPathNodes.find((p) => p.id === conn.toId);
        if (!nodeA || !nodeB) return;

        const ax = nodeA.lng || FALLBACK_PLOT_LNG;
        const ay = nodeA.lat || FALLBACK_PLOT_LAT;
        const bx = nodeB.lng || FALLBACK_PLOT_LNG;
        const by = nodeB.lat || FALLBACK_PLOT_LAT;
        const px = latlng.lng;
        const py = latlng.lat;

        const abx = bx - ax;
        const aby = by - ay;
        const abLenSq = abx * abx + aby * aby;
        if (abLenSq === 0) return;

        const apx = px - ax;
        const apy = py - ay;
        const t = (apx * abx + apy * aby) / abLenSq;

        if (t >= 0.05 && t <= 0.95) {
          const cx = ax + t * abx;
          const cy = ay + t * aby;
          const dist = Math.hypot(px - cx, py - cy);

          if (dist < PATH_SNAP_THRESHOLD) {
            setConnections((prevConn) => {
              const filtered = prevConn.filter((c) => c.id !== conn.id);
              return [
                ...filtered,
                {
                  id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  fromId: nodeA.id,
                  toId: tempId,
                  cemetery_id: activeCemeteryId,
                },
                {
                  id: `conn-${Date.now() + 1}-${Math.random().toString(36).substring(2, 6)}`,
                  fromId: tempId,
                  toId: nodeB.id,
                  cemetery_id: activeCemeteryId,
                },
              ];
            });
          }
        }
      });
    }

    // Sync with server in background
    window.axios.post('/api/plots', {
      plot_number: plotNumber,
      name: lotType === 'entrance' ? 'Main Entrance' : undefined,
      section: sec,
      lot_type: lotType,
      capacity,
      price,
      status: 'available',
      lat: latlng.lat,
      lng: latlng.lng,
      cemetery_id: activeCemeteryId,
      notes: `Created via GIS ${tool} tool.`
    }).then((res) => {
      if (res.data?.success && res.data.data) {
        const savedPlot = res.data.data;
        setPlots((prev) => {
          if (!prev.some((p) => p.id === tempId)) {
            // Plot was deleted by user before background save finished; delete the orphaned server record
            window.axios.delete('/api/plots/' + savedPlot.id).catch(() => {});
            return prev;
          }
          return prev.map((p) => p.id === tempId ? savedPlot : p);
        });
        setSelectedPlot((prev) => prev && prev.id === tempId ? savedPlot : prev);
        setConnections((prev) =>
          prev.map((c) => ({
            ...c,
            fromId: c.fromId === tempId ? savedPlot.id : c.fromId,
            toId: c.toId === tempId ? savedPlot.id : c.toId,
          }))
        );
      }
    }).catch((err) => {
      console.error('Error adding plot to server in background:', err);
    });
  };

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, tool: 'standard' | 'apartment' | 'ground' | 'entrance' | 'point' | 'border' | 'select' | 'pan' | 'fill') => {
    setActiveGisTool(tool);
    e.dataTransfer.setData('text/plain', tool);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!map) return;
    const tool = e.dataTransfer.getData('text/plain');
    if (!['standard', 'apartment', 'ground', 'entrance', 'point', 'border'].includes(tool)) return;

    const mapContainer = map.getContainer();
    const rect = mapContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const latlng = map.containerPointToLatLng([x, y]);
    addPlotAtLocation(tool as any, latlng);
  };

  const handleMapClick = async (latlng: L.LatLng) => {
    if (ignoreMapClickRef.current) {
      ignoreMapClickRef.current = false;
      return;
    }
    setPlotContextMenu(null);
    if (['standard', 'apartment', 'ground', 'entrance', 'point', 'border'].includes(activeGisTool)) {
      await addPlotAtLocation(activeGisTool as any, latlng);
    } else {
      setSelectedPlot(null);
      setSelectedPlots([]);
    }
  };

  // Boundary Metadata State
  const [cemeteryName, setCemeteryName] = useState('Himlayan Memorial Park');
  const [location, setLocation] = useState('Metro Manila');
  const [description, setDescription] = useState('Official surveyed boundary perimeter and sector outlines.');
  const [geojsonText, setGeojsonText] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [needsBorderNode, setNeedsBorderNode] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handlePromptLogout = () => {
    setShowLogoutModal(true);
  };

  const handleSaveAllAssets = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await handleSaveBoundary();

      const activePlotIds = new Set(plots.map((p) => p.id));
      const activeConnections = connections
        .filter((c) => !c.cemetery_id || c.cemetery_id === activeCemeteryId)
        .filter(
          (c) =>
            !c.fromId.startsWith('plot-new-') &&
            !c.toId.startsWith('plot-new-') &&
            activePlotIds.has(c.fromId) &&
            activePlotIds.has(c.toId)
        )
        .map((c) => ({ fromId: c.fromId, toId: c.toId }));

      try {
        await window.axios.post('/api/plot-connections/sync', {
          cemetery_id: activeCemeteryId,
          connections: activeConnections,
        });
      } catch (connErr) {
        console.error('Error syncing plot connections:', connErr);
      }

      setCemeteries((prev) =>
        prev.map((c) =>
          c.id === activeCemeteryId
            ? { ...c, polygonCoords, geojsonText }
            : c
        )
      );
      window.dispatchEvent(new CustomEvent('himlayan_plots_updated'));
      localStorage.setItem('himlayan_plots_updated_at', Date.now().toString());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving assets:', err);
    } finally {
      setSaving(false);
    }
  };

  // Cemeteries list state
  const [cemeteries, setCemeteries] = useState<Array<{
    id: string;
    name: string;
    location: string;
    polygonCoords: [number, number][];
    geojsonText: string;
    center: [number, number];
  }>>([
    {
      id: DEFAULT_CEMETERY_ID,
      name: 'Himlayan Memorial Park',
      location: 'Metro Manila',
      polygonCoords: DEFAULT_HIMLAYAN_POLYGON,
      geojsonText: '',
      center: DEFAULT_MAP_CENTER,
    }
  ]);
  const [activeCemeteryId, setActiveCemeteryId] = useState(DEFAULT_CEMETERY_ID);

  // Delete Cemetery Confirmation Modal State
  const [showDeleteCemeteryPrompt, setShowDeleteCemeteryPrompt] = useState(false);
  const [cemeteryToDelete, setCemeteryToDelete] = useState<{
    id: string;
    name: string;
    location: string;
    polygonCoords: [number, number][];
    geojsonText: string;
    center: [number, number];
  } | null>(null);

  // Add Cemetery Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCemeteryNameInput, setNewCemeteryNameInput] = useState('');
  const [newLocationInput, setNewLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [selectedLocationCoords, setSelectedLocationCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!newLocationInput || newLocationInput.trim().length < 2) {
      setLocationSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newLocationInput)}&limit=5`, {
          headers: { 'Accept-Language': 'en' }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setLocationSuggestions(data);
        }
      } catch (err) {
        console.error('Location search error:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [newLocationInput]);

  // Connections and Drag Connect State
  const [connections, setConnections] = useState<Array<{ id: string; fromId: string; toId: string; cemetery_id?: string }>>([]);
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);

  const handlePlotClickForConnection = (targetPlotId: string) => {
    if (!connectingNodeId || connectingNodeId === targetPlotId) return;
    const sourcePlot = plots.find((p) => p.id === connectingNodeId);
    const targetPlot = plots.find((p) => p.id === targetPlotId);
    if (!sourcePlot || !targetPlot) return;

    if (sourcePlot.lot_type === 'border') {
      if (targetPlot.lot_type !== 'border') {
        alert('Border nodes can only connect to other border nodes.');
        setConnectingNodeId(null);
        return;
      }
    }
    if (sourcePlot.lot_type !== 'border' && targetPlot.lot_type === 'border') {
      alert('Other nodes cannot connect to border nodes.');
      setConnectingNodeId(null);
      return;
    }

    const exists = connections.some(
      (c) => (c.fromId === connectingNodeId && c.toId === targetPlotId) || (c.fromId === targetPlotId && c.toId === connectingNodeId)
    );
    if (!exists) {
      setConnections((prev) => [
        ...prev,
        {
          id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          fromId: connectingNodeId,
          toId: targetPlotId,
          cemetery_id: activeCemeteryId,
        },
      ]);
    }
    setConnectingNodeId(null);
  };

  // Auto-open "Add Cemetery Map" modal only for newly created / fresh engineer accounts
  useEffect(() => {
    if (user && user.role === 'engineer') {
      const storageKey = `has_seen_add_cemetery_map_${user.id}`;
      const hasSeenAddModal = localStorage.getItem(storageKey);

      if (!hasSeenAddModal) {
        setShowAddModal(true);
      }
    }
  }, [user]);

  const handleCloseAddModal = () => {
    if (user?.id) {
      localStorage.setItem(`has_seen_add_cemetery_map_${user.id}`, 'true');
    }
    setShowAddModal(false);
  };

  // Edit Cemetery Name Modal State
  const [showEditCemeteryModal, setShowEditCemeteryModal] = useState(false);
  const [editCemeteryNameInput, setEditCemeteryNameInput] = useState('');
  const [editCemeteryLocationInput, setEditCemeteryLocationInput] = useState('');

  // Polygon Coordinates for Himlayan Cemetery
  const [polygonCoords, setPolygonCoords] = useState<[number, number][]>(DEFAULT_HIMLAYAN_POLYGON);

  // Load existing cemetery map GeoJSON and plots on mount
  useEffect(() => {
    const DEFAULT_CENTER: [number, number] = DEFAULT_MAP_CENTER;

    const buildCemeteryItemFromMap = (m: any): {
      id: string;
      name: string;
      location: string;
      polygonCoords: [number, number][];
      geojsonText: string;
      center: [number, number];
    } => {
      const props = m.boundary_data?.features?.[0]?.properties || {};
      const geometry = m.boundary_data?.features?.[0]?.geometry;
      let polygonCoords: [number, number][] = [];
      if (geometry?.type === 'Polygon' && Array.isArray(geometry.coordinates?.[0])) {
        polygonCoords = geometry.coordinates[0]
          .filter((c: any) => Array.isArray(c) && c.length >= 2)
          .map((c: any) => [parseFloat(c[1]), parseFloat(c[0])] as [number, number]);
      }
      const first = polygonCoords[0] || DEFAULT_CENTER;
      return {
        id: m.cemetery_id || m.id,
        name: props.name || m.name || 'Himlayan Memorial Park',
        location: props.location || 'Metro Manila',
        polygonCoords,
        geojsonText: JSON.stringify(m.boundary_data || { type: 'FeatureCollection', features: [] }, null, 2),
        center: first,
      };
    };

    const fetchMapAndPlots = async () => {
      try {
        const [mapRes, plotsRes, connRes] = await Promise.all([
          window.axios.get('/api/cemetery-map'),
          window.axios.get('/api/plots', { params: { limit: 10000 } }),
          window.axios.get('/api/plot-connections').catch(() => ({ data: { success: false, data: [] } })),
        ]);

        if (mapRes.data?.success && Array.isArray(mapRes.data.data) && mapRes.data.data.length > 0) {
          const maps = mapRes.data.data;
          const byId = new Map<string, { id: string; name: string; location: string; polygonCoords: [number, number][]; geojsonText: string; center: [number, number] }>();
          maps.forEach((m: any) => {
            const item = buildCemeteryItemFromMap(m);
            byId.set(item.id, item);
          });
          const built = Array.from(byId.values());

          const hasBaselinePlots = (plotsRes.data?.data ?? []).some((p: any) => !p.cemetery_id);
          if (hasBaselinePlots && !built.some((c: { id: string }) => c.id === DEFAULT_CEMETERY_ID)) {
            built.push({
              id: DEFAULT_CEMETERY_ID,
              name: 'Himlayan Memorial Park',
              location: 'Metro Manila',
              polygonCoords: DEFAULT_HIMLAYAN_POLYGON,
              geojsonText: '',
              center: DEFAULT_CENTER,
            });
          }

          const plotsList: any[] = plotsRes.data?.data ?? [];

          const createdAtOf = new Map<string, number>();
          (maps as any[]).forEach((m) => {
            const id = m.cemetery_id || m.id;
            const t = new Date(m.created_at || 0).getTime();
            const existing = createdAtOf.get(id);
            if (existing === undefined || t < existing) {
              createdAtOf.set(id, t);
            }
          });

          const orderedByCreated = [...built].sort(
            (a, b) => (createdAtOf.get(a.id) || 0) - (createdAtOf.get(b.id) || 0)
          );

          const hasData = (id: string) =>
            plotsList.some((p) => (p.cemetery_id || DEFAULT_CEMETERY_ID) === id);

          const target =
            orderedByCreated.find((c) => hasData(c.id) || c.polygonCoords.length > 0) ||
            orderedByCreated[0] ||
            built[0];

          setCemeteries(orderedByCreated);
          setActiveCemeteryId((prev) => {
            const prevHasData = built.some((c) => c.id === prev && hasData(c.id));
            return prevHasData ? prev : target.id;
          });
          setCemeteryName(target.name);
          setLocation(target.location);
          setDescription((target as any).description || '');
          setGeojsonText(target.geojsonText);
          setPolygonCoords(target.polygonCoords);
          setNeedsBorderNode(target.polygonCoords.length === 0);
          if (map && target.center) {
            map.flyTo(target.center, FOCUS_ZOOM_LEVEL, { duration: FLY_DURATION_SECONDS });
          }
        } else {
          // Initialize default GeoJSON
          const defaultGeoJson = {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: { name: cemeteryName, location },
                geometry: {
                  type: 'Polygon',
                  coordinates: [polygonCoords.map((c) => [c[1], c[0]])],
                },
              },
            ],
          };
          const defGeoStr = JSON.stringify(defaultGeoJson, null, 2);
          setGeojsonText(defGeoStr);
          setCemeteries([
            {
              id: DEFAULT_CEMETERY_ID,
              name: 'Himlayan Memorial Park',
              location: 'Metro Manila',
              polygonCoords: polygonCoords,
              geojsonText: defGeoStr,
              center: DEFAULT_MAP_CENTER,
            }
          ]);
        }

        if (plotsRes.data?.success) {
          setPlots(plotsRes.data.data || []);
        }

        if (connRes.data?.success && Array.isArray(connRes.data.data)) {
          const loadedConnections = connRes.data.data.map((conn: any) => ({
            id: conn.id,
            fromId: conn.from_plot_id,
            toId: conn.to_plot_id,
            cemetery_id: conn.cemetery_id || undefined,
          }));
          setConnections((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const newConns = loadedConnections.filter((c: any) => !existingIds.has(c.id));
            return [...prev, ...newConns];
          });
        }
      } catch (err) {
        console.error('Error loading engineer workspace data:', err);
      }
    };

    fetchMapAndPlots();

    const handleRemoteUpdate = () => {
      fetchMapAndPlots();
    };
    window.addEventListener('himlayan_plots_updated', handleRemoteUpdate);
    window.addEventListener('storage', handleRemoteUpdate);
    return () => {
      window.removeEventListener('himlayan_plots_updated', handleRemoteUpdate);
      window.removeEventListener('storage', handleRemoteUpdate);
    };
  }, []);

  // Fly to the active cemetery whenever the map becomes available or the selection changes
  useEffect(() => {
    if (!map || !activeCemeteryId) return;
    if (lastFlownCemeteryRef.current === activeCemeteryId) return;
    const cem = cemeteries.find((c) => c.id === activeCemeteryId);
    if (cem?.center) {
      lastFlownCemeteryRef.current = activeCemeteryId;
      map.flyTo(cem.center, FOCUS_ZOOM_LEVEL, { duration: FLY_DURATION_SECONDS });
    }
  }, [map, activeCemeteryId, cemeteries]);

  // Delete cemetery action
  const handleConfirmDeleteCemetery = async () => {
    if (!cemeteryToDelete) return;
    const targetId = cemeteryToDelete.id;

    // Filter out target plots
    const targetPlots = plots.filter(
      (p) => (p.cemetery_id || DEFAULT_CEMETERY_ID) === targetId || (targetId === DEFAULT_CEMETERY_ID && !p.cemetery_id)
    );

    for (const p of targetPlots) {
      try {
        await window.axios.delete('/api/plots/' + p.id);
      } catch (err) {
        console.error('Error deleting plot:', err);
      }
    }

    setPlots((prev) =>
      prev.filter(
        (p) =>
          (p.cemetery_id || DEFAULT_CEMETERY_ID) !== targetId &&
          !(targetId === DEFAULT_CEMETERY_ID && !p.cemetery_id)
      )
    );

    const remaining = cemeteries.filter((c) => c.id !== targetId);
    setCemeteries(remaining);

    if (targetId !== DEFAULT_CEMETERY_ID) {
      try {
        await window.axios.delete('/api/cemetery-map', {
          params: { cemetery_id: targetId },
        });
      } catch (err) {
        console.error('Error deleting cemetery identity:', err);
      }
    }

    if (activeCemeteryId === targetId) {
      if (remaining.length > 0) {
        const nextCem = remaining[0];
        setActiveCemeteryId(nextCem.id);
        setCemeteryName(nextCem.name);
        setLocation(nextCem.location);
        setPolygonCoords(nextCem.polygonCoords);
        setGeojsonText(nextCem.geojsonText);
        setNeedsBorderNode(nextCem.polygonCoords.length === 0);
        if (map && nextCem.center) {
          map.flyTo(nextCem.center, FOCUS_ZOOM_LEVEL, { duration: FLY_DURATION_SECONDS });
        }
      } else {
        setActiveCemeteryId('');
        setCemeteryName('');
        setLocation('');
        setPolygonCoords([]);
        setGeojsonText('');
        setShowAddModal(true);
      }
    }

    setShowDeleteCemeteryPrompt(false);
    setCemeteryToDelete(null);
  };

  // Automatically sync border connections and polygon coordinates for active cemetery
  useEffect(() => {
    if (!activeCemeteryId) return;
    const cemeteryBorders = plots.filter(
      (p) => p.lot_type === 'border' && (p.cemetery_id || DEFAULT_CEMETERY_ID) === activeCemeteryId
    );

    setConnections((prevConn) => {
      const nonBorderConns = prevConn.filter((c) => {
        if (c.cemetery_id && c.cemetery_id !== activeCemeteryId) return true;
        const f = plots.find((p) => p.id === c.fromId);
        const t = plots.find((p) => p.id === c.toId);
        const isBorderConn = f?.lot_type === 'border' && t?.lot_type === 'border';
        return !isBorderConn;
      });

      if (cemeteryBorders.length >= 2) {
        const sorted = sortBorderPlotsByPlacement(cemeteryBorders);

        const newBorderConns: Array<{ id: string; fromId: string; toId: string; cemetery_id: string }> = [];
        for (let i = 0; i < sorted.length; i++) {
          const curr = sorted[i];
          const next = sorted[(i + 1) % sorted.length];
          newBorderConns.push({
            id: `conn-border-${activeCemeteryId}-${i}-${curr.id}-${next.id}`,
            fromId: curr.id,
            toId: next.id,
            cemetery_id: activeCemeteryId,
          });
        }
        return [...nonBorderConns, ...newBorderConns];
      } else {
        return nonBorderConns;
      }
    });

    if (cemeteryBorders.length >= 3) {
      const sorted = sortBorderPlotsByPlacement(cemeteryBorders);
      setPolygonCoords(sorted.map((b) => [b.lat || 0, b.lng || 0] as [number, number]));
      setNeedsBorderNode(false);
    } else {
      setPolygonCoords([]);
      setNeedsBorderNode(true);
    }
  }, [plots, activeCemeteryId]);

  const handleSaveBoundary = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const hasPolygon = Array.isArray(polygonCoords) && polygonCoords.length >= 3;
      let parsedJson: any;
      if (hasPolygon) {
        parsedJson = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { name: cemeteryName, location },
              geometry: {
                type: 'Polygon',
                coordinates: [polygonCoords.map((c) => [c[1], c[0]])],
              },
            },
          ],
        };
      } else {
        try {
          parsedJson = JSON.parse(geojsonText);
        } catch (e) {
          parsedJson = { type: 'FeatureCollection', features: [] };
        }
      }

      const res = await window.axios.post('/api/cemetery-map', {
        name: cemeteryName,
        description,
        boundary_data: parsedJson,
        cemetery_id: activeCemeteryId,
      });

      if (res.data?.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error saving cemetery boundary:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNewCemetery = async () => {
    if (!newCemeteryNameInput.trim()) return;
    const addedName = newCemeteryNameInput.trim();
    const addedLocation = newLocationInput.trim() || 'Solano';

    let lat = DEFAULT_MAP_CENTER[0];
    let lon = DEFAULT_MAP_CENTER[1];

    if (selectedLocationCoords) {
      lat = selectedLocationCoords[0];
      lon = selectedLocationCoords[1];
    } else if (newLocationInput.trim()) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newLocationInput)}&limit=1`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lon = parseFloat(data[0].lon);
        }
      } catch (e) {
        // fallback
      }
    }

    setPolygonCoords([]);
    setNeedsBorderNode(true);
    setActiveGisTool('border');

    if (map) {
      map.flyTo([lat, lon], FOCUS_ZOOM_LEVEL, { duration: FLY_DURATION_SECONDS });
    }

    setCemeteryName(addedName);
    setLocation(addedLocation);

    const newGeoJson = {
      type: 'FeatureCollection',
      features: [],
    };
    const newGeoStr = JSON.stringify(newGeoJson, null, 2);
    setGeojsonText(newGeoStr);

    const newId = 'cemetery-' + Date.now();
    const newCemeteryItem = {
      id: newId,
      name: addedName,
      location: addedLocation,
      polygonCoords: [],
      geojsonText: newGeoStr,
      center: [lat, lon] as [number, number],
    };

    setCemeteries((prev) => [...prev, newCemeteryItem]);
    setActiveCemeteryId(newId);

    try {
      await window.axios.post('/api/cemetery-map', {
        name: addedName,
        description: '',
        boundary_data: newGeoJson,
        cemetery_id: newId,
      });
    } catch (err) {
      console.error('Error persisting new cemetery identity:', err);
    }

    if (user?.id) {
      localStorage.setItem(`has_seen_add_cemetery_map_${user.id}`, 'true');
    }
    setShowAddModal(false);
    setNewCemeteryNameInput('');
    setNewLocationInput('');
    setSelectedLocationCoords(null);
    setLocationSuggestions([]);
    setShowDrawer(true);
  };

  const handleUpdateCemeteryName = () => {
    if (!editCemeteryNameInput.trim()) return;
    const updatedName = editCemeteryNameInput.trim();
    const updatedLoc = editCemeteryLocationInput.trim() || location;
    setCemeteryName(updatedName);
    setLocation(updatedLoc);

    let updatedGeoStr = geojsonText;
    try {
      const parsed = JSON.parse(geojsonText || '{}');
      if (parsed.features && parsed.features[0]) {
        parsed.features[0].properties = {
          ...parsed.features[0].properties,
          name: updatedName,
          location: updatedLoc,
        };
        updatedGeoStr = JSON.stringify(parsed, null, 2);
        setGeojsonText(updatedGeoStr);
      }
    } catch {
      // ignore
    }

    setCemeteries((prev) =>
      prev.map((c) =>
        c.id === activeCemeteryId
          ? { ...c, name: updatedName, location: updatedLoc, geojsonText: updatedGeoStr }
          : c
      )
    );

    setShowEditCemeteryModal(false);
  };

  const filteredPlots = plots.filter((p) => {
    if ((p.cemetery_id || DEFAULT_CEMETERY_ID) !== activeCemeteryId) return false;
    return searchQuery
      ? p.plot_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.section.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
  });

  const handleUpdateSelection = (id: string, updates: any) => {
    const isMulti = selectedPlots.length > 1 && selectedPlots.some((item) => item.id === id);
    if (isMulti) {
      if (Object.keys(dragStartRotationsRef.current).length === 0) {
        const initialRotations: Record<string, number> = {};
        const initialPositions: Record<string, { lat: number; lng: number }> = {};
        selectedPlots.forEach((item) => {
          initialRotations[item.id] = item.rotation || 0;
          initialPositions[item.id] = { lat: item.lat || FALLBACK_PLOT_LAT, lng: item.lng || FALLBACK_PLOT_LNG };
        });
        dragStartRotationsRef.current = initialRotations;
        dragStartPlotsPositionsRef.current = initialPositions;
      }

      const deltaRotation = updates.rotation !== undefined ? (updates.rotation - (dragStartRotationsRef.current[id] || 0)) : 0;

      const positions = Object.values(dragStartPlotsPositionsRef.current) as Array<{ lat: number; lng: number }>;
      const cLat = positions.reduce((sum, p) => sum + p.lat, 0) / positions.length;
      const cLng = positions.reduce((sum, p) => sum + p.lng, 0) / positions.length;

      const rad = -(deltaRotation * Math.PI) / 180;

      const updatedPositionsMap = new Map<string, { lat: number; lng: number; rotation?: number }>();

      selectedPlots.forEach((item) => {
        const initPos = dragStartPlotsPositionsRef.current[item.id] || { lat: item.lat || FALLBACK_PLOT_LAT, lng: item.lng || FALLBACK_PLOT_LNG };
        const dLat = initPos.lat - cLat;
        const dLng = initPos.lng - cLng;
        const newLat = cLat + dLat * Math.cos(rad) + dLng * Math.sin(rad);
        const newLng = cLng - dLat * Math.sin(rad) + dLng * Math.cos(rad);
        const newRot = updates.rotation !== undefined ? ((dragStartRotationsRef.current[item.id] || 0) + deltaRotation) : item.rotation;

        updatedPositionsMap.set(item.id, { lat: newLat, lng: newLng, rotation: newRot });

        const marker = markerRefs.current.get(item.id);
        if (marker) {
          marker.setLatLng([newLat, newLng]);
        }
      });

      setPlots((prev) => prev.map((item) => {
        const newCoords = updatedPositionsMap.get(item.id);
        if (newCoords) {
          const nextItem = { ...item, lat: newCoords.lat, lng: newCoords.lng };
          if (newCoords.rotation !== undefined) nextItem.rotation = newCoords.rotation;
          if (updates.width !== undefined) nextItem.width = updates.width;
          if (updates.height !== undefined) nextItem.height = updates.height;
          return nextItem;
        }
        return item;
      }));

      setSelectedPlots((prev) => prev.map((item) => {
        const newCoords = updatedPositionsMap.get(item.id);
        if (newCoords) {
          const nextItem = { ...item, lat: newCoords.lat, lng: newCoords.lng };
          if (newCoords.rotation !== undefined) nextItem.rotation = newCoords.rotation;
          if (updates.width !== undefined) nextItem.width = updates.width;
          if (updates.height !== undefined) nextItem.height = updates.height;
          return nextItem;
        }
        return item;
      }));

      if ((updates as any)._isFinal) {
        const { _isFinal, ...cleanUpdates } = updates as any;
        selectedPlots.forEach((item) => {
          const newCoords = updatedPositionsMap.get(item.id);
          const nextClean = { ...cleanUpdates };
          if (newCoords) {
            nextClean.lat = newCoords.lat;
            nextClean.lng = newCoords.lng;
            if (newCoords.rotation !== undefined) nextClean.rotation = newCoords.rotation;
          }
          updatePlotField(item.id, nextClean);
        });
        dragStartRotationsRef.current = {};
        dragStartPlotsPositionsRef.current = {};
      }
    } else {
      setPlots((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
      setSelectedPlots((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
      setSelectedPlot((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));

      if ((updates as any)._isFinal) {
        const { _isFinal, ...cleanUpdates } = updates as any;
        updatePlotField(id, cleanUpdates);
      }
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 font-body text-slate-900 flex flex-col relative overflow-hidden">
      {/* Top Header Navbar */}
      <Navbar
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onLogout={handlePromptLogout}
        onSaveAssets={handleSaveAllAssets}
      />

      {/* Main Full View OpenStreetMap Container */}
      <div
        className="flex-1 w-full h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] mt-16 sm:mt-20 relative z-0"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={handleDrop}
      >
        {/* Connecting Mode Banner */}
        {connectingNodeId && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-teal-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4 border border-teal-500/50">
            <span className="flex items-center gap-2">
              <Share2 className="w-4 h-4 animate-spin" />
              <span>Connecting node #{plots.find((p) => p.id === connectingNodeId)?.plot_number}. Click another path node or plot box to connect.</span>
            </span>
            <button
              onClick={() => setConnectingNodeId(null)}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-xl text-[11px] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
        {/* Floating Top Right Save Control Stack (Outside Header) */}
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 right-4 sm:right-8 z-30 flex flex-col items-end gap-2"
        >
          {/* Green Save Button (outside header) */}
          <button
            onClick={handleSaveAllAssets}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-500/50 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Save placed assets for currently equipped cemetery tab"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
            <span>{saving ? 'Saving...' : 'Save Placed Assets'}</span>
          </button>

          {savedSuccess && (
            <div className="bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 animate-in fade-in zoom-in-95">
              <Check className="w-3.5 h-3.5" />
              <span>Assets saved for {cemeteryName}!</span>
            </div>
          )}
        </div>
        {/* Floating Top Left Cemetery Selector & Manager Box */}
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 left-4 sm:left-8 z-30 max-w-xs w-full"
        >
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-2xl space-y-2 text-white">
            {/* Render all cemetery tabs */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
              {cemeteries.map((cem) => {
                const isActive = cem.id === activeCemeteryId;
                return (
                  <div
                    key={cem.id}
                    onClick={() => {
                      setActiveCemeteryId(cem.id);
                      setCemeteryName(cem.name);
                      setLocation(cem.location);
                      setPolygonCoords(cem.polygonCoords);
                      setGeojsonText(cem.geojsonText);
                      setNeedsBorderNode(cem.polygonCoords.length === 0);
                      if (map && cem.center) {
                        map.flyTo(cem.center, FOCUS_ZOOM_LEVEL, { duration: FLY_DURATION_SECONDS });
                      }
                    }}
                    className={`w-full text-slate-900 rounded-full px-4 py-2.5 text-xs font-bold font-body flex items-center justify-between shadow-sm border transition-all cursor-pointer ${
                      isActive ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/30' : 'bg-slate-100 hover:bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'} shrink-0`} />
                      <span className="truncate font-bold">{cem.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCemeteryId(cem.id);
                          setCemeteryName(cem.name);
                          setLocation(cem.location);
                          setPolygonCoords(cem.polygonCoords);
                          setGeojsonText(cem.geojsonText);
                          setEditCemeteryNameInput(cem.name);
                          setEditCemeteryLocationInput(cem.location);
                          setShowEditCemeteryModal(true);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer"
                        title="Edit Cemetery Name"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCemeteryToDelete(cem);
                          setShowDeleteCemeteryPrompt(true);
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                        title="Delete Cemetery"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Button 2: Add another cemetery */}
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full bg-white hover:bg-slate-50 text-slate-900 rounded-full px-3.5 py-2.5 text-xs font-bold font-body flex items-center justify-between shadow-sm transition-all border border-slate-200 group cursor-pointer"
            >
              <span className="text-slate-800 font-semibold pl-1">Add another cemetery</span>
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </button>
          </div>
        </div>

        <MapContainer
          center={DEFAULT_MAP_CENTER}
          zoom={DEFAULT_MAP_ZOOM}
          maxZoom={24}
          scrollWheelZoom={true}
          dragging={true}
          boxZoom={false}
          zoomControl={false}
          className={`h-full w-full z-10 ${isShiftPressed || activeGisTool === 'select' ? 'cursor-crosshair' : ''}`}
          style={{ height: '100%', width: '100%' }}
        >
          <ZoomControl position="bottomright" />
          <MapResizer />
            <MapEventsCapture
              setMapInstance={setMap}
              onMapClick={handleMapClick}
              onDropTool={addPlotAtLocation}
              activeGisTool={activeGisTool}
              setActiveGisTool={setActiveGisTool}
              plots={useMemo(
                () => plots.filter((p) => (p.cemetery_id || DEFAULT_CEMETERY_ID) === activeCemeteryId),
                [plots, activeCemeteryId]
              )}
              ignoreMapClickRef={ignoreMapClickRef}
              onPlotsSelected={useCallback((selected: Plot[], isAppend?: boolean) => {
                if (isAppend) {
                  setSelectedPlots((prev) => {
                    const existingIds = new Set(prev.map((p) => p.id));
                    const combined = [...prev, ...selected.filter((p) => !existingIds.has(p.id))];
                    return combined;
                  });
                } else {
                  setSelectedPlots(selected);
                }
                if (selected.length > 0) {
                  setSelectedPlot(null); // Clear single selection if multiple selected
                }
              }, [])}
            />
          
          {(() => {
            if (selectedPlots.length > 1) {
              return (
                <MultiSelectOverlay
                  plots={selectedPlots}
                  map={map}
                  zoomLevel={zoomLevel}
                  ignoreMapClickRef={ignoreMapClickRef}
                  onDelete={() => removeMultiplePlots(selectedPlots)}
                  onUpdate={handleUpdateSelection}
                />
              );
            }
            const activeOverlays = selectedPlots.length > 0 ? selectedPlots : (selectedPlot ? [selectedPlot] : []);
            return activeOverlays.map((p, idx) => (
              <PlotEditorOverlay 
                key={p.id}
                plot={p} 
                map={map}
                marker={markerRefs.current.get(p.id)}
                zoomLevel={zoomLevel} 
                onDelete={selectedPlots.length > 1 ? () => removeMultiplePlots(selectedPlots) : removePlot}
                ignoreMapClickRef={ignoreMapClickRef}
                hideControls={selectedPlots.length > 1 && idx !== 0}
                activeGisTool={activeGisTool}
                onUpdate={handleUpdateSelection}
              />
            ));
          })()}

          <TileLayer
            key={activeTile}
            attribution={TILE_URLS[activeTile].attribution}
            url={TILE_URLS[activeTile].url}
            maxZoom={24}
            maxNativeZoom={TILE_URLS[activeTile].maxNativeZoom}
          />

          {/* Master Perimeter Polygon Overlay (Clustered per distinct border group) */}
          {(() => {
            const borderPlots = plots.filter((p) => p.lot_type === 'border' && (p.cemetery_id || DEFAULT_CEMETERY_ID) === activeCemeteryId);
            if (borderPlots.length === 0) {
              if (polygonCoords.length >= 3) {
                return (
                  <Polygon
                    positions={polygonCoords}
                    pathOptions={{
                      color: '#059669',
                      fillColor: '#10b981',
                      fillOpacity: 0.25,
                      weight: 3.5,
                      dashArray: '4, 8',
                    }}
                  />
                );
              }
              return null;
            }

            // Group border plots into spatial / connected components clusters
            const visited = new Set<string>();
            const clusters: Plot[][] = [];
            const adj = new Map<string, string[]>();
            borderPlots.forEach(b => adj.set(b.id, []));
            connections.forEach(conn => {
              if (adj.has(conn.fromId) && adj.has(conn.toId)) {
                adj.get(conn.fromId)!.push(conn.toId);
                adj.get(conn.toId)!.push(conn.fromId);
              }
            });

            borderPlots.forEach(startNode => {
              if (!visited.has(startNode.id)) {
                const cluster: Plot[] = [];
                const queue: Plot[] = [startNode];
                visited.add(startNode.id);

                while (queue.length > 0) {
                  const curr = queue.shift()!;
                  cluster.push(curr);

                  const neighbors = adj.get(curr.id) || [];
                  neighbors.forEach(nId => {
                    const nPlot = borderPlots.find(b => b.id === nId);
                    if (nPlot && !visited.has(nPlot.id)) {
                      visited.add(nPlot.id);
                      queue.push(nPlot);
                    }
                  });


                }
                clusters.push(cluster);
              }
            });

            return (
              <>
                {clusters.map((cluster, cIdx) => {
                  let sortedCluster: Plot[] = [];
                  const clusterIds = new Set(cluster.map(p => p.id));
                  const startNode = cluster.reduce((min, p) => ((p.lng || 0) < (min.lng || 0) ? p : min), cluster[0]);
                  const path: Plot[] = [];
                  const pathVisited = new Set<string>();

                  let currId: string | null = startNode.id;
                  while (currId && clusterIds.has(currId) && !pathVisited.has(currId)) {
                    pathVisited.add(currId);
                    const currPlot = cluster.find(p => p.id === currId);
                    if (currPlot) path.push(currPlot);

                    const neighbors: string[] = adj.get(currId) || [];
                    const nextId: string | undefined = neighbors.find((nId: string) => clusterIds.has(nId) && !pathVisited.has(nId));
                    currId = nextId || null;
                  }

                  if (path.length === cluster.length) {
                    sortedCluster = path;
                  } else {
                    sortedCluster = sortBorderPlotsByPlacement(cluster);
                  }

                  const polyCoords: [number, number][] = sortedCluster.map((p) => [p.lat || FALLBACK_PLOT_LAT, p.lng || FALLBACK_PLOT_LNG] as [number, number]);

                  if (polyCoords.length < 2) return null;

                  return (
                    <React.Fragment key={`cluster-${cIdx}`}>
                      {polyCoords.length >= 3 && (
                        <Polygon
                          positions={polyCoords}
                          pathOptions={{
                            color: '#059669',
                            fillColor: '#10b981',
                            fillOpacity: 0.25,
                            weight: 3.5,
                            dashArray: '4, 8',
                          }}
                        />
                      )}
                      <Polyline
                        positions={polyCoords.length >= 3 ? [...polyCoords, polyCoords[0]] : polyCoords}
                        pathOptions={{
                          color: '#10b981',
                          weight: 4,
                          dashArray: '4, 4',
                          lineCap: 'round',
                          lineJoin: 'round',
                        }}
                      />
                    </React.Fragment>
                  );
                })}
              </>
            );
          })()}

          {/* User-Established Connections (Polylines) */}
          {connections
            .filter((c) => !c.cemetery_id || c.cemetery_id === activeCemeteryId)
            .map((conn) => {
              const fromPlot = plots.find((p) => p.id === conn.fromId);
              const toPlot = plots.find((p) => p.id === conn.toId);
              if (!fromPlot || !toPlot) return null;
              const fLat = fromPlot.lat || FALLBACK_PLOT_LAT;
              const fLng = fromPlot.lng || FALLBACK_PLOT_LNG;
              const tLat = toPlot.lat || FALLBACK_PLOT_LAT;
              const tLng = toPlot.lng || FALLBACK_PLOT_LNG;
              return (
                <Polyline
                  key={conn.id}
                  positions={[[fLat, fLng], [tLat, tLng]]}
                  pathOptions={{
                    color: '#14b8a6',
                    weight: 3,
                    dashArray: '4, 4',
                    opacity: 0.85,
                  }}
                />
              );
            })}

          {/* Individual Plot Markers */}
          {(() => {
            const firstPathPlotId = plots.find((p) => p.lot_type === 'entrance')?.id || plots.find((p) => p.lot_type === 'path')?.id;
            return filteredPlots.map((plot) => (
              <Marker
                key={plot.id}
                ref={(ref) => {
                  if (ref) {
                    markerRefs.current.set(plot.id, ref);
                    (ref as any).plotId = plot.id;
                  } else {
                    markerRefs.current.delete(plot.id);
                  }
                }}
                position={[plot.lat || FALLBACK_PLOT_LAT, plot.lng || FALLBACK_PLOT_LNG]}
                icon={createPlotIcon(
                  plot,
                  selectedPlots.some((p) => p.id === plot.id),
                  zoomLevel,
                  firstPathPlotId === plot.id
                )}
                draggable={!isShiftPressed || selectedPlots.some((p) => p.id === plot.id)}
              eventHandlers={{
                add: (e) => {
                  (e.target as any).plotId = plot.id;
                },
                dragstart: (e) => {
                  isDraggingRef.current = true;
                  saveToUndoStack();
                  const marker = e.target;
                  (marker as any).plotId = plot.id;
                  const startPos = marker.getLatLng();
                  dragStartLatLngRef.current = startPos;
                  dragLastGoodPosRef.current = { lat: startPos.lat, lng: startPos.lng };

                  const isPlotSelected = selectedPlots.some((p) => p.id === plot.id);
                  const initialPositions: Record<string, { lat: number; lng: number }> = {};

                  const activeSelection = (isPlotSelected && selectedPlots.length > 0) ? selectedPlots : [plot];
                  activeSelection.forEach((p) => {
                    initialPositions[p.id] = {
                      lat: p.lat || FALLBACK_PLOT_LAT,
                      lng: p.lng || FALLBACK_PLOT_LNG
                    };
                  });
                  dragStartPlotsPositionsRef.current = initialPositions;

                  const otherMarkers: { layer: L.Marker; initialLat: number; initialLng: number }[] = [];
                  activeSelection.forEach((p) => {
                    if (p.id !== plot.id) {
                      const layer = markerRefs.current.get(p.id);
                      if (layer) {
                        const initial = initialPositions[p.id];
                        if (initial) {
                          otherMarkers.push({
                            layer,
                            initialLat: initial.lat,
                            initialLng: initial.lng
                          });
                        }
                      }
                    }
                  });
                  dragOtherMarkersRef.current = otherMarkers;
                },
                drag: (e) => {
                  if (!dragStartLatLngRef.current) return;
                  const marker = e.target;
                  const currentPos = marker.getLatLng();
                  const startPos = dragStartLatLngRef.current;
                  const deltaLat = currentPos.lat - startPos.lat;
                  const deltaLng = currentPos.lng - startPos.lng;

                  // Live boundary clamp: keep the dragged marker inside the placed border perimeter
                  const boundary = getActiveBoundaryPolygon(plots, activeCemeteryId, polygonCoords);
                  const primaryIsBorder = plot.lot_type === 'border';
                  const proposed: [number, number] = [startPos.lat + deltaLat, startPos.lng + deltaLng];
                  let allowMove = primaryIsBorder || boundary.length < 3 || isPointInPolygon(proposed, boundary);

                  // Border node drag must not push any asset (box / node) outside the enclosed perimeter
                  if (allowMove && primaryIsBorder) {
                    const proposedPolygon = getProposedBoundaryPolygon(plots, activeCemeteryId, plot.id, proposed);
                    if (proposedPolygon.length >= 3) {
                      const oldBoundary = getActiveBoundaryPolygon(plots, activeCemeteryId, polygonCoords);
                      const initialPositions = dragStartPlotsPositionsRef.current;
                      const anyAssetEjected = plots.some((p) => {
                        if (p.lot_type === 'border') return false;
                        if ((p.cemetery_id || DEFAULT_CEMETERY_ID) !== activeCemeteryId) return false;
                        const init = initialPositions[p.id];
                        const assetLat = init ? init.lat + deltaLat : (p.lat || FALLBACK_PLOT_LAT);
                        const assetLng = init ? init.lng + deltaLng : (p.lng || FALLBACK_PLOT_LNG);
                        const wasInside = oldBoundary.length < 3 || isPointInPolygon([assetLat, assetLng], oldBoundary);
                        const willBeInside = isPointInPolygon([assetLat, assetLng], proposedPolygon);
                        return wasInside && !willBeInside;
                      });
                      if (anyAssetEjected) {
                        allowMove = false;
                      }
                    }
                  }

                  if (!allowMove) {
                    const good = dragLastGoodPosRef.current || { lat: startPos.lat, lng: startPos.lng };
                    marker.setLatLng([good.lat, good.lng]);
                    return;
                  }
                  dragLastGoodPosRef.current = { lat: startPos.lat + deltaLat, lng: startPos.lng + deltaLng };

                  if (dragOtherMarkersRef.current) {
                    dragOtherMarkersRef.current.forEach(({ layer, initialLat, initialLng }) => {
                      layer.setLatLng([initialLat + deltaLat, initialLng + deltaLng]);
                    });
                  }

                  const initialPositions = dragStartPlotsPositionsRef.current;
                  if (initialPositions && Object.keys(initialPositions).length > 0) {
                    setPlots((prev) =>
                      prev.map((p) => {
                        const init = initialPositions[p.id];
                        if (init) {
                          return {
                            ...p,
                            lat: init.lat + deltaLat,
                            lng: init.lng + deltaLng,
                          };
                        }
                        return p;
                      })
                    );
                  }
                },
                dragend: async (e) => {
                  if (!dragStartLatLngRef.current) return;
                  const marker = e.target;
                  const currentPos = marker.getLatLng();
                  const startPos = dragStartLatLngRef.current;
                  const deltaLat = currentPos.lat - startPos.lat;
                  const deltaLng = currentPos.lng - startPos.lng;

                  // Verify boundary constraints
                  const isPlotSelected = selectedPlots.some((p) => p.id === plot.id);
                  const activePolygon = getActiveBoundaryPolygon(plots, activeCemeteryId, polygonCoords);

                  if (activePolygon.length >= 3 && plot.lot_type !== 'border') {
                    const isInside = isPointInPolygon([currentPos.lat, currentPos.lng], activePolygon);
                    if (!isInside) {
                      marker.setLatLng([startPos.lat, startPos.lng]);
                      if (dragOtherMarkersRef.current) {
                        dragOtherMarkersRef.current.forEach(({ layer, initialLat, initialLng }) => {
                          layer.setLatLng([initialLat, initialLng]);
                        });
                      }
                      // Revert React state back to pre-drag positions
                      setPlots((prev) =>
                        prev.map((p) => {
                          const initial = dragStartPlotsPositionsRef.current[p.id];
                          if (initial) return { ...p, lat: initial.lat, lng: initial.lng };
                          return p;
                        })
                      );
                      if (isPlotSelected) {
                        setSelectedPlots((prev) =>
                          prev.map((p) => {
                            const initial = dragStartPlotsPositionsRef.current[p.id];
                            if (initial) return { ...p, lat: initial.lat, lng: initial.lng };
                            return p;
                          })
                        );
                      } else {
                        const initial = dragStartPlotsPositionsRef.current[plot.id];
                        if (initial) {
                          setSelectedPlot((p) => p && p.id === plot.id ? { ...p, lat: initial.lat, lng: initial.lng } : p);
                        }
                      }
                      alert('Cannot move plot outside the created cemetery border perimeter.');
                      dragStartLatLngRef.current = null;
                      dragStartPlotsPositionsRef.current = {};
                      dragOtherMarkersRef.current = [];
                      dragLastGoodPosRef.current = null;
                      setTimeout(() => { isDraggingRef.current = false; }, 150);
                      return;
                    }
                  }

                  const activeSelection = isPlotSelected && selectedPlots.length > 0 ? selectedPlots : [plot];
                  
                  const finalPositionsMap = new Map<string, { lat: number; lng: number }>();

                  setPlots((prev) =>
                    prev.map((p) => {
                      const initial = dragStartPlotsPositionsRef.current[p.id];
                      if (initial) {
                        const finalLat = initial.lat + deltaLat;
                        const finalLng = initial.lng + deltaLng;
                        finalPositionsMap.set(p.id, { lat: finalLat, lng: finalLng });
                        return { ...p, lat: finalLat, lng: finalLng };
                      }
                      return p;
                    })
                  );

                  if (isPlotSelected) {
                    setSelectedPlots((prev) =>
                      prev.map((p) => {
                        const coords = finalPositionsMap.get(p.id);
                        if (coords) {
                          return { ...p, lat: coords.lat, lng: coords.lng };
                        }
                        return p;
                      })
                    );
                  } else {
                    const coords = finalPositionsMap.get(plot.id);
                    if (coords) {
                      setSelectedPlot((p) => p && p.id === plot.id ? { ...p, lat: coords.lat, lng: coords.lng } : p);
                    }
                  }

                  try {
                    await Promise.all(
                      activeSelection.map(async (p) => {
                        if (p.id.startsWith('plot-new-')) return;
                        const coords = finalPositionsMap.get(p.id);
                        if (coords) {
                          await window.axios.put('/api/plots/' + p.id, {
                            lat: coords.lat,
                            lng: coords.lng,
                          });
                        }
                      })
                    );
                  } catch (err) {
                    console.error('Error updating plot positions after drag:', err);
                  }

                  dragStartLatLngRef.current = null;
                  dragStartPlotsPositionsRef.current = {};
                  dragOtherMarkersRef.current = [];
                  dragLastGoodPosRef.current = null;

                  setTimeout(() => {
                    isDraggingRef.current = false;
                  }, 150);
                },
                click: (e) => {
                  if (connectingNodeId) {
                    handlePlotClickForConnection(plot.id);
                    return;
                  }
                  setPlotContextMenu(null);
                  ignoreMapClickRef.current = true;
                  if (isDraggingRef.current) return;
                  const originalEvent = (e as any).originalEvent as MouseEvent | undefined;
                  const shiftDown = isShiftPressed || Boolean(originalEvent?.shiftKey) || activeGisTool === 'select';

                  if (shiftDown) {
                    setSelectedPlots((prev) => {
                      let base = [...prev];
                      if (selectedPlot && !base.some((p) => p.id === selectedPlot.id)) {
                        base.push(selectedPlot);
                      }
                      const exists = base.some((p) => p.id === plot.id);
                      let next: Plot[];
                      if (exists) {
                        next = base.filter((p) => p.id !== plot.id);
                      } else {
                        next = [...base, plot];
                      }

                      if (next.length === 1) {
                        setSelectedPlot(next[0]);
                      } else {
                        setSelectedPlot(null);
                      }
                      return next;
                    });
                  } else {
                    setSelectedPlot(plot);
                    setSelectedPlots([]);
                  }
                },
                contextmenu: (e) => {
                  const originalEvent = (e as any).originalEvent as MouseEvent | undefined;
                  if (originalEvent) {
                    originalEvent.preventDefault();
                    originalEvent.stopPropagation();
                  }
                  setSelectedPlot(plot);
                  if (originalEvent) {
                    setPlotContextMenu({
                      x: originalEvent.clientX,
                      y: originalEvent.clientY,
                      plotId: plot.id,
                    });
                  }
                }
              }}
            />
          ));
        })()}
        </MapContainer>



        {/* Floating Bottom Left Group: Legend Box + Tile Layer Selector */}
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-6 left-4 sm:left-8 z-30 flex flex-col items-start gap-3"
        >
          {/* Legend Box */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl w-56 sm:w-60 overflow-hidden text-slate-900 transition-all">
            {/* Header */}
            <div
              onClick={() => setIsLegendOpen(!isLegendOpen)}
              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-200/80"
            >
              <span className="font-heading text-base font-semibold text-slate-900 tracking-tight">
                Legend:
              </span>
              {isLegendOpen ? (
                <ChevronUp className="w-5 h-5 text-slate-800 stroke-[2.2]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-800 stroke-[2.2]" />
              )}
            </div>

            {/* Legend Content */}
            {isLegendOpen && (
              <div className="divide-y divide-slate-100 text-xs sm:text-sm font-body">
                {/* Available */}
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold">•</span>
                    <span className="text-slate-800 font-medium">Available</span>
                  </div>
                  <div className="w-4 h-5 bg-[#00c853] rounded-[2px] shadow-2xs" />
                </div>

                {/* Reserved */}
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold">•</span>
                    <span className="text-slate-800 font-medium">Reserved</span>
                  </div>
                  <div className="w-4 h-5 bg-[#f59e0b] rounded-[2px] shadow-2xs" />
                </div>

                {/* Occupied */}
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold">•</span>
                    <span className="text-slate-800 font-medium">Occupied</span>
                  </div>
                  <div className="w-4 h-5 bg-[#ff1744] rounded-[2px] shadow-2xs" />
                </div>

                {/* Apartment Type */}
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold">•</span>
                    <span className="text-slate-800 font-medium">Apartment Type</span>
                  </div>
                  <div className="w-5 h-6 border-2 border-slate-900 rounded-[3px] bg-white flex items-center justify-center font-bold text-xs text-slate-900">
                    2
                  </div>
                </div>

                {/* Ground Type */}
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold">•</span>
                    <span className="text-slate-800 font-medium">Ground Type</span>
                  </div>
                  <div className="w-5 h-6 border-2 border-slate-900 rounded-[3px] bg-white flex items-center justify-center">
                    <div className="w-2.5 h-2.5 border-[1.5px] border-slate-900 rotate-45" />
                  </div>
                </div>

                {/* Entrance Node */}
                <div className="px-4 py-2 flex items-center justify-between bg-teal-50/50">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold">•</span>
                    <span className="text-slate-900 font-bold text-xs">Entrance Node</span>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-amber-500 bg-teal-600 shadow-2xs flex items-center justify-center shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/>
                      <path d="M2 20h20"/>
                    </svg>
                  </div>
                </div>

                {/* Path */}
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold">•</span>
                    <span className="text-slate-800 font-medium">Path</span>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-teal-700 bg-teal-500 shadow-2xs" />
                </div>

                {/* Border */}
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold">•</span>
                    <span className="text-slate-800 font-medium">Border</span>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-emerald-700 bg-emerald-500 shadow-2xs" />
                </div>
              </div>
            )}
          </div>

          {/* Floating Tile Layer Selector */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2.5 shadow-xl flex items-center gap-2 text-white">
            <Globe className="w-4 h-4 text-emerald-400 ml-1.5" />
            <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Layer:</span>
            {(['osm', 'satellite', 'topo'] as TileProvider[]).map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveTile(layer)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                  activeTile === layer
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>

        {/* Please add border node instruction box (appears on top of the toolbar) */}
        {needsBorderNode && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 text-white px-4 py-2 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>Please add border node to a location</span>
          </div>
        )}

        {/* Floating Bottom Center GIS Drawing Toolbar */}
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.16)] border border-slate-200/90 px-6 py-2.5 flex items-center gap-4 transition-all group/toolbar"
        >
          {/* Draggable Helper Text */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900/95 text-[10px] text-white px-2.5 py-1 rounded-full opacity-0 group-hover/toolbar:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md font-semibold">
            💡 Drag & drop or press key shortcuts [1-8] to equip tools
          </div>

          {/* Tool 1: Standard Plot (Rectangle Outline) */}
          <button
            onClick={() => setActiveGisTool('standard')}
            onDragStart={(e) => handleDragStart(e, 'standard')}
            draggable={true}
            title="Standard Plot Tool (Shortcut: Key [1])"
            className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center cursor-grab active:cursor-grabbing relative ${
              activeGisTool === 'standard'
                ? 'bg-slate-100/90 shadow-sm scale-105'
                : 'hover:bg-slate-50/60 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="w-[18px] h-[30px] border-[1.5px] border-slate-800 rounded-[1.5px] bg-transparent pointer-events-none" />
            <span className="absolute -bottom-1 -right-1 bg-slate-800 text-white font-mono text-[9px] font-extrabold px-1 rounded shadow-2xs border border-slate-700 pointer-events-none">
              1
            </span>
          </button>

          {/* Tool 2: Apartment Type Plot (Double Box with 2) */}
          <button
            onClick={() => setActiveGisTool('apartment')}
            onDragStart={(e) => handleDragStart(e, 'apartment')}
            draggable={true}
            title="Apartment Type Plot Tool (Shortcut: Key [2])"
            className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center cursor-grab active:cursor-grabbing relative ${
              activeGisTool === 'apartment'
                ? 'bg-slate-100/90 shadow-sm scale-105'
                : 'hover:bg-slate-50/60 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="w-[18px] h-[30px] border-[1.5px] border-slate-800 rounded-[1.5px] bg-transparent p-[1.5px] flex items-center justify-center pointer-events-none">
              <div className="w-full h-full border border-slate-800 rounded-[1px] flex items-center justify-center">
                <span className="font-sans font-extrabold text-[11px] text-slate-800 leading-none">2</span>
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 bg-slate-800 text-white font-mono text-[9px] font-extrabold px-1 rounded shadow-2xs border border-slate-700 pointer-events-none">
              2
            </span>
          </button>

          {/* Tool 3: Ground Type Plot (Box with Diamond) */}
          <button
            onClick={() => setActiveGisTool('ground')}
            onDragStart={(e) => handleDragStart(e, 'ground')}
            draggable={true}
            title="Ground Type Plot Tool (Shortcut: Key [3])"
            className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center cursor-grab active:cursor-grabbing relative ${
              activeGisTool === 'ground'
                ? 'bg-slate-100/90 shadow-sm scale-105'
                : 'hover:bg-slate-50/60 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="w-[18px] h-[30px] border-[1.5px] border-slate-800 rounded-[1.5px] bg-transparent flex items-center justify-center pointer-events-none">
              <div className="w-2.5 h-2.5 border-[1.5px] border-slate-800 rotate-45 bg-transparent" />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-slate-800 text-white font-mono text-[9px] font-extrabold px-1 rounded shadow-2xs border border-slate-700 pointer-events-none">
              3
            </span>
          </button>

          {/* Tool 4: Entrance Node Circle */}
          <button
            onClick={() => setActiveGisTool('entrance')}
            onDragStart={(e) => handleDragStart(e, 'entrance')}
            draggable={true}
            title="Entrance Node Tool (Shortcut: Key [4])"
            className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center cursor-grab active:cursor-grabbing relative ${
              activeGisTool === 'entrance'
                ? 'bg-slate-100/90 shadow-sm scale-105'
                : 'hover:bg-slate-50/60 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="w-6 h-6 border-2 border-[#0d9488] rounded-full bg-transparent flex items-center justify-center pointer-events-none shadow-[0_0_6px_rgba(13,148,136,0.6)]">
              <div className="w-3.5 h-3.5 rounded-full bg-[#0d9488] flex items-center justify-center">
                <DoorOpen className="w-2.5 h-2.5 text-white pointer-events-none" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 bg-slate-800 text-white font-mono text-[9px] font-extrabold px-1 rounded shadow-2xs border border-slate-700 pointer-events-none">
              4
            </span>
          </button>

          {/* Tool 5: Path / Point Circle */}
          <button
            onClick={() => setActiveGisTool('point')}
            onDragStart={(e) => handleDragStart(e, 'point')}
            draggable={true}
            title="Path Tool (Shortcut: Key [5])"
            className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center cursor-grab active:cursor-grabbing relative ${
              activeGisTool === 'point'
                ? 'bg-slate-100/90 shadow-sm scale-105'
                : 'hover:bg-slate-50/60 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="w-6 h-6 border-[1.5px] border-slate-800 rounded-full bg-transparent flex items-center justify-center pointer-events-none">
              <div className="w-3.5 h-3.5 rounded-full bg-[#009bb4]" />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-slate-800 text-white font-mono text-[9px] font-extrabold px-1 rounded shadow-2xs border border-slate-700 pointer-events-none">
              5
            </span>
          </button>

          {/* Tool 6: Border Point Tool */}
          <button
            onClick={() => setActiveGisTool('border')}
            onDragStart={(e) => handleDragStart(e, 'border')}
            draggable={true}
            title="Border Tool (Shortcut: Key [6])"
            className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center cursor-grab active:cursor-grabbing relative ${
              activeGisTool === 'border'
                ? 'bg-slate-100/90 shadow-sm scale-105'
                : 'hover:bg-slate-50/60 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="w-6 h-6 border-[1.5px] border-slate-800 rounded-full bg-transparent flex items-center justify-center pointer-events-none">
              <div className="w-3.5 h-3.5 rounded-full bg-[#10b981]" />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-slate-800 text-white font-mono text-[9px] font-extrabold px-1 rounded shadow-2xs border border-slate-700 pointer-events-none">
              6
            </span>
          </button>

          {/* Vertical Divider */}
          <div className="w-[1px] h-7 bg-slate-200/90 mx-1" />

          {/* Tool 7: Select Tool */}
          <button
            onClick={() => setActiveGisTool('select')}
            onDragStart={(e) => handleDragStart(e, 'select')}
            draggable={true}
            title="Select Tool (Shortcut: Key [7])"
            className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer relative ${
              activeGisTool === 'select'
                ? 'bg-slate-100/90 shadow-sm scale-105'
                : 'hover:bg-slate-50/60 opacity-80 hover:opacity-100'
            }`}
          >
            <Plus className="w-6 h-6 text-slate-800 stroke-[1.5] pointer-events-none" />
            <span className="absolute -bottom-1 -right-1 bg-slate-800 text-white font-mono text-[9px] font-extrabold px-1 rounded shadow-2xs border border-slate-700 pointer-events-none">
              7
            </span>
          </button>

          {/* Tool 8: Pan / Hand Tool */}
          <button
            onClick={() => setActiveGisTool('pan')}
            onDragStart={(e) => handleDragStart(e, 'pan')}
            draggable={true}
            title="Pan Tool (Shortcut: Key [8] or V)"
            className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer relative ${
              activeGisTool === 'pan'
                ? 'bg-slate-100/90 shadow-sm scale-105'
                : 'hover:bg-slate-50/60 opacity-80 hover:opacity-100'
            }`}
          >
            <Hand className="w-6 h-6 text-slate-800 stroke-[1.5] pointer-events-none" />
            <span className="absolute -bottom-1 -right-1 bg-slate-800 text-white font-mono text-[9px] font-extrabold px-1 rounded shadow-2xs border border-slate-700 pointer-events-none">
              8
            </span>
          </button>
        </div>

        {/* Right-Click Plot Details Inspector Box (positions beside right-clicked plot) */}
        {plotContextMenu && (() => {
          const activePlot = plots.find((p) => p.id === plotContextMenu.plotId);
          if (!activePlot) return null;

          const isNode = activePlot.lot_type === 'path' || activePlot.lot_type === 'border' || activePlot.lot_type === 'entrance';
          const cardWidth = isNode ? 240 : 310;
          const cardHeight = isNode ? 120 : 380;
          const leftPos = Math.max(10, Math.min(plotContextMenu.x + 12, window.innerWidth - cardWidth - 16));
          const topPos = Math.max(10, Math.min(plotContextMenu.y - 20, window.innerHeight - cardHeight - 16));

          if (isNode) {
            return (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.preventDefault()}
                className="fixed z-[9999] w-60 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl p-3.5 flex flex-col space-y-3 text-slate-900 transition-all animate-in fade-in zoom-in-95 duration-150"
                style={{
                  top: `${topPos}px`,
                  left: `${leftPos}px`,
                }}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                    <h3 className="font-heading font-bold text-xs text-slate-900 capitalize">
                      {activePlot.lot_type} Node #{activePlot.plot_number}
                    </h3>
                  </div>
                  <button
                    onClick={() => setPlotContextMenu(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {activePlot.lot_type === 'entrance' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Gate Name
                    </label>
                    <input
                      type="text"
                      defaultValue={activePlot.name || ''}
                      placeholder="e.g. Main Entrance"
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (value !== (activePlot.name || '')) {
                          updatePlotField(activePlot.id, { name: value || undefined });
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Shown as the starting gate in the public map's pathfinding navigator.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setConnectingNodeId(activePlot.id);
                    setPlotContextMenu(null);
                  }}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-xl text-xs text-center transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Drag Connect</span>
                </button>

                <button
                  onClick={() => {
                    setConnections((prev) => prev.filter((c) => c.fromId !== activePlot.id && c.toId !== activePlot.id));
                    setPlotContextMenu(null);
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs text-center transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>

                <button
                  onClick={() => {
                    ignoreMapClickRef.current = true;
                    setConnections((prev) => prev.filter((c) => c.fromId !== activePlot.id && c.toId !== activePlot.id));
                    removePlot(activePlot);
                    setPlotContextMenu(null);
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs text-center transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Node</span>
                </button>
              </div>
            );
          }

          return (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
              className="fixed z-[9999] w-80 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl p-4 flex flex-col space-y-3 text-slate-900 transition-all animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
              style={{
                top: `${topPos}px`,
                left: `${leftPos}px`,
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${activePlot.status === 'reserved' ? 'bg-amber-500 animate-pulse' : activePlot.status === 'occupied' ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                  <h3 className="font-heading font-bold text-sm text-slate-900">
                    Selected Lot #{activePlot.plot_number}
                  </h3>
                </div>
                <button
                  onClick={() => setPlotContextMenu(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Reserved / Scheduled Burial Info Box */}
              {(activePlot.status === 'reserved' || activePlot.burial_date) && (
                <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-amber-950 border-b border-amber-200 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Scheduled Burial Info</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 uppercase">
                      Reserved
                    </span>
                  </div>

                  <div className="space-y-1.5 text-slate-800">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-semibold">Scheduled Date & Time:</span>
                      <span className="font-extrabold text-amber-950">
                        {activePlot.burial_date
                          ? new Date(activePlot.burial_date).toLocaleString('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : 'Not set'}
                      </span>
                    </div>

                    {activePlot.inquirer_name && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-semibold">Reserved By / Inquirer:</span>
                        <span className="font-bold text-slate-900">{activePlot.inquirer_name}</span>
                      </div>
                    )}

                    {activePlot.deceased_name && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-semibold">Deceased:</span>
                        <span className="font-bold text-emerald-800">{activePlot.deceased_name}</span>
                      </div>
                    )}

                    </div>
                </div>
              )}

              {/* Deceased Person Names per Stack Level Editor (only editable when reserved/occupied/full) */}
              {(() => {
                if (activePlot.status === 'available') return null;
                let currentDeceased = getPlotDeceasedNames(activePlot);
                currentDeceased = currentDeceased.slice(0, MAX_STACKS);
                const isApartment = activePlot.lot_type === 'apartment';
                return (
                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Deceased {isApartment ? `Names (${currentDeceased.length} Stacks)` : 'Names'}</span>
                      </span>
                      {isApartment && (
                        <button
                          onClick={async () => {
                            if (currentDeceased.length >= MAX_STACKS) return;
                            const nextNames = [...currentDeceased, ''];
                            const newCap = Math.max(activePlot.capacity || 1, nextNames.length);
                            await applyDeceasedNamesUpdate(activePlot, nextNames, newCap);
                          }}
                          disabled={currentDeceased.length >= MAX_STACKS}
                          className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                            currentDeceased.length >= MAX_STACKS
                              ? 'bg-slate-300 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                          title={currentDeceased.length >= MAX_STACKS ? `Maximum ${MAX_STACKS} stacks` : 'Add Stack Level'}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Stack</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {currentDeceased.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="w-10 shrink-0 font-bold text-[10px] text-slate-600 bg-slate-200/80 px-1 py-1 rounded text-center">
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            placeholder={`Deceased name ${idx + 1}`}
                            value={name}
                            onChange={async (e) => {
                              const nextNames = [...currentDeceased];
                              nextNames[idx] = e.target.value;
                              await applyDeceasedNamesUpdate(activePlot, nextNames, activePlot.capacity || nextNames.length);
                            }}
                            className="min-w-0 flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                          />
                          {currentDeceased.length > 1 && (
                            <button
                              onClick={async () => {
                                const nextNames = currentDeceased.filter((_, i) => i !== idx);
                                const newCap = Math.max(1, nextNames.length);
                                await applyDeceasedNamesUpdate(activePlot, nextNames, newCap);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="Remove Level"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Section:</span>
                  <span className="font-semibold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">{activePlot.section}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Lot Type:</span>
                  <span className="font-semibold text-slate-900 capitalize">{activePlot.lot_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Capacity:</span>
                  <span className="font-semibold text-slate-900">{activePlot.capacity} pax</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Price:</span>
                  <span className="font-semibold text-slate-900">₱{Number(activePlot.price || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Quick Status Control */}
              <div className="pt-1 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Status
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => updatePlotField(activePlot.id, { status: 'available' })}
                    className={`py-1 rounded-lg border text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      activePlot.status === 'available'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#00c853]" />
                    <span>Available</span>
                  </button>

                  <button
                    onClick={() => updatePlotField(activePlot.id, { status: 'reserved' })}
                    className={`py-1 rounded-lg border text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      activePlot.status === 'reserved'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                    <span>Reserved</span>
                  </button>

                  <button
                    onClick={() => updatePlotField(activePlot.id, { status: 'occupied' })}
                    className={`py-1 rounded-lg border text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      activePlot.status === 'occupied' || activePlot.status === 'full'
                        ? 'border-red-500 bg-red-50 text-red-800 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#ff1744]" />
                    <span>Occupied</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-1.5 border-t border-slate-100">
                <button
                  onClick={() => {
                    duplicatePlot(activePlot);
                    setPlotContextMenu(null);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs text-center transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={() => {
                    setEditingPlotDetails(activePlot);
                    setPlotContextMenu(null);
                  }}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs text-center transition-all cursor-pointer"
                >
                  Edit Details
                </button>
                <button
                  onClick={() => {
                    removePlot(activePlot);
                    setPlotContextMenu(null);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-2 rounded-xl text-xs text-center transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  title="Delete Lot"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-100" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Floating Collapsible Selected Lots Inspector (Top Right) */}
        {selectedPlots.length > 0 && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-4 sm:right-8 z-30 w-full max-w-xs bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl p-4 flex flex-col space-y-3.5 text-slate-900 transition-all animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  Selection ({selectedPlots.length} items)
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlots([])}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 max-h-32 overflow-y-auto space-y-1.5 pr-1">
              <p className="font-semibold text-slate-700">Selected Lots:</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedPlots.map((p) => (
                  <span key={p.id} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-slate-200">
                    #{p.plot_number}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2.5 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => removeMultiplePlots(selectedPlots)}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs text-center transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-200" />
                  <span>Delete</span>
                </button>
              </div>
              <button
                onClick={() => setSelectedPlots([])}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Custom Delete Confirmation Modal */}
        {deleteConfirmState?.isOpen && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          >
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative flex flex-col space-y-4 animate-in zoom-in-95 duration-150 text-slate-900">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Confirm Deletion
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    This action cannot be undone immediately.
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-700 font-semibold">
                {deleteConfirmState.message}
              </p>

              {/* Lot Number Badges Preview */}
              <div className="max-h-28 overflow-y-auto bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-wrap gap-1.5">
                {deleteConfirmState.plotsToDelete.map((p) => (
                  <span
                    key={p.id}
                    className="bg-white text-slate-800 px-2 py-0.5 rounded text-[11px] font-mono font-bold border border-slate-200 shadow-2xs"
                  >
                    #{p.plot_number}
                  </span>
                ))}
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => setDeleteConfirmState(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteConfirmed}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Another Cemetery Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-slate-900">
                    Add New Cemetery Map
                  </h3>
                  <p className="text-xs text-slate-500">
                    Register a new cemetery project to survey and map boundaries.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs my-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cemetery Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Solano Municipal Memorial Park"
                    value={newCemeteryNameInput}
                    onChange={(e) => setNewCemeteryNameInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-xs"
                  />
                </div>

                <div className="relative">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Location / Region
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Solano, Nueva Vizcaya"
                    value={newLocationInput}
                    onChange={(e) => {
                      setNewLocationInput(e.target.value);
                      setSelectedLocationCoords(null);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-xs"
                  />
                  {isSearchingLocation && (
                    <div className="absolute right-3 top-9 text-slate-400 text-[10px]">Searching...</div>
                  )}
                  {locationSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                      {locationSuggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setNewLocationInput(item.display_name);
                            const lat = parseFloat(item.lat);
                            const lon = parseFloat(item.lon);
                            if (!isNaN(lat) && !isNaN(lon)) {
                              setSelectedLocationCoords([lat, lon]);
                            }
                            setLocationSuggestions([]);
                          }}
                          className="px-3 py-2 text-xs hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 cursor-pointer border-b border-slate-100 last:border-b-0 truncate"
                        >
                          {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNewCemetery}
                  disabled={!newCemeteryNameInput.trim()}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create & Open GIS</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Cemetery Confirmation Modal */}
        {showDeleteCemeteryPrompt && cemeteryToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => {
                  setShowDeleteCemeteryPrompt(false);
                  setCemeteryToDelete(null);
                }}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 text-white flex items-center justify-center shadow-md">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-slate-900">
                    Delete Cemetery
                  </h3>
                  <p className="text-xs text-slate-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-700 mb-4 leading-relaxed">
                Are you sure you want to delete{' '}
                <span className="font-bold text-slate-900">{cemeteryToDelete.name}</span>?
                All plots, boundaries, and data tied to this cemetery map will be permanently removed.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowDeleteCemeteryPrompt(false);
                    setCemeteryToDelete(null);
                  }}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteCemetery}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Permanently</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Cemetery Name Modal */}
        {showEditCemeteryModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowEditCemeteryModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-slate-900">
                    Edit Cemetery Name
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update the official name and location of this cemetery map.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs my-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cemetery Name *
                  </label>
                  <input
                    type="text"
                    value={editCemeteryNameInput}
                    onChange={(e) => setEditCemeteryNameInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Location / Region
                  </label>
                  <input
                    type="text"
                    value={editCemeteryLocationInput}
                    onChange={(e) => setEditCemeteryLocationInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowEditCemeteryModal(false)}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCemeteryName}
                  disabled={!editCemeteryNameInput.trim()}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enter Details Dialog Modal */}
        {editingPlotDetails && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setEditingPlotDetails(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
                  <Settings className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Enter Lot Details
                  </h3>
                  <p className="text-xs text-slate-500 font-body">
                    Update specifications, coordinates, capacity, and pricing.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 text-xs font-body">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Plot Number *
                  </label>
                  <input
                    type="text"
                    value={editingPlotDetails.plot_number}
                    onChange={(e) =>
                      setEditingPlotDetails({
                        ...editingPlotDetails,
                        plot_number: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    value={editingPlotDetails.section}
                    onChange={(e) =>
                      setEditingPlotDetails({
                        ...editingPlotDetails,
                        section: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                {editingPlotDetails.lot_type === 'entrance' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Gate Name
                    </label>
                    <input
                      type="text"
                      value={editingPlotDetails.name || ''}
                      placeholder="e.g. Main Entrance"
                      onChange={(e) =>
                        setEditingPlotDetails({
                          ...editingPlotDetails,
                          name: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Shown as the starting gate in the public map's pathfinding navigator.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lot Price (₱)
                  </label>
                  <input
                    type="number"
                    value={editingPlotDetails.price || 0}
                    onChange={(e) =>
                      setEditingPlotDetails({
                        ...editingPlotDetails,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Capacity (Max Occupants)
                  </label>
                  <input
                    type="number"
                    value={editingPlotDetails.capacity}
                    onChange={(e) =>
                      setEditingPlotDetails({
                        ...editingPlotDetails,
                        capacity: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Current Occupants
                  </label>
                  <input
                    type="number"
                    value={editingPlotDetails.current_occupants}
                    onChange={(e) =>
                      setEditingPlotDetails({
                        ...editingPlotDetails,
                        current_occupants: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lot Type
                  </label>
                  <select
                    value={editingPlotDetails.lot_type}
                    onChange={(e) =>
                      setEditingPlotDetails({
                        ...editingPlotDetails,
                        lot_type: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  >
                    <option value="single">Single Lawn</option>
                    <option value="family">Family Ground</option>
                    <option value="apartment">Apartment</option>
                    <option value="entrance">Entrance Node</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingPlotDetails.status}
                    onChange={(e) =>
                      setEditingPlotDetails({
                        ...editingPlotDetails,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="occupied">Occupied</option>
                    <option value="full">Full</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe specific features or directions for this plot."
                    value={editingPlotDetails.notes || ''}
                    onChange={(e) =>
                      setEditingPlotDetails({
                        ...editingPlotDetails,
                        notes: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => setEditingPlotDetails(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updatePlotField(editingPlotDetails.id, editingPlotDetails);
                    setEditingPlotDetails(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Save Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Center Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full text-center space-y-4 font-body relative"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-heading font-bold text-slate-900 leading-snug">
                    Do you want to save the placed assets first?
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Save current boxes, border nodes, and layout changes for{' '}
                    <strong className="text-slate-800">{cemeteryName}</strong>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                  {/* Green Save button */}
                  <button
                    onClick={async () => {
                      await handleSaveAllAssets();
                      setShowLogoutModal(false);
                      router.post('/logout');
                    }}
                    className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                    <span>Save & Log Out</span>
                  </button>

                  {/* Black "Cancel" button */}
                  <button
                    onClick={() => {
                      setShowLogoutModal(false);
                    }}
                    className="w-full sm:flex-1 bg-slate-900 hover:bg-black text-white font-bold text-xs py-3 px-4 rounded-xl border border-slate-800 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                    <span>Cancel</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

