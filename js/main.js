// Navbar scroll shadow
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 10
      ? '0 4px 24px rgba(0,42,71,0.12)'
      : '0 2px 12px rgba(0,42,71,0.06)';
  }, { passive: true });
}

// Mobile burger toggle
const burger = document.getElementById('navBurger');
const navLinks = document.getElementById('navLinks');
if (burger && navLinks) {
  burger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
}

// Close mobile nav on link click
if (navLinks && burger) {
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
}

// Active nav link highlight on scroll
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

function highlightNav() {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 90) current = sec.id;
  });
  navAnchors.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}
window.addEventListener('scroll', highlightNav, { passive: true });
highlightNav();

// News: load and render entries from a JSON file.
const newsList = document.getElementById('newsList');

// Publications: load and render entries from a BibTeX file.
const pubList = document.getElementById('pubList');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function stripBibBraces(value) {
  return value.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}

function normalizeAuthors(authorField) {
  if (!authorField) return '';
  return authorField
    .split(/\s+and\s+/i)
    .map(name => name.trim())
    .filter(Boolean)
    .map(name => {
      if (!name.includes(',')) return name;
      const [last, first] = name.split(',').map(part => part.trim());
      return `${first} ${last}`.trim();
    })
    .join(', ');
}

function parseBibEntryFields(block) {
  const fields = {};
  const fieldPattern = /([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(\{(?:[^{}]|\{[^{}]*\})*\}|"[^"]*"|[^,\n]+)\s*,?/g;
  let match = fieldPattern.exec(block);

  while (match) {
    const key = match[1].toLowerCase();
    let rawValue = match[2].trim();
    if (
      (rawValue.startsWith('{') && rawValue.endsWith('}')) ||
      (rawValue.startsWith('"') && rawValue.endsWith('"'))
    ) {
      rawValue = rawValue.slice(1, -1);
    }
    fields[key] = stripBibBraces(rawValue);
    match = fieldPattern.exec(block);
  }

  return fields;
}

function parseBibTex(content) {
  const entries = [];
  const entryPattern = /@([a-zA-Z]+)\s*\{\s*([^,]+)\s*,([\s\S]*?)\}\s*(?=@|$)/g;
  let match = entryPattern.exec(content);

  while (match) {
    const type = match[1].toLowerCase();
    const key = match[2].trim();
    const fieldBlock = match[3];
    const fields = parseBibEntryFields(fieldBlock);

    entries.push({
      type,
      key,
      title: fields.title || key,
      authors: normalizeAuthors(fields.author || ''),
      year: fields.year || 'n.d.',
      venue: fields.booktitle || fields.journal || fields.publisher || '',
      abstract: fields.abstract || '',
      url: fields.url || fields.doi || '',
      topics: (fields.keywords || '')
        .split(/[;,]/)
        .map(topic => topic.trim())
        .filter(Boolean),
    });

    match = entryPattern.exec(content);
  }

  return entries.sort((a, b) => Number(b.year) - Number(a.year));
}

function publicationTypeLabel(type) {
  const map = {
    inproceedings: 'Conference',
    article: 'Journal',
    incollection: 'Book Chapter',
    phdthesis: 'Thesis',
    mastersthesis: 'Thesis',
    misc: 'Misc',
  };
  return map[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

function renderNews(items) {
  if (!newsList) return;
  const limit = Number(newsList.dataset.limit || '0');
  const visibleItems = limit > 0 ? items.slice(0, limit) : items;

  if (!visibleItems.length) {
    newsList.innerHTML = `
      <div class="news-item">
        <span class="news-date">--</span>
        <div class="news-body">
          <p>No news items found in news.json.</p>
        </div>
      </div>
    `;
    return;
  }

  newsList.innerHTML = visibleItems.map(item => `
    <div class="news-item">
      <span class="news-date">${escapeHtml(item.dateLabel || '')}</span>
      <div class="news-body">
        <p>${escapeHtml(item.text || '')}</p>
      </div>
    </div>
  `).join('');
}

async function loadNews() {
  if (!newsList) return;

  try {
    const response = await fetch('./news.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load news.json (${response.status})`);
    }

    const items = await response.json();
    const sortedItems = Array.isArray(items)
      ? items.sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''))
      : [];
    renderNews(sortedItems);
  } catch (error) {
    console.error('Failed to load news:', error);
    newsList.innerHTML = `
      <div class="news-item">
        <span class="news-date">Error</span>
        <div class="news-body">
          <p>Could not load news.json. Please verify the file exists and can be accessed by the local server.</p>
        </div>
      </div>
    `;
  }
}

function renderPublications(entries) {
  if (!pubList) return;
  const limit = Number(pubList.dataset.limit || '0');
  const visibleEntries = limit > 0 ? entries.slice(0, limit) : entries;

  if (!visibleEntries.length) {
    pubList.innerHTML = `
      <div class="pub-card">
        <p class="pub-venue">No publications found in publications.bib.</p>
      </div>
    `;
    return;
  }

  pubList.innerHTML = visibleEntries.map(entry => {
    const linkHtml = entry.url
      ? `<p class="pub-venue"><a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener">View publication</a></p>`
      : '';

    const topicsHtml = entry.topics.length
      ? `<div class="pub-topics">${entry.topics
          .map(topic => `<span class="pub-topic">${escapeHtml(topic)}</span>`)
          .join('')}</div>`
      : '';

    const abstractHtml = entry.abstract
      ? `<p class="pub-abstract">${escapeHtml(entry.abstract)}</p>`
      : '';

    const venueText = [entry.venue, entry.year].filter(Boolean).join(' · ');

    return `
      <div class="pub-card">
        <div class="pub-meta">
          <span class="pub-badge pub-badge-year">${escapeHtml(entry.year)}</span>
          <span class="pub-badge pub-badge-proc">${escapeHtml(publicationTypeLabel(entry.type))}</span>
        </div>
        <h3 class="pub-title">${escapeHtml(entry.title)}</h3>
        ${entry.authors ? `<p class="pub-authors">${escapeHtml(entry.authors)}</p>` : ''}
        ${venueText ? `<p class="pub-venue">${escapeHtml(venueText)}</p>` : ''}
        ${abstractHtml}
        ${linkHtml}
        ${topicsHtml}
      </div>
    `;
  }).join('');
}

async function loadPublications() {
  if (!pubList) return;

  try {
    const response = await fetch('./publications.bib', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load publications.bib (${response.status})`);
    }

    const bibContent = await response.text();
    const entries = parseBibTex(bibContent);
    renderPublications(entries);
  } catch (error) {
    console.error('Failed to load publications:', error);
    pubList.innerHTML = `
      <div class="pub-card">
        <p class="pub-venue">Could not load publications.bib. Please verify the file exists and can be accessed by the local server.</p>
      </div>
    `;
  }
}

loadPublications();
loadNews();
