import L from 'leaflet';
import './year-filter.css';

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function chipMarkup(year, color, count) {
  return `
    <button
      type="button"
      class="swims-year-filter__chip"
      data-year="${escapeHTML(year)}"
      style="--year-color: ${escapeHTML(color)};"
      aria-pressed="true"
      aria-label="Toggle ${escapeHTML(year)} (${count} swims)"
    >
      <span class="swims-year-filter__chip-year">${escapeHTML(year)}</span>
      <span class="swims-year-filter__chip-count">${count}</span>
    </button>
  `;
}

function baseButtonMarkup(name, isActive) {
  return `
    <button
      type="button"
      class="swims-year-filter__base-btn"
      data-base="${escapeHTML(name)}"
      aria-pressed="${isActive ? 'true' : 'false'}"
    >${escapeHTML(name).toUpperCase()}</button>
  `;
}

const YearFilterControl = L.Control.extend({
  options: {
    position: 'topleft',
  },

  initialize(options) {
    L.Util.setOptions(this, options);
    this._yearLayers = options.yearLayers;
    this._sortedYears = options.sortedYears;
    this._yearColors = options.yearColors;
    this._yearCounts = options.yearCounts;
    this._baseLayers = options.baseLayers;
    this._activeBase = options.defaultBaseLayer;
    this._onTimelineClick = options.onTimelineClick || null;
    this._timelineActive = false;

    this._totalCount = this._sortedYears.reduce(
      (sum, y) => sum + this._yearCounts[y],
      0,
    );
    this._active = new Set(this._sortedYears);
    this._expanded = false;
    this._locked = false;
  },

  getActiveYears() {
    return new Set(this._active);
  },

  setLocked(locked) {
    this._locked = Boolean(locked);
    if (!this._container) return;
    this._container.dataset.locked = this._locked ? 'true' : 'false';
  },

  setTimelineActive(active) {
    this._timelineActive = Boolean(active);
    if (!this._timelineBtn) return;
    this._timelineBtn.textContent = this._timelineActive ? 'STOP' : 'TIMELINE';
    this._timelineBtn.setAttribute(
      'aria-pressed',
      this._timelineActive ? 'true' : 'false',
    );
  },

  onAdd(map) {
    this._map = map;

    const container = L.DomUtil.create('div', 'swims-year-filter');
    container.dataset.state = 'collapsed';
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    container.innerHTML = this._render();
    this._container = container;

    this._countEl = container.querySelector('.swims-year-filter__count');
    this._metaEl = container.querySelector('.swims-year-filter__meta');
    this._triggerEl = container.querySelector('.swims-year-filter__trigger');
    this._timelineBtn = container.querySelector('[data-action="timeline"]');

    container.addEventListener('click', this._onClick.bind(this));
    return container;
  },

  _render() {
    const chips = this._sortedYears
      .map((year) =>
        chipMarkup(year, this._yearColors[year], this._yearCounts[year]),
      )
      .join('');

    const baseButtons = Object.keys(this._baseLayers)
      .map((name) => baseButtonMarkup(name, name === this._activeBase))
      .join('');

    return `
      <button
        type="button"
        class="swims-year-filter__trigger"
        data-action="toggle-drawer"
        aria-expanded="false"
      >
        <span class="swims-year-filter__count">${this._totalCount}</span>
        <span class="swims-year-filter__caret" aria-hidden="true">▶</span>
        <span class="swims-year-filter__meta">SWIMS / ALL</span>
      </button>
      <div class="swims-year-filter__body" role="region" aria-label="Year filter">
        <div class="swims-year-filter__body-inner">
          <div class="swims-year-filter__quick">
            <button type="button" class="swims-year-filter__quick-btn" data-action="all">ALL</button>
            <button type="button" class="swims-year-filter__quick-btn" data-action="none">NONE</button>
            <button type="button" class="swims-year-filter__quick-btn swims-year-filter__quick-btn--timeline" data-action="timeline" aria-pressed="false">TIMELINE</button>
          </div>
          <div class="swims-year-filter__grid">${chips}</div>
          <div class="swims-year-filter__base">
            <span class="swims-year-filter__base-label">BASE MAP</span>
            <div class="swims-year-filter__base-buttons">${baseButtons}</div>
          </div>
        </div>
      </div>
    `;
  },

  _onClick(event) {
    // The timeline toggle stays live even while the filter is locked.
    const timelineAction = event.target.closest('[data-action="timeline"]');
    if (timelineAction) {
      this._onTimelineClick?.();
      return;
    }

    if (this._locked) return;

    const trigger = event.target.closest('[data-action="toggle-drawer"]');
    if (trigger) {
      this._toggleDrawer();
      return;
    }

    const chip = event.target.closest('.swims-year-filter__chip');
    if (chip) {
      this._toggleYear(Number(chip.dataset.year), chip);
      return;
    }

    const action = event.target.closest('[data-action]');
    if (action) {
      const value = action.dataset.action;
      if (value === 'all') this._setAll(true);
      else if (value === 'none') this._setAll(false);
      return;
    }

    const baseBtn = event.target.closest('[data-base]');
    if (baseBtn) {
      this._switchBase(baseBtn.dataset.base);
    }
  },

  _toggleDrawer() {
    this._expanded = !this._expanded;
    this._container.dataset.state = this._expanded ? 'expanded' : 'collapsed';
    this._triggerEl.setAttribute('aria-expanded', String(this._expanded));
  },

  _toggleYear(year, chipEl) {
    const layer = this._yearLayers[year];
    if (this._active.has(year)) {
      this._active.delete(year);
      this._map.removeLayer(layer);
      chipEl.setAttribute('aria-pressed', 'false');
    } else {
      this._active.add(year);
      this._map.addLayer(layer);
      chipEl.setAttribute('aria-pressed', 'true');
    }
    this._updateCounter();
  },

  _setAll(visible) {
    this._sortedYears.forEach((year) => {
      const layer = this._yearLayers[year];
      const chip = this._container.querySelector(`[data-year="${year}"]`);
      if (visible) {
        this._active.add(year);
        if (!this._map.hasLayer(layer)) this._map.addLayer(layer);
        chip.setAttribute('aria-pressed', 'true');
      } else {
        this._active.delete(year);
        if (this._map.hasLayer(layer)) this._map.removeLayer(layer);
        chip.setAttribute('aria-pressed', 'false');
      }
    });
    this._updateCounter();
  },

  _switchBase(name) {
    if (name === this._activeBase) return;
    const next = this._baseLayers[name];
    const current = this._baseLayers[this._activeBase];
    if (!next || !current) return;

    this._map.removeLayer(current);
    this._map.addLayer(next);
    // Re-add the cluster cover so it sits above the tile layer.
    this._activeBase = name;

    this._container
      .querySelectorAll('[data-base]')
      .forEach((btn) =>
        btn.setAttribute('aria-pressed', btn.dataset.base === name ? 'true' : 'false'),
      );
  },

  _updateCounter() {
    const activeCount = [...this._active].reduce(
      (sum, y) => sum + this._yearCounts[y],
      0,
    );
    this._countEl.textContent = activeCount;
    this._metaEl.textContent = this._counterLabel();
  },

  _counterLabel() {
    const n = this._active.size;
    if (n === 0) return 'SWIMS / NONE';
    if (n === this._sortedYears.length) return 'SWIMS / ALL';
    if (n === 1) {
      const [only] = this._active;
      return `SWIMS / ${only}`;
    }
    return `SWIMS / ${n} YRS`;
  },
});

export function installYearFilter(map, options) {
  return new YearFilterControl(options).addTo(map);
}
