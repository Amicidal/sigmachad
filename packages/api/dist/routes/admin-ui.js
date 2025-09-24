/**
 * Admin UI Route
 * Serves a self-contained HTML page for monitoring and controlling
 * admin features like sync status, pause/resume, and health.
 */
export async function registerAdminUIRoutes(app, _kgService, _dbService) {
    app.get("/admin/ui", async (_request, reply) => {
        const html = `<!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Memento Admin</title>
      <style>
        :root { --bg: #0f1220; --panel: #171a2b; --panel2: #111425; --text: #e6e8ef; --muted: #99a1b3; --ok: #9ece6a; --warn: #e0af68; --bad: #f7768e; --accent: #7aa2f7; }
        html, body { margin:0; padding:0; height:100%; background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial; }
        .layout { display: grid; grid-template-rows: auto auto 1fr; height: 100%; }
        header { padding: 12px 16px; background: var(--panel); border-bottom: 1px solid #252941; display: flex; align-items: center; justify-content: space-between; }
        header .title { font-weight: 600; }
        header .env { color: var(--muted); font-size: 12px; }
        .toolbar { padding: 10px 16px; background: var(--panel2); border-bottom: 1px solid #252941; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        button, select, input[type="number"] { background: #232744; color: var(--text); border: 1px solid #2b3054; border-radius: 6px; padding: 8px 12px; cursor: pointer; }
        button:hover { background: #2b3054; }
        button.primary { background: #2b3a6a; border-color: #2d4aa5; }
        button.primary:hover { background: #2e4b7a; }
        .content { display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; padding: 16px; min-height: 0; }
        .card { background: var(--panel); border: 1px solid #252941; border-radius: 10px; padding: 12px; min-height: 120px; }
        .card h3 { margin: 0 0 8px 0; font-size: 14px; color: var(--muted); font-weight: 600; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .kv { display: grid; grid-template-columns: auto 1fr; gap: 6px 10px; }
        .kv div { min-width: 110px; color: var(--muted); }
        .value { color: var(--text); }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; border: 1px solid #2b3054; }
        .ok { color: var(--ok); border-color: rgba(158,206,106,0.3); background: rgba(158,206,106,0.08); }
        .warn { color: var(--warn); border-color: rgba(224,175,104,0.3); background: rgba(224,175,104,0.08); }
        .bad { color: var(--bad); border-color: rgba(247,118,142,0.3); background: rgba(247,118,142,0.08); }
        pre { margin:0; padding: 10px; background: #0e1120; border: 1px solid #252941; border-radius: 8px; color: #c7cbe0; font-size: 12px; overflow: auto; max-height: 280px; }
        .row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .spacer { flex: 1; }
        .small { font-size: 12px; color: var(--muted); }
        .checkbox { display: inline-flex; align-items: center; gap: 6px; }
      </style>
    </head>
    <body>
      <div class="layout">
        <header>
          <div class="title">Memento Admin</div>
          <div class="env" id="env-info"></div>
        </header>
        <div class="toolbar">
          <button id="btn-refresh" class="primary">Refresh Status</button>
          <button id="btn-pause">Pause</button>
          <button id="btn-resume">Resume</button>
          <div class="spacer"></div>
          <div class="row">
            <label class="checkbox"><input type="checkbox" id="opt-force"> force</label>
            <label class="checkbox"><input type="checkbox" id="opt-emb"> embeddings</label>
            <label class="checkbox"><input type="checkbox" id="opt-tests"> tests</label>
            <label class="checkbox"><input type="checkbox" id="opt-sec"> security</label>
            <label>concurrency <input type="number" id="opt-conc" min="1" max="32" value="8" style="width:70px"/></label>
            <label>batch size <input type="number" id="opt-batch" min="1" max="1000" value="60" style="width:80px"/></label>
            <button id="btn-sync" class="primary">Start Full Sync</button>
            <button id="btn-tune">Apply Tuning</button>
          </div>
        </div>
        <div class="content">
          <div class="card">
            <h3>Sync Status</h3>
            <div class="grid">
              <div class="kv">
                <div>Active</div><div class="value" id="v-active">-</div>
                <div>Paused</div><div class="value" id="v-paused">-</div>
                <div>Queue</div><div class="value" id="v-queue">-</div>
                <div>Rate</div><div class="value" id="v-rate">-</div>
                <div>Latency</div><div class="value" id="v-latency">-</div>
                <div>Success</div><div class="value" id="v-success">-</div>
              </div>
              <div class="kv">
                <div>Phase</div><div class="value" id="v-phase">-</div>
                <div>Progress</div><div class="value" id="v-progress">-</div>
                <div>Errors</div><div class="value" id="v-errors">-</div>
                <div>Last Sync</div><div class="value" id="v-last">-</div>
                <div>Totals</div><div class="value" id="v-totals">-</div>
                <div>Ops</div><div class="value" id="v-ops">-</div>
                <div></div><div class="small">Polling every 3s</div>
              </div>
            </div>
            <div style="margin-top:10px">
              <pre id="status-json">{}</pre>
            </div>
          </div>
          <div class="card">
            <h3>Health</h3>
            <div class="grid">
              <div class="kv">
                <div>Overall</div><div class="value" id="h-overall">-</div>
                <div>Graph DB</div><div class="value" id="h-graph">-</div>
                <div>Vector DB</div><div class="value" id="h-vector">-</div>
              </div>
              <div class="kv">
                <div>Entities</div><div class="value" id="h-entities">-</div>
                <div>Relationships</div><div class="value" id="h-rels">-</div>
                <div>Uptime</div><div class="value" id="h-uptime">-</div>
              </div>
            </div>
            <div style="margin-top:10px"><pre id="health-json">{}</pre></div>
          </div>
        </div>
      </div>

      <script>
        const apiBase = location.origin + '/api/v1';
        const rootBase = location.origin;
        const el = (id) => document.getElementById(id);

        function fmtNum(n) { if (n == null) return '-'; return typeof n === 'number' ? (Math.round(n*100)/100) : String(n); }
        function fmtDate(d) { try { return new Date(d).toLocaleString(); } catch { return '-'; } }

        async function getJSON(url, opts) {
          const res = await fetch(url, opts);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        }

        let lastJobId = null;

        async function refreshStatus() {
          try {
            const data = await getJSON(apiBase + '/sync-status');
            const s = data?.data || data;
            el('v-active').textContent = String(!!s.isActive);
            el('v-paused').textContent = String(!!s.paused);
            el('v-queue').textContent = fmtNum(s.queueDepth);
            el('v-rate').textContent = fmtNum(s.processingRate) + '/s';
            el('v-latency').textContent = fmtNum(s.performance?.syncLatency) + ' ms';
            el('v-success').textContent = fmtNum((s.performance?.successRate||0)*100) + '%';
            el('v-errors').textContent = fmtNum(s.errors?.count);
            el('v-last').textContent = fmtDate(s.lastSync);
            const totals = s.operations?.totals || {};
            const first = (s.operations?.active || [])[0] || {};
            el('v-phase').textContent = first.phase || '-';
            el('v-progress').textContent = (first.progress != null ? Math.round((first.progress||0)*100) + '%' : '-');
            el('v-totals').textContent = totals.totalOperations != null ? JSON.stringify(totals) : '-';
            const ops = (s.operations?.active || []).length;
            el('v-ops').textContent = ops + ' active';
            // Track first active job id for tuning
            lastJobId = (s.operations?.active || [])[0]?.id || null;
            el('status-json').textContent = JSON.stringify(s, null, 2);
          } catch (e) {
            el('status-json').textContent = 'Failed to load status: ' + e.message;
          }
        }

        async function refreshHealth() {
          try {
            const data = await getJSON(apiBase + '/admin-health');
            const h = data?.data || data;
            el('h-overall').innerHTML = badge(h.overall);
            el('h-graph').textContent = h.components?.graphDatabase?.status || '-';
            el('h-vector').textContent = h.components?.vectorDatabase?.status || '-';
            el('h-entities').textContent = fmtNum(h.metrics?.totalEntities);
            el('h-rels').textContent = fmtNum(h.metrics?.totalRelationships);
            el('h-uptime').textContent = fmtNum(h.metrics?.uptime) + ' s';
            el('health-json').textContent = JSON.stringify(h, null, 2);
          } catch (e) {
            el('health-json').textContent = 'Failed to load health: ' + e.message;
          }
        }

        function badge(status) {
          const cls = status === 'healthy' ? 'ok' : (status === 'degraded' ? 'warn' : 'bad');
          return '<span class="badge ' + cls + '">' + (status || '-') + '</span>';
        }

        async function post(url, body) {
          const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
          const txt = await res.text();
          let json = null; try { json = JSON.parse(txt); } catch {}
          return { ok: res.ok, status: res.status, json, raw: txt };
        }

        // UI actions
        el('btn-refresh').addEventListener('click', () => { refreshStatus(); refreshHealth(); });
        el('btn-pause').addEventListener('click', async () => {
          let res = await post(apiBase + '/sync/pause');
          if (!(res.ok && (res.json?.success === true))) {
            res = await post(rootBase + '/sync/pause');
          }
          if (!(res.ok && (res.json?.success === true))) {
            res = await post(apiBase + '/admin/sync/pause');
          }
          if (!(res.ok && (res.json?.success === true))) {
            res = await post(rootBase + '/admin/sync/pause');
          }
          await refreshStatus();
        });
        el('btn-resume').addEventListener('click', async () => {
          let res = await post(apiBase + '/sync/resume');
          if (!(res.ok && (res.json?.success === true))) {
            res = await post(rootBase + '/sync/resume');
          }
          if (!(res.ok && (res.json?.success === true))) {
            res = await post(apiBase + '/admin/sync/resume');
          }
          if (!(res.ok && (res.json?.success === true))) {
            res = await post(rootBase + '/admin/sync/resume');
          }
          await refreshStatus();
        });
        el('btn-sync').addEventListener('click', async () => {
          const btn = el('btn-sync');
          btn.disabled = true; btn.textContent = 'Starting...';
          const payload = {
            force: el('opt-force').checked,
            includeEmbeddings: el('opt-emb').checked,
            includeTests: el('opt-tests').checked,
            includeSecurity: el('opt-sec').checked,
            maxConcurrency: Number(el('opt-conc').value) || 8,
            batchSize: Number(el('opt-batch').value) || 60
          };
          try {
            // Try versioned API
            let res = await post(apiBase + '/sync', payload);
            if (!(res.ok && res.json && res.json.success === true)) {
              // Fallback to root alias
              res = await post(rootBase + '/sync', payload);
            }
            if (!(res.ok && res.json && res.json.success === true)) {
              // Try admin alias under versioned API
              res = await post(apiBase + '/admin/sync', payload);
            }
            if (!(res.ok && res.json && res.json.success === true)) {
              // Final fallback: root admin alias
              res = await post(rootBase + '/admin/sync', payload);
            }
            el('status-json').textContent = JSON.stringify(res.json || { status: res.status, raw: res.raw }, null, 2);
            await refreshStatus();
          } catch (e) {
            el('status-json').textContent = 'Failed to start sync: ' + (e?.message || String(e));
          } finally {
            btn.disabled = false; btn.textContent = 'Start Full Sync';
          }
        });

        el('btn-tune').addEventListener('click', async () => {
          if (!lastJobId) { alert('No active job to tune'); return; }
          const payload = {
            jobId: lastJobId,
            maxConcurrency: Number(el('opt-conc').value) || undefined,
            batchSize: Number(el('opt-batch').value) || undefined
          };
          try {
            const res = await post(apiBase + '/sync/tune', payload);
            el('status-json').textContent = JSON.stringify(res.json || { status: res.status, raw: res.raw }, null, 2);
          } catch (e) {
            el('status-json').textContent = 'Failed to tune sync: ' + (e?.message || String(e));
          }
        });

        // Initial
        el('env-info').textContent = 'API: ' + apiBase;
        refreshStatus();
        refreshHealth();
        setInterval(refreshStatus, 3000);
      </script>
    </body>
    </html>`;
        reply.header("content-type", "text/html; charset=utf-8").send(html);
    });
}
//# sourceMappingURL=admin-ui.js.map