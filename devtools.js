// Main Dev Tools Script (converted from bookmarklet)
(function() {
  const d = document;
  const b = d.body;
  const h = d.head;

  if (d.getElementById('devToolsPanel')) {
    return alert('Dev Tools already active');
  }

  const panel = d.createElement('div');
  panel.id = 'devToolsPanel';
  Object.assign(panel.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '350px',
    background: '#1e1e1e',
    border: '1px solid #555',
    borderRadius: '8px',
    zIndex: 999999,
    display: 'flex',
    flexDirection: 'column',
    resize: 'both',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
  });

  const bar = d.createElement('div');
  Object.assign(bar.style, {
    background: '#333',
    padding: '6px 8px',
    cursor: 'move',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    userSelect: 'none'
  });

  bar.innerHTML = '<span style="color:#fff;font:13px monospace">🛠️ Dev Tools</span><div style="display:flex;gap:4px"><button id="inspectBtn" title="Inspector (Ctrl+Shift+I)" style="background:#06c;color:#fff;border:none;border-radius:3px;padding:4px 8px;cursor:pointer;font:11px monospace">🔍</button><button id="extractBtn" title="Extract CSS (Ctrl+Shift+X)" style="background:#f90;color:#fff;border:none;border-radius:3px;padding:4px 8px;cursor:pointer;font:11px monospace">📋</button><button id="varsBtn" title="Extract All CSS Variables (Ctrl+Shift+V)" style="background:#9c27b0;color:#fff;border:none;border-radius:3px;padding:4px 8px;cursor:pointer;font:11px monospace">🎨</button><button id="iframeBtn" title="Inject into iframe (Ctrl+Shift+F)" style="background:#00897b;color:#fff;border:none;border-radius:3px;padding:4px 8px;cursor:pointer;font:11px monospace">🖼️</button><button id="hideBtn" title="Hide/Show" style="background:#666;color:#fff;border:none;border-radius:3px;padding:4px 8px;cursor:pointer">—</button><button id="closeBtn" title="Close" style="background:#c33;color:#fff;border:none;border-radius:3px;padding:4px 8px;cursor:pointer">✕</button></div>';
  panel.appendChild(bar);

  const cssLabel = d.createElement('div');
  cssLabel.textContent = 'Live CSS Editor:';
  Object.assign(cssLabel.style, {
    padding: '6px 8px',
    color: '#9cdcfe',
    font: '11px monospace',
    background: '#252525',
    borderBottom: '1px solid #444'
  });
  panel.appendChild(cssLabel);

  const area = d.createElement('textarea');
  Object.assign(area.style, {
    height: '300px',
    background: '#1e1e1e',
    color: '#9cdcfe',
    border: 'none',
    outline: 'none',
    padding: '8px',
    resize: 'none',
    font: '12px monospace'
  });

  const cssTag = d.createElement('style');
  cssTag.id = 'liveCSS';
  h.appendChild(cssTag);

  const key = 'liveCSS_' + location.host;
  area.value = localStorage.getItem(key) || '';
  cssTag.textContent = area.value;

  area.oninput = () => {
    cssTag.textContent = area.value;
    localStorage.setItem(key, area.value);
  };

  panel.appendChild(area);
  b.appendChild(panel);

  // Dragging functionality
  let down = false, ox = 0, oy = 0;
  bar.onmousedown = e => {
    down = true;
    ox = e.clientX - panel.offsetLeft;
    oy = e.clientY - panel.offsetTop;
    b.style.userSelect = 'none';
  };
  d.onmouseup = () => {
    down = false;
    b.style.userSelect = '';
  };
  d.onmousemove = e => {
    if (down) {
      panel.style.left = e.clientX - ox + 'px';
      panel.style.top = e.clientY - oy + 'px';
      panel.style.right = '';
    }
  };

  // Hide/Show button
  d.getElementById('hideBtn').onclick = function() {
    if (area.style.display === 'none') {
      area.style.display = '';
      cssLabel.style.display = '';
      panel.style.height = '';
      this.textContent = '—';
    } else {
      area.style.display = 'none';
      cssLabel.style.display = 'none';
      panel.style.height = '40px';
      this.textContent = '▢';
    }
  };

  // Close button
  d.getElementById('closeBtn').onclick = () => {
    panel.remove();
    cssTag.remove();
    cleanupInspector();
    cleanupExtractor();
  };

  let tooltip, overlay, notify, navBox, currentEl, navKeyHandler, extractMoveHandler, extractNavKeyHandler, moveHandler;

  const desc = el => {
    if (!el?.tagName) return '';
    let t = el.tagName.toLowerCase();
    let i = el.id ? '#' + el.id : '';
    let c = el.className ? '.' + String(el.className).trim().replace(/\s+/g, '.') : '';
    return t + i + c;
  };

  const extractCompleteCSS = el => {
    let sel = desc(el);
    let css = '';
    let foundRules = new Map();
    let keyframes = new Map();

    const isUserSheet = s => {
      try {
        if (!s.href) return true;
        let h = s.href.toLowerCase();
        return !h.includes('chrome-extension://') && !h.includes('moz-extension://') && !h.includes('webkit-');
      } catch (e) {
        return false;
      }
    };

    const matches = (e, s) => {
      try {
        return e.matches(s);
      } catch (ex) {
        return false;
      }
    };

    const fmt = r => {
      if (!r.style) return '';
      let t = r.style.cssText;
      if (!t) return '';
      return t.split(';').filter(p => p.trim()).map(p => '  ' + p.trim() + ';').join('\n');
    };

    const fmtKeyframe = rule => {
      let text = '@keyframes ' + rule.name + ' {\n';
      try {
        Array.from(rule.cssRules).forEach(kf => {
          text += '  ' + kf.keyText + ' {\n';
          let props = kf.style.cssText.split(';').filter(p => p.trim()).map(p => '    ' + p.trim() + ';').join('\n');
          text += props + '\n  }\n';
        });
      } catch (e) {}
      text += '}\n';
      return text;
    };

    try {
      Array.from(d.styleSheets).forEach(sheet => {
        if (!isUserSheet(sheet)) return;
        try {
          Array.from(sheet.cssRules || sheet.rules || []).forEach(rule => {
            if (rule.type === 1) {
              let s = rule.selectorText;
              let base = s.replace(/:hover|:active|:focus|:before|:after|::before|::after|::marker/g, '');
              if (matches(el, base)) {
                if (!foundRules.has(s)) foundRules.set(s, []);
                let f = fmt(rule);
                if (f) foundRules.get(s).push(f);
              }
            } else if (rule.type === 7) {
              let styles = window.getComputedStyle(el);
              let animNames = styles.animationName.split(',').map(n => n.trim());
              if (animNames.includes(rule.name)) {
                keyframes.set(rule.name, fmtKeyframe(rule));
              }
            } else if (rule.type === 4) {
              try {
                Array.from(rule.cssRules).forEach(mr => {
                  if (mr.type === 1) {
                    let s = mr.selectorText;
                    let base = s.replace(/:hover|:active|:focus|:before|:after|::before|::after|::marker/g, '');
                    if (matches(el, base)) {
                      let k = '@media ' + rule.media.mediaText + '->' + s;
                      if (!foundRules.has(k)) foundRules.set(k, []);
                      let f = fmt(mr);
                      if (f) foundRules.get(k).push(f);
                    }
                  } else if (mr.type === 7) {
                    let styles = window.getComputedStyle(el);
                    let animNames = styles.animationName.split(',').map(n => n.trim());
                    if (animNames.includes(mr.name)) {
                      keyframes.set(mr.name, fmtKeyframe(mr));
                    }
                  }
                });
              } catch (e) {}
            }
          });
        } catch (e) {}
      });
    } catch (e) {}

    if (foundRules.size === 0 && keyframes.size === 0) {
      css = '/* No authored styles found for ' + sel + ' */\n\n' + sel + ' {\n  /* Add your styles here */\n}\n\n';
    } else {
      if (keyframes.size > 0) {
        css += '/* Animations */\n';
        keyframes.forEach(k => css += k + '\n');
      }

      let base = [], pseudo = [], pseudoEl = [], media = [];
      foundRules.forEach((props, s) => {
        let block = s + ' {\n' + props.join('\n') + '\n}\n\n';
        if (s.startsWith('@media')) {
          let p = s.split('->');
          block = p[0] + ' {\n  ' + p[1] + ' {\n  ' + props.join('\n  ') + '\n  }\n}\n\n';
          media.push(block);
        } else if (s.includes('::before') || s.includes(':before') || s.includes('::after') || s.includes(':after') || s.includes('::marker')) {
          pseudoEl.push(block);
        } else if (s.includes(':hover') || s.includes(':active') || s.includes(':focus')) {
          pseudo.push(block);
        } else {
          base.push(block);
        }
      });

      if (base.length > 0) {
        css += '/* Base Styles */\n';
        base.forEach(r => css += r);
      }
      if (pseudo.length > 0) {
        css += '/* Interactive States */\n';
        pseudo.forEach(r => css += r);
      }
      if (pseudoEl.length > 0) {
        css += '/* Pseudo Elements */\n';
        pseudoEl.forEach(r => css += r);
      }
      if (media.length > 0) {
        css += '/* Media Queries */\n';
        media.forEach(r => css += r);
      }
    }

    return css;
  };

  const insertAtEnd = (text) => {
    if (area.style.display === 'none') {
      area.style.display = '';
      cssLabel.style.display = '';
      panel.style.height = '';
      d.getElementById('hideBtn').textContent = '—';
    }

    let cur = area.value;
    let lines = cur.split('\n');
    let lastNonEmpty = -1;

    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() !== '') {
        lastNonEmpty = i;
        break;
      }
    }

    let insertPos = 0;
    if (lastNonEmpty >= 0) {
      let beforeLines = lines.slice(0, lastNonEmpty + 1).join('\n');
      insertPos = beforeLines.length + (beforeLines ? 1 : 0);
    } else {
      insertPos = cur.length;
    }

    let before = cur.substring(0, insertPos);
    let after = cur.substring(insertPos);
    area.value = before + text + after;

    let cursorPos = insertPos + text.indexOf('{\n') + 3;
    area.selectionStart = area.selectionEnd = cursorPos;

    cssTag.textContent = area.value;
    localStorage.setItem(key, area.value);
    area.focus();
  };

  const updateHighlight = el => {
    if (!el || !el.tagName) return;
    currentEl = el;
    let info = desc(el);
    let dims = el.getBoundingClientRect();
    let details = info + '\n' + 'W: ' + Math.round(dims.width) + 'px H: ' + Math.round(dims.height) + 'px';

    if (el.id) details += '\nID: ' + el.id;
    if (el.className) details += '\nClass: ' + el.className;

    let styles = window.getComputedStyle(el);
    details += '\nDisplay: ' + styles.display;
    details += '\nPosition: ' + styles.position;

    tooltip.textContent = details;
    tooltip.style.display = 'block';
    tooltip.style.left = '10px';
    tooltip.style.top = '10px';

    Object.assign(overlay.style, {
      left: dims.left + 'px',
      top: dims.top + 'px',
      width: dims.width + 'px',
      height: dims.height + 'px',
      display: 'block'
    });

    navBox.style.display = 'flex';
    Object.assign(navBox.style, {
      left: dims.left + 'px',
      top: (dims.top - 36 < 10 ? dims.bottom + 4 : dims.top - 36) + 'px'
    });
  };

  const insertSelector = el => {
    let sel = desc(el);
    insertAtEnd(sel + ' {\n  \n}\n\n');
    notify.textContent = '✓ ' + sel;
    notify.style.display = 'block';
    setTimeout(() => notify.style.display = 'none', 800);
  };

  const cleanupInspector = () => {
    if (window.__inspActive) {
      tooltip?.remove();
      overlay?.remove();
      navBox?.remove();
      notify?.remove();
      d.removeEventListener('mousemove', moveHandler);
      d.removeEventListener('keydown', navKeyHandler);
      window.__inspActive = false;
      let btn = d.getElementById('inspectBtn');
      if (btn) btn.style.background = '#06c';
    }
  };

  const cleanupExtractor = () => {
    if (window.__extractActive) {
      tooltip?.remove();
      overlay?.remove();
      navBox?.remove();
      notify?.remove();
      d.removeEventListener('mousemove', extractMoveHandler);
      d.removeEventListener('keydown', extractNavKeyHandler);
      window.__extractActive = false;
      let btn = d.getElementById('extractBtn');
      if (btn) btn.style.background = '#f90';
    }
  };

  // Inspector button
  d.getElementById('inspectBtn').onclick = function() {
    if (window.__inspActive) {
      cleanupInspector();
      return;
    }

    cleanupExtractor();
    window.__inspActive = true;
    this.style.background = '#0a0';

    tooltip = d.createElement('div');
    Object.assign(tooltip.style, {
      position: 'fixed',
      zIndex: 1000000,
      pointerEvents: 'none',
      background: 'rgba(0,0,0,0.9)',
      color: '#0f0',
      padding: '4px 8px',
      borderRadius: '4px',
      font: '11px monospace',
      display: 'none',
      left: '10px',
      top: '10px',
      whiteSpace: 'pre-wrap'
    });
    b.appendChild(tooltip);

    overlay = d.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      zIndex: 999999,
      pointerEvents: 'none',
      border: '2px solid #0f0',
      background: 'rgba(0,255,0,0.15)',
      display: 'none'
    });
    b.appendChild(overlay);

    navBox = d.createElement('div');
    navBox.innerHTML = '<button data-nav="parent" title="Parent (↑)" style="background:#333;color:#fff;border:1px solid #0f0;padding:4px 8px;cursor:pointer;font:10px monospace">↑ Parent</button><button data-nav="child" title="First Child (↓)" style="background:#333;color:#fff;border:1px solid #0f0;padding:4px 8px;cursor:pointer;font:10px monospace">↓ Child</button><button data-nav="prev" title="Prev Sibling (←)" style="background:#333;color:#fff;border:1px solid #0f0;padding:4px 8px;cursor:pointer;font:10px monospace">← Prev</button><button data-nav="next" title="Next Sibling (→)" style="background:#333;color:#fff;border:1px solid #0f0;padding:4px 8px;cursor:pointer;font:10px monospace">Next →</button><button data-nav="before" title="::before" style="background:#363;color:#fff;border:1px solid #0f0;padding:4px 6px;cursor:pointer;font:9px monospace">::before</button><button data-nav="after" title="::after" style="background:#363;color:#fff;border:1px solid #0f0;padding:4px 6px;cursor:pointer;font:9px monospace">::after</button><button data-nav="marker" title="::marker" style="background:#363;color:#fff;border:1px solid #0f0;padding:4px 6px;cursor:pointer;font:9px monospace">::marker</button><button data-nav="select" title="Select (Enter)" style="background:#0a0;color:#000;border:1px solid #0f0;padding:4px 8px;cursor:pointer;font:10px monospace;font-weight:bold">✓ Select</button>';
    Object.assign(navBox.style, {
      position: 'fixed',
      zIndex: 1000001,
      display: 'none',
      gap: '4px',
      background: 'rgba(0,0,0,0.9)',
      padding: '4px',
      borderRadius: '4px',
      border: '1px solid #0f0',
      pointerEvents: 'auto'
    });
    b.appendChild(navBox);

    navBox.onclick = e => {
      e.stopPropagation();
      let act = e.target.dataset.nav;
      if (!act || !currentEl) return;

      if (act === 'parent' && currentEl.parentElement) {
        updateHighlight(currentEl.parentElement);
      } else if (act === 'child' && currentEl.firstElementChild) {
        updateHighlight(currentEl.firstElementChild);
      } else if (act === 'prev' && currentEl.previousElementSibling) {
        updateHighlight(currentEl.previousElementSibling);
      } else if (act === 'next' && currentEl.nextElementSibling) {
        updateHighlight(currentEl.nextElementSibling);
      } else if (act === 'before') {
        let sel = desc(currentEl) + '::before';
        insertAtEnd(sel + ' {\n  content: "";\n  \n}\n\n');
        notify.textContent = '✓ ' + sel;
        notify.style.display = 'block';
        setTimeout(() => notify.style.display = 'none', 800);
        cleanupInspector();
      } else if (act === 'after') {
        let sel = desc(currentEl) + '::after';
        insertAtEnd(sel + ' {\n  content: "";\n  \n}\n\n');
        notify.textContent = '✓ ' + sel;
        notify.style.display = 'block';
        setTimeout(() => notify.style.display = 'none', 800);
        cleanupInspector();
      } else if (act === 'marker') {
        let sel = desc(currentEl) + '::marker';
        insertAtEnd(sel + ' {\n  \n}\n\n');
        notify.textContent = '✓ ' + sel;
        notify.style.display = 'block';
        setTimeout(() => notify.style.display = 'none', 800);
        cleanupInspector();
      } else if (act === 'select') {
        insertSelector(currentEl);
        cleanupInspector();
      }
    };

    notify = d.createElement('div');
    Object.assign(notify.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      background: 'rgba(0,200,0,0.95)',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '6px',
      font: '14px monospace',
      zIndex: 1000002,
      display: 'none',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
    });
    b.appendChild(notify);

    moveHandler = e => {
      if (navBox && navBox.style.display === 'flex') {
        let boxRect = navBox.getBoundingClientRect();
        let margin = 10;
        if (e.clientX >= boxRect.left - margin && e.clientX <= boxRect.right + margin && 
            e.clientY >= boxRect.top - margin && e.clientY <= boxRect.bottom + margin) {
          return;
        }
      }

      let el = d.elementFromPoint(e.clientX, e.clientY);
      if (!el || el.closest('#devToolsPanel')) return;
      updateHighlight(el);
    };

    navKeyHandler = e => {
      if (!currentEl) return;
      let handled = false;

      if (e.key === 'ArrowUp' && currentEl.parentElement) {
        updateHighlight(currentEl.parentElement);
        handled = true;
      } else if (e.key === 'ArrowDown' && currentEl.firstElementChild) {
        updateHighlight(currentEl.firstElementChild);
        handled = true;
      } else if (e.key === 'ArrowLeft' && currentEl.previousElementSibling) {
        updateHighlight(currentEl.previousElementSibling);
        handled = true;
      } else if (e.key === 'ArrowRight' && currentEl.nextElementSibling) {
        updateHighlight(currentEl.nextElementSibling);
        handled = true;
      } else if (e.key === 'Enter') {
        insertSelector(currentEl);
        cleanupInspector();
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    d.addEventListener('mousemove', moveHandler);
    d.addEventListener('keydown', navKeyHandler);
  };

  // Extract CSS button
  d.getElementById('extractBtn').onclick = function() {
    if (window.__extractActive) {
      cleanupExtractor();
      return;
    }

    cleanupInspector();
    window.__extractActive = true;
    this.style.background = '#fa0';

    tooltip = d.createElement('div');
    Object.assign(tooltip.style, {
      position: 'fixed',
      zIndex: 1000000,
      pointerEvents: 'none',
      background: 'rgba(0,0,0,0.9)',
      color: '#ff0',
      padding: '4px 8px',
      borderRadius: '4px',
      font: '11px monospace',
      display: 'none',
      maxWidth: '300px',
      whiteSpace: 'pre-wrap',
      left: '10px',
      top: '10px'
    });
    b.appendChild(tooltip);

    overlay = d.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      zIndex: 999999,
      pointerEvents: 'none',
      border: '2px solid #ff0',
      background: 'rgba(255,255,0,0.15)',
      display: 'none'
    });
    b.appendChild(overlay);

    navBox = d.createElement('div');
    navBox.innerHTML = '<button data-nav="parent" title="Parent (↑)" style="background:#333;color:#fff;border:1px solid #ff0;padding:4px 8px;cursor:pointer;font:10px monospace">↑ Parent</button><button data-nav="child" title="First Child (↓)" style="background:#333;color:#fff;border:1px solid #ff0;padding:4px 8px;cursor:pointer;font:10px monospace">↓ Child</button><button data-nav="prev" title="Prev Sibling (←)" style="background:#333;color:#fff;border:1px solid #ff0;padding:4px 8px;cursor:pointer;font:10px monospace">← Prev</button><button data-nav="next" title="Next Sibling (→)" style="background:#333;color:#fff;border:1px solid #ff0;padding:4px 8px;cursor:pointer;font:10px monospace">Next →</button><button data-nav="extract" title="Extract (Enter)" style="background:#fa0;color:#000;border:1px solid #ff0;padding:4px 8px;cursor:pointer;font:10px monospace;font-weight:bold">📋 Extract</button>';
    Object.assign(navBox.style, {
      position: 'fixed',
      zIndex: 1000001,
      display: 'none',
      gap: '4px',
      background: 'rgba(0,0,0,0.9)',
      padding: '4px',
      borderRadius: '4px',
      border: '1px solid #ff0',
      pointerEvents: 'auto'
    });
    b.appendChild(navBox);

    navBox.onclick = e => {
      e.stopPropagation();
      let act = e.target.dataset.nav;
      if (!act || !currentEl) return;

      if (act === 'parent' && currentEl.parentElement) {
        updateExtractHighlight(currentEl.parentElement);
      } else if (act === 'child' && currentEl.firstElementChild) {
        updateExtractHighlight(currentEl.firstElementChild);
      } else if (act === 'prev' && currentEl.previousElementSibling) {
        updateExtractHighlight(currentEl.previousElementSibling);
      } else if (act === 'next' && currentEl.nextElementSibling) {
        updateExtractHighlight(currentEl.nextElementSibling);
      } else if (act === 'extract') {
        let css = extractCompleteCSS(currentEl);
        insertAtEnd(css);
        notify.textContent = '✓ Complete CSS extracted';
        notify.style.display = 'block';
        setTimeout(() => notify.style.display = 'none', 1200);
        cleanupExtractor();
      }
    };

    notify = d.createElement('div');
    Object.assign(notify.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      background: 'rgba(255,150,0,0.95)',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '6px',
      font: '14px monospace',
      zIndex: 1000002,
      display: 'none',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
    });
    b.appendChild(notify);

    const updateExtractHighlight = el => {
      if (!el || !el.tagName) return;
      currentEl = el;
      let info = desc(el);
      let dims = el.getBoundingClientRect();
      let details = 'Click to extract\n' + info + '\nW: ' + Math.round(dims.width) + 'px H: ' + Math.round(dims.height) + 'px';

      tooltip.textContent = details;
      tooltip.style.display = 'block';
      tooltip.style.left = '10px';
      tooltip.style.top = '10px';

      Object.assign(overlay.style, {
        left: dims.left + 'px',
        top: dims.top + 'px',
        width: dims.width + 'px',
        height: dims.height + 'px',
        display: 'block'
      });

      navBox.style.display = 'flex';
      Object.assign(navBox.style, {
        left: dims.left + 'px',
        top: (dims.top - 36 < 10 ? dims.bottom + 4 : dims.top - 36) + 'px'
      });
    };

    extractMoveHandler = e => {
      if (navBox && navBox.style.display === 'flex') {
        let boxRect = navBox.getBoundingClientRect();
        let margin = 10;
        if (e.clientX >= boxRect.left - margin && e.clientX <= boxRect.right + margin && 
            e.clientY >= boxRect.top - margin && e.clientY <= boxRect.bottom + margin) {
          return;
        }
      }

      let el = d.elementFromPoint(e.clientX, e.clientY);
      if (!el || !el.tagName || el.closest('#devToolsPanel')) return;
      updateExtractHighlight(el);
    };

    extractNavKeyHandler = e => {
      if (!currentEl) return;
      let handled = false;

      if (e.key === 'ArrowUp' && currentEl.parentElement) {
        updateExtractHighlight(currentEl.parentElement);
        handled = true;
      } else if (e.key === 'ArrowDown' && currentEl.firstElementChild) {
        updateExtractHighlight(currentEl.firstElementChild);
        handled = true;
      } else if (e.key === 'ArrowLeft' && currentEl.previousElementSibling) {
        updateExtractHighlight(currentEl.previousElementSibling);
        handled = true;
      } else if (e.key === 'ArrowRight' && currentEl.nextElementSibling) {
        updateExtractHighlight(currentEl.nextElementSibling);
        handled = true;
      } else if (e.key === 'Enter') {
        let css = extractCompleteCSS(currentEl);
        insertAtEnd(css);
        notify.textContent = '✓ Complete CSS extracted';
        notify.style.display = 'block';
        setTimeout(() => notify.style.display = 'none', 1200);
        cleanupExtractor();
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    d.addEventListener('mousemove', extractMoveHandler);
    d.addEventListener('keydown', extractNavKeyHandler);
  };

  // CSS Variables button
  d.getElementById('varsBtn').onclick = function() {
    let allVars = new Map();

    try {
      Array.from(d.styleSheets).forEach(sheet => {
        try {
          if (!sheet.href || (sheet.href && !sheet.href.includes('chrome-extension://') && !sheet.href.includes('moz-extension://') && !sheet.href.includes('webkit-'))) {
            Array.from(sheet.cssRules || []).forEach(rule => {
              if (rule.selectorText && (rule.selectorText.includes(':root') || rule.selectorText.includes('html'))) {
                let style = rule.style;
                for (let i = 0; i < style.length; i++) {
                  let prop = style[i];
                  if (prop.startsWith('--')) {
                    let val = style.getPropertyValue(prop).trim();
                    if (val) allVars.set(prop, val);
                  }
                }
              }
            });
          }
        } catch (e) {}
      });
    } catch (e) {}

    if (allVars.size === 0) {
      if (!notify) notify = d.createElement('div');
      Object.assign(notify.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        background: 'rgba(200,50,50,0.95)',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '6px',
        font: '14px monospace',
        zIndex: 1000002,
        display: 'block',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
      });
      notify.textContent = '✗ No CSS variables found';
      b.appendChild(notify);
      setTimeout(() => notify.style.display = 'none', 1200);
      return;
    }

    let rootBlock = ':root {\n';
    Array.from(allVars.entries()).sort((a, b) => a[0].localeCompare(b[0])).forEach(([name, val]) => {
      rootBlock += '  ' + name + ': ' + val + ';\n';
    });
    rootBlock += '}\n\n';

    if (area.style.display === 'none') {
      area.style.display = '';
      cssLabel.style.display = '';
      panel.style.height = '';
      d.getElementById('hideBtn').textContent = '—';
    }

    let cur = area.value;
    if (cur.includes(':root')) {
      let rootStart = cur.indexOf(':root');
      let rootEnd = cur.indexOf('}', rootStart);
      if (rootEnd !== -1) {
        let before = cur.substring(0, rootStart);
        let after = cur.substring(rootEnd + 1);
        let afterTrimmed = after.replace(/^\s*\n+/, '');
        area.value = before + rootBlock + afterTrimmed;
      }
    } else {
      area.value = rootBlock + cur;
    }

    cssTag.textContent = area.value;
    localStorage.setItem(key, area.value);
    area.focus();

    if (!notify) notify = d.createElement('div');
    Object.assign(notify.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      background: 'rgba(156,39,176,0.95)',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '6px',
      font: '14px monospace',
      zIndex: 1000002,
      display: 'block',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
    });
    notify.textContent = '✓ ' + allVars.size + ' CSS variables extracted';
    b.appendChild(notify);
    setTimeout(() => notify.style.display = 'none', 1200);
  };

  // Keyboard shortcuts
  d.onkeydown = e => {
    if (e.ctrlKey && e.shiftKey) {
      if (e.key === 'E' || e.key === 'e') {
        e.preventDefault();
        d.getElementById('hideBtn')?.click();
      } else if (e.key === 'I' || e.key === 'i') {
        e.preventDefault();
        d.getElementById('inspectBtn')?.click();
      } else if (e.key === 'X' || e.key === 'x') {
        e.preventDefault();
        d.getElementById('extractBtn')?.click();
      } else if (e.key === 'V' || e.key === 'v') {
        e.preventDefault();
        d.getElementById('varsBtn')?.click();
      } else if (e.key === 'F' || e.key === 'f') {
        e.preventDefault();
        d.getElementById('iframeBtn')?.click();
      }
    }
  };

  // Iframe injection button
  d.getElementById('iframeBtn').onclick = function() {
    let iframes = Array.from(d.querySelectorAll('iframe'));

    if (iframes.length === 0) {
      if (!notify) notify = d.createElement('div');
      Object.assign(notify.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        background: 'rgba(200,50,50,0.95)',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '6px',
        font: '14px monospace',
        zIndex: 1000002,
        display: 'block',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
      });
      notify.textContent = '✗ No iframes found on this page';
      b.appendChild(notify);
      setTimeout(() => notify.style.display = 'none', 1200);
      return;
    }

    let modal = d.createElement('div');
    Object.assign(modal.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.8)',
      zIndex: 1000003,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });

    let box = d.createElement('div');
    Object.assign(box.style, {
      background: '#1e1e1e',
      padding: '20px',
      borderRadius: '8px',
      maxWidth: '600px',
      maxHeight: '70vh',
      overflow: 'auto',
      border: '2px solid #00897b'
    });

    let title = d.createElement('div');
    title.textContent = 'Select iframe (' + iframes.length + ' found):';
    Object.assign(title.style, {
      color: '#fff',
      marginBottom: '15px',
      fontSize: '16px',
      fontWeight: 'bold'
    });
    box.appendChild(title);

    iframes.forEach((iframe, idx) => {
      let isAccessible = false;
      try {
        let iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) isAccessible = true;
      } catch (e) {}

      let btn = d.createElement('div');
      Object.assign(btn.style, {
        padding: '12px',
        margin: '8px 0',
        background: '#2a2a2a',
        borderRadius: '4px',
        border: '1px solid #444',
        cursor: 'pointer'
      });

      let status = d.createElement('div');
      status.textContent = isAccessible ? '✓ Accessible' : '⚠️ Cross-Origin (click to open URL)';
      Object.assign(status.style, {
        color: isAccessible ? '#4caf50' : '#ff9800',
        fontSize: '11px',
        marginBottom: '5px',
        fontWeight: 'bold'
      });
      btn.appendChild(status);

      let url = d.createElement('div');
      let src = iframe.src || '(inline iframe)';
      url.textContent = 'Iframe ' + (idx + 1) + ': ' + src;
      Object.assign(url.style, {
        color: '#fff',
        fontSize: '13px',
        wordBreak: 'break-all'
      });
      btn.appendChild(url);

      btn.onmouseover = () => btn.style.background = '#333';
      btn.onmouseout = () => btn.style.background = '#2a2a2a';

      btn.onclick = () => {
        if (isAccessible) {
          try {
            let script = iframe.contentDocument.createElement('script');
            script.textContent = '(' + arguments.callee.toString() + ')()';
            iframe.contentDocument.body.appendChild(script);
            modal.remove();

            if (!notify) notify = d.createElement('div');
            Object.assign(notify.style, {
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              background: 'rgba(0,137,123,0.95)',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '6px',
              font: '14px monospace',
              zIndex: 1000002,
              display: 'block',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            });
            notify.textContent = '✓ Dev Tools injected into iframe!';
            b.appendChild(notify);
            setTimeout(() => notify.style.display = 'none', 1500);
          } catch (err) {
            modal.remove();
            if (!notify) notify = d.createElement('div');
            Object.assign(notify.style, {
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              background: 'rgba(200,50,50,0.95)',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '6px',
              font: '14px monospace',
              zIndex: 1000002,
              display: 'block',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            });
            notify.textContent = '✗ Failed: ' + err.message;
            b.appendChild(notify);
            setTimeout(() => notify.style.display = 'none', 2000);
          }
        } else {
          if (iframe.src) {
            window.open(iframe.src, '_blank');
            modal.remove();

            if (!notify) notify = d.createElement('div');
            Object.assign(notify.style, {
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              background: 'rgba(0,137,123,0.95)',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '6px',
              font: '14px monospace',
              zIndex: 1000002,
              display: 'block',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            });
            notify.textContent = '✓ Opening iframe URL in new tab...';
            b.appendChild(notify);
            setTimeout(() => notify.style.display = 'none', 2000);
          } else {
            modal.remove();
            if (!notify) notify = d.createElement('div');
            Object.assign(notify.style, {
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              background: 'rgba(200,50,50,0.95)',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '6px',
              font: '14px monospace',
              zIndex: 1000002,
              display: 'block',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            });
            notify.textContent = '✗ Inline iframe (no URL)';
            b.appendChild(notify);
            setTimeout(() => notify.style.display = 'none', 2000);
          }
        }
      };

      box.appendChild(btn);
    });

    let cancelBtn = d.createElement('button');
    cancelBtn.textContent = 'Cancel';
    Object.assign(cancelBtn.style, {
      display: 'block',
      width: '100%',
      padding: '10px',
      marginTop: '15px',
      background: '#666',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '13px'
    });
    cancelBtn.onclick = () => modal.remove();
    box.appendChild(cancelBtn);

    modal.appendChild(box);
    b.appendChild(modal);
  };
})();