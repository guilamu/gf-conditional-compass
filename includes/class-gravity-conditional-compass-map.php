<?php
/**
 * Conditional Logic Map Class
 *
 * Handles the form settings page for displaying conditional logic relationships
 *
 * @package Gravity_Conditional_Compass
 * @since 0.9.4
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class GF_Conditional_Logic_Map {

	/**
	 * Instance of this class
	 *
	 * @var GF_Conditional_Logic_Map
	 */
	private static $instance = null;

	/**
	 * Get instance of this class
	 *
	 * @return GF_Conditional_Logic_Map
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor
	 */
	public function __construct() {
		add_filter( 'gform_form_settings_menu', array( $this, 'add_settings_menu' ), 10, 2 );
		add_action( 'gform_form_settings_page_gf_conditional_logic_map', array( $this, 'settings_page' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Add settings menu item
	 *
	 * @param array $menu_items Menu items
	 * @param int   $form_id    Form ID
	 * @return array
	 */
		public function add_settings_menu( $menu_items, $form_id ) {

    		$icon_svg  = '';
    		$svg_path  = GFFIELDIDCOND_PLUGIN_DIR . 'assets/images/logo.bw.svg';
		
    		if ( file_exists( $svg_path ) ) {
        		$icon_svg = file_get_contents( $svg_path );
    		}
		
    		$menu_items[] = array(
        		'name'  => 'gf_conditional_logic_map',
        		'label' => __( 'Conditional Compass', 'gravity-conditional-compass' ),
        		'icon'  => $icon_svg, // must be SVG or icon classes, not <img>
    		);
    return $menu_items;
}


	/**
	 * Enqueue CSS and JS assets
	 *
	 * @param string $hook Current admin page hook
	 */
	public function enqueue_assets( $hook ) {
		// Only load on Gravity Forms settings pages
		if ( strpos( $hook, 'gf_edit_forms' ) === false ) {
			return;
		}

		// Check if we're on the conditional logic map page
		$subview = rgget( 'subview' );
		if ( $subview !== 'gf_conditional_logic_map' ) {
			return;
		}

		wp_enqueue_style(
			'gravity-conditional-compass-map',
			GFFIELDIDCOND_PLUGIN_URL . 'assets/css/gravity-conditional-compass-map.css',
			array(),
			GFFIELDIDCOND_VERSION
		);

		wp_enqueue_script(
			'gravity-conditional-compass-map',
			GFFIELDIDCOND_PLUGIN_URL . 'assets/js/gravity-conditional-compass-map.js',
			array( 'jquery' ),
			GFFIELDIDCOND_VERSION,
			true
		);

		// Pass translations to JS
		wp_localize_script(
			'gravity-conditional-compass-map',
			'gfCondLogicMapL10n',
			array(
				'copiedToClipboard' => __( 'Copied to clipboard!', 'gravity-conditional-compass' ),
				'copyFailed'        => __( 'Failed to copy. Please select and copy manually.', 'gravity-conditional-compass' ),
			)
		);
	}

	/**
	 * Render the settings page
	 */
	public function settings_page() {
		$form_id = rgget( 'id' );
		$form    = GFAPI::get_form( $form_id );

		if ( ! $form ) {
			echo '<p>' . esc_html__( 'Form not found.', 'gravity-conditional-compass' ) . '</p>';
			return;
		}

		GFFormSettings::page_header();
		$this->render_map_ui( $form );
		GFFormSettings::page_footer();
	}

	/**
	 * Generate the conditional logic text map
	 *
	 * @param array $form Form object
	 * @return string
	 */
	private function generate_map( $form ) {
		$map = "Form Conditional Logic Map\n";
		$map .= str_repeat( '═', 79 ) . "\n\n";

		if ( empty( $form['fields'] ) ) {
			$map .= __( 'No fields found.', 'gravity-conditional-compass' ) . "\n";
			return $map;
		}

		// Build a usage map (which fields are used by which fields)
		$usage_map = array();
		foreach ( $form['fields'] as $field ) {
			if ( ! empty( $field->conditionalLogic ) && ! empty( $field->conditionalLogic['rules'] ) ) {
				foreach ( $field->conditionalLogic['rules'] as $rule ) {
					$condition_field_id = $rule['fieldId'];
					if ( ! isset( $usage_map[ $condition_field_id ] ) ) {
						$usage_map[ $condition_field_id ] = array();
					}
					$usage_map[ $condition_field_id ][] = array(
						'field_id' => $field->id,
						'operator' => $rule['operator'],
						'value'    => isset( $rule['value'] ) ? $rule['value'] : '',
					);
				}
			}
		}

		// Operator mapping
		$operator_map = array(
			'is'          => __( 'is', 'gravity-conditional-compass' ),
			'isnot'       => __( 'is not', 'gravity-conditional-compass' ),
			'>'           => __( 'is greater than', 'gravity-conditional-compass' ),
			'<'           => __( 'is less than', 'gravity-conditional-compass' ),
			'>='          => __( 'is greater than or equal to', 'gravity-conditional-compass' ),
			'<='          => __( 'is less than or equal to', 'gravity-conditional-compass' ),
			'contains'    => __( 'contains', 'gravity-conditional-compass' ),
			'starts_with' => __( 'starts with', 'gravity-conditional-compass' ),
			'ends_with'   => __( 'ends with', 'gravity-conditional-compass' ),
		);

		// Generate map for each field
		foreach ( $form['fields'] as $field ) {
			$field_label = ! empty( $field->adminLabel ) ? $field->adminLabel : $field->label;
			$field_type  = ucfirst( $field->type );

			// Determine if field has dependencies
			$has_depends_on = ! empty( $field->conditionalLogic ) && ! empty( $field->conditionalLogic['rules'] );
			$has_used_by    = isset( $usage_map[ $field->id ] );

			// Mark unused fields (neither use conditions nor are used by others)
			$unused_start = ( ! $has_depends_on && ! $has_used_by ) ? '[UNUSED-START]' : '';
			$unused_end   = ( ! $has_depends_on && ! $has_used_by ) ? '[UNUSED-END]' : '';

			$map .= sprintf(
				"%s[FIELD-ID-START]Field %d[FIELD-ID-END] [FIELD-TYPE-START][%s][FIELD-TYPE-END] \"%s\"\n",
				$unused_start,
				$field->id,
				$field_type,
				$field_label
			);

			// DEPENDS ON (conditions FROM other fields)
			if ( $has_depends_on ) {
				$logic_type = isset( $field->conditionalLogic['logicType'] ) ? $field->conditionalLogic['logicType'] : 'all';

				foreach ( $field->conditionalLogic['rules'] as $index => $rule ) {
					$condition_field_id = $rule['fieldId'];
					$condition_field    = GFFormsModel::get_field( $form, $condition_field_id );
					$condition_label    = $condition_field ? ( ! empty( $condition_field->adminLabel ) ? $condition_field->adminLabel : $condition_field->label ) : "Field {$condition_field_id}";

					$operator = isset( $operator_map[ $rule['operator'] ] ) ? $operator_map[ $rule['operator'] ] : $rule['operator'];
					$value    = isset( $rule['value'] ) ? $rule['value'] : '';

					$action = ( $field->conditionalLogic['actionType'] === 'show' ) ? 'SHOW IF' : 'HIDE IF';

					// Build the sentence
					if ( $rule['operator'] === 'is' && empty( $value ) ) {
						$condition_text = sprintf(
							'[FIELD-ID-START]Field %d[FIELD-ID-END] "%s" is empty',
							$condition_field_id,
							$condition_label
						);
					} elseif ( $rule['operator'] === 'isnot' && empty( $value ) ) {
						$condition_text = sprintf(
							'[FIELD-ID-START]Field %d[FIELD-ID-END] "%s" is not empty',
							$condition_field_id,
							$condition_label
						);
					} else {
						$condition_text = sprintf(
							'[FIELD-ID-START]Field %d[FIELD-ID-END] "%s" %s %s',
							$condition_field_id,
							$condition_label,
							$operator,
							$value
						);
					}

					$map .= sprintf(
						"  ╚═[%s]═> %s\n",
						$action,
						$condition_text
					);

					// Add logic type indicator if there are multiple rules
					if ( count( $field->conditionalLogic['rules'] ) > 1 && $index < count( $field->conditionalLogic['rules'] ) - 1 ) {
						$logic_indicator = strtoupper( $logic_type );
						$map .= sprintf( "      [%s]\n", $logic_indicator );
					}
				}
			}

			// USED BY (conditions TO other fields that use this field)
			if ( $has_used_by ) {
				foreach ( $usage_map[ $field->id ] as $usage ) {
					$operator = isset( $operator_map[ $usage['operator'] ] ) ? $operator_map[ $usage['operator'] ] : $usage['operator'];
					$value    = $usage['value'];

					if ( $usage['operator'] === 'is' && empty( $value ) ) {
						$condition_desc = 'is empty';
					} elseif ( $usage['operator'] === 'isnot' && empty( $value ) ) {
						$condition_desc = 'is not empty';
					} else {
						$condition_desc = sprintf( '%s %s', $operator, $value );
					}

					$map .= sprintf(
						"  └─> IS USED BY [FIELD-ID-START]Field %d[FIELD-ID-END] (condition: %s)\n",
						$usage['field_id'],
						$condition_desc
					);
				}
			}

			$map .= $unused_end . "\n";
		}

		return $map;
	}

	/**
	 * Render the map UI
	 *
	 * @param array $form Form object
	 */
	private function render_map_ui( $form ) {
		$map_content = $this->generate_map( $form );
		?>
		<div class="gform-settings-panel">
			<header class="gform-settings-panel__header">
				<h4 class="gform-settings-panel__title"><?php esc_html_e( 'Conditional Compass', 'gravity-conditional-compass' ); ?></h4>
			</header>

			<div class="gform-settings-panel__content">
				<div class="gfcl-map-container">
					<div class="gfcl-map-header">
						<label class="gform-settings-label">
							<?php esc_html_e( 'Form Conditional Logic Overview', 'gravity-conditional-compass' ); ?>
						</label>
						<button type="button" class="button button-secondary gfcl-copy-button" id="gfcl-copy-map">
							<span class="dashicons dashicons-clipboard"></span>
							<?php esc_html_e( 'Copy to Clipboard', 'gravity-conditional-compass' ); ?>
						</button>
					</div>

					<!-- Filter Toggles -->
					<div class="gfcl-filters">
						<label class="gfcl-toggle">
							<input type="checkbox" id="gfcl-hide-field-number" class="gfcl-toggle-input">
							<span class="gfcl-toggle-slider"></span>
							<span class="gfcl-toggle-label"><?php esc_html_e( 'Hide field number', 'gravity-conditional-compass' ); ?></span>
						</label>

						<label class="gfcl-toggle">
							<input type="checkbox" id="gfcl-hide-field-type" class="gfcl-toggle-input">
							<span class="gfcl-toggle-slider"></span>
							<span class="gfcl-toggle-label"><?php esc_html_e( 'Hide field type', 'gravity-conditional-compass' ); ?></span>
						</label>

						<label class="gfcl-toggle">
							<input type="checkbox" id="gfcl-hide-unused" class="gfcl-toggle-input">
							<span class="gfcl-toggle-slider"></span>
							<span class="gfcl-toggle-label"><?php esc_html_e( 'Hide fields not in any condition', 'gravity-conditional-compass' ); ?></span>
						</label>

						<label class="gfcl-toggle">
							<input type="checkbox" id="gfcl-hide-used-by" class="gfcl-toggle-input">
							<span class="gfcl-toggle-slider"></span>
							<span class="gfcl-toggle-label"><?php esc_html_e( 'Hide "is used" dependencies', 'gravity-conditional-compass' ); ?></span>
						</label>

						<label class="gfcl-toggle">
							<input type="checkbox" id="gfcl-hide-depends-on" class="gfcl-toggle-input">
							<span class="gfcl-toggle-slider"></span>
							<span class="gfcl-toggle-label"><?php esc_html_e( 'Hide "depends on" dependencies', 'gravity-conditional-compass' ); ?></span>
						</label>
					</div>

					<textarea
						id="gfcl-map-textarea"
						class="gfcl-map-textarea"
						readonly
					><?php echo esc_textarea( $map_content ); ?></textarea>
					<p class="gfcl-help-text">
						<?php esc_html_e( 'This is a text-based map showing all conditional logic relationships in your form. Use the button above to copy the entire map to your clipboard.', 'gravity-conditional-compass' ); ?>
					</p>
					<div id="gfcl-copy-notice" class="gfcl-copy-notice" style="display: none;">
						<span class="dashicons dashicons-yes-alt"></span>
						<span class="gfcl-copy-notice-text"></span>
					</div>
				</div>
			</div>
		</div>
		<?php
	}
}
