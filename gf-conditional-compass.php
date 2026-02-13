<?php

/**
 * Plugin Name: Gravity Forms Conditional Compass
 * Plugin URI: https://github.com/guilamu/Gravity-Forms-Conditional-Compass
 * Description: Display field IDs and conditional logic dependencies in the Gravity Forms editor with live updates and clickable badges
 * Version: 1.2.1
 * Author: Guilamu
 * Author URI: https://github.com/guilamu
 * Text Domain: gf-conditional-compass
 * Domain Path: /languages
 * Update URI: https://github.com/guilamu/Gravity-Forms-Conditional-Compass/
 * Requires at least: 5.0
 * Requires PHP: 7.0
 * License: AGPL-3.0-or-later
 */

// Exit if accessed directly
if (! defined('ABSPATH')) {
	exit;
}

// Define plugin constants
define('GFFIELDIDCOND_VERSION', '1.2.1');
define('GFFIELDIDCOND_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('GFFIELDIDCOND_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include the GitHub auto-updater
require_once GFFIELDIDCOND_PLUGIN_DIR . 'includes/class-github-updater.php';

/**
 * Register with Guilamu Bug Reporter
 */
add_action('plugins_loaded', function () {
	if (class_exists('Guilamu_Bug_Reporter')) {
		Guilamu_Bug_Reporter::register(array(
			'slug'        => 'gf-conditional-compass',
			'name'        => 'Gravity Forms Conditional Compass',
			'version'     => GFFIELDIDCOND_VERSION,
			'github_repo' => 'guilamu/Gravity-Forms-Conditional-Compass',
		));
	}
}, 20);

/**
 * Add "Report a Bug" link to plugin row meta
 *
 * @param array  $links Plugin meta links.
 * @param string $file  Plugin file path.
 * @return array Modified links.
 */
function gfcc_plugin_row_meta($links, $file)
{
	if (plugin_basename(__FILE__) !== $file) {
		return $links;
	}

	if (class_exists('Guilamu_Bug_Reporter')) {
		$links[] = sprintf(
			'<a href="#" class="guilamu-bug-report-btn" data-plugin-slug="gf-conditional-compass" data-plugin-name="%s">%s</a>',
			esc_attr__('Gravity Forms Conditional Compass', 'gf-conditional-compass'),
			esc_html__('🐛 Report a Bug', 'gf-conditional-compass')
		);
	} else {
		$links[] = sprintf(
			'<a href="%s" target="_blank">%s</a>',
			'https://github.com/guilamu/guilamu-bug-reporter/releases',
			esc_html__('🐛 Report a Bug (install Bug Reporter)', 'gf-conditional-compass')
		);
	}

	return $links;
}
add_filter('plugin_row_meta', 'gfcc_plugin_row_meta', 10, 2);

/**
 * Load plugin textdomain for translations
 */
function gf_field_id_cond_load_textdomain()
{
	load_plugin_textdomain(
		'gf-conditional-compass',
		false,
		dirname(plugin_basename(__FILE__)) . '/languages'
	);
}
add_action('plugins_loaded', 'gf_field_id_cond_load_textdomain');

/**
 * Enqueue admin styles for form builder
 *
 * Uses early priority to ensure styles load before Gravity Forms editor styles.
 * Only loads on Gravity Forms editor pages.
 */
function gf_field_id_cond_enqueue_styles()
{
	$current_screen = get_current_screen();

	// Only load on Gravity Forms editor pages
	if ($current_screen && strpos($current_screen->id, 'gf_edit_forms') !== false) {
		wp_enqueue_style(
			'driver-js',
			GFFIELDIDCOND_PLUGIN_URL . 'assets/css/driver.css',
			array(),
			'1.0.1'
		);

		wp_enqueue_style(
			'gf-conditional-compass',
			GFFIELDIDCOND_PLUGIN_URL . 'assets/css/gf-conditional-compass.css',
			array('driver-js'),
			GFFIELDIDCOND_VERSION
		);
	}
}
add_action('admin_enqueue_scripts', 'gf_field_id_cond_enqueue_styles', 5);

/**
 * Fallback: Output CSS directly in admin_head if enqueue doesn't work
 *
 * This is a redundancy measure to ensure styles load even if wp_enqueue_style
 * fails due to plugin conflicts or timing issues.
 *
 * @return void
 */
function gf_field_id_cond_inline_css_fallback()
{
	$current_screen = get_current_screen();

	// Only on Gravity Forms editor pages
	if ($current_screen && strpos($current_screen->id, 'gf_edit_forms') !== false) {
		$css_url = GFFIELDIDCOND_PLUGIN_URL . 'assets/css/gf-conditional-compass.css';
		echo '<link rel="stylesheet" href="' . esc_url($css_url) . '?ver=' . esc_attr(GFFIELDIDCOND_VERSION) . '" type="text/css" media="all" />';
	}
}
add_action('admin_head', 'gf_field_id_cond_inline_css_fallback', 1);



/**
 * Enqueue JavaScript file for form builder functionality
 *
 * Only loads on Gravity Forms editor pages. Requires jQuery as a dependency.
 *
 * @return void
 */
function gf_field_id_cond_enqueue_scripts()
{
	$current_screen = get_current_screen();

	// Only load on Gravity Forms editor pages
	if ($current_screen && strpos($current_screen->id, 'gf_edit_forms') !== false) {
		wp_enqueue_script(
			'driver-js',
			GFFIELDIDCOND_PLUGIN_URL . 'assets/js/driver.js',
			array(),
			'1.0.1',
			true
		);

		wp_enqueue_script(
			'gf-conditional-compass',
			GFFIELDIDCOND_PLUGIN_URL . 'assets/js/gf-conditional-compass.js',
			array('jquery', 'driver-js'),
			GFFIELDIDCOND_VERSION,
			true
		);

		// Localize script with translations
		wp_localize_script(
			'gf-conditional-compass',
			'gfFieldIdCondTranslations',
			array(
				'currentTime'               => __('Current Time', 'gf-conditional-compass'),
				'currentDate'               => __('Current Date', 'gf-conditional-compass'),
				'yesterday'                 => __('Yesterday', 'gf-conditional-compass'),
				'tomorrow'                  => __('Tomorrow', 'gf-conditional-compass'),
				'lastWeek'                  => __('Last Week', 'gf-conditional-compass'),
				'nextWeek'                  => __('Next Week', 'gf-conditional-compass'),
				'lastMonth'                 => __('Last Month', 'gf-conditional-compass'),
				'nextMonth'                 => __('Next Month', 'gf-conditional-compass'),
				'lastYear'                  => __('Last Year', 'gf-conditional-compass'),
				'nextYear'                  => __('Next Year', 'gf-conditional-compass'),
				'field'                     => __('field', 'gf-conditional-compass'),
				'thisField'                 => __('This field', 'gf-conditional-compass'),
				'willBeDisplayedIf'         => __('will be displayed if', 'gf-conditional-compass'),
				'willBeHiddenIf'            => __('will be hidden if', 'gf-conditional-compass'),
				'isEmpty'                   => __('is empty', 'gf-conditional-compass'),
				'isNotEmpty'                => __('is not empty', 'gf-conditional-compass'),
				'hasConditionalLogic'       => __('Has conditional logic', 'gf-conditional-compass'),
				'usedInConditionalLogic'    => __('Used in conditional logic', 'gf-conditional-compass'),
				'usedAsConditionIn'         => __('Used as condition in', 'gf-conditional-compass'),
				'allConditionsMustBeMet'    => __('All conditions must be met', 'gf-conditional-compass'),
				'anyConditionCanBeMet'      => __('Any condition can be met', 'gf-conditional-compass'),
				'hideFieldIdBadges'         => __('Hide field ID badges', 'gf-conditional-compass'),
				'hideUsedDependencies'      => __('Hide "is used" dependencies', 'gf-conditional-compass'),
				'hideDependsOnDependencies' => __('Hide "depends on" dependencies', 'gf-conditional-compass'),
				'andConnector'              => __(' AND ', 'gf-conditional-compass'),
				'orConnector'               => __(' OR ', 'gf-conditional-compass'),
				'isUsedByField'             => __('Is used by field ', 'gf-conditional-compass'),
				'copyConditions'            => __('Copy Conditions', 'gf-conditional-compass'),
				'pasteConditionsTo'         => __('Paste Conditions to %d field(s)', 'gf-conditional-compass'),
				'selectFieldsToPaste'       => __('Paste conditions from field %d to', 'gf-conditional-compass'),
				'cancel'                    => __('Cancel', 'gf-conditional-compass'),
				'searchFields'              => __('Search fields...', 'gf-conditional-compass'),
				'noConditionsToCopy'        => __('No conditions to copy on this field.', 'gf-conditional-compass'),
				'conditionsCopied'          => __('Conditions copied!', 'gf-conditional-compass'),
				'conditionsPasted'          => __('Conditions pasted to %d field(s)!', 'gf-conditional-compass'),
				'operators'                 => array(
					'is'                 => __('is', 'gf-conditional-compass'),
					'isnot'              => __('is not', 'gf-conditional-compass'),
					'greaterThan'        => __('is greater than', 'gf-conditional-compass'),
					'lessThan'           => __('is less than', 'gf-conditional-compass'),
					'greaterThanOrEqual' => __('is greater than or equal to', 'gf-conditional-compass'),
					'lessThanOrEqual'    => __('is less than or equal to', 'gf-conditional-compass'),
					'contains'           => __('contains', 'gf-conditional-compass'),
					'startsWith'         => __('starts with', 'gf-conditional-compass'),
					'endsWith'           => __('ends with', 'gf-conditional-compass'),
					'isIn'               => __('is in', 'gf-conditional-compass'),
					'isNotIn'            => __('is not in', 'gf-conditional-compass'),
				),
			)
		);

		// Pass plugin URL to JavaScript
		wp_add_inline_script(
			'gf-conditional-compass',
			'var gfFieldIdCondPluginUrl = ' . json_encode(GFFIELDIDCOND_PLUGIN_URL) . ';',
			'before'
		);
	}
}
add_action('admin_enqueue_scripts', 'gf_field_id_cond_enqueue_scripts', 10);

/**
 * Display field IDs and conditional logic badges in form editor
 *
 * Adds a badge container with field ID after the field label/legend.
 * JavaScript will populate this container with conditional logic badges.
 *
 * @param string $content The field HTML content
 * @param object $field   The Gravity Forms field object
 * @return string Modified content with badge container
 */
add_filter('gform_field_content', function ($content, $field) {
	// Only modify content in form editor
	if (! GFCommon::is_form_editor()) {
		return $content;
	}

	// Validate field object
	if (! is_object($field) || ! isset($field->id)) {
		return $content;
	}

	// Build the initial badges HTML with a container
	$field_id = absint($field->id);
	$badges   = sprintf('<span class="gfcc-field-badges" data-field-id="%d">', $field_id);
	$badges  .= sprintf(
		'<span class="gfcc-inline-field-id">%s</span>',
		sprintf(esc_html__('ID: %d', 'gf-conditional-compass'), $field_id)
	);
	$badges  .= '</span>';

	// Insert badges after </label> or </legend> using regex
	$search  = '<\\/label>|<\\/legend>';
	$replace = sprintf('\\0 %s', $badges);
	$new     = preg_replace("/$search/", $replace, $content, 1);

	// Safety: if preg_replace fails, fall back to original content
	if ($new === null) {
		return $content;
	}

	return $new;
}, 10, 2);

/**
 * Load Conditional Logic Map class only if file exists
 *
 * This loads the settings page class for the Conditional Compass map feature.
 * Only loads after Gravity Forms is fully loaded.
 *
 * @return void
 */
function gf_field_id_cond_load_conditional_map()
{
	$class_file = GFFIELDIDCOND_PLUGIN_DIR . 'includes/class-gf-conditional-compass-map.php';

	if (! file_exists($class_file)) {
		return;
	}

	require_once $class_file;

	// Initialize Conditional Logic Map if class exists
	if (class_exists('GF_Conditional_Logic_Map')) {
		GF_Conditional_Logic_Map::get_instance();
	}
}
add_action('gform_loaded', 'gf_field_id_cond_load_conditional_map');

/**
 * Filter Gravity Forms Admin Config to inject our settings into the Editor Preferences flyout.
 */
add_filter('gform_config_data_gform_admin_config', function ($data) {
	// Guard: only inject if the editor_button component exists
	if (! isset($data['components']['editor_button'])) {
		return $data;
	}

	$user_id = get_current_user_id();

	// Define our settings keys (JS key => user_meta key)
	$settings = array(
		'gfccHideFieldId' => 'gfcc_hide_field_id_badges',
		'gfccHideDepends' => 'gfcc_hide_depends_deps',
		'gfccHideUsed'    => 'gfcc_hide_used_deps',
		'gfccHideCopy'    => 'gfcc_hide_copy_badge',
	);

	// Inject into the editor_button component config
	if (! isset($data['components']['editor_button']['conditionalCompass'])) {
		$data['components']['editor_button']['conditionalCompass'] = array();
	}

	foreach ($settings as $jsKey => $metaKey) {
		$val = get_user_meta($user_id, $metaKey, true);
		$data['components']['editor_button']['conditionalCompass'][$jsKey] = ($val === '1');
	}

	// Add translations for the flyout toggles
	$data['components']['editor_button']['conditionalCompass']['i18n'] = array(
		'hideFieldId' => __('Hide Field ID badges', 'gf-conditional-compass'),
		'hideDepends' => __('Hide "Depends on" badges', 'gf-conditional-compass'),
		'hideUsed'    => __('Hide "Used by" badges', 'gf-conditional-compass'),
		'hideCopy'    => __('Hide "Copy" badges', 'gf-conditional-compass'),
	);

	return $data;
});

/**
 * AJAX handler for saving Conditional Compass editor settings.
 */
add_action('wp_ajax_gfcc_save_editor_setting', function () {
	if (! current_user_can('gravityforms_edit_forms')) {
		wp_send_json_error('Unauthorized');
	}

	$setting = sanitize_text_field($_POST['setting']);
	$value   = sanitize_text_field($_POST['value']);

	$allowed_settings = array(
		'gfcc_hide_field_id_badges',
		'gfcc_hide_depends_deps',
		'gfcc_hide_used_deps',
		'gfcc_hide_copy_badge',
	);

	if (in_array($setting, $allowed_settings, true)) {
		update_user_meta(get_current_user_id(), $setting, $value);
		wp_send_json_success();
	} else {
		wp_send_json_error('Invalid setting');
	}
});
