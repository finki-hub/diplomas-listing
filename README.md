# FINKI Hub / Theses Listing

A web dashboard for browsing bachelor's and master's theses and their mentors at FCSE, also with statistics.

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

## Localization

The interface supports Macedonian, English, Albanian and Turkish. Macedonian is the default; the selected language is saved in browser storage. Names use Latin transliteration outside Macedonian, while thesis titles, descriptions and downloaded documents retain their original text.

Status translations cover the live catalogs and the definitions in [diplomski](https://gitlab.finki.ukim.mk/wp/diplomski/-/blob/dev/src/main/resources/messages.properties) and [magisterski](https://gitlab.finki.ukim.mk/wp/magisterski/-/blob/dev/src/main/java/vp/magisterski/model/enumerations/MasterThesisStatus.java). Unrecognized statuses retain their source wording. Filters and shared URLs use the original values.

Run the regular tests with `npm test`. To verify translation coverage against both live APIs and the upstream status definitions:

```sh
LIVE_CATALOG_TESTS=1 npm test --workspace theses-listing-web -- src/lib/localization-live.test.ts
```

## License

This project is licensed under the terms of the MIT license.
