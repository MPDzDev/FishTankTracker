const content = document.getElementById('content');
const tankSection = document.getElementById('tankSection');
const residentsSection = document.getElementById('residentsSection');
const measurementsSection = document.getElementById('measurementsSection');
const eventsSection = document.getElementById('eventsSection');
const photosSection = document.getElementById('photosSection');
const lightbox = document.getElementById('photoLightbox');
const lightboxImg = lightbox?.querySelector('img') ?? null;
const lightboxCaption = lightbox?.querySelector('.lightbox__caption') ?? null;
const lightboxClose = lightbox?.querySelector('.lightbox__close') ?? null;

const previewContainer = document.getElementById('photoPreview');
const previewList = document.getElementById('photoPreviewList');
const previewEmpty = document.getElementById('photoPreviewEmpty');

const LAST_URL_KEY = 'aquatrack:last-url';
const LAST_FILE_KEY = 'aquatrack:last-file';
const LIGHTBOX_BODY_CLASS = 'lightbox-open';

let storageWarningShown = false;
let lastPhotoTrigger = null;
let lazyImageObserver = null;

function getLazyImageObserver() {
  if (!('IntersectionObserver' in window)) {
    return null;
  }
  if (!lazyImageObserver) {
    lazyImageObserver = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = entry.target;
        observer.unobserve(target);
        const src = target.dataset.src;
        if (src) {
          target.src = src;
          target.removeAttribute('data-src');
        }
      }
    }, {
      rootMargin: '200px 0px',
      threshold: 0.1,
    });
  }
  return lazyImageObserver;
}

function registerLazyImage(img, src) {
  if (!img || !src) return;
  img.loading = 'lazy';
  img.decoding = 'async';

  const observer = getLazyImageObserver();
  if (!observer) {
    img.src = src;
    return;
  }

  img.dataset.src = src;
  observer.observe(img);
}

if (photosSection) {
  photosSection.addEventListener('click', (event) => {
    const card = event.target.closest('.photo-card');
    if (!card) {
      return;
    }
    event.preventDefault();
    openPhotoCard(card);
  });

  photosSection.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    const card = event.target.closest('.photo-card');
    if (!card) {
      return;
    }
    event.preventDefault();
    openPhotoCard(card);
  });
}

if (lightboxClose) {
  lightboxClose.addEventListener('click', () => hideLightbox());
}

if (lightbox) {
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      hideLightbox();
    }
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && lightbox && !lightbox.hidden) {
    hideLightbox();
  }
});

function setStatus(message, tone = 'info') {
  const prefix = `[${tone}]`;
  if (tone === 'error') {
    console.error(`${prefix} ${message}`);
  } else if (tone === 'warn' || tone === 'warning') {
    console.warn(`${prefix} ${message}`);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

function storageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    if (!storageWarningShown) {
      console.warn('[storage] Unable to read key.', error);
      storageWarningShown = true;
    }
    return null;
  }
}

function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    if (!storageWarningShown) {
      console.warn('[storage] Unable to persist data.', error);
      storageWarningShown = true;
    }
  }
}

function storageRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    if (!storageWarningShown) {
      console.warn('[storage] Unable to remove stored data.', error);
      storageWarningShown = true;
    }
  }
}

function clearContent() {
  if (lightbox && !lightbox.hidden) {
    hideLightbox();
  }

  for (const section of [
    tankSection,
    residentsSection,
    measurementsSection,
    eventsSection,
    photosSection,
  ]) {
    section.hidden = true;
    section.querySelector('.panel-body').innerHTML = '';
  }

  if (previewContainer && previewList) {
    previewList.innerHTML = '';
    previewContainer.classList.add('is-empty');
    if (previewEmpty) {
      previewEmpty.hidden = false;
    }
  }

  content.classList.remove('has-data');
}

function escapeHtml(value) {
  if (value == null) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return value;
  }
  return (
    date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) +
    ' · ' +
    date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
}

function formatVolume(volumeL) {
  if (volumeL == null) return '—';
  const num = Number(volumeL);
  if (Number.isNaN(num)) return volumeL;
  return `${num.toLocaleString()} L`;
}

function renderTank(tank) {
  if (!tank) return false;
  const listItems = [
    {
      label: 'Name',
      value: tank.name,
    },
    {
      label: 'Volume',
      value: formatVolume(tank.volumeL),
    },
    {
      label: 'Started',
      value: formatDate(tank.start),
    },
    {
      label: 'Notes',
      value: tank.notes,
    },
  ]
    .filter((item) => item.value && String(item.value).trim().length > 0)
    .map((item) => {
      const isNotes = typeof item.label === 'string' && item.label.toLowerCase() === 'notes';
      const classAttr = isNotes ? ' class="note-item"' : '';
      return `<li${classAttr}><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(
        item.value
      )}</strong></li>`;
    })
    .join('');

  if (!listItems) return false;

  const markup = `<ul class="details-grid">${listItems}</ul>`;
  tankSection.querySelector('.panel-body').innerHTML = markup;
  tankSection.hidden = false;
  return true;
}

const TYPE_LABELS = {
  fish: 'Fish',
  shrimp: 'Shrimp',
  snail: 'Snails',
  plant: 'Plants',
  algae: 'Algae',
};

function renderResidents(residents = []) {
  if (!residents.length) return false;

  const groups = new Map();
  for (const resident of residents) {
    const key = resident.type ?? 'other';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(resident);
  }

  const template = document.getElementById('residentGroupTemplate');
  const fragment = document.createDocumentFragment();

  for (const [type, entries] of groups.entries()) {
    entries.sort((a, b) => {
      const aLabel = a.label ?? '';
      const bLabel = b.label ?? '';
      return aLabel.localeCompare(bLabel, undefined, { sensitivity: 'base' });
    });
    const clone = template.content.cloneNode(true);
    const heading = clone.querySelector('h3');
    heading.textContent = TYPE_LABELS[type] ?? type;
    const table = clone.querySelector('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th scope="col">Label</th>
          <th scope="col">Common</th>
          <th scope="col">Scientific</th>
          <th scope="col">Count</th>
          <th scope="col">Since</th>
        </tr>
      </thead>
      <tbody>
        ${entries
          .map((entry) => {
            return `
              <tr>
                <td>${escapeHtml(entry.label)}</td>
                <td>${escapeHtml(entry.common)}</td>
                <td>${escapeHtml(entry.sci ?? '')}</td>
                <td>${escapeHtml(entry.count ?? '')}</td>
                <td>${escapeHtml(formatDate(entry.date))}</td>
              </tr>
            `;
          })
          .join('')}
      </tbody>`;
    fragment.appendChild(clone);
  }

  const container = residentsSection.querySelector('.panel-body');
  container.innerHTML = '';
  container.appendChild(fragment);
  residentsSection.hidden = false;
  return true;
}

function renderMeasurements(measurements = []) {
  const container = measurementsSection.querySelector('.panel-body');
  if (!measurements.length) {
    container.innerHTML = '<p class="empty-state">No measurements logged yet.</p>';
    measurementsSection.hidden = false;
    return true;
  }

  const header = `
    <thead>
      <tr>
        <th>Date</th>
        <th>pH</th>
        <th>Temp °C</th>
        <th>GH</th>
        <th>KH</th>
        <th>NO₃</th>
        <th>NO₂</th>
        <th>NH₃</th>
        <th>Notes</th>
      </tr>
    </thead>`;

  const rows = measurements
    .map((measurement) => {
      const cells = [
        formatDateTime(measurement.t),
        measurement.ph ?? '—',
        measurement.temp ?? '—',
        measurement.gh ?? '—',
        measurement.kh ?? '—',
        measurement.no3 ?? '—',
        measurement.no2 ?? '—',
        measurement.nh3 ?? '—',
        measurement.notes ? escapeHtml(measurement.notes) : '—',
      ].map((value) => `<td>${escapeHtml(value)}</td>`);
      return `<tr>${cells.join('')}</tr>`;
    })
    .join('');

  container.innerHTML = `<div class="table-wrapper"><table>${header}<tbody>${rows}</tbody></table></div>`;
  measurementsSection.hidden = false;
  return true;
}

const EVENT_LABELS = {
  water_change: 'Water change',
  filter_clean: 'Filter clean',
  dose: 'Dose',
  treatment: 'Treatment',
  note: 'Note',
  add_resident: 'Added resident',
  remove_resident: 'Removed resident',
  setup: 'Setup',
  hardscape: 'Hardscape',
  planting: 'Planting',
};

function renderEvents(events = []) {
  const container = eventsSection.querySelector('.panel-body');
  if (!events.length) {
    container.innerHTML = '<p class="empty-state">No events logged yet.</p>';
    eventsSection.hidden = false;
    return true;
  }

  const header = `
    <thead>
      <tr>
        <th>Date</th>
        <th>Event</th>
        <th>Details</th>
        <th>Notes</th>
      </tr>
    </thead>`;

  const rows = events
    .map((event) => {
      const eventType = EVENT_LABELS[event.type] ?? event.type ?? 'Event';
      const detail = event.v1 ? `<span class="tag">${escapeHtml(event.v1)}</span>` : '—';
      return `
        <tr>
          <td>${escapeHtml(formatDateTime(event.t))}</td>
          <td>${escapeHtml(eventType)}</td>
          <td>${detail}</td>
          <td>${event.notes ? escapeHtml(event.notes) : '—'}</td>
        </tr>
      `;
    })
    .join('');

  container.innerHTML = `<div class="table-wrapper"><table>${header}<tbody>${rows}</tbody></table></div>`;
  eventsSection.hidden = false;
  return true;
}

function resolvePhotoUrl(url, overrideBase, jsonBase) {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^(?:[a-z]+:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const base = overrideBase ?? jsonBase ?? '';
  if (!base) {
    return trimmed;
  }
  try {
    const baseUrl = new URL(base, window.location.href);
    return new URL(trimmed, baseUrl).href;
  } catch (error) {
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const normalizedPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
    return `${normalizedBase}/${normalizedPath}`;
  }
}

function buildPhotoDisplayData(photo) {
  const altText = photo?.caption ? String(photo.caption) : 'Aquarium photo';
  const captionParts = [];
  const textPieces = [];
  if (photo?.caption) {
    captionParts.push(`<span class=\"caption\">${escapeHtml(photo.caption)}</span>`);
    textPieces.push(String(photo.caption));
  }

  const metaPieces = [];
  const formattedDate = photo?.takenAt ? formatDate(photo.takenAt) : '';
  if (formattedDate && formattedDate !== '—') {
    metaPieces.push(formattedDate);
  }
  if (photo?.resident) {
    metaPieces.push(photo.resident);
  }
  if (metaPieces.length) {
    const metaMarkup = metaPieces.map((piece) => escapeHtml(piece)).join(' | ');
    captionParts.push(`<span class=\"meta\">${metaMarkup}</span>`);
    textPieces.push(metaPieces.join(' | '));
  }

  const captionText = textPieces.join(' | ').trim();

  return {
    altText,
    captionHtml: captionParts.join(''),
    captionText,
    formattedDate,
  };
}

function sortPhotosLatestFirst(photos = []) {
  if (!Array.isArray(photos) || photos.length === 0) {
    return [];
  }
  const total = photos.length;
  return photos
    .map((photo, index) => {
      const ts = photo?.takenAt ? new Date(photo.takenAt).valueOf() : Number.NaN;
      const sortKey = Number.isNaN(ts) ? -(total - index) : ts;
      return { photo, index, sortKey };
    })
    .sort((a, b) => {
      if (a.sortKey !== b.sortKey) {
        return b.sortKey - a.sortKey;
      }
      return b.index - a.index;
    })
    .map((entry) => entry.photo);
}

function selectPreviewPhotos(photos = []) {
  return sortPhotosLatestFirst(photos).slice(0, 3);
}

function updatePhotoPreview(photos = [], jsonBase, overrideBase) {
  if (!previewContainer || !previewList) {
    return;
  }

  previewList.innerHTML = '';

  const latest = selectPreviewPhotos(photos);
  if (!latest.length) {
    previewContainer.classList.add('is-empty');
    if (previewEmpty) {
      previewEmpty.hidden = false;
    }
    return;
  }

  previewContainer.classList.remove('is-empty');
  if (previewEmpty) {
    previewEmpty.hidden = true;
  }

  for (const photo of latest) {
    const resolvedUrl = resolvePhotoUrl(photo.url, overrideBase, jsonBase);
    const { altText, captionHtml, captionText, formattedDate } = buildPhotoDisplayData(photo);

    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preview-card';
    button.dataset.fullUrl = resolvedUrl;
    button.dataset.caption = captionText;
    button.dataset.alt = altText;

    const ariaLabel = captionText
      ? `Open ${captionText}`
      : formattedDate && formattedDate !== '—'
      ? `Open photo taken ${formattedDate}`
      : 'Open aquarium photo';
    button.setAttribute('aria-label', ariaLabel);

    const img = document.createElement('img');
    img.alt = '';

    const meta = document.createElement('span');
    meta.className = 'preview-card__meta';
    if (captionHtml) {
      meta.innerHTML = captionHtml;
    } else if (formattedDate && formattedDate !== '—') {
      meta.innerHTML = `<span>${escapeHtml(formattedDate)}</span>`;
    } else {
      meta.textContent = 'View photo';
    }

    button.append(img, meta);
    button.addEventListener('click', () => {
      lastPhotoTrigger = button;
      showLightbox(resolvedUrl, captionText, altText);
    });

    li.appendChild(button);
    previewList.appendChild(li);
    registerLazyImage(img, resolvedUrl);
  }
}

function showLightbox(url, caption = '', alt = 'Aquarium photo') {
  if (!lightbox || !lightboxImg) return;

  lightboxImg.src = url;
  lightboxImg.alt = alt;

  if (lightboxCaption) {
    const trimmed = typeof caption === 'string' ? caption.trim() : '';
    lightboxCaption.textContent = trimmed;
    lightboxCaption.hidden = trimmed.length === 0;
  }

  lightbox.hidden = false;
  try {
    lightbox.focus({ preventScroll: true });
  } catch (error) {
    lightbox.focus();
  }
  document.body.classList.add(LIGHTBOX_BODY_CLASS);
}

function hideLightbox() {
  if (!lightbox || !lightboxImg) return;

  if (!lightbox.hidden) {
    lightbox.hidden = true;
    lightboxImg.src = '';
    lightboxImg.alt = '';

    if (lightboxCaption) {
      lightboxCaption.textContent = '';
      lightboxCaption.hidden = false;
    }
  }

  document.body.classList.remove(LIGHTBOX_BODY_CLASS);

  if (lastPhotoTrigger && typeof lastPhotoTrigger.focus === 'function') {
    if (lastPhotoTrigger.isConnected) {
      try {
        lastPhotoTrigger.focus({ preventScroll: true });
      } catch (error) {
        lastPhotoTrigger.focus();
      }
    }
    lastPhotoTrigger = null;
  }
}

function openPhotoCard(card) {
  if (!card) return;
  const url = card.dataset?.fullUrl;
  if (!url) return;

  lastPhotoTrigger = card;
  const caption = card.dataset?.caption ?? '';
  const alt = card.dataset?.alt ?? 'Aquarium photo';
  showLightbox(url, caption, alt);
}

function renderPhotos(photos = [], jsonBase, overrideBase) {
  const container = photosSection.querySelector('.panel-body');
  if (!photos.length) {
    container.innerHTML = '<p class="empty-state">No photos added yet.</p>';
    photosSection.hidden = false;
    updatePhotoPreview([], jsonBase, overrideBase);
    return true;
  }

  const template = document.getElementById('photoCardTemplate');
  const fragment = document.createDocumentFragment();
  const lazyQueue = [];

  const orderedPhotos = sortPhotosLatestFirst(photos);

  for (const photo of orderedPhotos) {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.photo-card');
    const img = clone.querySelector('img');
    const caption = clone.querySelector('figcaption');

    const resolvedUrl = resolvePhotoUrl(photo.url, overrideBase, jsonBase);
    const { altText, captionHtml, captionText, formattedDate } = buildPhotoDisplayData(photo);

    img.alt = altText;
    lazyQueue.push({ img, src: resolvedUrl });

    caption.innerHTML = captionHtml;

    card.classList.add('photo-card--interactive');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.dataset.fullUrl = resolvedUrl;
    card.dataset.caption = captionText;
    card.dataset.alt = altText;

    if (captionText) {
      card.setAttribute('aria-label', `View photo: ${captionText}`);
    } else if (formattedDate && formattedDate !== '—') {
      card.setAttribute('aria-label', `View photo taken ${formattedDate}`);
    } else {
      card.setAttribute('aria-label', 'View aquarium photo');
    }

    fragment.appendChild(clone);
  }

  const grid = document.createElement('div');
  grid.className = 'photo-grid';
  grid.appendChild(fragment);
  container.innerHTML = '';
  container.appendChild(grid);
  photosSection.hidden = false;

  for (const { img, src } of lazyQueue) {
    registerLazyImage(img, src);
  }

  updatePhotoPreview(orderedPhotos, jsonBase, overrideBase);
  return true;
}

function render(data, options = {}) {
  clearContent();
  if (!data || typeof data !== 'object') {
    setStatus('Invalid data: expected an object.', 'error');
    return false;
  }

  let hasContent = false;
  if (renderTank(data.tank)) hasContent = true;
  if (renderResidents(Array.isArray(data.residents) ? data.residents : [])) hasContent = true;
  if (renderMeasurements(Array.isArray(data.measurements) ? data.measurements : []))
    hasContent = true;
  if (renderEvents(Array.isArray(data.events) ? data.events : [])) hasContent = true;
  if (
    renderPhotos(
      Array.isArray(data.photos) ? data.photos : [],
      data.photosBase,
      options.photosBase
    )
  ) {
    hasContent = true;
  }

  if (hasContent) {
    content.classList.add('has-data');
  }

  return hasContent;
}

async function loadFromUrl(url, photosBaseOverride, { successMessage } = {}) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const data = await response.json();
    render(data, { photosBase: photosBaseOverride });
    storageSet(LAST_URL_KEY, url);
    storageRemove(LAST_FILE_KEY);
    setStatus(successMessage ?? `Loaded ${url}.`, 'info');
    return true;
  } catch (error) {
    console.error(error);
    setStatus(`Failed to load ${url}: ${error.message}`, 'error');
    return false;
  }
}

function loadFromFile(file, photosBaseOverride) {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      const text = String(reader.result ?? '');
      const json = JSON.parse(text);
      render(json, { photosBase: photosBaseOverride });
      storageSet(LAST_FILE_KEY, text);
      storageRemove(LAST_URL_KEY);
      setStatus(`Loaded ${file.name}.`, 'info');
    } catch (error) {
      console.error(error);
      setStatus(`Could not parse ${file.name}: ${error.message}`, 'error');
    }
  });
  reader.addEventListener('error', () => {
    setStatus(`Failed to read ${file.name}.`, 'error');
  });
  reader.readAsText(file);
}

function handleFiles(files, photosBaseOverride) {
  if (!files?.length) return;
  const [file] = files;
  if (file.type && file.type !== 'application/json') {
    setStatus('Please provide a JSON file.', 'error');
    return;
  }
  loadFromFile(file, photosBaseOverride);
}

function handleDrop(event, photosBaseOverride) {
  event.preventDefault();
  handleFiles(event.dataTransfer?.files, photosBaseOverride);
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const dataParam = params.get('data');
  const baseParam = params.get('base') ?? undefined;

  document.addEventListener('dragover', (event) => {
    event.preventDefault();
  });
  document.addEventListener('drop', (event) => handleDrop(event, baseParam));

  if (dataParam) {
    const url = decodeURIComponent(dataParam);
    if (!(await loadFromUrl(url, baseParam, { successMessage: `Loaded ${url}.` }))) {
      render(DEFAULT_DATA);
      setStatus('Showing bundled sample data.', 'warning');
    }
    return;
  }

  const storedFile = storageGet(LAST_FILE_KEY);
  if (storedFile) {
    try {
      const json = JSON.parse(storedFile);
      render(json, { photosBase: baseParam });
      setStatus('Loaded most recent local file.', 'info');
      return;
    } catch (error) {
      console.error(error);
      storageRemove(LAST_FILE_KEY);
    }
  }

  const storedUrl = storageGet(LAST_URL_KEY);
  if (storedUrl) {
    if (await loadFromUrl(storedUrl, baseParam, { successMessage: `Loaded ${storedUrl}.` })) {
      return;
    }
    storageRemove(LAST_URL_KEY);
  }

  if (!(await loadFromUrl('aquatrack.json', baseParam, { successMessage: 'Loaded aquatrack.json.' }))) {
    render(DEFAULT_DATA);
    setStatus('Showing bundled sample data.', 'warning');
  }
}

const DEFAULT_DATA = {
  tank: {
    name: 'Tetra Starter Line 54L',
    volumeL: 54,
    start: '2024-10-04',
    notes:
      'Internal filter with sponge and bio balls, 50W heater, LED lighting with blue/white modes. Substrate stack of Fluval Stratum capped with sand and gravel.',
  },
  residents: [
    {
      label: 'Cryptocoryne affinis',
      common: 'Cryptocoryne affinis',
      type: 'plant',
      count: 1,
      date: '2024-10-04',
      notes: 'Foreground to midground rooted in substrate.',
    },
    {
      label: 'Anubias nana',
      common: 'Anubias nana',
      type: 'plant',
      count: 2,
      date: '2024-10-04',
      notes: 'Epiphyte attached to driftwood and rocks.',
    },
    {
      label: 'Marimo moss ball',
      common: 'Marimo moss ball',
      type: 'algae',
      count: 1,
      date: '2024-10-04',
      notes: 'Placed on substrate as ornamental feature.',
    },
  ],
  measurements: [],
  events: [
    {
      t: '2024-10-04T09:00:00Z',
      type: 'setup',
      v1: 'Initial fill',
      notes:
        'Filled with ~20 L reverse osmosis water topped up with Bologna tap water. Dosed Tetra AquaSafe conditioner and Tetra FilterActive bacteria starter.',
    },
    {
      t: '2024-10-04T10:00:00Z',
      type: 'hardscape',
      v1: 'Driftwood centerpiece and grey rocks',
      notes: 'Arranged driftwood centerpiece with decorative grey stones before planting.',
    },
    {
      t: '2024-10-04T11:00:00Z',
      type: 'planting',
      v1: 'Initial planting',
      notes:
        'Planted Cryptocoryne affinis in the substrate, secured two Anubias nana to wood/rocks, and placed Marimo moss ball. Added Tetra PlantaStart tablets near roots.',
    },
  ],
  photos: [],
};

init();
