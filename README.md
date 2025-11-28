# Gravity Forms Conditional Compass
<p align="center">
  <img src="assets/images/logo.png" alt="Gravity Conditional Compass Logo" width="400">
</p>
Display field IDs and conditional logic dependencies in the Gravity Forms editor with live updates and clickable badges.

## Features
![Plugin Screenshot](https://github.com/guilamu/Gravity-Forms-Conditional-Compass/blob/main/screenshot.png)
![Plugin Screenshot](https://github.com/guilamu/Gravity-Forms-Conditional-Compass/blob/main/screenshot-2.png)
- **Field ID Badges**: Display field IDs inline with field labels in the form editor
- **Conditional Logic Badges**: Show which fields are referenced in conditional logic rules
- **Conditional Logic Map**: Comprehensive overview of all conditional logic relationships in your form
- **Live Updates**: Badges update automatically when you modify conditional logic settings
- **Clickable Badges**: Click badges to jump directly to the conditional logic settings
- **Tooltips**: Hover over badges for detailed information in plain English (or French)
- **Visual Logic Type Indicators**: ALL/ANY badges show the logic type for multiple conditions
- **Multilingual**: Fully translatable (English and French included)

## Installation

1. Upload the `gravity-conditional-compass` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Edit any Gravity Form to see the field IDs and conditional logic badges
4. Access the Conditional Logic Map from the form settings menu

## Requirements

- WordPress 5.0 or higher
- PHP 7.0 or higher
- Gravity Forms plugin (any recent version)

## Usage

Once activated, the plugin automatically displays:

- **ID badges** next to each field label showing the field ID
- **Arrow symbols (→)** when a field has conditional logic
- **COND badges** showing which fields are referenced in the conditional logic
- **ALL/ANY badges** when multiple conditions are configured

### Interactions

- **Hover** over COND badges to see the full conditional logic rule in plain language
- **Click** on COND badges to open the conditional logic settings for that field
- **Hover** over ALL/ANY badges to see their meaning

### Conditional Logic Map

Access the Conditional Logic Map from the form settings menu to:

- View a comprehensive text-based map of all conditional logic relationships
- Filter view by dependencies (DEPENDS ON / USED BY)
- Show only fields with conditional logic
- Hide field numbers or types for cleaner output
- Copy the entire map to clipboard for documentation

## Translations

The plugin is translation-ready and includes:

- English (default)
- French (Français)

### Adding Your Own Translation

1. Use the `.pot` file in `/languages/` as a template
2. Create a `.po` file for your language (e.g., `gravity-conditional-compass-de_DE.po` for German)
3. Translate all strings
4. Compile to `.mo` using Poedit or msgfmt:
   ```bash
   msgfmt -o gravity-conditional-compass-de_DE.mo gravity-conditional-compass-de_DE.po
   ```
5. Place both `.po` and `.mo` files in the `/languages/` folder

## Badge Types

### Field ID Badge
- **Display**: `ID: 1`
- **Color**: Light blue/purple
- **Purpose**: Shows the field's unique identifier

### Conditional Logic Badges
- **Display**: `COND: 4` (where 4 is the referenced field ID)
- **Color**: Orange (for ALL logic) or Green (for ANY logic)
- **Purpose**: Shows which fields control this field's visibility
- **Interactive**: Click to open conditional logic settings
- **Tooltip**: Displays full rule in natural language

### Logic Type Badges
- **Display**: `ALL` or `ANY`
- **Color**: Matches the COND badge color
- **Purpose**: Indicates whether all or any conditions must be met
- **Tooltip**: "All conditions must be met" or "Any condition can be met"

## Changelog

### Version 0.9.7 - 2025-11-28

#### Major Update: Plugin Renamed
- **New Name**: Gravity Conditional Compass (formerly "Gravity Forms Field ID and Conditional Logic Display")
- Updated all file names and references
- Updated text domain to `gravity-conditional-compass`
- Updated folder structure and naming conventions

#### Improvements
- Refined file organization
- Updated documentation
- Improved code consistency

### Version 0.9.6 - 2025-11-27

#### New Features
- Added Conditional Logic Map feature
- Comprehensive overview of all conditional logic relationships
- Filterable view options
- Copy to clipboard functionality

### Version 0.9 - 2025-11-26

#### Initial Release
- Display field IDs inline with field labels
- Show conditional logic dependencies as clickable badges
- Live updates when modifying conditional logic
- Tooltips with natural language descriptions
- Multilingual support (English and French)
- ALL/ANY logic type indicators
- Click badges to open conditional logic settings

## Support

For issues, questions, or feature requests, please visit the [GitHub repository](https://github.com/guilamu/Gravity-Conditional-Compass).

## License

This plugin is licensed under the GNU Affero General Public License v3.0.
