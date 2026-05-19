# Gravity Forms Conditional Compass
<p align="center">
  <img src="assets/images/logo.png" alt="Gravity Forms Conditional Compass Logo" width="400">
</p>

Display field IDs, conditional logic badges, and an interactive visual trace directly in the Gravity Forms editor — so you always know which fields are pulling the strings.

## Inspect Conditional Logic

![Plugin Screenshot](https://github.com/guilamu/gf-conditional-compass/blob/main/screenshot-3.png)![Plugin Screenshot](https://github.com/guilamu/gf-conditional-compass/blob/main/screenshot-2.png)

- See field IDs inline with supported fields in the Gravity Forms editor, including section breaks
- Open a field's conditional logic settings by clicking any dependency badge in the builder canvas
- Spot upstream and downstream logic relationships with inline arrows, ALL/ANY indicators, and plain-language tooltips

## Trace And Reuse Rules

- Launch a guided visual trace from any clickable field ID badge to follow dependencies step by step
- Copy one field's conditional logic and paste it to multiple target fields with search and Shift+Click range selection
- Choose whether condition summaries stay visible while you review copied rules and target fields

## Document The Full Map

- Open a full-page conditional logic map from **Settings → Conditional Logic Map**
- Filter the output by **DEPENDS ON** or **USED BY** relationships to audit large forms faster
- Copy the generated map to the clipboard for documentation, QA notes, or client handoff

## Key Features

- **Gravity Forms Native UI:** Works inside the existing builder canvas, conditional logic panel, and editor preferences flyout
- **Multilingual:** All interface strings are available in English and French
- **Translation-Ready:** `.pot` and source `.po` files are included for additional locales
- **Secure:** Uses nonce verification, capability checks, and escaped output in admin flows
- **GitHub Updates:** Supports WordPress-style update checks and one-click installs from GitHub releases
- **Accessible:** Includes keyboard navigation for badges, toggles, and modal actions

## Requirements

- Gravity Forms 2.10 or higher
- WordPress 5.0 or higher
- PHP 7.0 or higher

## Installation

1. Upload the `gf-conditional-compass` folder to `/wp-content/plugins/`
2. Activate the plugin through the **Plugins** menu in WordPress
3. Open any form from the **Forms** menu to load the editor enhancements automatically
4. Use **Settings → Conditional Logic Map** to review the full logic map, or open **Editor Preferences** to hide badge types per user

## FAQ

### Do I need to configure anything?

No. Once activated, badges and the Visual Trace are available immediately in the Gravity Forms editor. No settings page is required.

### Which Gravity Forms versions are supported?

The plugin targets Gravity Forms 2.10 or higher. It relies on Gravity Forms' public editor APIs and the standard `gform_field_content` filter.

### Can I hide certain badge types?

Yes. Open the **Editor Preferences** flyout (cog icon next to the Save button) and use the Conditional Compass toggles to hide Field ID, "Depends on", "Used by", or "Copy" badges independently. Settings are saved per user.

### How does the auto-update work?

The plugin checks GitHub releases for newer versions and presents updates through the standard **Dashboard → Updates** screen — exactly like WordPress.org-hosted plugins.

### Can I customize the editor markup with a hook?

Yes. The plugin layers on top of Gravity Forms editor markup, so you can still add your own `gform_field_content` customization after Conditional Compass runs:

```php
add_filter( 'gform_field_content', function( $content, $field ) {
  if ( function_exists( 'GFCommon::is_form_editor' ) && GFCommon::is_form_editor() && 3 === (int) $field->id ) {
    $content .= '<p class="my-admin-note">Review this field before publishing.</p>';
  }

  return $content;
}, 20, 2 );
```

## Project Structure

```
gf-conditional-compass/
├── gf-conditional-compass.php                  # Main plugin bootstrap
├── README.md                                   # Plugin documentation
├── LICENSE                                     # Plugin license
├── assets/
│   ├── css/
│   │   ├── gf-conditional-compass.css          # Form builder badge styles
│   │   └── gf-conditional-compass-map.css      # Conditional Logic Map page styles
│   ├── images/
│   │   ├── icon-128x128.png                    # Small plugin icon
│   │   ├── icon-256x256.png                    # Large plugin icon
│   │   ├── logo.bw.svg                         # Monochrome logo asset
│   │   ├── logo.png                            # Main plugin logo
│   │   └── randomize.png                       # Arrow icon for badges
│   └── js/
│       ├── gf-conditional-compass.js           # Form builder interactions
│       └── gf-conditional-compass-map.js       # Conditional Logic Map interactions
├── includes/
│   ├── class-gf-conditional-compass-map.php    # Conditional Logic Map settings page
│   ├── class-github-updater.php                # GitHub auto-updates
│   └── Parsedown.php                           # Markdown parser for the plugin details modal
├── languages/
│   ├── gf-conditional-compass-fr_FR.mo         # French translation (binary)
│   ├── gf-conditional-compass-fr_FR.po         # French translation (source)
│   └── gf-conditional-compass.pot              # Translation template
```

## Changelog

### 1.3.3 - 2026-05-19
- **Improved:** Updated the GitHub auto-updater so the "View details" modal keeps its footer action button on already-current installs and reports tested WordPress compatibility through the expected update metadata
- **Fixed:** Refined conditional separator badge spacing for tighter alignment in the Gravity Forms editor

### 1.3.2 - 2026-05-10
- **Improved:** Normal fields now use the same dedicated badge row layout as Section and Submit fields for more consistent pill alignment in the Gravity Forms editor

### 1.3.1 - 2026-05-10
- **New:** Added submit button support to Conditional Compass badges, tracing, and copy/paste flows in the Gravity Forms editor

### 1.3.0 - 2026-05-10
- **New:** Added a WordPress-style "View details" modal that renders README tabs, GitHub release notes, and a styled plugin banner
- **Improved:** Refined the GitHub updater to use the canonical repository slug, complete WordPress update metadata, and Parsedown-based README rendering
- **Fixed:** Conditional Compass badges now appear on Section fields in the form editor

### 1.2.3 - 2026-02-16
- **New:** "Hide condition summaries" toggle in the Copy/Paste modal — uses the native Gravity Forms toggle to show or hide existing condition text per field

### 1.2.2 - 2026-02-16
- **Fixed:** Console warning `[GFCC] Editor flyout config not found` on the Form List page
- **Fixed:** Refined script/style enqueuing to only target the Gravity Forms editor
- **Improved:** Demoted flyout config missing message to a debug log for better resilience

### 1.2.1 - 2026-02-13
- **New:** Badge visibility toggles moved to the native Gravity Forms **Editor Preferences** flyout (cog icon)
- **New:** Per-user toggle persistence via `user_meta` (replaces localStorage)
- **New:** AJAX handler for saving editor preferences server-side

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
