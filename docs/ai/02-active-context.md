# CURRENT FOCUS: Landing Page Fixes — COMPLETE

## What we just did:
- Fixed broken routes on the landing page: replaced all instances of `/signup` with `/register` across `HeroSection`, `SiteHeader`, `SiteFooter`, `CtaBand`, and `MobileNavigationController`.
- Resolved missing image errors:
  - Updated logo paths from `/logo.png` to `/logo.jpg`.
  - Removed `imageUrl` references from `highlights.ts` to allow graceful fallback to interactive gradient layouts.
  - Removed missing background images (`hero-crowd.jpg` and `footer_goa_buildings.jpg`) that were causing 404s and breaking layout.
- Cleaned up dead-end interactions:
  - Removed empty social media links in the footer.
  - Removed the broken "Download Brochure" link.
  - Fixed track filter pills in the hero section to anchor to `#highlights`.
- Updated stale content: "GSF 2026" and "Goa Startup Festival" strings updated to "SDC" / "Student Developer Club PU".
- Verified types with `tsc --noEmit`.

## Status: FULLY COMPLETE — no further action required. Code is ready to be committed and pushed.
