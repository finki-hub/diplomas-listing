# FINKI Hub / Theses Listing

A web dashboard for browsing bachelor's and master's theses and their mentors at the
Faculty of Computer Science and Engineering (FCSE).

- Search, filter, and sort thesis catalogs.
- Use the interface in Macedonian, English, Albanian, or Turkish.
- Explore catalog statistics and download thesis documents.

## Development

Install Node.js and npm. From the repository root, install dependencies and
start the web app:

```sh
npm ci
npm run dev
```

## Project structure

- `web/` — SolidJS browser app.
- `bachelors-api/` and `masters-api/` — catalog API Workers; `shared/` contains
  common code.

## Checks

```sh
npm test
npm run build
```

## License

[MIT](LICENSE)
