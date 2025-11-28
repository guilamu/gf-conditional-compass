<?php
/**
 * Plugin Name: Gravity Forms Conditional Compass
 * Description: Display field IDs and conditional logic dependencies in the Gravity Forms editor with live updates and clickable badges
 * Version: 0.9.8
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
define( 'GFFIELDIDCOND_VERSION', '0.9.7' );
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
 * Enqueue admin styles - DUAL APPROACH for reliability
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
// Hook with EARLY priority 5 instead of default 10
add_action( 'admin_enqueue_scripts', 'gf_field_id_cond_enqueue_styles', 5 );

/**
 * Fallback: Output CSS directly in admin_head if enqueue doesn't work
 */
function gf_field_id_cond_inline_css_fallback() {
	$current_screen = get_current_screen();

	// Only on Gravity Forms editor pages
	if ( $current_screen && strpos( $current_screen->id, 'gf_edit_forms' ) !== false ) {
		$css_url = GFFIELDIDCOND_PLUGIN_URL . 'assets/css/gravity-conditional-compass.css';
		echo '<link rel="stylesheet" href="' . esc_url( $css_url ) . '?ver=' . GFFIELDIDCOND_VERSION . '" type="text/css" media="all" />';
	}
}
add_action( 'admin_head', 'gf_field_id_cond_inline_css_fallback', 1 );

/**
 * Output translations and plugin URL INLINE before loading external JavaScript
 */
add_action( 'gform_editor_js', function() {
	?>
	<script type="text/javascript">
		// Translations object - loaded BEFORE external JS file
		var gfFieldIdCondTranslations = {
			currentTime: <?php echo json_encode( __( 'Current Time', 'gravity-conditional-compass' ) ); ?>,
			currentDate: <?php echo json_encode( __( 'Current Date', 'gravity-conditional-compass' ) ); ?>,
			yesterday: <?php echo json_encode( __( 'Yesterday', 'gravity-conditional-compass' ) ); ?>,
			tomorrow: <?php echo json_encode( __( 'Tomorrow', 'gravity-conditional-compass' ) ); ?>,
			lastWeek: <?php echo json_encode( __( 'Last Week', 'gravity-conditional-compass' ) ); ?>,
			nextWeek: <?php echo json_encode( __( 'Next Week', 'gravity-conditional-compass' ) ); ?>,
			lastMonth: <?php echo json_encode( __( 'Last Month', 'gravity-conditional-compass' ) ); ?>,
			nextMonth: <?php echo json_encode( __( 'Next Month', 'gravity-conditional-compass' ) ); ?>,
			lastYear: <?php echo json_encode( __( 'Last Year', 'gravity-conditional-compass' ) ); ?>,
			nextYear: <?php echo json_encode( __( 'Next Year', 'gravity-conditional-compass' ) ); ?>,
			field: <?php echo json_encode( __( 'field', 'gravity-conditional-compass' ) ); ?>,
			thisField: <?php echo json_encode( __( 'This field', 'gravity-conditional-compass' ) ); ?>,
			willBeDisplayedIf: <?php echo json_encode( __( 'will be displayed if', 'gravity-conditional-compass' ) ); ?>,
			willBeHiddenIf: <?php echo json_encode( __( 'will be hidden if', 'gravity-conditional-compass' ) ); ?>,
			isEmpty: <?php echo json_encode( __( 'is empty', 'gravity-conditional-compass' ) ); ?>,
			isNotEmpty: <?php echo json_encode( __( 'is not empty', 'gravity-conditional-compass' ) ); ?>,
			hasConditionalLogic: <?php echo json_encode( __( 'Has conditional logic', 'gravity-conditional-compass' ) ); ?>,
			usedInConditionalLogic: <?php echo json_encode( __( 'Used in conditional logic', 'gravity-conditional-compass' ) ); ?>,
			usedAsConditionIn: <?php echo json_encode( __( 'Used as condition in', 'gravity-conditional-compass' ) ); ?>,
			allConditionsMustBeMet: <?php echo json_encode( __( 'All conditions must be met', 'gravity-conditional-compass' ) ); ?>,
			anyConditionCanBeMet: <?php echo json_encode( __( 'Any condition can be met', 'gravity-conditional-compass' ) ); ?>,
			hideFieldIdBadges: <?php echo json_encode( __( 'Hide field ID badges', 'gravity-conditional-compass' ) ); ?>,
			hideUsedDependencies: <?php echo json_encode( __( 'Hide "is used" dependencies', 'gravity-conditional-compass' ) ); ?>,
			hideDependsOnDependencies: <?php echo json_encode( __( 'Hide "depends on" dependencies', 'gravity-conditional-compass' ) ); ?>,
			operators: {
				is: <?php echo json_encode( __( 'is', 'gravity-conditional-compass' ) ); ?>,
				isnot: <?php echo json_encode( __( 'is not', 'gravity-conditional-compass' ) ); ?>,
				greaterThan: <?php echo json_encode( __( 'is greater than', 'gravity-conditional-compass' ) ); ?>,
				lessThan: <?php echo json_encode( __( 'is less than', 'gravity-conditional-compass' ) ); ?>,
				greaterThanOrEqual: <?php echo json_encode( __( 'is greater than or equal to', 'gravity-conditional-compass' ) ); ?>,
				lessThanOrEqual: <?php echo json_encode( __( 'is less than or equal to', 'gravity-conditional-compass' ) ); ?>,
				contains: <?php echo json_encode( __( 'contains', 'gravity-conditional-compass' ) ); ?>,
				startsWith: <?php echo json_encode( __( 'starts with', 'gravity-conditional-compass' ) ); ?>,
				endsWith: <?php echo json_encode( __( 'ends with', 'gravity-conditional-compass' ) ); ?>,
				isIn: <?php echo json_encode( __( 'is in', 'gravity-conditional-compass' ) ); ?>,
				isNotIn: <?php echo json_encode( __( 'is not in', 'gravity-conditional-compass' ) ); ?>
			}
		};

		// Pass plugin URL to JavaScript for the randomize.png image
		var gfFieldIdCondPluginUrl = <?php echo json_encode( GFFIELDIDCOND_PLUGIN_URL ); ?>;
	</script>
	<?php
}, 5 ); // Priority 5 - runs BEFORE the script enqueue priority 10

/**
 * Enqueue external JavaScript file
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
	}
}
add_action( 'admin_enqueue_scripts', 'gf_field_id_cond_enqueue_scripts', 10 );

/**
 * Display field IDs and conditional logic badges in form editor
 */
add_filter( 'gform_field_content', function( $content, $field ) {
	if ( ! GFCommon::is_form_editor() ) {
		return $content;
	}

	// Build the initial badges HTML with a container
	$badges  = sprintf( '<span class="gw-field-badges" data-field-id="%d">', $field->id );
	$badges .= sprintf(
		'<span class="gw-inline-field-id">%s</span>',
		sprintf( esc_html__( 'ID: %d', 'gravity-conditional-compass' ), $field->id )
	);
	$badges .= '</span>';

	// Insert badges after </label> or </legend> using a valid regex with delimiters
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
 */
function gf_field_id_cond_load_conditional_map() {
	$class_file = GFFIELDIDCOND_PLUGIN_DIR . 'includes/class-gravity-conditional-compass-map.php';

	if ( file_exists( $class_file ) ) {
		require_once $class_file;

		// Initialize Conditional Logic Map
		if ( class_exists( 'GF_Conditional_Logic_Map' ) ) {
			GF_Conditional_Logic_Map::get_instance();
		}
	}
}
add_action( 'gform_loaded', 'gf_field_id_cond_load_conditional_map' );
