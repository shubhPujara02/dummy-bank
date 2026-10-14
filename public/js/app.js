// Shared helpers for Dummy Bank pages.

const DummyBank = (() => {
  // Remember UTM params from the landing URL for the whole session, so a lead
  // submitted on a later page still carries its campaign attribution.
  function captureUtm() {
    const params = new URLSearchParams(location.search);
    const utm = {};
    ['source', 'medium', 'campaign'].forEach((k) => {
      const v = params.get('utm_' + k);
      if (v) utm[k] = v;
    });
    if (Object.keys(utm).length) sessionStorage.setItem('db_utm', JSON.stringify(utm));
    return JSON.parse(sessionStorage.getItem('db_utm') || '{}');
  }

  async function fillSelects() {
    const selects = document.querySelectorAll('select[data-catalog]');
    if (!selects.length) return;
    const catalog = await fetch('/api/catalog').then((r) => r.json());
    selects.forEach((sel) => {
      const options = catalog[sel.dataset.catalog] || [];
      options.forEach((o) => sel.add(new Option(o.label, o.value)));
      const preset = new URLSearchParams(location.search).get(sel.name);
      if (preset) sel.value = preset;
    });
  }

  function showMessage(el, type, html) {
    el.className = 'message ' + type;
    el.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Wires a form to POST its fields as JSON. onSuccess(data) returns the
  // success message HTML.
  function bindForm(form, url, onSuccess) {
    const btn = form.querySelector('button[type=submit]');
    const msg = form.parentElement.querySelector('.message');
    const label = btn.textContent;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.className = 'message';
      btn.disabled = true;
      btn.textContent = 'Please wait...';

      const payload = Object.fromEntries(new FormData(form).entries());
      payload.utm = captureUtm();

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          showMessage(msg, 'error', escapeHtml(data.error || 'Something went wrong.'));
        } else {
          showMessage(msg, 'success', onSuccess(data));
          form.reset();
        }
      } catch (err) {
        showMessage(msg, 'error', 'Could not reach the server.');
      } finally {
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  }

  captureUtm();
  document.addEventListener('DOMContentLoaded', fillSelects);

  return { bindForm, escapeHtml, showMessage };
})();
