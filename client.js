/**
 * Client half of dsh-quick-archive.
 *
 * What it adds: a one-click 归档 / "Archive" icon button inside the trailing
 * action area of every sidebar session row — the seat right next to the ⋯
 * menu — so archiving no longer needs the menu.
 *
 * Why it is not a slot occupant: the shipped browsing region declares no
 * extension hole under a session row (`sidebar.workspaces` is the whole
 * region; its only child hole is the directory-flow seat). The plugin
 * therefore contributes into the row's own action span instead of claiming a
 * seat that would shadow the shipped list. The contribution is additive and
 * self-healing:
 *
 * - a row is only touched when its React props identify it as a session row
 *   (`node.id` plus the row's own `onArchive` action), so workspace rows and
 *   search-result rows are left alone;
 * - the control is (re)built on pointer-over / focus-in, which re-reads the
 *   row's live session id and label — a reused DOM node can never archive the
 *   wrong session;
 * - the action goes through the declared `uiWorkspace.archiveSession` Client
 *   service, the same call the ⋯ menu item makes, so the current-session
 *   clearing semantics stay with their owner.
 */
window.__ModuleLoader__.load({
  id: 'dsh-quick-archive',
  factory() {
    'use strict';

    const PKG = 'dsh-quick-archive';
    const NS = 'dsh-quick-archive';
    /** Marks the button this package owns, and carries the live session id. */
    const OWNER_ATTR = 'data-dsh-quick-archive';
    const CLASS = 'dsh-qa-archive';

    const DICTIONARIES = {
      zh: {
        archive: '归档会话',
        archiveNamed: '归档会话“{name}”',
      },
      en: {
        archive: 'Archive session',
        archiveNamed: 'Archive session “{name}”',
      },
    };

    /** Mirrors the shipped row icon-button geometry and theme aliases. */
    const CSS = [
      '.' + CLASS + '{cursor:pointer;width:16px;height:16px;flex:none;color:var(--dsw-alias-label-tertiary);background:transparent;border:0;border-radius:4px;padding:0;display:inline-flex;align-items:center;justify-content:center}',
      '.' + CLASS + ':hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14))}',
      '.' + CLASS + ':focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.' + CLASS + ':disabled{opacity:.45;cursor:default}',
      '.' + CLASS + '>svg{display:block}',
    ].join('');

    const SVG_NS = 'http://www.w3.org/2000/svg';

    function svgElement(name, attributes) {
      const node = document.createElementNS(SVG_NS, name);
      for (const key of Object.keys(attributes)) node.setAttribute(key, attributes[key]);
      return node;
    }

    function archiveIcon() {
      const stroke = {
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.3',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      };
      const svg = svgElement('svg', {
        viewBox: '0 0 16 16',
        width: '16',
        height: '16',
        'aria-hidden': 'true',
      });
      svg.appendChild(svgElement('path', Object.assign({}, stroke, { d: 'M2.3 2.4h11.4v2.8H2.3z' })));
      svg.appendChild(svgElement('path', Object.assign({}, stroke, {
        d: 'M3.5 5.2v7.2a1.2 1.2 0 0 0 1.2 1.2h6.6a1.2 1.2 0 0 0 1.2-1.2V5.2',
      })));
      svg.appendChild(svgElement('path', Object.assign({}, stroke, { d: 'M6.4 8.1h3.2' })));
      return svg;
    }

    /** The React fiber hung on a DOM node, whatever the runtime's hash suffix is. */
    function fiberOf(element) {
      if (!element || typeof element !== 'object') return null;
      for (const key of Object.keys(element)) {
        if (key.startsWith('__reactFiber$')) return element[key];
      }
      return null;
    }

    /**
     * Session-row props for a row element, or null when the element is not a
     * session row (workspace row, blank placeholder row, search-result row).
     */
    function sessionPropsOf(row) {
      let fiber = fiberOf(row);
      for (let hop = 0; fiber && hop < 24; hop += 1) {
        const props = fiber.memoizedProps;
        if (
          props
          && props.node
          && typeof props.node.id === 'string'
          && typeof props.onArchive === 'function'
        ) {
          return props.node.blank ? null : props;
        }
        fiber = fiber.return;
      }
      return null;
    }

    function rowOf(node) {
      const element = node && (node.nodeType === 1 ? node : node.parentElement);
      return element ? element.closest('div[role="treeitem"]') : null;
    }

    /** The row's trailing action span — the seat that holds the ⋯ button. */
    function actionsOf(row) {
      const children = row.children;
      for (let index = children.length - 1; index >= 0; index -= 1) {
        const child = children[index];
        if (child.tagName === 'SPAN' && child.querySelector('button') !== null) return child;
      }
      return null;
    }

    function apply(ctx) {
      const locale = ctx.locale;
      ctx.effect(() => locale.register(NS, DICTIONARIES), PKG + ': dictionaries');
      ctx.effect(() => {
        const tag = document.createElement('style');
        tag.dataset.plugin = PKG;
        tag.dataset.pluginCss = PKG + '/quick-archive.css';
        tag.textContent = CSS;
        document.head.appendChild(tag);
        return () => tag.remove();
      }, PKG + ': stylesheet');

      ctx.effect(() => {
        const t = locale.bind(NS);
        const pending = new WeakSet();
        let lastRow = null;

        function labelFor(node) {
          const title = typeof node.title === 'string' ? node.title.trim() : '';
          return title ? t('archiveNamed', { name: title }) : t('archive');
        }

        function setLabel(button, node) {
          const text = labelFor(node);
          if (button.getAttribute('aria-label') === text) return;
          button.setAttribute('aria-label', text);
          button.title = text;
        }

        /** Drop this row's own control — never one belonging to a nested row. */
        function strip(row) {
          const host = actionsOf(row);
          const stale = host ? host.querySelector(':scope > [' + OWNER_ATTR + ']') : null;
          if (stale) stale.remove();
        }

        function onClick(event) {
          const button = event.currentTarget;
          if (pending.has(button)) return;
          const props = sessionPropsOf(rowOf(button));
          if (!props) return;
          const sessionId = props.node.id;
          button.setAttribute(OWNER_ATTR, sessionId);
          pending.add(button);
          button.disabled = true;
          button.setAttribute('aria-busy', 'true');
          Promise.resolve(ctx.uiWorkspace.archiveSession(sessionId)).then(
            () => {
              // An accepted archive unmounts the row; keep the control spent.
            },
            (reason) => {
              console.warn('[' + PKG + '] archive rejected:', reason);
              pending.delete(button);
              button.disabled = false;
              button.removeAttribute('aria-busy');
            },
          );
        }

        function ensure(row) {
          const props = sessionPropsOf(row);
          if (!props) {
            strip(row);
            return;
          }
          const host = actionsOf(row);
          if (!host) return;
          let button = host.querySelector(':scope > [' + OWNER_ATTR + ']');
          if (!button) {
            button = document.createElement('button');
            button.type = 'button';
            button.className = CLASS;
            button.setAttribute(OWNER_ATTR, props.node.id);
            button.appendChild(archiveIcon());
            button.addEventListener('click', onClick);
            host.insertBefore(button, host.firstChild);
          }
          setLabel(button, props.node);
        }

        const onPointerOver = (event) => {
          const row = rowOf(event.target);
          if (!row || row === lastRow) return;
          lastRow = row;
          ensure(row);
        };

        const onFocusIn = (event) => {
          const row = rowOf(event.target);
          if (!row) return;
          ensure(row);
        };

        const onLocaleChange = () => {
          const buttons = document.querySelectorAll('[' + OWNER_ATTR + ']');
          for (const button of buttons) {
            const props = sessionPropsOf(rowOf(button));
            if (props) setLabel(button, props.node);
          }
        };

        document.addEventListener('pointerover', onPointerOver, true);
        document.addEventListener('focusin', onFocusIn, true);
        const unsubscribe = locale.subscribe(onLocaleChange);

        return () => {
          document.removeEventListener('pointerover', onPointerOver, true);
          document.removeEventListener('focusin', onFocusIn, true);
          unsubscribe?.();
          const buttons = document.querySelectorAll('[' + OWNER_ATTR + ']');
          for (const button of buttons) button.remove();
          lastRow = null;
        };
      }, PKG + ': row actions');
    }

    return {
      inject: ['locale', 'uiWorkspace'],
      apply,
    };
  },
});
