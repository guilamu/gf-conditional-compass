# Gravity Forms Conditional Compass
<p align="center">
  <img src="assets/images/logo.png" alt="Gravity Forms Conditional Compass Logo" width="400">
</p>

Display field IDs, conditional logic badges, and an interactive visual trace directly in the Gravity Forms editor — so you always know which fields are pulling the strings.

## Form Editor Badges

![Plugin Screenshot](https://github.com/guilamu/Gravity-Forms-Conditional-Compass/blob/main/screenshot-3.png)![Plugin Screenshot](https://github.com/guilamu/Gravity-Forms-Conditional-Compass/blob/main/screenshot-2.png)

- **ID badges** show each field's unique identifier inline with its label
- **COND badges** reveal which fields are referenced in conditional logic rules
- **ALL/ANY indicators** display the logic type when multiple conditions are configured
- **Arrow symbols (→ / ←)** mark fields that have or are used in conditional logic
- **Tooltips** describe the full rule in plain language on hover
- **Clickable** — click any COND badge to jump to that field's conditional logic settings

## Visual Trace

- Click any **Field ID Badge** to launch an interactive guided tour of the field's conditional logic
- Navigate **upstream dependencies** (fields this field depends on) and **downstream effects** (fields that depend on it)
- Natural language descriptions explain each rule inside the popover
- Click field names inside the popover to re-centre the trace on a different field

## Copy/Paste Conditional Logic

- Copy conditional logic rules from one field and paste them to multiple other fields at once
- Search and select target fields in a modal with checkboxes and Shift+Click range selection
- Conditions are deep-copied — changes to the source afterwards do not affect pasted fields

## Conditional Logic Map

- Access a full-page text map of every conditional logic relationship in your form
- Filter by **DEPENDS ON** or **USED BY** relationships
- Toggle field numbers or types for a cleaner view
- Copy the entire map to clipboard for documentation

## Key Features

- **Multilingual:** All strings are internationalized (English and French included)
- **Translation-Ready:** `.pot` template included — add any language with Poedit
- **Secure:** Nonce-verified, capability-checked, escaped output throughout
- **GitHub Updates:** Automatic updates from GitHub releases via the WordPress admin
- **Performance:** Debounced updates, DOM caching, and efficient event handling
- **Accessible:** Full keyboard navigation (Tab, Enter, Space) with ARIA roles

## Requirements

- Gravity Forms plugin (any recent version)
- WordPress 5.0 or higher
- PHP 7.0 or higher

## Installation

1. Upload the `gf-conditional-compass` folder to `/wp-content/plugins/`
2. Activate the plugin through the **Plugins** menu in WordPress
3. Edit any Gravity Form — badges appear automatically
4. Access the **Conditional Logic Map** from the form **Settings** menu

## FAQ

### Do I need to configure anything?

No. Once activated, badges and the Visual Trace are available immediately in the Gravity Forms editor. No settings page is required.

### Which Gravity Forms versions are supported?

The plugin works with any recent version of Gravity Forms. It hooks into the standard `gform_field_content` filter and uses the public JavaScript API.

### Can I hide certain badge types?

Yes. Use the global toggles in the form editor settings panel to hide field ID badges, "is used" badges, or "depends on" badges independently.

### How does the auto-update work?

The plugin checks GitHub releases for newer versions and presents updates through the standard **Dashboard → Updates** screen — exactly like WordPress.org-hosted plugins.

## Project Structure

```
gf-conditional-compass/
├── gf-conditional-compass.php                  # Main plugin file
├── includes/
│   ├── class-gf-conditional-compass-map.php    # Conditional Logic Map settings page
│   └── class-github-updater.php                # GitHub auto-updates
├── assets/
│   ├── css/
│   │   ├── gf-conditional-compass.css          # Form builder badge styles
│   │   └── gf-conditional-compass-map.css      # Conditional Logic Map page styles
│   ├── images/
│   │   ├── icon-128x128.png
│   │   ├── icon-256x256.png
│   │   ├── logo.bw.svg
│   │   ├── logo.png
│   │   └── randomize.png                       # Arrow icon for badges
│   └── js/
│       ├── gf-conditional-compass.js           # Form builder functionality
│       └── gf-conditional-compass-map.js       # Conditional Logic Map functionality
├── languages/
│   ├── gf-conditional-compass-fr_FR.mo         # French translation (binary)
│   ├── gf-conditional-compass-fr_FR.po         # French translation (source)
│   └── gf-conditional-compass.pot              # Translation template
├── LICENSE
└── README.md
```

## Changelog

### 1.2.0 - 2026-02-11
- **New:** Copy/Paste Conditional Logic — copy rules from one field and paste them to multiple fields via a searchable modal
- **New:** Visual Trace — click a field ID to interactively explore upstream/downstream conditional logic relationships
- **New:** GitHub auto-updater and release workflow for one-click updates
- **New:** Guilamu Bug Reporter integration for streamlined issue reporting
- **Improved:** Renamed all CSS/JS prefixes from `gw-` to `gfcc-` to avoid Gravity Wiz conflicts
- **Improved:** Field names are now clickable links in Visual Trace descriptions
- **Fixed:** Popup modal display issues for the Copy/Paste feature
- **Fixed:** Translation strings for modal title and search placeholder

### 1.0.0 - 2025-11-30
- Initial release

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with love for the WordPress community
</p>
