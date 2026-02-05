/* eslint-disable @typescript-eslint/no-explicit-any */
declare namespace kakao.maps {
  function load(callback?: () => void): void;

  class Map {
    constructor(container: HTMLElement, options?: MapOptions);
    relayout?(): void;
    setCenter(latlng: LatLng): void;
    getCenter(): LatLng;
    getLevel(): number;
    setLevel(level: number): void;
  }

  interface MapOptions {
    center?: LatLng;
    level?: number;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class Marker {
    constructor(options?: MarkerOptions);
    setMap(map: Map | null): void;
    getPosition(): LatLng;
  }

  interface MarkerOptions {
    position?: LatLng;
    map?: Map;
    title?: string;
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
  }

  interface CustomOverlayOptions {
    position?: LatLng;
    content?: string | HTMLElement;
    map?: Map;
    yAnchor?: number;
  }

  namespace event {
    function addListener(
      target: object,
      type: string,
      handler: (event?: any) => void
    ): void;
  }

  namespace services {
    const Status: { OK: string; ERROR: string; ZERO_RESULT: string };
    class Geocoder {
      addressSearch(
        address: string,
        callback: (result: { x: string; y: string }[], status: string) => void
      ): void;
    }
  }
}

declare const kakao: {
  maps: typeof kakao.maps;
};
