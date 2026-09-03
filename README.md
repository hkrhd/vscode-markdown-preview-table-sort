# Markdown Preview Table Sort

[日本語](./README_JA.md)

Adds table sorting to VS Code's built-in Markdown preview.

## Behavior

- Click a table header to sort by that column
- Cycle through ascending, descending, and the original Markdown order with each click
- Natural sorting places `item2` before `item10`
- Empty cells always appear last
- Sort multiple tables independently
- Does not modify the Markdown source

## Requirements

- VS Code 1.136.0 or later

## Known limitations

- Dates are compared as natural text without inferring their format.
- Raw HTML tables without both a header and body are not modified.

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
