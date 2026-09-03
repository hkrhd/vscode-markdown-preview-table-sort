# Markdown Preview Table Sort

[日本語](./README_JA.md)

Sort tables by column directly in VS Code's built-in Markdown preview.

## Features

- Click a table header to sort the column.
- Click again to cycle through ascending, descending, and the original Markdown order.
- Natural sorting keeps values such as `item2` before `item10`.
- Empty cells stay at the bottom.
- Each table is sorted independently.
- Keyboard and screen-reader friendly controls.
- Your Markdown source is never modified.

## Usage

1. Open a Markdown file.
2. Open VS Code's built-in Markdown preview (`Ctrl+Shift+V` / `Cmd+Shift+V`).
3. Click a column header, or focus its sort button and press Enter or Space.

The sort state resets to the original Markdown order when the preview content is refreshed.

## Requirements

- VS Code 1.136.0 or newer
- Tables rendered by VS Code's built-in Markdown preview

## Known limitations

- Dates are compared as natural text; no date-format inference is performed.
- Raw HTML tables without both a header and body are not changed.

## Development

```sh
npm ci
npm run lint
npm test
npm run package:vsix
```

`npm test` launches an actual VS Code instance and exercises the built-in Markdown preview end to end.

## License

[MIT](./LICENSE)

