(() => {
  'use strict';

  const initializedAttribute = 'data-markdown-preview-table-sort-initialized';
  const sortableClass = 'markdown-preview-table-sort-sortable';
  const buttonClass = 'markdown-preview-table-sort-button';
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base'
  });

  function cellText(row, columnIndex) {
    return row.cells[columnIndex]?.textContent.trim() ?? '';
  }

  function compareValues(left, right, direction) {
    const leftEmpty = left.length === 0;
    const rightEmpty = right.length === 0;

    if (leftEmpty !== rightEmpty) {
      return leftEmpty ? 1 : -1;
    }

    if (leftEmpty) {
      return 0;
    }

    return collator.compare(left, right) * direction;
  }

  function headerLabel(header, columnIndex) {
    const text = Array.from(header.childNodes)
      .filter((node) => !(node instanceof HTMLElement && node.classList.contains(buttonClass)))
      .map((node) => node.textContent ?? '')
      .join('')
      .trim();

    return text || `column ${columnIndex + 1}`;
  }

  function initializeTable(table) {
    if (table.hasAttribute(initializedAttribute) || table.tBodies.length === 0) {
      return;
    }

    const headerRow = table.tHead?.rows[table.tHead.rows.length - 1];
    if (!headerRow || headerRow.cells.length === 0) {
      return;
    }

    table.setAttribute(initializedAttribute, '');

    const headers = Array.from(headerRow.cells);
    const originalRows = Array.from(table.tBodies, (body) =>
      Array.from(body.rows, (row, index) => ({ row, index }))
    );
    let activeColumn = -1;
    let state = 'none';

    function updateAccessibility() {
      headers.forEach((header, columnIndex) => {
        const button = header.querySelector(`:scope > .${buttonClass}`);
        const selected = columnIndex === activeColumn && state !== 'none';

        if (selected) {
          header.setAttribute('aria-sort', state === 'ascending' ? 'ascending' : 'descending');
        } else {
          header.removeAttribute('aria-sort');
        }

        if (button) {
          const nextAction = selected && state === 'ascending'
            ? 'descending'
            : selected && state === 'descending'
              ? 'original order'
              : 'ascending';
          button.setAttribute('aria-label', `Sort ${headerLabel(header, columnIndex)} ${nextAction}`);
          button.title = button.getAttribute('aria-label');
        }
      });
    }

    function renderRows(columnIndex, nextState) {
      originalRows.forEach((rows, bodyIndex) => {
        const orderedRows = nextState === 'none'
          ? rows
          : [...rows].sort((left, right) => {
            const direction = nextState === 'ascending' ? 1 : -1;
            const compared = compareValues(
              cellText(left.row, columnIndex),
              cellText(right.row, columnIndex),
              direction
            );
            return compared || left.index - right.index;
          });

        const fragment = document.createDocumentFragment();
        orderedRows.forEach(({ row }) => fragment.append(row));
        table.tBodies[bodyIndex].append(fragment);
      });
    }

    function cycleSort(columnIndex) {
      if (activeColumn !== columnIndex || state === 'none') {
        activeColumn = columnIndex;
        state = 'ascending';
      } else if (state === 'ascending') {
        state = 'descending';
      } else {
        state = 'none';
      }

      renderRows(columnIndex, state);
      updateAccessibility();
    }

    headers.forEach((header, columnIndex) => {
      header.classList.add(sortableClass);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = buttonClass;
      button.setAttribute('aria-label', `Sort ${headerLabel(header, columnIndex)} ascending`);
      button.title = button.getAttribute('aria-label');
      header.append(button);

      header.addEventListener('click', (clickEvent) => {
        const target = clickEvent.target;
        if (!(target instanceof Element)) {
          return;
        }

        const unrelatedControl = target.closest(
          `a, input, select, textarea, summary, button:not(.${buttonClass})`
        );
        if (unrelatedControl) {
          return;
        }

        cycleSort(columnIndex);
      });
    });

    updateAccessibility();
  }

  function initializeTables() {
    document.querySelectorAll('table').forEach(initializeTable);
  }

  function initializePreview() {
    initializeTables();

    const observer = new MutationObserver(initializeTables);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePreview, { once: true });
  } else {
    initializePreview();
  }

  window.addEventListener('vscode.markdown.updateContent', initializeTables);
})();
