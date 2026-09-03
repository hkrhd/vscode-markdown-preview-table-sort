const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  By,
  EditorView,
  Key,
  until,
  VSBrowser,
  WebView,
} = require('vscode-extension-tester');

describe('Markdown preview table sorting', function () {
  const fixturePath = path.resolve(__dirname, 'resources/tables.md');
  const alternateFixturePath = path.resolve(__dirname, 'resources/alternate.md');
  const originalMarkdown = fs.readFileSync(fixturePath, 'utf8');
  const originalAlternateMarkdown = fs.readFileSync(alternateFixturePath, 'utf8');
  let view;

  async function columnValues(tableIndex, columnIndex) {
    const cells = await view.findWebElements(By.css(
      `table:nth-of-type(${tableIndex}) tbody tr td:nth-child(${columnIndex})`
    ));
    return Promise.all(cells.map((cell) => cell.getText()));
  }

  async function sortButton(tableIndex, columnIndex) {
    return view.findWebElement(By.css(
      `table:nth-of-type(${tableIndex}) thead th:nth-child(${columnIndex}) > `
        + '.markdown-preview-table-sort-button'
    ));
  }

  async function waitForSortButton(timeout = 60000) {
    const driver = VSBrowser.instance.driver;
    await driver.wait(
      until.elementLocated(By.css('.markdown-preview-table-sort-button')),
      timeout
    );
  }

  async function switchToPreviewWithHeading(headingId, timeout = 30000) {
    const driver = VSBrowser.instance.driver;
    const deadline = Date.now() + timeout;

    await view.switchBack();
    while (Date.now() < deadline) {
      view = new WebView();
      try {
        await view.switchToFrame(Math.min(5000, deadline - Date.now()));
        if ((await view.findWebElements(By.css(`h1#${headingId}`))).length > 0) {
          return;
        }
        await view.switchBack();
      } catch {
        await driver.switchTo().defaultContent();
      }
      await driver.sleep(200);
    }

    throw new Error(`Markdown preview with heading #${headingId} was not available`);
  }

  async function openPreview(editorView) {
    await (await editorView.getTabByTitle('tables.md', 0)).select();
    const previewAction = await editorView.getAction(async (action) =>
      (await action.getTitle()).startsWith('Open Preview to the Side'), 0, 30000);
    assert.ok(previewAction, 'Markdown preview editor action was not available');
    await previewAction.click();

    view = new WebView();
    await view.switchToFrame(30000);
    await waitForSortButton();
  }

  async function closePreviewEditors(editorView) {
    let closedPreview = false;

    while (true) {
      const groups = await editorView.getEditorGroups();
      let foundPreview = false;

      for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
        const titles = await editorView.getOpenEditorTitles(groupIndex);
        const previewTitle = titles.find((title) => title.startsWith('Preview '));
        if (previewTitle) {
          await editorView.closeEditor(previewTitle, groupIndex);
          closedPreview = true;
          foundPreview = true;
          break;
        }
      }

      if (!foundPreview) {
        return closedPreview;
      }
    }
  }

  async function closePreview(editorView) {
    await view.switchBack();
    assert.equal(
      await closePreviewEditors(editorView),
      true,
      'Markdown preview editor was not open'
    );
  }

  before(async function () {
    this.timeout(90000);
    const driver = VSBrowser.instance.driver;
    const editorView = new EditorView();
    await driver.wait(async () => {
      try {
        const tab = await editorView.getActiveTab();
        return tab ? (await tab.getTitle()) === 'tables.md' : false;
      } catch {
        return false;
      }
    }, 30000);
    await (await editorView.getActiveTab()).select();
    await closePreviewEditors(editorView);
    try {
      await openPreview(editorView);
    } catch (error) {
      const previewState = await driver.executeScript(
        'return {'
          + 'readyState: document.readyState,'
          + 'tables: document.querySelectorAll("table").length,'
          + 'initialized: Array.from(document.querySelectorAll("table"), table => table.hasAttribute("data-markdown-preview-table-sort-initialized")),'
          + 'error: document.documentElement.getAttribute("data-markdown-preview-table-sort-error"),'
          + 'scripts: Array.from(document.scripts, script => script.src)'
          + '};'
      );
      const scriptFetch = await driver.executeAsyncScript(
        'const done = arguments[0];'
          + 'const source = Array.from(document.scripts, script => script.src)'
          + '.find(src => src.endsWith("/markdown-preview-table-sort.js"));'
          + 'fetch(source).then(async response => {'
          + 'const text = await response.text();'
          + 'done({ ok: response.ok, status: response.status, bytes: text.length });'
          + '}).catch(fetchError => done({ error: String(fetchError) }));'
      );
      error.message += ` Preview state: ${JSON.stringify(previewState)}`
        + ` Script fetch: ${JSON.stringify(scriptFetch)}`;
      throw error;
    }
  });

  after(async () => {
    if (view) {
      await view.switchBack();
    }
    await new EditorView().closeAllEditors();
  });

  it('cycles natural sorting through ascending, descending, and original order', async () => {
    const button = await sortButton(1, 1);
    const header = await view.findWebElement(By.css('table:nth-of-type(1) thead th:nth-child(1)'));

    await button.click();
    assert.deepEqual(await columnValues(1, 1), ['empty', 'Item1', 'item2', 'item10']);
    assert.equal(await header.getAttribute('aria-sort'), 'ascending');

    await button.click();
    assert.deepEqual(await columnValues(1, 1), ['item10', 'item2', 'Item1', 'empty']);
    assert.equal(await header.getAttribute('aria-sort'), 'descending');

    await button.click();
    assert.deepEqual(await columnValues(1, 1), ['item10', 'item2', 'Item1', 'empty']);
    assert.equal(await header.getAttribute('aria-sort'), null);
  });

  it('sorts numeric values stably, keeps empty cells last, and isolates tables', async () => {
    const scoreButton = await sortButton(1, 2);

    await scoreButton.click();
    assert.deepEqual(await columnValues(1, 1), ['item2', 'Item1', 'item10', 'empty']);
    assert.deepEqual(await columnValues(2, 1), ['Tokyo', 'Osaka']);

    await scoreButton.click();
    assert.deepEqual(await columnValues(1, 1), ['item10', 'item2', 'Item1', 'empty']);
  });

  it('supports keyboard activation', async () => {
    const secondTableButton = await sortButton(2, 2);
    await secondTableButton.sendKeys(Key.ENTER);
    assert.deepEqual(await columnValues(2, 1), ['Osaka', 'Tokyo']);

    await secondTableButton.sendKeys(Key.SPACE);
    assert.deepEqual(await columnValues(2, 1), ['Tokyo', 'Osaka']);
  });

  it('remains available after changing files and reopening the preview', async function () {
    this.timeout(120000);
    const driver = VSBrowser.instance.driver;
    const editorView = new EditorView();

    await view.switchBack();
    view = new WebView();
    await view.switchToFrame(30000);
    await waitForSortButton(30000);

    const currentHeading = await (await view.findWebElement(By.css('h1'))).getText();
    const showingPrimaryFixture = currentHeading === 'Sortable tables';
    const linkText = showingPrimaryFixture ? 'Open alternate table' : 'Open sortable tables';
    const destinationHeading = showingPrimaryFixture ? 'alternate-table' : 'sortable-tables';
    const expectedValues = showingPrimaryFixture
      ? ['item3', 'item20']
      : ['empty', 'Item1', 'item2', 'item10'];
    const links = await view.findWebElements(By.css('a'));
    const linkTexts = await Promise.all(links.map((link) => link.getText()));
    const fixtureLink = links[linkTexts.indexOf(linkText)];
    assert.ok(fixtureLink, 'Markdown fixture link was not available');
    await driver.executeScript('arguments[0].click();', fixtureLink);

    await switchToPreviewWithHeading(destinationHeading);
    await waitForSortButton(30000);

    await (await sortButton(1, 1)).click();
    assert.deepEqual(await columnValues(1, 1), expectedValues);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await closePreview(editorView);
      await openPreview(editorView);
      await (await sortButton(1, 1)).click();
      assert.deepEqual(await columnValues(1, 1), ['empty', 'Item1', 'item2', 'item10']);
    }
  });

  it('does not modify the Markdown source', () => {
    assert.equal(fs.readFileSync(fixturePath, 'utf8'), originalMarkdown);
    assert.equal(fs.readFileSync(alternateFixturePath, 'utf8'), originalAlternateMarkdown);
  });
});
