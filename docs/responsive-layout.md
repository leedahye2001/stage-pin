# Web responsive layout

- Mobile web: below 768px. Existing floating bottom tabs, home search/banner and two-column goods grid stay unchanged.
- Tablet web: 768–1023px. Shared top search/navigation, centered content and three-column goods grid.
- Desktop web: 1024px and above. Content capped at 1200px, four-column goods grid, expanded banner with arrow buttons, two-column calendar/agenda and image/detail views.
- Forms and MY use narrower reading widths instead of stretching across a monitor.
- Native iPhone layout is unchanged: breakpoints apply only to web; no native dependencies or rebuild required by these layout changes alone.
- NOL was referenced for header/navigation, centered sections and horizontal poster collections; branding and existing StagePin titles remain unchanged.

## Verification

- 393, 820 and 1440px: navigation mode, goods card widths, horizontal overflow and screenshots checked.
- Breakpoint/width calculations: `mobile/tests/responsive.test.mjs`.
- Skeleton loading uses the shared `LoadingSkeleton` component. Read loading is separate from save/generate button progress.
