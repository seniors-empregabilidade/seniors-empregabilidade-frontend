# Design system

Visual specification for the Seniors – Empregabilidade interface. Source of truth for
color, typography, component states, image slots, and spacing metrics across the 30
prototyped screens.

- Version: 2 (visual direction I)
- Design target: desktop 1440
- Conformance target: WCAG 2.2 AA (contractual)
- Implementation: React 19, Tailwind CSS 4, shadcn/ui (base-nova), Base UI

Interface copy in the examples below is Brazilian Portuguese because it is user-facing
text. Everything else in this document is English, per `CONTRIBUTING.md`.

## 1. Scope and conventions

- Contrast ratios are computed with the WCAG 2.x relative luminance formula, always
  against the surface the token is applied to: white for text and action tokens,
  `#0B2545` for the light tones.
- Applied minimums: 4.5:1 for text below 24px, 3:1 for text at 24px or larger and for
  component boundaries and focus states.
- Color is given in hexadecimal for reference and in `oklch` for implementation, which
  is the format already used in `src/styles.css`.
- Measurements are in pixels. Typography and radius map to Tailwind utilities in
  section 8.
- `axe-core` and `cypress-axe` are already installed; the values in this specification
  are verifiable by the existing suite.

## 2. Palette

Two blues with distinct roles. `#0B2545` is the text color and the dark surface.
`#1D4ED8` is reserved for the primary action and the focus ring; it is not a link
color, a heading color, or an icon color.

### Text and action

| Token | Hex | oklch | Ratio | Usage and minimum |
| --- | --- | --- | --- | --- |
| `--foreground` | `#0B2545` | `0.264 0.068 255` | 15.4 | Text and headings. Also the dark surface. Min. 4.5 |
| `--foreground-2` | `#33456B` | `0.393 0.069 264` | 9.5 | Supporting paragraphs. Min. 4.5 |
| `--muted-foreground` | `#46587A` | `0.460 0.060 263` | 7.2 | Metadata, labels, field text. 16px floor |
| `--primary` | `#1D4ED8` | `0.488 0.217 264` | 6.7 | Primary action fill and focus ring. Min. 3 |
| `--primary-hover` | `#163FAE` | `0.419 0.183 264` | 8.9 | Primary action hover state |

### Surface and boundary

| Token | Hex | oklch | Ratio | Usage |
| --- | --- | --- | --- | --- |
| `--background` | `#FFFFFF` | `1 0 0` | — | Page, card, modal |
| `--muted` | `#F5F8FD` | `0.978 0.007 261` | 14.5 | Reading blocks and hero. Ratio measured against `--foreground` |
| `--accent` | `#EFF6FF` | `0.970 0.014 255` | 14.1 | Chips, list item hover, logo slot |
| `--input` | `#8496B3` | `0.669 0.048 260` | 3.0 | Field and secondary button border. Min. 3 (1.4.11) |
| `--border` | `#DBE4F0` | `0.916 0.019 256` | 1.3 | Card outline. Decorative, no minimum |
| `--rule` | `#E7EEF8` | `0.947 0.015 257` | 1.2 | 1px divider between list items |

### State

| Token | Hex | oklch | Ratio | Usage |
| --- | --- | --- | --- | --- |
| `--success` | `#0B6B3A` | `0.465 0.114 154` | 6.6 | Confirmation label and border. Valid as text |
| `--destructive` | `#8C1D18` | `0.420 0.147 28` | 9.1 | Field error, error message, destructive action |
| `--warning-foreground` | `#7A5210` | `0.471 0.093 74` | 6.3 | Warning text, measured against `--warning-background` |
| `--warning-background` | `#FDF3E3` | `0.968 0.024 80` | — | Warning surface |
| `--warning-border` | `#B57A17` | `0.625 0.126 73` | — | Warning border |
| `--disabled` | `#DBE4F0` | `0.916 0.019 256` | 5.6 | Disabled surface. Dedicated pair, replaces kit opacity |
| `--disabled-foreground` | `#46587A` | `0.460 0.060 263` | 5.6 | Disabled label |

The `--sidebar-*` family reuses these values: surface at `--foreground`, active item in
white, inactive item at `#DBE4F0`. It introduces no new color.

## 3. Text on dark surfaces

Over `#0B2545` the text tokens invert. This applies to dark bands, the sidebar, and the
footer. A nested light surface — a form field, a white button — does not inherit the
rule and returns to the section 2 tokens.

Allowed:

| Token | Role | Ratio |
| --- | --- | --- |
| `--on-dark` | Headings and text | 15.4 |
| `--on-dark-muted` | Labels | 12.0 |
| `--on-dark-subtle` | Supporting text | 9.1 |
| `--on-dark-accent` | Markers | 6.5 |

Forbidden on dark surfaces:

| Usage | Ratio |
| --- | --- |
| `--muted-foreground` as text | 2.2 |
| `--primary` as text | 2.3 |
| `--primary` as a fill | 2.3 |
| `--input` below 18px | 5.1, permitted only at 18px or larger |

Implementation consequence: a primary action inside a dark band uses a white fill with
a `--foreground` label.

## 4. Typography

Plus Jakarta Sans, weights 400, 500, 600, and 700. Selection criteria: numeral
legibility, distinction between `1`, `l`, and `I`, and performance at large sizes. Body
size is 18px with a 16px floor.

| Level | px / weight | Tailwind | Sample |
| --- | --- | --- | --- |
| Display | 42 / 700 | `text-[42px]` | Experiência é ativo |
| Heading 1 | 32 / 700 | `text-3xl` | Vagas compatíveis |
| Heading 2 | 26 / 700 | `text-[26px]` | Analista de operações |
| Heading 3 | 21 / 700 | `text-xl` | Suas candidaturas |
| Body | 18 / 400 | `text-lg` | Product base size. Never use 14px or 16px as body |
| Label | 16 / 600 | `text-base` | Field label — the floor of the scale |
| Auxiliary | 16 / 400 | `text-base` | Supporting and help text |
| Tag | 13 / 600 mono | `font-mono` | Section, category, state. Uppercase, tracked |

The monospace tag identifies system vocabulary. It does not apply to running sentences
or to headings. Uppercase is forbidden in headings.

### Divergence from the kit default

The shadcn button, label, field description, and table cell use `text-sm` (14px). Every
installed component requires an override to `text-lg` or `text-base`, preferably in the
component's `cva` variant rather than as a class at the call site.

## 5. Components and states

Minimum touch target is 44px in height. Form fields are 48px, to accommodate 18px body
text. One primary action per screen.

### Primary button

44px height, radius 8, 17px/600.

| State | Specification |
| --- | --- |
| Default | `--primary` fill, white label |
| Hover | `--primary-hover` fill |
| Focus visible | 3px ring in `--ring`, 2px offset |
| Disabled | `--disabled` fill, `--disabled-foreground` label, 5.6 |

### Variants

| Variant | Specification |
| --- | --- |
| Secondary | White fill, `--foreground` label, 1.5px `--input` border |
| Subtle | `--accent` fill, `--foreground` label, 1.5px `--border` border |
| Link | White fill, `--foreground` label, underline with 3px offset |
| Destructive | `--destructive` fill, white label |

### Field

48px height, persistent label above the field.

| State | Specification |
| --- | --- |
| Default | 1.5px `--input` border, radius 8, 18px value text |
| Focus | 1.5px `--primary` border plus 3px ring at 2px offset |
| Error | 2px `--destructive` border plus an error message carrying the correction |

A validation error requires text stating the correction. A `--destructive` border alone
does not satisfy criterion 1.4.1. Example error copy: `Falta o @ e o domínio. Exemplo:
maria.andrade@empresa.com.br`

Placeholder text never replaces the label.

### State message

Redundant signaling: a text label precedes the message. A `lucide-react` icon is
optional and never replaces the label.

| Kind | Label | Border | Background |
| --- | --- | --- | --- |
| Success | `Sucesso` | `--success` | White |
| Warning | `Atenção` | `--warning-border` | `--warning-background` |
| Error | `Erro` | `--destructive` | White |

Radius 10. Label in 13px monospace uppercase; message in 18px body.

### Job card

Fixed composition: 48px logo, Heading 3 title, Auxiliary metadata line, chips, and a
pair of actions. Applies to listings, search results, and detail views. Card border is
1.5px `--border` with radius 10 and 22px padding.

## 6. Image slots

| Slot | Shape | Specification |
| --- | --- | --- |
| `data-logo="empresa"` | 48 × 48, radius 8 | Precedes the job title in listing, detail, modal, and history. A missing file shows the two initials in `--foreground-2` over `--accent` |
| `data-imagem="foto-candidato"` | 104 and 72, circular | 104px on the profile, 72px in the edit modal. Upload is optional, JPG or PNG up to 5 MB. Without a file, a circular monogram |
| `data-imagem="landing-hero"` | 388px height, radius 14 | Right column of the hero. File pending. Free aspect ratio, cropped by the container |

All slots are `aria-hidden`: the equivalent information lives in the adjacent text. They
do not require descriptive alternative text.

## 7. Spacing, radius, and targets

Spacing follows the 4px Tailwind scale: 4, 8, 12, 16, 24, 32, 48 (`1`, `2`, `3`, `4`,
`6`, `8`, `12`).

Radius derives from `--radius: 0.625rem`:

| Name | Value | Usage |
| --- | --- | --- |
| `sm` | 6px | Tags, small frames |
| `md` | 8px | Buttons, fields, logos |
| `lg` | 10px | Cards, state messages |
| `xl` | 14px | Modals, bands, containers |
| `full` | 999px | Chips, circular avatars |

The prototype uses 12px on modals and bands; the implementation raises those cases to
`rounded-xl` (14px). No container value exceeds 14px.

## 8. CSS variables

Replacement for `src/styles.css`. Keeps every token the kit already references —
including `--card-foreground`, `--secondary`, and the `--sidebar-*` family — and adds
seven. The file's `@theme inline` and `@layer base` layers remain; the new tokens need a
corresponding `@theme inline` entry to become utilities.

```css
:root {
  --radius: 0.625rem;                      /* unchanged */

  --background: oklch(1 0 0);
  --foreground: oklch(0.264 0.068 255);    /* #0B2545 */
  --foreground-2: oklch(0.393 0.069 264);  /* new - #33456B */

  --card: oklch(1 0 0);
  --card-foreground: oklch(0.264 0.068 255);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.264 0.068 255);

  --primary: oklch(0.488 0.217 264);       /* #1D4ED8 */
  --primary-foreground: oklch(1 0 0);
  --primary-hover: oklch(0.419 0.183 264); /* new - #163FAE */

  --secondary: oklch(0.970 0.014 255);     /* #EFF6FF */
  --secondary-foreground: oklch(0.264 0.068 255);

  --muted: oklch(0.978 0.007 261);         /* #F5F8FD */
  --muted-foreground: oklch(0.460 0.060 263);
  --accent: oklch(0.970 0.014 255);
  --accent-foreground: oklch(0.264 0.068 255);

  --border: oklch(0.916 0.019 256);        /* #DBE4F0 */
  --rule: oklch(0.947 0.015 257);          /* new - #E7EEF8 */
  --input: oklch(0.669 0.048 260);         /* #8496B3 - 3:1 */
  --ring: oklch(0.488 0.217 264);

  --disabled: oklch(0.916 0.019 256);           /* new */
  --disabled-foreground: oklch(0.460 0.060 263);

  --success: oklch(0.465 0.114 154);       /* #0B6B3A */
  --destructive: oklch(0.420 0.147 28);    /* #8C1D18 */
  --warning-foreground: oklch(0.471 0.093 74);  /* new */
  --warning-background: oklch(0.968 0.024 80);  /* new */
  --warning-border: oklch(0.625 0.126 73);      /* new */

  --on-dark: oklch(1 0 0);
  --on-dark-muted: oklch(0.916 0.019 256);
  --on-dark-subtle: oklch(0.828 0.038 258);
  --on-dark-accent: oklch(0.735 0.136 262);

  --sidebar: oklch(0.264 0.068 255);
  --sidebar-foreground: oklch(0.916 0.019 256);
  --sidebar-primary: oklch(1 0 0);
  --sidebar-primary-foreground: oklch(0.264 0.068 255);
  --sidebar-accent: oklch(0.393 0.069 264);
  --sidebar-accent-foreground: oklch(1 0 0);
  --sidebar-border: oklch(0.393 0.069 264);
  --sidebar-ring: oklch(0.488 0.217 264);
}

@theme inline {
  /* add to the existing entries */
  --color-foreground-2: var(--foreground-2);
  --color-primary-hover: var(--primary-hover);
  --color-rule: var(--rule);
  --color-disabled: var(--disabled);
  --color-disabled-foreground: var(--disabled-foreground);
  --color-warning-foreground: var(--warning-foreground);
  --color-warning-background: var(--warning-background);
  --color-warning-border: var(--warning-border);
  --color-on-dark: var(--on-dark);
  --color-on-dark-muted: var(--on-dark-muted);
  --color-on-dark-subtle: var(--on-dark-subtle);
  --color-on-dark-accent: var(--on-dark-accent);

  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
}
```

### Implementation notes

- `--warning` stops being a single color and becomes a trio. Any current use of
  `--color-warning` must point to one of the three.
- `--sidebar` inverts: it becomes a dark surface. Active item in white, inactive at
  `--sidebar-foreground`.
- The disabled state uses the dedicated pair, not `opacity`. The kit's default opacity
  reduces the label below 3:1.
- The font must be loaded in the HTML or through a local `@font-face`. Declaring
  `--font-sans` does not download it.
- No `prefers-color-scheme: dark` token is planned.

### Delta against the current `src/styles.css`

ADR 0003 applied a first pass of the brand palette. This specification supersedes those
values. The differences that require review:

| Token | Current | This specification | Reason |
| --- | --- | --- | --- |
| `--input` | same value as `--border`, 1.28:1 against white | `#8496B3`, 3.0:1 | The current value fails criterion 1.4.11 for field and secondary-button borders |
| `--primary` | `#1D5FD8`, 5.71:1 | `#1D4ED8`, 6.7:1 | Aligns the action color with the approved visual direction |
| `--muted-foreground` | `oklch(0.5 0.035 255)` | `oklch(0.460 0.060 263)` | Raises metadata text contrast to 7.2:1 |
| `--warning` | single color `#F0A83C` | trio: foreground, background, border | A single warning color cannot produce readable text on its own surface |
| `--sidebar` | light surface | dark surface at `--foreground` | The approved direction inverts the sidebar |
| New tokens | absent | `--foreground-2`, `--primary-hover`, `--rule`, `--disabled`, `--disabled-foreground`, and the `--warning-*` trio | Required by the component states in section 5 |

## 9. Verifiable criteria

| Criterion | Requirement | Adopted value |
| --- | --- | --- |
| 1.4.1 | Color is not the only means | Text label on every state message; field errors carry correction text |
| 1.4.3 | Text contrast | System minimum 4.5; lowest value in use 5.6 (disabled label) |
| 1.4.11 | Component contrast | Field border 3.0; action fill 6.7 |
| 1.4.10 | Reflow | Specified for 1440; 320px depends on the mobile version |
| 1.4.12 | Text spacing | Line height at or above 1.38 at every level; containers have no fixed height |
| 2.4.7 | Focus visible | 3px ring in `--ring`, 2px offset, 6.7 against white |
| 2.4.11 | Focus not obscured | The 2px offset requires 4px of clearance; no fixed element overlaps scrollable content |
| 2.5.8 | Target size | 44 × 44px, above the 24 × 24 minimum |
| 2.3.3 | Motion | The `prefers-reduced-motion` block is already present in the styles file |

Criteria that this specification does not cover and that belong to the implementation
review: 3.3.7 redundant entry, 3.3.8 accessible authentication, 3.2.6 consistent help.
