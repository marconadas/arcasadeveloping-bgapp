// Optimized Leaflet Heat Layer with willReadFrequently support
// Based on leaflet.heat but with performance improvements for frequent canvas reads

import L from 'leaflet';

interface SimpleHeatOptions {
  willReadFrequently?: boolean;
  radius?: number;
  blur?: number;
  gradient?: { [key: number]: string };
  max?: number;
}

class OptimizedSimpleHeat {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private max: number = 1;
  private _data: [number, number, number][] = [];
  private circle: HTMLCanvasElement | null = null;
  private grad: Uint8ClampedArray | null = null;
  private r: number = 0;
  private _customGradientSet: boolean = false;

  // Performance cache
  private gradientCache = new Map<string, Uint8ClampedArray>();
  private circleCache = new Map<string, HTMLCanvasElement>();

  constructor(canvas: HTMLCanvasElement | string, options: SimpleHeatOptions = {}) {
    if (typeof canvas === 'string') {
      this.canvas = document.getElementById(canvas) as HTMLCanvasElement;
    } else {
      this.canvas = canvas;
    }

    // Create context with willReadFrequently for better getImageData performance
    const contextOptions: CanvasRenderingContext2DSettings = {};
    if (options.willReadFrequently !== false) {
      contextOptions.willReadFrequently = true;
    }

    const ctx = this.canvas.getContext('2d', contextOptions);
    if (!ctx) {
      throw new Error('Could not get 2d context from canvas');
    }

    this.ctx = ctx;
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.clear();
  }

  data(data: [number, number, number][]): this {
    this._data = data;
    return this;
  }

  setMax(max: number): this {
    this.max = max;
    return this;
  }

  add(point: [number, number, number]): this {
    this._data.push(point);
    return this;
  }

  clear(): this {
    this._data = [];
    return this;
  }

  radius(radius: number, blur: number = 15): this {
    const cacheKey = `${radius}_${blur}`;

    // Check cache first
    if (this.circleCache.has(cacheKey)) {
      this.circle = this.circleCache.get(cacheKey)!;
      this.r = radius + blur;
      return this;
    }

    const circle = document.createElement('canvas');
    const ctx = circle.getContext('2d')!;
    const r = this.r = radius + blur;

    circle.width = circle.height = r * 2;

    ctx.shadowOffsetX = ctx.shadowOffsetY = 200;
    ctx.shadowBlur = blur;
    ctx.shadowColor = 'black';

    ctx.beginPath();
    ctx.arc(r - 200, r - 200, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    this.circle = circle;
    this.circleCache.set(cacheKey, circle);

    return this;
  }

  gradient(gradient: { [key: number]: string }): this {
    const cacheKey = JSON.stringify(gradient);

    // Check cache first
    if (this.gradientCache.has(cacheKey)) {
      this.grad = this.gradientCache.get(cacheKey)!;
      this._customGradientSet = true;
      return this;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const gradientObj = ctx.createLinearGradient(0, 0, 0, 256);

    canvas.width = 1;
    canvas.height = 256;

    for (const i in gradient) {
      gradientObj.addColorStop(+i, gradient[i]);
    }

    ctx.fillStyle = gradientObj;
    ctx.fillRect(0, 0, 1, 256);

    this.grad = ctx.getImageData(0, 0, 1, 256).data;
    this.gradientCache.set(cacheKey, this.grad);
    this._customGradientSet = true;

    return this;
  }

  draw(minOpacity: number = 0.05): this {
    if (!this.circle) {
      this.radius(25);
    }
    // Only set default gradient if no gradient has been set at all
    if (!this.grad && !this._customGradientSet) {
      this.gradient({
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1: 'red'
      });
    }

    const ctx = this.ctx;

    // Clear canvas
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw heat points
    for (let i = 0, len = this._data.length; i < len; i++) {
      const p = this._data[i];
      ctx.globalAlpha = Math.max(p[2] / this.max, minOpacity);
      ctx.drawImage(this.circle!, p[0] - this.r, p[1] - this.r);
    }

    // Colorize
    const colored = ctx.getImageData(0, 0, this.width, this.height);
    this.colorize(colored.data, this.grad!);
    ctx.putImageData(colored, 0, 0);

    return this;
  }

  private colorize(pixels: Uint8ClampedArray, gradient: Uint8ClampedArray): void {
    for (let i = 3, len = pixels.length, j; i < len; i += 4) {
      j = pixels[i] * 4; // get gradient color from opacity value

      if (j) {
        pixels[i - 3] = gradient[j];     // red
        pixels[i - 2] = gradient[j + 1]; // green
        pixels[i - 1] = gradient[j + 2]; // blue
      }
    }
  }

  // Clean up cache when needed
  clearCache(): void {
    this.gradientCache.clear();
    this.circleCache.clear();
  }
}

// Optimized Leaflet HeatLayer with better performance
export class OptimizedHeatLayer extends L.Layer {
  private latlngs: any[];
  private heat: OptimizedSimpleHeat | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private frame: number | null = null;
  private map: L.Map | null = null;

  constructor(latlngs: any[], options: any = {}) {
    super();
    this.latlngs = latlngs;
    L.Util.setOptions(this, options);
  }

  setLatLngs(latlngs: any[]): this {
    this.latlngs = latlngs;
    return this.redraw();
  }

  addLatLng(latlng: any): this {
    this.latlngs.push(latlng);
    return this.redraw();
  }

  setOptions(options: any): this {
    L.Util.setOptions(this, options);
    if (this.heat && this.updateOptions) {
      this.updateOptions();
    }
    return this.redraw();
  }

  redraw(): this {
    if (!this.heat || this.frame || (this.map && (this.map as any)._animating)) {
      return this;
    }

    this.frame = L.Util.requestAnimFrame(this._redraw.bind(this));
    return this;
  }

  onAdd(map: L.Map): this {
    this.map = map;

    if (!this.canvas) {
      this.initCanvas();
    }

    map.getPanes().overlayPane!.appendChild(this.canvas!);

    map.on('moveend', this.reset, this);

    if (map.options.zoomAnimation && (L.Browser as any).any3d) {
      map.on('zoomanim', this.animateZoom, this);
    }

    this.reset();
    return this;
  }

  onRemove(map: L.Map): this {
    map.getPanes().overlayPane!.removeChild(this.canvas!);

    map.off('moveend', this.reset, this);

    if (map.options.zoomAnimation) {
      map.off('zoomanim', this.animateZoom, this);
    }

    return this;
  }

  addTo(map: L.Map): this {
    map.addLayer(this);
    return this;
  }

  private initCanvas(): void {
    const canvas = this.canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-layer leaflet-layer');

    const originProp = L.DomUtil.testProp(['transformOrigin', 'WebkitTransformOrigin', 'msTransformOrigin']);
    if (originProp) {
      canvas.style[originProp as any] = '50% 50%';
    }

    const size = this.map!.getSize();
    canvas.width = size.x;
    canvas.height = size.y;

    const animated = this.map!.options.zoomAnimation && (L.Browser as any).any3d;
    L.DomUtil.addClass(canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));

    // Create optimized heat with willReadFrequently
    this.heat = new OptimizedSimpleHeat(canvas, {
      willReadFrequently: true
    });

    this.updateOptions();
  }

  private updateOptions(): void {
    if (!this.heat) return;

    const options = this.options as any;

    this.heat.radius(
      options.radius || 25,
      options.blur !== undefined ? options.blur : 15
    );

    if (options.gradient) {
      this.heat.gradient(options.gradient);
    }

    if (options.max !== undefined) {
      this.heat.setMax(options.max);
    }
  }

  private reset(): void {
    if (!this.map || !this.canvas || !this.heat) return;

    const topLeft = this.map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this.canvas, topLeft);

    const size = this.map.getSize();

    if ((this.heat as any)._width !== size.x) {
      this.canvas.width = (this.heat as any)._width = size.x;
    }
    if ((this.heat as any)._height !== size.y) {
      this.canvas.height = (this.heat as any)._height = size.y;
    }

    this._redraw();
  }

  private _redraw(): void {
    if (!this.map || !this.heat) {
      this.frame = null;
      return;
    }

    const data: [number, number, number][] = [];
    const r = (this.heat as any)._r || 25;
    const size = this.map.getSize();
    const bounds = new L.Bounds(
      L.point([-r, -r]),
      size.add([r, r])
    );

    const options = this.options as any;
    const max = options.max === undefined ? 1 : options.max;
    const maxZoom = options.maxZoom === undefined ? this.map.getMaxZoom() : options.maxZoom;
    const v = 1 / Math.pow(2, Math.max(0, Math.min(maxZoom - this.map.getZoom(), 12)));
    const cellSize = r / 2;
    const grid: any[] = [];
    const panePos = (this.map as any)._getMapPanePos();
    const offsetX = panePos.x % cellSize;
    const offsetY = panePos.y % cellSize;

    for (let i = 0, len = this.latlngs.length; i < len; i++) {
      const p = this.map.latLngToContainerPoint(this.latlngs[i]);

      if (bounds.contains(p)) {
        const x = Math.floor((p.x - offsetX) / cellSize) + 2;
        const y = Math.floor((p.y - offsetY) / cellSize) + 2;

        const alt = this.latlngs[i].alt !== undefined ?
          this.latlngs[i].alt :
          (this.latlngs[i][2] !== undefined ? +this.latlngs[i][2] : 1);

        const k = alt * v;

        grid[y] = grid[y] || [];
        const cell = grid[y][x];

        if (cell) {
          cell[0] = (cell[0] * cell[2] + p.x * k) / (cell[2] + k);
          cell[1] = (cell[1] * cell[2] + p.y * k) / (cell[2] + k);
          cell[2] += k;
        } else {
          grid[y][x] = [p.x, p.y, k];
        }
      }
    }

    for (let i = 0, len = grid.length; i < len; i++) {
      if (grid[i]) {
        for (let j = 0, len2 = grid[i].length; j < len2; j++) {
          const cell = grid[i][j];
          if (cell) {
            data.push([
              Math.round(cell[0]),
              Math.round(cell[1]),
              Math.min(cell[2], max)
            ]);
          }
        }
      }
    }

    this.heat.data(data);
    this.heat.draw(options.minOpacity);
    this.frame = null;
  }

  private animateZoom(e: any): void {
    if (!this.map || !this.canvas) return;

    const scale = this.map.getZoomScale(e.zoom);
    const offset = (this.map as any)._getCenterOffset(e.center)._multiplyBy(-scale).subtract((this.map as any)._getMapPanePos());

    if (L.DomUtil.setTransform) {
      L.DomUtil.setTransform(this.canvas, offset, scale);
    } else {
      (this.canvas.style as any)[L.DomUtil.TRANSFORM] =
        'translate3d(' + offset.x + 'px,' + offset.y + 'px,0) scale(' + scale + ')';
    }
  }
}

// Factory function
export function optimizedHeatLayer(latlngs: any[], options?: any): OptimizedHeatLayer {
  return new OptimizedHeatLayer(latlngs, options);
}

// Default export for convenience
export default OptimizedHeatLayer;