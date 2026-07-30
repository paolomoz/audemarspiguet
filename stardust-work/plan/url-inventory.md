# audemarspiguet.com — full URL inventory (migration reference)

Captured 2026-07-30 from the site's own sitemaps (26 locale editions listed in
robots.txt). **Full raw list: [`urls-all.txt`](urls-all.txt) — 24,710 unique
URLs, one per line.** Per-edition sitemap XML preserved in [`sitemaps/`](sitemaps/).

## Locale editions (26)

Two tiers share one path taxonomy:

| Tier | Editions | Count |
|---|---|---|
| Language-only (international) | `/en/` `/fr/` `/de/` `/it/` `/es/` `/ru/` `/ja/` `/zh-hans/` `/zh-hant/` | 9 |
| Country/language | `/ch/{en,fr,de,it}` `/us/en` `/gb/en` `/fr/fr` `/de/de` `/it/it` `/es/es` `/ru/ru` `/cn/zh-hans` `/hk/{en,zh-hant}` `/tw/zh-hant` `/mo/zh-hant` `/jp/ja` | 17 |

Korean (`*/ko/`) exists but is robots-disallowed — confirm scope with AP.

**Symmetry findings (path sets, locale prefix stripped):**
- All same-language editions are *identical* path sets (`/en/` ≡ `/us/en` ≡ `/gb/en` ≡ `/hk/en` ≡ `/ch/en`, 0 diff). A country edition is a market overlay (currency, legal, store emphasis) on a language master.
- Per-language deltas are editorial: `ja` has 1,022 paths (+92 vs en, −50), incl. two Japan-only news categories (`styling`, `watch-expert`); `zh-hant` 942; `zh-hans` 938; `de` 935; `it`/`es`/`ru` 932; `fr` 931; `en` 980.

**URLs per edition:** en-family 980 × 5 · ja-family 1,022 × 2 · zh-hant-family 942 × 4 · zh-hans-family 938 × 2 · de 935 × 3 · it/es/ru 932 × 7 (÷ family) · fr 931 × 3 = **24,710**.

## Page-type taxonomy (counts: canonical `/ch/en` edition → all 26 editions)

| # | Path pattern | Page type | /ch/en | All editions |
|---|---|---|---|---|
| 1 | `/{loc}/home` | Homepage | 1 | 26 |
| 2 | `/{loc}/collections/{name}` (+1 index) | Collection landing (pilot archetype ✅) | 20 | 499 |
| 3 | `/{loc}/watch-collection/{family}` | Collection product-listing index (12 families) | 12 | ~312 |
| 4 | `/{loc}/watch-collection/{family}/{reference}` | **Product detail page (PIM-fed)** | 566 | ~14,716 |
| 5 | `/{loc}/watch/{slug}` (a few nested) | Campaign / novelties / special-edition landing | 81 | 1,954 |
| 6 | `/{loc}/news` | Editorial hub (filterable index) | 1 | 26 |
| 7 | `/{loc}/news/{category}/{slug}` | Editorial article (categories en: art, origins, savoir-faire, music, golf; ja adds styling, watch-expert) | 135 | 3,491 |
| 8 | `/{loc}/stores` | Store locator (Yext-fed, geolocated) | 1 | 26 |
| 9 | `/{loc}/stores/{slug}` | Store / AP House detail | 76 | 1,976 |
| 10 | `/{loc}/about/...` (2–3 levels) | Brand storytelling (commitments, savoir-faire, contemporary-art, foundation, music, golf, origins) | 35 | 910 |
| 11 | `/{loc}/services/...` | Client services (after-sales, coverage, FAQ, pricelist, visits) | 16 | 357 |
| 12 | `/{loc}/legal/{market}` | Legal/privacy per market + accessibility | 33 | 339 |
| 13 | `/{loc}/masterclasses` (+`/detail`) | Masterclass booking experience | 2 | 52 |
|  | **Total** |  | **980** | **24,710** |

PDP volume per collection family (`/ch/en`): royal-oak 339 · code-1159 104 ·
royal-oak-offshore 95 · royal-oak-concept 26 · Etablisseurs 4 · remaster01,
neo-frame, 150-heritage 2 each · millenary, jules-audemars, haute-joaillerie,
classique 1 each.

## Not in sitemaps (functional URLs to account for)

From robots.txt disallows and site chrome — pages/servlets that exist but are
unindexed, needed for feature parity:

- `*/errors/*` (404/50x pages), `*/secure/*` (authenticated client area)
- Query-parameter variants excluded from crawl: `?ref=` (PDP strap/ref deep-links), `?strap=`
- AJAX servlets (the site's dynamic surface): `.products.*.json` (PIM product feeds), `.yextentities*.` (store locator), `.addfavouritewatch./.removefavouritewatch./.getfavouritewatchstatus.` (wishlist), `.compare.` (product compare), `.createnewsletter.` (newsletter), `.postcontactus.` (contact form), `.booksession./.bookappointment.` (boutique/masterclass booking), `.requestwarrantyextend.` (warranty)
- Site search overlay (client-side, no dedicated indexed page)

Migration scope decisions pending with AP: Korean editions, `/secure/` client
area, and whether language-only international editions remain separate
publications or become fallbacks.
