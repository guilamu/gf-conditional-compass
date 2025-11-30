<?php
/**
 * Plugin Name: Gravity Forms Conditional Compass
 * Description: Display field IDs and conditional logic dependencies in the Gravity Forms editor with live updates and clickable badges
 * Version: 1.0
 * Text Domain: gravity-conditional-compass
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.0
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define plugin constants
define( 'GFFIELDIDCOND_VERSION', '1.0' );
define( 'GFFIELDIDCOND_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'GFFIELDIDCOND_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Load plugin textdomain for translations
 */
function gf_field_id_cond_load_textdomain() {
	load_plugin_textdomain(
		'gravity-conditional-compass',
		false,
		dirname( plugin_basename( __FILE__ ) ) . '/languages'
	);
}
add_action( 'plugins_loaded', 'gf_field_id_cond_load_textdomain' );

/**
 * Enqueue admin styles for form builder
 *
 * Uses early priority to ensure styles load before Gravity Forms editor styles.
 * Only loads on Gravity Forms editor pages.
 */
function gf_field_id_cond_enqueue_styles() {
	$current_screen = get_current_screen();

	// Only load on Gravity Forms editor pages
	if ( $current_screen && strpos( $current_screen->id, 'gf_edit_forms' ) !== false ) {
		wp_enqueue_style(
			'gravity-conditional-compass',
			GFFIELDIDCOND_PLUGIN_URL . 'assets/css/gravity-conditional-compass.css',
			array(),
			GFFIELDIDCOND_VERSION
		);
	}
}
add_action( 'admin_enqueue_scripts', 'gf_field_id_cond_enqueue_styles', 5 );

/**
 * Fallback: Output CSS directly in admin_head if enqueue doesn't work
 *
 * This is a redundancy measure to ensure styles load even if wp_enqueue_style
 * fails due to plugin conflicts or timing issues.
 *
 * @return void
 */
function gf_field_id_cond_inline_css_fallback() {
	$current_screen = get_current_screen();

	// Only on Gravity Forms editor pages
	if ( $current_screen && strpos( $current_screen->id, 'gf_edit_forms' ) !== false ) {
		$css_url = GFFIELDIDCOND_PLUGIN_URL . 'assets/css/gravity-conditional-compass.css';
		echo '<link rel="stylesheet" href="' . esc_url( $css_url ) . '?ver=' . esc_attr( GFFIELDIDCOND_VERSION ) . '" type="text/css" media="all" />';
	}
}
add_action( 'admin_head', 'gf_field_id_cond_inline_css_fallback', 1 );



/**
 * Enqueue JavaScript file for form builder functionality
 *
 * Only loads on Gravity Forms editor pages. Requires jQuery as a dependency.
 *
 * @return void
 */
function gf_field_id_cond_enqueue_scripts() {
	$current_screen = get_current_screen();

	// Only load on Gravity Forms editor pages
	if ( $current_screen && strpos( $current_screen->id, 'gf_edit_forms' ) !== false ) {
		wp_enqueue_script(
			'gravity-conditional-compass',
			GFFIELDIDCOND_PLUGIN_URL . 'assets/js/gravity-conditional-compass.js',
			array( 'jquery' ),
			GFFIELDIDCOND_VERSION,
			true
		);

		// Localize script with translations
		wp_localize_script(
			'gravity-conditional-compass',
			'gfFieldIdCondTranslations',
			array(
				'currentTime'               => __( 'Current Time', 'gravity-conditional-compass' ),
				'currentDate'               => __( 'Current Date', 'gravity-conditional-compass' ),
				'yesterday'                 => __( 'Yesterday', 'gravity-conditional-compass' ),
				'tomorrow'                  => __( 'Tomorrow', 'gravity-conditional-compass' ),
				'lastWeek'                  => __( 'Last Week', 'gravity-conditional-compass' ),
				'nextWeek'                  => __( 'Next Week', 'gravity-conditional-compass' ),
				'lastMonth'                 => __( 'Last Month', 'gravity-conditional-compass' ),
				'nextMonth'                 => __( 'Next Month', 'gravity-conditional-compass' ),
				'lastYear'                  => __( 'Last Year', 'gravity-conditional-compass' ),
				'nextYear'                  => __( 'Next Year', 'gravity-conditional-compass' ),
				'field'                     => __( 'field', 'gravity-conditional-compass' ),
				'thisField'                 => __( 'This field', 'gravity-conditional-compass' ),
				'willBeDisplayedIf'         => __( 'will be displayed if', 'gravity-conditional-compass' ),
				'willBeHiddenIf'            => __( 'will be hidden if', 'gravity-conditional-compass' ),
				'isEmpty'                   => __( 'is empty', 'gravity-conditional-compass' ),
				'isNotEmpty'                => __( 'is not empty', 'gravity-conditional-compass' ),
				'hasConditionalLogic'       => __( 'Has conditional logic', 'gravity-conditional-compass' ),
				'usedInConditionalLogic'    => __( 'Used in conditional logic', 'gravity-conditional-compass' ),
				'usedAsConditionIn'         => __( 'Used as condition in', 'gravity-conditional-compass' ),
				'allConditionsMustBeMet'    => __( 'All conditions must be met', 'gravity-conditional-compass' ),
				'anyConditionCanBeMet'      => __( 'Any condition can be met', 'gravity-conditional-compass' ),
				'hideFieldIdBadges'         => __( 'Hide field ID badges', 'gravity-conditional-compass' ),
				'hideUsedDependencies'      => __( 'Hide "is used" dependencies', 'gravity-conditional-compass' ),
				'hideDependsOnDependencies' => __( 'Hide "depends on" dependencies', 'gravity-conditional-compass' ),
				'operators'                 => array(
					'is'                 => __( 'is', 'gravity-conditional-compass' ),
					'isnot'              => __( 'is not', 'gravity-conditional-compass' ),
					'greaterThan'        => __( 'is greater than', 'gravity-conditional-compass' ),
					'lessThan'           => __( 'is less than', 'gravity-conditional-compass' ),
					'greaterThanOrEqual' => __( 'is greater than or equal to', 'gravity-conditional-compass' ),
					'lessThanOrEqual'    => __( 'is less than or equal to', 'gravity-conditional-compass' ),
					'contains'           => __( 'contains', 'gravity-conditional-compass' ),
					'startsWith'         => __( 'starts with', 'gravity-conditional-compass' ),
					'endsWith'           => __( 'ends with', 'gravity-conditional-compass' ),
					'isIn'               => __( 'is in', 'gravity-conditional-compass' ),
					'isNotIn'            => __( 'is not in', 'gravity-conditional-compass' ),
				),
			)
		);

		// Pass plugin URL to JavaScript
		wp_add_inline_script(
			'gravity-conditional-compass',
			'var gfFieldIdCondPluginUrl = ' . json_encode( GFFIELDIDCOND_PLUGIN_URL ) . ';',
			'before'
		);
	}
}
add_action( 'admin_enqueue_scripts', 'gf_field_id_cond_enqueue_scripts', 10 );

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
add_filter( 'gform_field_content', function( $content, $field ) {
	// Only modify content in form editor
	if ( ! GFCommon::is_form_editor() ) {
		return $content;
	}

	// Validate field object
	if ( ! is_object( $field ) || ! isset( $field->id ) ) {
		return $content;
	}

	// Build the initial badges HTML with a container
	$field_id = absint( $field->id );
	$badges   = sprintf( '<span class="gw-field-badges" data-field-id="%d">', $field_id );
	$badges  .= sprintf(
		'<span class="gw-inline-field-id">%s</span>',
		sprintf( esc_html__( 'ID: %d', 'gravity-conditional-compass' ), $field_id )
	);
	$badges  .= '</span>';

	// Insert badges after </label> or </legend> using regex
	$search  = '<\\/label>|<\\/legend>';
	$replace = sprintf( '\\0 %s', $badges );
	$new     = preg_replace( "/$search/", $replace, $content, 1 );

	// Safety: if preg_replace fails, fall back to original content
	if ( $new === null ) {
		return $content;
	}

	return $new;
}, 10, 2 );

/**
 * Load Conditional Logic Map class only if file exists
 *
 * This loads the settings page class for the Conditional Compass map feature.
 * Only loads after Gravity Forms is fully loaded.
 *
 * @return void
 */
function gf_field_id_cond_load_conditional_map() {
	$class_file = GFFIELDIDCOND_PLUGIN_DIR . 'includes/class-gravity-conditional-compass-map.php';

	if ( ! file_exists( $class_file ) ) {
		return;
	}

	require_once $class_file;

	// Initialize Conditional Logic Map if class exists
	if ( class_exists( 'GF_Conditional_Logic_Map' ) ) {
		GF_Conditional_Logic_Map::get_instance();
	}
}
add_action( 'gform_loaded', 'gf_field_id_cond_load_conditional_map' );
