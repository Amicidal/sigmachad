import Graph from 'graphology';
import Sigma from 'sigma';
import forceAtlas2 from 'graphology-layout-forceatlas2';

type Entity = { id: string; type?: string; name?: string; path?: string };
type Relationship = { id?: string; fromEntityId: string; toEntityId: string; type?: string };

const API_BASE = `${location.origin}/api/v1`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, any> = {}, children: (HTMLElement | string)[] = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v; else if (k === 'style') e.setAttribute('style', v); else e.setAttribute(k, String(v));
  }
  for (const c of children) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return e;
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function getSelectedEdgeTypes(): string[] {
  const sel = document.getElementById('edge-types') as HTMLSelectElement | null;
  if (!sel) return [];
  return Array.from(sel.selectedOptions).map((o) => o.value);
}

function getSelectedEdgeDirection(): 'both' | 'outgoing' | 'incoming' {
  const radios = document.getElementsByName('edge-direction') as NodeListOf<HTMLInputElement>;
  for (const r of Array.from(radios)) if (r.checked) return (r.value as any) || 'both';
  return 'both';
}

function getSelectedNodeTypes(): string[] {
  const sel = document.getElementById('node-types') as HTMLSelectElement | null;
  if (!sel) return [];
  return Array.from(sel.selectedOptions).map((o) => o.value);
}

function toNode(e: Entity) {
  const id = e.id;
  const label = (e as any).name || (e as any).path || e.id;
  const rawType = (e as any).type || 'entity';
  const kind = (e as any).kind;
  // Symbols are specialized by kind (function, class, interface, ...)
  const entityType = rawType === 'symbol' && typeof kind === 'string' ? kind : rawType;
  return { id, label, entityType } as any;
}

function toEdge(r: Relationship) {
  return { id: r.id || `${r.fromEntityId}->${r.toEntityId}` , source: r.fromEntityId, target: r.toEntityId, type: (r as any).type } as any;
}

async function fetchSubgraph(limit = 2000, typeFilter = ''): Promise<{ nodes: Entity[]; edges: Relationship[] }> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (typeFilter) params.set('type', typeFilter);
  const data = await getJSON<any>(`${API_BASE}/graph/subgraph?${params.toString()}`);
  if (data && data.success) return data.data;
  return data;
}

async function fetchNeighbors(id: string, limit = 1000): Promise<{ nodes: Entity[]; edges: Relationship[] }> {
  const params = new URLSearchParams();
  params.set('id', id);
  params.set('limit', String(limit));
  const data = await getJSON<any>(`${API_BASE}/graph/neighbors?${params.toString()}`);
  if (data && data.success) return data.data;
  return data;
}

function nodeColor(entityType?: string) {
  if (entityType === 'symbol' || entityType === 'function') return '#7aa2f7';
  if (entityType === 'class' || entityType === 'interface') return '#9ece6a';
  if (entityType === 'file' || entityType === 'module' || entityType === 'directory') return '#f7768e';
  if (entityType === 'documentation') return '#c678dd';
  if (entityType === 'spec') return '#e5c07b';
  if (entityType === 'test') return '#56b6c2';
  return '#3b4066';
}

function nodeSize(entityType?: string) {
  if (entityType === 'file' || entityType === 'directory' || entityType === 'module') return 4.5;
  if (entityType === 'class' || entityType === 'interface') return 4.0;
  if (entityType === 'function' || entityType === 'symbol') return 3.5;
  if (entityType === 'test' || entityType === 'spec') return 3.2;
  if (entityType === 'documentation') return 3.0;
  return 2.8;
}

function nodeLabelPrefix(entityType?: string) {
  if (entityType === 'file') return '📄 ';
  if (entityType === 'directory' || entityType === 'module') return '🗂️ ';
  if (entityType === 'function' || entityType === 'symbol') return 'ƒ ';
  if (entityType === 'class' || entityType === 'interface') return 'Ⓒ ';
  if (entityType === 'test' || entityType === 'spec') return '🧪 ';
  if (entityType === 'documentation') return '📘 ';
  return '';
}

// Edge styling helpers
function edgeColor(relType?: string) {
  switch (relType) {
    case 'CONTAINS': return '#8a8fae';
    case 'DEFINES': return '#8b5cf6';
    case 'IMPORTS': return '#f59e0b';
    case 'EXPORTS': return '#a78bfa';
    case 'CALLS': return '#38bdf8';
    case 'REFERENCES': return '#22d3ee';
    case 'IMPLEMENTS': return '#34d399';
    case 'EXTENDS': return '#a3e635';
    case 'DEPENDS_ON': return '#ec4899';
    case 'TESTS': return '#facc15';
    case 'VALIDATES': return '#fbbf24';
    case 'DOCUMENTED_BY': return '#c084fc';
    case 'DESCRIBES_DOMAIN': return '#8b5cf6';
    case 'BELONGS_TO_DOMAIN': return '#6366f1';
    default: return '#5865a0';
  }
}

function edgeWidth(relType?: string) {
  switch (relType) {
    case 'CALLS':
    case 'IMPLEMENTS':
    case 'EXTENDS':
    case 'DEPENDS_ON':
      return 1.2;
    case 'IMPORTS':
    case 'EXPORTS':
    case 'REFERENCES':
      return 1.0;
    default:
      return 0.9;
  }
}

function edgeProgramType(_relType?: string) {
  // Use directed arrows for clarity across types
  return 'arrow';
}

function buildUI() {
  const root = document.getElementById('app')!;
  const toolbar = el('div', { class: 'toolbar', style: 'display:flex;gap:8px;align-items:center;padding:10px;background:#171a2b;border-bottom:1px solid #252941;color:#e6e8ef;flex-wrap:wrap' }, [
    el('input', { id: 'search', placeholder: 'Filter by name/type…', style: 'background:#0e1120;color:#e6e8ef;border:1px solid #252941;border-radius:6px;padding:8px 10px;min-width:240px' }),
    el('label', {}, [ 'limit ', el('input', { id: 'limit', type: 'number', min: '500', max: '5000', step: '100', value: '2000', style: 'width:90px;background:#0e1120;color:#e6e8ef;border:1px solid #252941;border-radius:6px;padding:6px 8px' }) ]),
    el('label', {}, [ el('input', { id: 'edges', type: 'checkbox', checked: 'true' }), ' Show edges' ]),
    el('label', { style: 'display:flex;gap:6px;align-items:center' }, [
      'Direction',
      (() => {
        const wrap = el('span');
        const mk = (val: string, text: string, checked = false) => {
          const id = `edge-dir-${val}`;
          const input = el('input', { type: 'radio', name: 'edge-direction', id, value: val, checked: checked ? 'true' : undefined });
          const lbl = el('label', { for: id, style: 'margin-right:8px' }, [text]);
          wrap.appendChild(input);
          wrap.appendChild(lbl);
        };
        mk('both', 'Both', true);
        mk('outgoing', 'Outgoing');
        mk('incoming', 'Incoming');
        return wrap;
      })()
    ]),
    el('label', { style: 'display:flex;gap:6px;align-items:center' }, [
      'Node types',
      (() => {
        const select = el('select', { id: 'node-types', multiple: 'true', size: '5', style: 'background:#0e1120;color:#e6e8ef;border:1px solid #252941;border-radius:6px;padding:6px 8px' });
        const opts = [
          'directory','module','file','function','class','interface','symbol','test','documentation'
        ];
        for (const v of opts) {
          const o = document.createElement('option');
          o.value = v; o.textContent = v;
          o.selected = true; // default to all selected
          (select as any).appendChild(o);
        }
        return select as unknown as HTMLElement;
      })()
    ]),
    el('label', { style: 'display:flex;gap:6px;align-items:center' }, [
      'Edge types',
      (() => {
        const select = el('select', { id: 'edge-types', multiple: 'true', size: '4', style: 'background:#0e1120;color:#e6e8ef;border:1px solid #252941;border-radius:6px;padding:6px 8px' });
        const opts = [
          'CONTAINS','IMPORTS','EXPORTS','DEFINES',
          'CALLS','REFERENCES','IMPLEMENTS','EXTENDS','DEPENDS_ON',
          'TESTS','VALIDATES',
          'DOCUMENTED_BY','DESCRIBES_DOMAIN','BELONGS_TO_DOMAIN',
        ];
        for (const v of opts) {
          const o = document.createElement('option');
          o.value = v; o.textContent = v;
          // Preselect the most common ones
          if (['CONTAINS','IMPORTS','CALLS','REFERENCES','IMPLEMENTS','EXTENDS','DEPENDS_ON','TESTS'].includes(v)) o.selected = true;
          (select as any).appendChild(o);
        }
        return select as unknown as HTMLElement;
      })()
    ]),
    el('button', { id: 'reload', style: 'background:#232744;color:#e6e8ef;border:1px solid #2b3054;border-radius:6px;padding:8px 12px;cursor:pointer' }, ['Reload']),
    el('button', { id: 'reset', style: 'background:#232744;color:#e6e8ef;border:1px solid #2b3054;border-radius:6px;padding:8px 12px;cursor:pointer' }, ['Reset view']),
    // KG query controls
    el('label', { style: 'display:flex;gap:6px;align-items:center' }, [
      'KG Query',
      el('input', { id: 'kg-query', placeholder: 'functionOrSymbolName', style: 'background:#0e1120;color:#e6e8ef;border:1px solid #252941;border-radius:6px;padding:6px 8px;min-width:200px' }),
      (() => {
        const select = el('select', { id: 'kg-mode', style: 'background:#0e1120;color:#e6e8ef;border:1px solid #252941;border-radius:6px;padding:6px 8px' });
        const opts = [
          ['files-importing-function', 'Files that import this function'],
          ['functions-depending-on-function', 'Functions that depend on this function'],
        ];
        for (const [v, t] of opts) {
          const o = document.createElement('option'); o.value = v; o.textContent = t; (select as any).appendChild(o);
        }
        return select as unknown as HTMLElement;
      })(),
      el('button', { id: 'kg-run', style: 'background:#2b3054;color:#e6e8ef;border:1px solid #2b3054;border-radius:6px;padding:6px 10px;cursor:pointer' }, ['Run'])
    ]),
    el('div', { id: 'counts', style: 'margin-left:auto;color:#99a1b3;font-size:12px' }, ['0 nodes • 0 edges']),
    el('div', { id: 'legend', style: 'display:flex;gap:10px;align-items:center;color:#99a1b3;font-size:12px' }, [])
  ]);
  const container = el('div', { style: 'display:flex;width:100%;height:calc(100vh - 52px);background:#0f1220' }, []);
  const sidebar = el('div', { id: 'sidebar', style: 'width:0;overflow:auto;transition:width 0.2s ease;background:#0e1120;border-right:1px solid #252941' }, []);
  const viewport = el('div', { id: 'viewport', style: 'position:relative;flex:1;height:100%' }, []);
  const toggleWrap = el('div', { style: 'display:flex;gap:6px;align-items:center' }, [
    el('button', { id: 'view-graph', style: 'background:#2b3054;color:#e6e8ef;border:1px solid #2b3054;border-radius:6px;padding:6px 10px;cursor:pointer' }, ['Graph']),
    el('button', { id: 'view-tree', style: 'background:#232744;color:#e6e8ef;border:1px solid #2b3054;border-radius:6px;padding:6px 10px;cursor:pointer' }, ['Tree'])
  ]);
  toolbar.insertBefore(toggleWrap, toolbar.firstChild);
  container.appendChild(sidebar);
  container.appendChild(viewport);
  root.appendChild(toolbar);
  root.appendChild(container);
  return { toolbar, viewport, sidebar };
}

async function main() {
  const { viewport, sidebar } = buildUI();
  // Populate legend
  const legend = document.getElementById('legend');
  if (legend) {
    const items: Array<[string, string]> = [
      ['file', '#f7768e'],
      ['directory/module', '#f7768e'],
      ['function/symbol', '#7aa2f7'],
      ['class/interface', '#9ece6a'],
      ['test/spec', '#56b6c2'],
      ['documentation', '#c678dd'],
    ];
    for (const [label, color] of items) {
      const dot = el('span', { style: `display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px` }, []);
      const item = el('span', { style: 'display:inline-flex;align-items:center;margin-right:10px' }, [dot, label]);
      legend.appendChild(item);
    }
  }
  const graph = new Graph();
  const renderer = new Sigma(graph, viewport as HTMLElement, {
    renderEdgeLabels: false,
    allowInvalidContainer: false,
    defaultNodeColor: '#3b4066',
    defaultEdgeColor: '#3a3e60',
  });

  async function loadInitial() {
    const limit = parseInt((document.getElementById('limit') as HTMLInputElement).value || '2000', 10);
    const showEdges = (document.getElementById('edges') as HTMLInputElement).checked;
    const { nodes, edges } = await fetchSubgraph(limit);
    graph.clear();
    const selectedNodeTypes = getSelectedNodeTypes();
    for (const e of nodes) {
      const n = toNode(e);
      if (!n.id) continue;
      if (selectedNodeTypes.length && !selectedNodeTypes.includes(n.entityType)) continue;
      // Provide initial positions so Sigma can render without errors
      graph.addNode(n.id, {
        label: `${nodeLabelPrefix(n.entityType)}${n.label}`,
        entityType: n.entityType,
        // Explicitly use Sigma's default node program
        type: 'circle',
        color: nodeColor(n.entityType),
        x: Math.random(),
        y: Math.random(),
        size: nodeSize(n.entityType) + Math.random() * 1.5,
      });
    }
    const selectedEdgeTypes = getSelectedEdgeTypes();

    if (showEdges) {
      for (const r of edges) {
        const ed = toEdge(r) as any;
        if (selectedEdgeTypes.length && ed.type && !selectedEdgeTypes.includes(String(ed.type))) continue;
        if (graph.hasNode(ed.source) && graph.hasNode(ed.target)) {
          const id = ed.id || `${ed.source}->${ed.target}`;
          if (!graph.hasEdge(id)) graph.addEdge(id, ed.source, ed.target, { size: edgeWidth(ed.type), color: edgeColor(ed.type), type: edgeProgramType(ed.type) } as any);
        }
      }
    }
    // Optionally refine positions with FA2
    try {
      const settings = forceAtlas2.inferSettings(graph);
      forceAtlas2.assign(graph, { iterations: 200, settings: { ...settings, slowDown: 10 } });
    } catch {}
    updateCounts();
  }

  async function kgSearch(query: string): Promise<any[]> {
    const res = await fetch(`${API_BASE.replace('/api/v1', '/api')}/graph/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, searchType: 'structural', entityTypes: ['symbol'], limit: 25 }),
    });
    if (!res.ok) throw new Error(`search HTTP ${res.status}`);
    const json = await res.json();
    return json?.data?.entities || [];
  }

  async function getEntityById(id: string): Promise<any | null> {
    const res = await fetch(`${API_BASE}/graph/entity/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  }

  async function listRelationships(params: { fromEntity?: string; toEntity?: string; type?: string; limit?: number; offset?: number }): Promise<any[]> {
    const qs = new URLSearchParams();
    if (params.fromEntity) qs.set('fromEntity', params.fromEntity);
    if (params.toEntity) qs.set('toEntity', params.toEntity);
    if (params.type) qs.set('type', params.type);
    if (params.limit != null) qs.set('limit', String(params.limit));
    if (params.offset != null) qs.set('offset', String(params.offset));
    const res = await fetch(`${API_BASE}/graph/relationships?${qs.toString()}`);
    if (!res.ok) throw new Error(`relationships HTTP ${res.status}`);
    const json = await res.json();
    return json?.data || [];
  }

  async function runKgQuery() {
    const q = (document.getElementById('kg-query') as HTMLInputElement).value.trim();
    const mode = (document.getElementById('kg-mode') as HTMLSelectElement).value;
    if (!q) return;
    // Find candidate function symbol by name
    const results = await kgSearch(q);
    const func = results.find((e: any) => e.type === 'symbol' && (e.kind === 'function' || e.entityType === 'function'))
      || results[0];
    if (!func) {
      alert('No matching symbol found');
      return;
    }

    // Center target node in graph
    const target = toNode(func as any);
    if (!graph.hasNode(target.id)) {
      graph.addNode(target.id, {
        label: `${nodeLabelPrefix(target.entityType)}${target.label}`,
        entityType: target.entityType,
        type: 'circle',
        color: nodeColor(target.entityType),
        x: Math.random(), y: Math.random(), size: nodeSize(target.entityType) + 1,
      });
    }

    const selectedNodeTypes = getSelectedNodeTypes();
    const selectedEdgeTypes = getSelectedEdgeTypes();

    if (mode === 'files-importing-function') {
      // files that IMPORTS -> func
      const rels = await listRelationships({ toEntity: func.id, type: 'IMPORTS', limit: 1000 });
      for (const r of rels) {
        const from = await getEntityById(r.fromEntityId);
        if (!from || from.type !== 'file') continue;
        const n = toNode(from);
        if (selectedNodeTypes.length && !selectedNodeTypes.includes(n.entityType)) continue;
        if (!graph.hasNode(n.id)) {
          graph.addNode(n.id, { label: `${nodeLabelPrefix(n.entityType)}${n.label}`, entityType: n.entityType, type: 'circle', color: nodeColor(n.entityType), x: Math.random(), y: Math.random(), size: nodeSize(n.entityType) });
        }
        const ed = { id: r.id || `${r.fromEntityId}->${r.toEntityId}`, source: r.fromEntityId, target: r.toEntityId, type: 'IMPORTS' } as any;
        if (selectedEdgeTypes.length && !selectedEdgeTypes.includes('IMPORTS')) continue;
        if (!graph.hasEdge(ed.id) && graph.hasNode(ed.source) && graph.hasNode(ed.target)) {
          graph.addEdge(ed.id, ed.source, ed.target, { size: edgeWidth(ed.type), color: edgeColor(ed.type), type: edgeProgramType(ed.type) } as any);
        }
      }
    } else if (mode === 'functions-depending-on-function') {
      // functions that CALLS/DEPENDS_ON/REFERENCES -> func
      const types = ['CALLS','DEPENDS_ON','REFERENCES'];
      for (const t of types) {
        const rels = await listRelationships({ toEntity: func.id, type: t, limit: 1000 });
        for (const r of rels) {
          const from = await getEntityById(r.fromEntityId);
          if (!from || from.type !== 'symbol' || !['function'].includes((from as any).kind)) continue;
          const n = toNode(from);
          if (selectedNodeTypes.length && !selectedNodeTypes.includes(n.entityType)) continue;
          if (!graph.hasNode(n.id)) {
            graph.addNode(n.id, { label: `${nodeLabelPrefix(n.entityType)}${n.label}`, entityType: n.entityType, type: 'circle', color: nodeColor(n.entityType), x: Math.random(), y: Math.random(), size: nodeSize(n.entityType) });
          }
          const ed = { id: r.id || `${r.fromEntityId}->${r.toEntityId}`, source: r.fromEntityId, target: r.toEntityId, type: t } as any;
          if (selectedEdgeTypes.length && !selectedEdgeTypes.includes(t)) continue;
          if (!graph.hasEdge(ed.id) && graph.hasNode(ed.source) && graph.hasNode(ed.target)) {
            graph.addEdge(ed.id, ed.source, ed.target, { size: edgeWidth(ed.type), color: edgeColor(ed.type), type: edgeProgramType(ed.type) } as any);
          }
        }
      }
    }

    try { renderer.getCamera().animate(graph.getNodeAttributes(target.id), { duration: 600 }); } catch {}
    updateCounts();
  }

  // Build hierarchical tree from directories and files
  type TreeNode = { name: string; path: string; type: 'directory' | 'module' | 'file'; children?: TreeNode[]; entityId?: string };
  function buildTree(nodes: any[]): TreeNode {
    const root: TreeNode = { name: '/', path: '/', type: 'directory', children: [] };

    const dirMap = new Map<string, TreeNode>();
    dirMap.set('/', root);
    const fileSet = new Set<string>();

    const normPath = (p: string): string => {
      if (!p) return '/';
      let s = String(p).replace(/\\/g, '/');
      s = s.replace(/\/+/g, '/');
      s = s.replace(/\/+$/g, '');
      if (!s.startsWith('/')) s = '/' + s;
      if (s === '') s = '/';
      return s;
    };

    const join = (a: string, b: string) => normPath((a === '/' ? '' : a) + '/' + b);

    const ensureDir = (dirPath: string): TreeNode => {
      const np = normPath(dirPath);
      const cached = dirMap.get(np);
      if (cached) return cached;
      const parentPath = np === '/' ? null : np.substring(0, np.lastIndexOf('/')) || '/';
      const parent = parentPath ? ensureDir(parentPath) : root;
      const name = np === '/' ? '/' : np.substring(np.lastIndexOf('/') + 1);
      const node: TreeNode = { name, path: np, type: 'directory', children: [] };
      if (!parent.children) parent.children = [];
      // Prevent duplicate folder entries under the same parent
      const existing = parent.children.find((c) => c.type !== 'file' && c.name === name);
      if (existing) {
        dirMap.set(np, existing);
        return existing;
      }
      parent.children.push(node);
      dirMap.set(np, node);
      return node;
    };

    for (const n of nodes) {
      if (!n || !n.type) continue;
      const t = String(n.type);
      const pRaw = (n as any).path as string | undefined;
      const p = pRaw ? normPath(pRaw) : '';
      if (t === 'directory' || t === 'module') {
        ensureDir(p || '/');
      } else if (t === 'file') {
        if (!p || p === '/') continue; // skip files without a concrete path
        if (fileSet.has(p)) continue; // dedupe by full path
        fileSet.add(p);
        const dirPath = p.substring(0, p.lastIndexOf('/')) || '/';
        const dir = ensureDir(dirPath);
        if (dir) {
          if (!dir.children) dir.children = [];
          const name = p.substring(p.lastIndexOf('/') + 1);
          // Avoid duplicate file names under same folder
          const exists = dir.children.some((c) => c.type === 'file' && c.path === p);
          if (!exists) dir.children.push({ name, path: p, type: 'file', entityId: (n as any).id });
        }
      }
    }
    // Sort children: directories first, then files, then name
    const sortRec = (node: TreeNode) => {
      if (!node.children) return;
      node.children.sort((a, b) => (a.type === 'file' ? 1 : 0) - (b.type === 'file' ? 1 : 0) || a.name.localeCompare(b.name));
      node.children.forEach(sortRec);
    };
    sortRec(root);
    return root;
  }

  async function loadTree() {
    // Fetch only directories and files to build the tree
    const limit = 5000;
    const dirData = await fetchSubgraph(limit, 'directory');
    const fileData = await fetchSubgraph(limit, 'file');
    const nodes = [...(dirData.nodes || []), ...(fileData.nodes || [])];
    const tree = buildTree(nodes);
    renderTree(tree);
  }

  function renderTree(tree: any) {
    sidebar.innerHTML = '';
    sidebar.style.width = '340px';
    const wrap = el('div', { style: 'padding:8px 10px;color:#e6e8ef;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial' }, []);
    const title = el('div', { style: 'font-size:12px;color:#99a1b3;margin-bottom:8px' }, ['Project Tree']);
    const list = el('div', { }, []);
    wrap.appendChild(title);
    wrap.appendChild(list);
    sidebar.appendChild(wrap);

    const renderNode = (node: any, container: HTMLElement, depth = 0) => {
      const row = el('div', { style: `padding:3px 6px;cursor:pointer;display:flex;align-items:center;gap:6px;` }, []);
      const indent = el('span', { style: `display:inline-block;width:${depth * 12}px` }, []);
      const isDir = node.type !== 'file';
      const icon = isDir ? '📁' : '📄';
      const caret = isDir ? el('span', { style: 'display:inline-block;width:10px;color:#99a1b3' }, ['▸']) : el('span', { style: 'display:inline-block;width:10px' }, []);
      const label = el('span', { style: 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px' }, [node.name || node.path || node.id]);
      row.appendChild(indent);
      row.appendChild(caret);
      row.appendChild(el('span', { }, [icon]));
      row.appendChild(label);
      container.appendChild(row);

      let expanded = false;
      let childrenWrap: HTMLElement | null = null;
      const toggle = async () => {
        if (!isDir) {
          // On file click: ensure node exists in graph and focus it
          const fileId = node.entityId;
          if (fileId && !graph.hasNode(fileId)) {
            try {
              const { nodes, edges } = await fetchNeighbors(fileId, 1000);
              let added = false;
              const selectedNodeTypes = getSelectedNodeTypes();
              for (const e of nodes) {
                if (!graph.hasNode(e.id)) {
                  const nn = toNode(e);
                  if (selectedNodeTypes.length && !selectedNodeTypes.includes(nn.entityType)) continue;
                  graph.addNode(nn.id, {
                    label: `${nodeLabelPrefix((nn as any).entityType)}${nn.label}`,
                    entityType: (nn as any).entityType,
                    type: 'circle',
                    color: nodeColor((nn as any).entityType),
                    x: Math.random(),
                    y: Math.random(),
                    size: nodeSize((nn as any).entityType) + Math.random() * 1.5,
                  });
                  added = true;
                }
              }
              const selectedEdgeTypes = getSelectedEdgeTypes();
              const edgeDir = getSelectedEdgeDirection();
              for (const r of edges) {
                const ed = toEdge(r) as any;
                if (selectedEdgeTypes.length && ed.type && !selectedEdgeTypes.includes(String(ed.type))) continue;
                if (edgeDir === 'outgoing' && ed.source !== fileId) continue;
                if (edgeDir === 'incoming' && ed.target !== fileId) continue;
                if (graph.hasNode(ed.source) && graph.hasNode(ed.target)) {
                  const id = ed.id || `${ed.source}->${ed.target}`;
                  if (!graph.hasEdge(id)) graph.addEdge(id, ed.source, ed.target, { size: edgeWidth(ed.type), color: edgeColor(ed.type), type: edgeProgramType(ed.type) } as any);
                }
              }
              if (added) {
                try { const settings = forceAtlas2.inferSettings(graph); forceAtlas2.assign(graph, { iterations: 80, settings: { ...settings, slowDown: 10 } }); } catch {}
              }
            } catch {}
          }
          if (fileId) {
            try { renderer.getCamera().animate(graph.getNodeAttributes(fileId), { duration: 600 }); } catch {}
          }
          return;
        }
        expanded = !expanded;
        caret.textContent = expanded ? '▾' : '▸';
        if (expanded) {
          childrenWrap = el('div', {}, []);
          container.appendChild(childrenWrap);
          for (const child of node.children || []) renderNode(child, childrenWrap, depth + 1);
        } else {
          if (childrenWrap && childrenWrap.parentElement) childrenWrap.parentElement.removeChild(childrenWrap);
          childrenWrap = null;
        }
      };
      row.onclick = toggle;
    };

    // Render top-level children
    for (const child of tree.children || []) renderNode(child, list, 0);
  }

  function updateCounts() {
    const counts = document.getElementById('counts')!;
    counts.textContent = `${graph.order} nodes • ${graph.size} edges`;
  }

  renderer.on('clickNode', async ({ node }) => {
    // Expand neighbors
    try {
      const { nodes, edges } = await fetchNeighbors(node, 1000);
      let added = false;
      const selectedNodeTypes = getSelectedNodeTypes();
      for (const e of nodes) {
        if (!graph.hasNode(e.id)) {
          const n = toNode(e);
          if (selectedNodeTypes.length && !selectedNodeTypes.includes(n.entityType)) continue;
          graph.addNode(n.id, {
            label: `${nodeLabelPrefix(n.entityType)}${n.label}`,
            entityType: n.entityType,
            type: 'circle',
            color: nodeColor(n.entityType),
            x: Math.random(),
            y: Math.random(),
            size: nodeSize(n.entityType) + Math.random() * 1.5,
          });
          added = true;
        }
      }
      const showEdges = (document.getElementById('edges') as HTMLInputElement).checked;
      const selectedEdgeTypes = getSelectedEdgeTypes();
      const edgeDir = getSelectedEdgeDirection();
      if (showEdges) {
        for (const r of edges) {
          const ed = toEdge(r) as any;
          if (selectedEdgeTypes.length && ed.type && !selectedEdgeTypes.includes(String(ed.type))) continue;
          if (edgeDir === 'outgoing' && ed.source !== node) continue;
          if (edgeDir === 'incoming' && ed.target !== node) continue;
          if (graph.hasNode(ed.source) && graph.hasNode(ed.target)) {
            const id = ed.id || `${ed.source}->${ed.target}`;
            if (!graph.hasEdge(id)) graph.addEdge(id, ed.source, ed.target, { size: edgeWidth(ed.type), color: edgeColor(ed.type), type: edgeProgramType(ed.type) } as any);
          }
        }
      }
      if (added) {
        try { const settings = forceAtlas2.inferSettings(graph); forceAtlas2.assign(graph, { iterations: 80, settings: { ...settings, slowDown: 10 } }); } catch {}
      }
      updateCounts();
    } catch (e) { console.error('expand failed', e); }
  });

  // Wire controls
  (document.getElementById('reload') as HTMLButtonElement).onclick = loadInitial;
  (document.getElementById('reset') as HTMLButtonElement).onclick = () => renderer.getCamera().animatedReset();
  (document.getElementById('edges') as HTMLInputElement).onchange = loadInitial;
  (document.getElementById('edge-types') as HTMLSelectElement).onchange = loadInitial;
  const dirRadios = document.getElementsByName('edge-direction') as NodeListOf<HTMLInputElement>;
  Array.from(dirRadios).forEach((r) => (r.onchange = loadInitial));
  (document.getElementById('node-types') as HTMLSelectElement).onchange = loadInitial;
  (document.getElementById('limit') as HTMLInputElement).onchange = loadInitial;
  (document.getElementById('search') as HTMLInputElement).oninput = () => {
    const term = ((document.getElementById('search') as HTMLInputElement).value || '').toLowerCase();
    graph.forEachNode((key, attrs) => {
      const label = String(attrs.label || '').toLowerCase();
      const entityType = String((attrs as any).entityType || '').toLowerCase();
      graph.setNodeAttribute(key, 'hidden', !!term && !(label.includes(term) || entityType.includes(term)));
    });
  };

  // KG query run
  (document.getElementById('kg-run') as HTMLButtonElement).onclick = async () => {
    try {
      await runKgQuery();
    } catch (e) {
      alert(`KG query failed: ${e}`);
    }
  };

  // View toggles
  (document.getElementById('view-tree') as HTMLButtonElement).onclick = async () => {
    await loadTree();
  };
  (document.getElementById('view-graph') as HTMLButtonElement).onclick = () => {
    sidebar.style.width = '0';
  };

  // Initial
  await loadInitial();
}

main().catch((e) => {
  const root = document.getElementById('app')!;
  root.textContent = `Failed to load graph viewer: ${e?.message || e}`;
});
