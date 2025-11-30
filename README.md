# Gravity Forms Conditional Compass
<p align="center">
  <img src="assets/images/logo.png" alt="Gravity Conditional Compass Logo" width="400">
</p>
Ever felt hopelessly lost in your own Gravity Forms conditional logic, like you built a maze and then misplaced the map? This plugin is your sarcastic little compass: it turns that wall of IFs and ANDs into a readable Conditional Logic Map and sprinkles clickable conditional badges directly in the form builder so you can see exactly which fields are pulling the strings!

## Features
![Plugin Screenshot](https://github.com/guilamu/Gravity-Forms-Conditional-Compass/blob/main/screenshot-3.png)![Plugin Screenshot](https://github.com/guilamu/Gravity-Forms-Conditional-Compass/blob/main/screenshot-2.png)

- **Field ID Badges**: Display field IDs inline with field labels in the form editor
- **Conditional Logic Badges**: Show which fields are referenced in conditional logic rules
- **Conditional Logic Map**: Comprehensive overview of all conditional logic relationships in your form
- **Live Updates**: Badges update automatically when you modify conditional logic settings (optimized with debouncing)
- **Clickable Badges**: Click badges to jump directly to the conditional logic settings
- **Keyboard Navigation**: Full keyboard accessibility support (Tab, Enter, Space)
- **Tooltips**: Hover over badges for detailed information in plain English (or French)
- **Visual Logic Type Indicators**: ALL/ANY badges show the logic type for multiple conditions
- **Global Toggles**: Hide/show badge types via settings panel
- **Performance Optimized**: Debounced updates, DOM caching, and efficient event handling
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
- **Keyboard Navigation**: Use Tab to navigate to badges, Enter or Space to activate
- **Hover** over ALL/ANY badges to see their meaning
- **Toggle Badges**: Use the global toggles in the settings panel to hide/show badge types

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

## Plugin Structure

```
gravity-conditional-compass/
├── assets/
│   ├── css/
│   │   ├── gravity-conditional-compass.css          # Form builder badge styles
│   │   └── gravity-conditional-compass-map.css     # Conditional Logic Map page styles
│   ├── images/
│   │   ├── icon-128x128.png
│   │   ├── icon-256x256.png
│   │   ├── logo.bw.svg
│   │   ├── logo.png
│   │   └── randomize.png                            # Arrow icon for badges
│   └── js/
│       ├── gravity-conditional-compass.js           # Form builder functionality
│       └── gravity-conditional-compass-map.js      # Conditional Logic Map functionality
├── includes/
│   └── class-gravity-conditional-compass-map.php   # Conditional Logic Map settings page class
├── languages/
│   ├── gravity-conditional-compass-fr_FR.mo        # French translation (compiled)
│   ├── gravity-conditional-compass-fr_FR.po        # French translation (source)
│   └── gravity-conditional-compass.pot             # Translation template
├── gravity-conditional-compass.php                  # Main plugin file
├── LICENSE
├── README.md
└── Screenshot.png
```

### File Descriptions

- **gravity-conditional-compass.php**: Main plugin file that handles initialization, asset enqueuing, and field content filtering
- **assets/js/gravity-conditional-compass.js**: Core JavaScript for form builder badges, conditional logic detection, and badge interactions
- **assets/js/gravity-conditional-compass-map.js**: JavaScript for the Conditional Logic Map settings page (filtering, copy functionality)
- **assets/css/gravity-conditional-compass.css**: Styles for form builder badges and tooltips
- **assets/css/gravity-conditional-compass-map.css**: Styles for the Conditional Logic Map settings page
- **includes/class-gravity-conditional-compass-map.php**: PHP class handling the Conditional Logic Map settings page generation and display

## Changelog

### Version 1.0 - 2025-11-30
#### Initial Release

## Development

### Code Structure
- **PHP**: Object-oriented approach with singleton pattern for settings page
- **JavaScript**: Modular functions with clear separation of concerns
- **CSS**: Organized with comments and logical grouping

## Support

For issues, questions, or feature requests, please visit the [GitHub repository](https://github.com/guilamu/Gravity-Conditional-Compass).

## License

This plugin is licensed under the GNU Affero General Public License v3.0.
