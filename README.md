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

## Canonical domains and legacy aliases

The canonical APIs are `bachelors-api.finki-hub.com` (`/diplomas` and
`/diplomas/download/:id`) and `masters-api.finki-hub.com` (`/masters` and
`/masters/download/:id`). The web app uses these hosts while retaining the
existing API paths and stable cache keys. The old API host attachments remain
available and return method-preserving `308` redirects to the canonical API
hosts: `diplomas-api.finki-hub.com` and `diplomski-api.finki-hub.com` for
bachelor's, and `magisterski-api.finki-hub.com` for master's. `OPTIONS`
preflights are passed through to the API CORS handler.

Pages middleware permanently (`301`) redirects `diplomas.finki-hub.com` and
`masters.finki-hub.com` to `theses.finki-hub.com`, and `diplomski.finki-hub.com`
and `magisterski.finki-hub.com` to `trudovi.finki-hub.com`. These redirects
preserve the original path and query. Canonical hosts, unknown hosts, and
`pages.dev` deployments continue through the normal Pages/SPA handling.

Pages and each API have independent main-branch deployment workflows, with
manual dispatch also available; there is no workflow ordering between them.
The canonical domains are already live, the frontend uses the canonical API
hosts, and the API legacy-host redirects include CORS headers for browser GETs
while passing OPTIONS preflights through to the existing CORS handler. To roll
back, restore the previous frontend API URLs if necessary, then redeploy the API
workers without legacy-host redirects. Keep canonical and legacy API domain
attachments during rollback. Pages `301` redirects may be cached by browsers,
so removing the middleware does not guarantee immediate rollback for clients
that cached a redirect.

## Localization

The interface supports Macedonian, English, Albanian and Turkish. Macedonian is the default; the selected language is saved in browser storage. Names use Latin transliteration outside Macedonian, while thesis titles, descriptions and downloaded documents retain their original text.

Status translations cover the live catalogs and the definitions in [diplomski](https://gitlab.finki.ukim.mk/wp/diplomski/-/blob/dev/src/main/resources/messages.properties) and [magisterski](https://gitlab.finki.ukim.mk/wp/magisterski/-/blob/dev/src/main/java/vp/magisterski/model/enumerations/MasterThesisStatus.java). Unrecognized statuses retain their source wording. Filters and shared URLs use the original values.

Run the regular tests with `npm test`. To verify translation coverage against both live APIs and the upstream status definitions:

```sh
LIVE_CATALOG_TESTS=1 npm test --workspace theses-listing-web -- src/lib/localization-live.test.ts
```

## License

This project is licensed under the terms of the MIT license.
