const express = require('express');
const morgan  = require('morgan');
const path    = require('path');

const app = express();

// ── Security headers (patch: CSP prevents inline script execution) ────────────
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src https://fonts.gstatic.com; img-src 'self' data:;"
  );
  next();
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// ── View engine ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── In-memory article dataset ─────────────────────────────────────────────────
const ARTICLES = [
  {
    id: 1, category: 'Technology',
    title: 'The Rise of AI-Powered Cybersecurity Tools',
    summary: 'How machine learning is being used to detect zero-day exploits and reduce false positive rates in enterprise security stacks.',
    author: 'Alex Chen', date: '2024-11-15', readTime: 6,
    tags: ['AI', 'security', 'machine-learning'],
  },
  {
    id: 2, category: 'Technology',
    title: 'WebAssembly Is Changing the Browser Security Model',
    summary: 'WASM modules introduce new attack surfaces — sandboxing, memory isolation and the future of browser-based code execution.',
    author: 'Maria Santos', date: '2024-11-12', readTime: 8,
    tags: ['webassembly', 'browser', 'security'],
  },
  {
    id: 3, category: 'Security',
    title: 'Understanding Cross-Site Scripting: From XSS-1 to Modern Bypasses',
    summary: 'A deep-dive into the evolution of XSS attacks, from naive script injection to CSP bypasses and mutation-based payloads.',
    author: 'James Okafor', date: '2024-11-10', readTime: 12,
    tags: ['xss', 'security', 'exploit'],
  },
  {
    id: 4, category: 'Security',
    title: 'Patch Validation in the Era of LLM-Assisted Development',
    summary: 'As AI tools write more security patches, automated regression testing frameworks are becoming critical for validating fixes.',
    author: 'Priya Nair', date: '2024-11-08', readTime: 7,
    tags: ['patch', 'llm', 'security'],
  },
  {
    id: 5, category: 'Research',
    title: 'CVE-2024-47764: Express Cookie Injection — A Case Study',
    summary: 'How a seemingly minor issue in Express cookie handling became a full reflected XSS vector across thousands of applications.',
    author: 'Alex Chen', date: '2024-11-05', readTime: 9,
    tags: ['cve', 'express', 'xss'],
  },
  {
    id: 6, category: 'Research',
    title: 'Automated Vulnerability Revalidation: State of the Art',
    summary: 'Survey of tools and techniques for automatically confirming that security patches actually prevent the reported exploit.',
    author: 'Riya Perera', date: '2024-11-02', readTime: 11,
    tags: ['automation', 'security', 'patch'],
  },
  {
    id: 7, category: 'Technology',
    title: 'Node.js 22: What Changed for Security-Conscious Developers',
    summary: 'Permission model, Maglev JIT compiler security implications, and breaking changes to the crypto API in the latest LTS.',
    author: 'James Okafor', date: '2024-10-28', readTime: 5,
    tags: ['nodejs', 'security'],
  },
  {
    id: 8, category: 'Security',
    title: 'Content Security Policy: A Field Guide to Real-World Bypass Techniques',
    summary: 'CSP is not a silver bullet. This article catalogues the most reliable bypass techniques found in bug bounty programmes.',
    author: 'Maria Santos', date: '2024-10-25', readTime: 14,
    tags: ['csp', 'xss', 'bypass'],
  },
];

const CATEGORIES = ['All', 'Technology', 'Security', 'Research'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function searchArticles(query, category) {
  const q = (query || '').toLowerCase().trim();
  return ARTICLES.filter(a => {
    const matchCat  = !category || category === 'All' || a.category === category;
    const matchText = !q ||
      a.title.toLowerCase().includes(q)   ||
      a.summary.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q));
    return matchCat && matchText;
  });
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Home → redirect to /search
app.get('/', (req, res) => res.redirect('/search'));

// ─── VULNERABLE SEARCH ENDPOINT ──────────────────────────────────────────────
// SECURITY FLAW: query is passed to the template as-is and rendered with <%- %>
// (raw unescaped output). This allows Reflected XSS via the ?q= parameter.
// This is the sink that AVRE detects.
app.get('/search', (req, res) => {
  const query    = req.query.q || '';           // ← user-controlled, unsanitised
  const category = req.query.cat || 'All';
  const results  = searchArticles(query, category);

  res.render('search', {
    query,          // ← passed raw into template → rendered with <%- query %>
    category,
    results,
    categories: CATEGORIES,
    totalResults: results.length,
  });
});

// ─── Article detail page ──────────────────────────────────────────────────────
app.get('/article/:id', (req, res) => {
  const article = ARTICLES.find(a => a.id === parseInt(req.params.id));
  if (!article) return res.redirect('/search');
  const related = ARTICLES.filter(a => a.id !== article.id && a.category === article.category).slice(0, 2);
  res.render('article', { article, related });
});

// ─── API endpoint — used by the search suggestions dropdown ──────────────────
app.get('/api/suggest', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (q.length < 2) return res.json([]);
  const tags = [...new Set(ARTICLES.flatMap(a => a.tags))];
  const matches = tags.filter(t => t.includes(q)).slice(0, 5);
  res.json(matches);
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Modern Search (AVRE target) running on http://localhost:${PORT}`);
  console.log(`[VULN] XSS sink: GET /search?q=<payload>`);
});
