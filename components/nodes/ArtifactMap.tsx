'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  MapGeoJSONFeature,
  SymbolLayerSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Located artifacts from /api/artifacts/map (GeoJSON FeatureCollection)
export interface ArtifactPoints {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: {
      slug: string;
      title: string;
      thumbnail: string | null;
      kind: string | null;
      period: string | null;
      designation: string | null;
    };
  }>;
}

const STYLE = 'dataviz';
const KOREA_CENTER: [number, number] = [127.8, 36.3];
const NATIONAL_TREASURE = '#f59e0b'; // amber-500 — matches the card badge
const TREASURE = '#334155'; // slate-700

/** Popup card, built with DOM APIs (titles come from the DB — never injected as HTML) */
function popupContent(
  p: ArtifactPoints['features'][number]['properties']
): HTMLElement {
  const root = document.createElement('a');
  root.href = `/nodes/${p.slug}`;
  root.className = 'block w-56 text-left no-underline';
  if (p.thumbnail) {
    const img = document.createElement('img');
    img.src = p.thumbnail;
    img.alt = '';
    img.loading = 'lazy';
    img.className = 'mb-2 h-28 w-full rounded object-cover';
    root.appendChild(img);
  }
  const title = document.createElement('div');
  title.className = 'text-sm font-semibold leading-snug text-gray-900';
  title.textContent = p.title;
  root.appendChild(title);
  const meta = document.createElement('div');
  meta.className = 'mt-0.5 text-xs text-gray-500';
  meta.textContent = [p.designation, p.period].filter(Boolean).join(' · ');
  root.appendChild(meta);
  const link = document.createElement('div');
  link.className = 'mt-1.5 text-xs font-medium text-brand-600';
  link.textContent = 'View details →';
  root.appendChild(link);
  return root;
}

export default function ArtifactMap({
  points,
}: {
  points: ArtifactPoints | undefined;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  // Create the map once
  useEffect(() => {
    if (!container.current || !key) return;
    let cancelled = false;
    let map: MapLibreMap | null = null;

    import('maplibre-gl').then(({ default: maplibregl }) => {
      if (cancelled || !container.current) return;
      map = new maplibregl.Map({
        container: container.current,
        style: `https://api.maptiler.com/maps/${STYLE}/style.json?key=${key}`,
        center: KOREA_CENTER,
        zoom: 6.2,
        minZoom: 5,
        maxBounds: [
          [122, 31.5],
          [134, 40],
        ],
        cooperativeGestures: true, // page scroll isn't hijacked by the map
      });
      mapRef.current = map;
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        'top-right'
      );

      map.on('load', () => {
        if (!map) return;
        const style = map.getStyle();
        // English labels where the tiles have them
        for (const layer of style.layers) {
          if (layer.type === 'symbol' && layer.layout?.['text-field']) {
            map.setLayoutProperty(layer.id, 'text-field', [
              'coalesce',
              ['get', 'name:en'],
              ['get', 'name'],
            ]);
          }
        }
        // Reuse a font the style's glyph server actually has
        const symbolLayer = style.layers.find(
          (l): l is SymbolLayerSpecification =>
            l.type === 'symbol' &&
            Array.isArray(l.layout?.['text-font']) &&
            !(l.layout['text-font'] as string[]).some((f) => /Italic/.test(f))
        );
        const labelFont = symbolLayer?.layout?.['text-font'] ?? [
          'Noto Sans Regular',
        ];

        map.addSource('artifacts', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterMaxZoom: 11,
          clusterRadius: 44,
        });
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'artifacts',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#fcd34d',
              20,
              '#fbbf24',
              100,
              '#f59e0b',
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              14,
              20,
              19,
              100,
              26,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.9,
          },
        });
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'artifacts',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': labelFont,
            'text-size': 12,
          },
          paint: { 'text-color': '#451a03' },
        });
        map.addLayer({
          id: 'points',
          type: 'circle',
          source: 'artifacts',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'match',
              ['get', 'kind'],
              'national_treasure',
              NATIONAL_TREASURE,
              TREASURE,
            ],
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 4, 12, 7],
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#ffffff',
          },
        });

        map.on('click', 'clusters', async (e) => {
          const feature = e.features?.[0] as MapGeoJSONFeature | undefined;
          if (!map || !feature) return;
          const source = map.getSource('artifacts') as GeoJSONSource;
          const zoom = await source.getClusterExpansionZoom(
            feature.properties.cluster_id
          );
          map.easeTo({
            center: (feature.geometry as GeoJSON.Point).coordinates as [
              number,
              number,
            ],
            zoom,
          });
        });
        map.on('click', 'points', (e) => {
          const feature = e.features?.[0] as MapGeoJSONFeature | undefined;
          if (!map || !feature) return;
          new maplibregl.Popup({ offset: 10, maxWidth: '260px' })
            .setLngLat(
              (feature.geometry as GeoJSON.Point).coordinates as [
                number,
                number,
              ]
            )
            .setDOMContent(
              popupContent(
                feature.properties as ArtifactPoints['features'][number]['properties']
              )
            )
            .addTo(map);
        });
        for (const layer of ['clusters', 'points']) {
          map.on(
            'mouseenter',
            layer,
            () => map && (map.getCanvas().style.cursor = 'pointer')
          );
          map.on(
            'mouseleave',
            layer,
            () => map && (map.getCanvas().style.cursor = '')
          );
        }
        setReady(true);
      });
    });

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [key]);

  // Push new points whenever the filters change
  useEffect(() => {
    const source = mapRef.current?.getSource('artifacts') as
      | GeoJSONSource
      | undefined;
    if (ready && source && points)
      source.setData(points as GeoJSON.FeatureCollection);
  }, [ready, points]);

  if (!key) {
    return (
      <div className="flex h-[480px] items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
        Map unavailable — NEXT_PUBLIC_MAPTILER_KEY is not set.
      </div>
    );
  }

  return (
    <div className="relative h-[70vh] min-h-[420px] w-full overflow-hidden rounded-xl border border-gray-200 bg-stone-50">
      {/* h-full, not absolute: .maplibregl-map sets position: relative */}
      <div ref={container} className="h-full w-full" />
      <div className="pointer-events-none absolute left-2 top-2 flex gap-3 rounded-md bg-white/90 px-2.5 py-1.5 text-[11px] text-gray-600 shadow-sm">
        <span className="flex items-center gap-1">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: NATIONAL_TREASURE }}
          />{' '}
          National Treasure
        </span>
        <span className="flex items-center gap-1">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: TREASURE }}
          />{' '}
          Treasure
        </span>
      </div>
    </div>
  );
}
