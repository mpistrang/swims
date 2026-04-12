import L from 'leaflet';
import './timeline.css';

const STEP_MS = 100;
const PULSE_DURATION_MS = 700;
const PULSE_START_RADIUS = 5;
const PULSE_END_RADIUS = 44;

// Framing for the world view used while the timeline plays. Padding keeps the
// map clear of the year-filter drawer (top-left) and the timeline bar (bottom).
const WORLD_BOUNDS = L.latLngBounds([-58, -175], [78, 185]);
const WORLD_PADDING_TOP_LEFT = [280, 24];
const WORLD_PADDING_BOTTOM_RIGHT = [24, 80];

function formatDate(feature) {
  const p = feature?.properties || {};
  const month = p.month ? String(p.month).slice(0, 3).toUpperCase() : '';
  return month ? `${month} ${p.year}` : String(p.year ?? '');
}

class TimelinePlayer {
  constructor(map, { chronological, onEnter, onExit, onTick }) {
    this._map = map;
    this._all = chronological;
    this._onEnter = onEnter;
    this._onExit = onExit;
    this._onTick = onTick;

    this._active = false;
    this._index = 0;
    this._timer = null;
    this._scrubbing = false;

    this._buildDom();
  }

  _buildDom() {
    const el = document.createElement('div');
    el.className = 'swims-timeline';
    el.dataset.state = 'idle';
    el.innerHTML = `
      <div class="swims-timeline__date">—</div>
      <input
        type="range"
        class="swims-timeline__slider"
        min="0"
        max="${this._all.length}"
        value="0"
        step="1"
        aria-label="Timeline position"
      />
    `;

    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);

    this._el = el;
    this._dateEl = el.querySelector('.swims-timeline__date');
    this._slider = el.querySelector('.swims-timeline__slider');

    const onScrubStart = () => {
      this._scrubbing = true;
      this._stopTimer();
    };
    const onScrubEnd = () => {
      if (!this._scrubbing) return;
      this._scrubbing = false;
      if (this._active && this._index < this._all.length) this._startTimer();
    };

    this._slider.addEventListener('pointerdown', onScrubStart);
    this._slider.addEventListener('pointerup', onScrubEnd);
    this._slider.addEventListener('pointercancel', onScrubEnd);
    this._slider.addEventListener('input', () => {
      const target = Number(this._slider.value);
      this._scrubTo(target);
    });
  }

  mount(mapContainer) {
    mapContainer.appendChild(this._el);
  }

  toggle() {
    if (this._active) this._exit();
    else this._enter();
  }

  _enter() {
    this._active = true;
    this._el.dataset.state = 'active';

    this._savedView = {
      center: this._map.getCenter(),
      zoom: this._map.getZoom(),
    };

    this._onEnter?.();

    for (const { marker, yearLayer } of this._all) {
      if (yearLayer.hasLayer(marker)) yearLayer.removeLayer(marker);
    }

    this._index = 0;
    this._slider.value = '0';
    this._dateEl.textContent = this._all[0] ? formatDate(this._all[0].feature) : '—';
    this._onTick?.(0);

    this._map.flyToBounds(WORLD_BOUNDS, {
      duration: 1.0,
      paddingTopLeft: WORLD_PADDING_TOP_LEFT,
      paddingBottomRight: WORLD_PADDING_BOTTOM_RIGHT,
    });

    // Start playback once the fly-to settles.
    this._map.once('moveend', () => {
      if (this._active) this._startTimer();
    });
  }

  _exit() {
    this._stopTimer();
    this._active = false;
    this._el.dataset.state = 'idle';

    for (const { marker, yearLayer } of this._all) {
      if (!yearLayer.hasLayer(marker)) yearLayer.addLayer(marker);
    }

    this._onExit?.();

    if (this._savedView) {
      this._map.flyTo(this._savedView.center, this._savedView.zoom, { duration: 1.0 });
    }
  }

  _startTimer() {
    this._stopTimer();
    this._timer = setInterval(() => this._tick(), STEP_MS);
  }

  _stopTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  _tick() {
    if (!this._active) {
      this._stopTimer();
      return;
    }
    if (this._index >= this._all.length) {
      this._stopTimer();
      return;
    }

    const entry = this._all[this._index];
    entry.yearLayer.addLayer(entry.marker);
    this._pulseAt(entry.feature.geometry?.coordinates, entry.marker.options.fillColor);

    this._index += 1;
    this._slider.value = String(this._index);
    this._dateEl.textContent = formatDate(entry.feature);
    this._onTick?.(this._index);
  }

  _scrubTo(targetIndex) {
    const target = Math.max(0, Math.min(this._all.length, targetIndex));

    if (target > this._index) {
      for (let i = this._index; i < target; i += 1) {
        const { marker, yearLayer } = this._all[i];
        if (!yearLayer.hasLayer(marker)) yearLayer.addLayer(marker);
      }
    } else if (target < this._index) {
      for (let i = this._index - 1; i >= target; i -= 1) {
        const { marker, yearLayer } = this._all[i];
        if (yearLayer.hasLayer(marker)) yearLayer.removeLayer(marker);
      }
    }

    this._index = target;
    const readoutFeature =
      target === 0 ? this._all[0]?.feature : this._all[target - 1]?.feature;
    this._dateEl.textContent = readoutFeature ? formatDate(readoutFeature) : '—';
    this._onTick?.(this._index);
  }

  _pulseAt(coords, color) {
    if (!Array.isArray(coords) || coords.length < 2) return;
    const [lon, lat] = coords;
    const ringColor = color || '#ffffff';

    const ring = L.circleMarker([lat, lon], {
      radius: PULSE_START_RADIUS,
      color: ringColor,
      weight: 3,
      opacity: 1,
      fillColor: ringColor,
      fillOpacity: 0.45,
      interactive: false,
    }).addTo(this._map);

    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / PULSE_DURATION_MS);
      const eased = 1 - (1 - t) * (1 - t);
      ring.setRadius(PULSE_START_RADIUS + (PULSE_END_RADIUS - PULSE_START_RADIUS) * eased);
      ring.setStyle({
        opacity: 1 - t,
        weight: 3 * (1 - t * 0.6),
        fillOpacity: 0.45 * (1 - t),
      });
      if (t < 1) requestAnimationFrame(step);
      else ring.remove();
    };
    requestAnimationFrame(step);
  }
}

export function installTimeline(map, options) {
  const player = new TimelinePlayer(map, options);
  player.mount(map.getContainer());
  return player;
}
