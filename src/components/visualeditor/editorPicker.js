/**
 * The point, click and highlight tool. When it is on, the preview document gets one
 * extra script: it outlines whatever the pointer is over and, when something is
 * clicked, reports that element back to the editor instead of following the link or
 * submitting the form. The editor turns that report into a targeted edit.
 *
 * The script is injected into the document as it is handed to the frame, so the
 * artifact itself is never modified — turning the tool off gives the original back.
 */
const PICKER_SCRIPT = `<script>
(function () {
  var box = null;
  function outline(el) {
    if (!box) {
      box = document.createElement('div');
      box.setAttribute('data-visual-x-picker', 'box');
      box.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #02cfff;background:rgba(2,207,255,0.14);border-radius:6px;box-shadow:0 0 0 1px rgba(0,0,0,0.45)';
      if (document.body) document.body.appendChild(box);
    }
    var r = el.getBoundingClientRect();
    box.style.left = r.left + 'px';
    box.style.top = r.top + 'px';
    box.style.width = r.width + 'px';
    box.style.height = r.height + 'px';
  }
  function path(el) {
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1 && parts.length < 4) {
      var step = node.tagName.toLowerCase();
      if (node.id) step += '#' + node.id;
      else if (typeof node.className === 'string' && node.className.trim()) step += '.' + node.className.trim().split(/\\s+/)[0];
      parts.unshift(step);
      node = node.parentElement;
    }
    return parts.join(' > ');
  }
  function describe(el) {
    return {
      path: path(el),
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      classes: typeof el.className === 'string' ? el.className.trim().split(/\\s+/).slice(0, 4).join(' ') : '',
      text: (el.innerText || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 160),
      role: el.getAttribute('role') || '',
      href: el.getAttribute('href') || ''
    };
  }
  document.addEventListener('mouseover', function (event) {
    if (event.target && event.target.nodeType === 1) outline(event.target);
  }, true);
  document.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    var el = event.target;
    if (el && el.nodeType === 1) {
      outline(el);
      try {
        parent.postMessage({ source: 'visual-x-picker', element: describe(el) }, '*');
      } catch (e) {}
    }
    return false;
  }, true);
})();
</script>`;

/** The document as the frame should receive it, with the picker script only when armed. */
export function withPicker(html) {
  if (!html) return html;
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${PICKER_SCRIPT}</body>`) : html + PICKER_SCRIPT;
}