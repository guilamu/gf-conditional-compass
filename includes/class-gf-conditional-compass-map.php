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
if (! defined('ABSPATH')) {
	exit;
}

/**
 * Class GF_Conditional_Logic_Map
 *
 * Singleton class for managing the Conditional Logic Map settings page.
 */
class GF_Conditional_Logic_Map
{

	/**
	 * Instance of this class
	 *
	 * @var GF_Conditional_Logic_Map|null
	 */
	private static $instance = null;

	/**
	 * Operator translation map
	 *
	 * @var array
	 */
	private static $operator_map = array(
		'is'          => 'is',
		'isnot'       => 'is not',
		'>'           => 'is greater than',
		'<'           => 'is less than',
		'>='          => 'is greater than or equal to',
		'<='          => 'is less than or equal to',
		'contains'    => 'contains',
		'starts_with' => 'starts with',
		'ends_with'   => 'ends with',
	);

	/**
	 * Get instance of this class
	 *
	 * @return GF_Conditional_Logic_Map
	 */
	public static function get_instance()
	{
		if (null === self::$instance) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor
	 */
	private function __construct()
	{
		add_filter('gform_form_settings_menu', array($this, 'add_settings_menu'), 10, 2);
		add_action('gform_form_settings_page_gf_conditional_logic_map', array($this, 'settings_page'));
		add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
	}

	/**
	 * Get the compass icon SVG markup
	 *
	 * @return string SVG icon markup
	 */
	private function get_compass_icon()
	{
		return '<svg width="20" height="20" viewBox="0 0 570 570" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
			<g transform="translate(0,570) scale(0.1,-0.1)">
				<path d="M2595 5689 c-241 -23 -506 -83 -730 -165 -263 -97 -583 -278 -800 -454 -44 -35 -136 -118 -204 -184 -890 -870 -1114 -2197 -558 -3309 367 -736 1048 -1285 1842 -1487 670 -171 1359 -97 1975 211 287 144 505 302 741 538 236 236 394 454 538 741 401 803 401 1737 0 2540 -174 347 -425 665 -724 917 -227 191 -559 384 -840 487 -386 142 -838 202 -1240 165z m513 -399 c196 -21 418 -73 592 -137 807 -301 1399 -1001 1559 -1843 56 -292 56 -628 0 -920 -131 -690 -555 -1292 -1161 -1651 -301 -179 -641 -292 -990 -329 -125 -13 -391 -13 -516 0 -926 99 -1718 715 -2045 1590 -149 401 -188 873 -106 1311 179 966 960 1757 1923 1945 214 41 533 56 744 34z"/>
				<path d="M3910 4449 c-30 -4 -73 -14 -95 -22 -89 -33 -1544 -671 -1595 -700 -71 -41 -197 -161 -237 -229 -32 -52 -679 -1526 -713 -1624 -60 -170 -13 -361 119 -487 118 -113 287 -162 437 -127 63 14 1615 694 1681 736 88 56 183 160 230 251 23 43 189 420 371 838 349 801 361 835 347 944 -21 151 -91 266 -210 343 -97 63 -226 93 -335 77z m125 -414 c16 -15 25 -36 25 -54 0 -35 -647 -1527 -688 -1586 -15 -22 -45 -52 -67 -67 -55 -38 -1553 -690 -1588 -691 -39 -1 -77 38 -77 79 0 22 115 297 324 776 178 409 333 762 344 784 33 65 87 105 227 167 740 327 1415 616 1443 616 22 1 41 -7 57 -24z"/>
				<path d="M2757 3230 c-111 -28 -209 -110 -260 -218 -29 -61 -32 -76 -32 -162 0 -86 3 -101 32 -162 40 -84 107 -151 193 -192 58 -28 75 -31 160 -31 85 0 102 3 160 31 83 39 155 111 194 194 28 58 31 75 31 160 0 85 -3 102 -31 160 -64 136 -186 219 -332 226 -42 2 -94 -1 -115 -6z"/>
			</g>
		</svg>';
	}

	/**
	 * Add settings menu item
	 *
	 * @param array $menu_items Menu items
	 * @param int   $form_id    Form ID
	 * @return array Modified menu items
	 */
	public function add_settings_menu($menu_items, $form_id)
	{
		$menu_items[] = array(
			'name'  => 'gf_conditional_logic_map',
			'label' => 'Conditional Compass',
			'icon'  => $this->get_compass_icon(),
		);

		return $menu_items;
	}

	/**
	 * Enqueue CSS and JS assets
	 *
	 * Only loads assets on the Conditional Logic Map settings page.
	 *
	 * @param string $hook Current admin page hook
	 * @return void
	 */
	public function enqueue_assets($hook)
	{
		// Early return if not on Gravity Forms settings pages
		if (strpos($hook, 'gf_edit_forms') === false) {
			return;
		}

		// Early return if not on the conditional logic map page
		$subview = sanitize_text_field(rgget('subview'));
		if ($subview !== 'gf_conditional_logic_map') {
			return;
		}

		// Enqueue styles
		wp_enqueue_style(
			'gf-conditional-compass-map',
			GFFIELDIDCOND_PLUGIN_URL . 'assets/css/gf-conditional-compass-map.css',
			array(),
			GFFIELDIDCOND_VERSION
		);

		// Enqueue main JavaScript file (needed for form builder badge toggles)
		wp_enqueue_script(
			'gf-conditional-compass',
			GFFIELDIDCOND_PLUGIN_URL . 'assets/js/gf-conditional-compass.js',
			array('jquery'),
			GFFIELDIDCOND_VERSION,
			true
		);

		// Pass translations to main JS file (required for badge functionality)
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
				'operators'                 => array(
					'is'                   => __('is', 'gf-conditional-compass'),
					'isnot'                => __('is not', 'gf-conditional-compass'),
					'greaterThan'          => __('is greater than', 'gf-conditional-compass'),
					'lessThan'             => __('is less than', 'gf-conditional-compass'),
					'greaterThanOrEqual'   => __('is greater than or equal to', 'gf-conditional-compass'),
					'lessThanOrEqual'      => __('is less than or equal to', 'gf-conditional-compass'),
					'contains'             => __('contains', 'gf-conditional-compass'),
					'startsWith'           => __('starts with', 'gf-conditional-compass'),
					'endsWith'             => __('ends with', 'gf-conditional-compass'),
					'isIn'                 => __('is in', 'gf-conditional-compass'),
					'isNotIn'              => __('is not in', 'gf-conditional-compass'),
				),
			)
		);

		// Pass plugin URL to main JS
		wp_add_inline_script(
			'gf-conditional-compass',
			'var gfFieldIdCondPluginUrl = ' . json_encode(GFFIELDIDCOND_PLUGIN_URL) . ';',
			'before'
		);

		// Enqueue map-specific JavaScript
		wp_enqueue_script(
			'gf-conditional-compass-map',
			GFFIELDIDCOND_PLUGIN_URL . 'assets/js/gf-conditional-compass-map.js',
			array('jquery', 'gf-conditional-compass'),
			GFFIELDIDCOND_VERSION,
			true
		);

		// Localize map script with translations
		wp_localize_script(
			'gf-conditional-compass-map',
			'gfCondLogicMapL10n',
			array(
				'copiedToClipboard' => __('Copied to clipboard!', 'gf-conditional-compass'),
				'copyFailed'        => __('Failed to copy. Please select and copy manually.', 'gf-conditional-compass'),
				'naturalLanguage'   => __('Natural Language', 'gf-conditional-compass'),
				'sentenceStart'     => __('The %1$s field (%2$s),', 'gf-conditional-compass'),
				'willBeShown'       => __('will be shown if', 'gf-conditional-compass'),
				'willBeHidden'      => __('will be hidden if', 'gf-conditional-compass'),
				'connectorAnd'      => __(' AND ', 'gf-conditional-compass'),
				'connectorOr'       => __(' OR ', 'gf-conditional-compass'),
				'conditionPart'     => __('the %1$s field (%2$s) %3$s', 'gf-conditional-compass'),
			)
		);
	}

	/**
	 * Render the settings page
	 *
	 * @return void
	 */
	public function settings_page()
	{
		$form_id = absint(rgget('id'));

		if (! $form_id) {
			$this->render_error_message(__('Invalid form ID.', 'gf-conditional-compass'));
			return;
		}

		$form = GFAPI::get_form($form_id);

		if (is_wp_error($form) || ! $form) {
			$this->render_error_message(__('Form not found.', 'gf-conditional-compass'));
			return;
		}

		// Validate form structure
		if (! is_array($form) || ! isset($form['fields'])) {
			$this->render_error_message(__('Invalid form structure.', 'gf-conditional-compass'));
			return;
		}

		GFFormSettings::page_header();
		$this->render_map_ui($form);
		GFFormSettings::page_footer();
	}

	/**
	 * Render error message
	 *
	 * @param string $message Error message to display
	 * @return void
	 */
	private function render_error_message($message)
	{
		echo '<div class="notice notice-error"><p>' . esc_html($message) . '</p></div>';
	}

	/**
	 * Get form title and description for display
	 *
	 * @param array $form Form object
	 * @return array Array with 'name' and 'description' keys
	 */
	private function get_form_info($form)
	{
		return array(
			'name'        => ! empty($form['title']) ? $form['title'] : __('Untitled Form', 'gf-conditional-compass'),
			'description' => ! empty($form['description']) ? $form['description'] : '',
		);
	}

	/**
	 * Get formatted map title
	 *
	 * @param array $form Form object
	 * @return string Formatted title
	 */
	private function get_map_title($form)
	{
		$form_info = $this->get_form_info($form);

		if (! empty($form_info['description'])) {
			return sprintf(
				__('Conditional Logic Map for form %s (%s)', 'gf-conditional-compass'),
				$form_info['name'],
				$form_info['description']
			);
		}

		return sprintf(
			__('Conditional Logic Map for form %s', 'gf-conditional-compass'),
			$form_info['name']
		);
	}

	/**
	 * Generate the conditional logic text map
	 *
	 * Uses array-based string building for better performance with large forms.
	 *
	 * @param array $form Form object
	 * @return string Generated map text
	 */
	private function generate_map($form)
	{
		$form_info = $this->get_form_info($form);
		$map_lines = array();

		// Build title
		if (! empty($form_info['description'])) {
			$title = sprintf(
				__('Conditional Logic Map for form %s (%s)', 'gf-conditional-compass'),
				$form_info['name'],
				$form_info['description']
			);
		} else {
			$title = sprintf(
				__('Conditional Logic Map for form %s', 'gf-conditional-compass'),
				$form_info['name']
			);
		}

		$map_lines[] = $title;
		$map_lines[] = str_repeat('═', 79);
		$map_lines[] = ''; // Empty line

		// Early return if no fields
		if (empty($form['fields']) || ! is_array($form['fields'])) {
			$map_lines[] = __('No fields found.', 'gf-conditional-compass');
			return implode("\n", $map_lines);
		}

		// Build usage map (which fields are used by which fields)
		$usage_map = $this->build_usage_map($form['fields']);

		// Get translated operator map
		$operator_map = $this->get_operator_map();

		// Generate map for each field
		foreach ($form['fields'] as $field) {
			if (! is_object($field) || ! isset($field->id)) {
				continue; // Skip invalid fields
			}

			$field_lines = $this->generate_field_map($field, $form, $usage_map, $operator_map);
			$map_lines   = array_merge($map_lines, $field_lines);
		}

		return implode("\n", $map_lines);
	}

	/**
	 * Build usage map showing which fields are used by which fields
	 *
	 * @param array $fields Array of field objects
	 * @return array Usage map array
	 */
	private function build_usage_map($fields)
	{
		$usage_map = array();

		if (! is_array($fields)) {
			return $usage_map;
		}

		foreach ($fields as $field) {
			if (! is_object($field) || empty($field->conditionalLogic) || empty($field->conditionalLogic['rules'])) {
				continue;
			}

			foreach ($field->conditionalLogic['rules'] as $rule) {
				if (! isset($rule['fieldId'])) {
					continue;
				}

				$condition_field_id = absint($rule['fieldId']);

				if (! isset($usage_map[$condition_field_id])) {
					$usage_map[$condition_field_id] = array();
				}

				$usage_map[$condition_field_id][] = array(
					'field_id' => $field->id,
					'operator' => isset($rule['operator']) ? $rule['operator'] : '',
					'value'    => isset($rule['value']) ? $rule['value'] : '',
				);
			}
		}

		return $usage_map;
	}

	/**
	 * Get translated operator map
	 *
	 * @return array Operator map with translated strings
	 */
	private function get_operator_map()
	{
		$map = array();

		foreach (self::$operator_map as $key => $value) {
			$map[$key] = __($value, 'gf-conditional-compass');
		}

		return $map;
	}

	/**
	 * Generate map lines for a single field
	 *
	 * @param object $field        Field object
	 * @param array  $form         Form object
	 * @param array  $usage_map    Usage map
	 * @param array  $operator_map Operator map
	 * @return array Array of map lines for this field
	 */
	private function generate_field_map($field, $form, $usage_map, $operator_map)
	{
		$lines = array();

		// Get field properties with fallbacks
		$field_label = ! empty($field->adminLabel) ? $field->adminLabel : (! empty($field->label) ? $field->label : '');
		$field_type  = ! empty($field->type) ? ucfirst($field->type) : 'Unknown';

		// Determine if field has dependencies
		$has_depends_on = ! empty($field->conditionalLogic) && ! empty($field->conditionalLogic['rules']);
		$has_used_by    = isset($usage_map[$field->id]);

		// Mark unused fields
		$is_unused = ! $has_depends_on && ! $has_used_by;
		$unused_start = $is_unused ? '[UNUSED-START]' : '';
		$unused_end   = $is_unused ? '[UNUSED-END]' : '';

		// Field header line
		$lines[] = sprintf(
			'%s[FIELD-ID-START]Field %d[FIELD-ID-END] [FIELD-TYPE-START][%s][FIELD-TYPE-END] "%s"',
			$unused_start,
			$field->id,
			$field_type,
			$field_label
		);

		// DEPENDS ON (conditions FROM other fields)
		if ($has_depends_on) {
			$depends_lines = $this->generate_depends_on_lines($field, $form, $operator_map);
			$lines         = array_merge($lines, $depends_lines);
		}

		// USED BY (conditions TO other fields that use this field)
		if ($has_used_by) {
			$used_by_lines = $this->generate_used_by_lines($field, $usage_map, $operator_map);
			$lines         = array_merge($lines, $used_by_lines);
		}

		// Close unused marker
		$lines[] = $unused_end;

		return $lines;
	}

	/**
	 * Generate "depends on" lines for a field
	 *
	 * @param object $field        Field object
	 * @param array  $form         Form object
	 * @param array  $operator_map Operator map
	 * @return array Array of lines
	 */
	private function generate_depends_on_lines($field, $form, $operator_map)
	{
		$lines      = array();
		$logic_type = isset($field->conditionalLogic['logicType']) ? $field->conditionalLogic['logicType'] : 'all';
		$rules      = $field->conditionalLogic['rules'];
		$rules_count = count($rules);

		foreach ($rules as $index => $rule) {
			if (! isset($rule['fieldId'])) {
				continue;
			}

			$condition_field_id = absint($rule['fieldId']);
			$condition_field    = GFFormsModel::get_field($form, $condition_field_id);

			// Get condition field label with fallback
			if ($condition_field && is_object($condition_field)) {
				$condition_label = ! empty($condition_field->adminLabel) ? $condition_field->adminLabel : (! empty($condition_field->label) ? $condition_field->label : "Field {$condition_field_id}");
			} else {
				$condition_label = "Field {$condition_field_id}";
			}

			$operator = isset($rule['operator']) && isset($operator_map[$rule['operator']]) ? $operator_map[$rule['operator']] : (isset($rule['operator']) ? $rule['operator'] : '');
			$value    = isset($rule['value']) ? $rule['value'] : '';

			$action = (isset($field->conditionalLogic['actionType']) && $field->conditionalLogic['actionType'] === 'show') ? 'SHOW IF' : 'HIDE IF';

			// Build condition text
			$condition_text = $this->format_condition_text($condition_field_id, $condition_label, $rule['operator'], $operator, $value);

			$lines[] = sprintf('  ╚═[%s]═> %s', $action, $condition_text);

			// Add logic type indicator if there are multiple rules and not the last one
			if ($rules_count > 1 && $index < $rules_count - 1) {
				$lines[] = sprintf('      [%s]', strtoupper($logic_type));
			}
		}

		return $lines;
	}

	/**
	 * Format condition text for display
	 *
	 * @param int    $field_id        Condition field ID
	 * @param string $field_label      Condition field label
	 * @param string $operator_key     Operator key (is, isnot, etc.)
	 * @param string $operator_label   Translated operator label
	 * @param string $value            Condition value
	 * @return string Formatted condition text
	 */
	private function format_condition_text($field_id, $field_label, $operator_key, $operator_label, $value)
	{
		// Handle special cases for empty/not empty
		if ($operator_key === 'is' && empty($value)) {
			return sprintf(
				'[FIELD-ID-START]Field %d[FIELD-ID-END] "%s" is empty',
				$field_id,
				$field_label
			);
		}

		if ($operator_key === 'isnot' && empty($value)) {
			return sprintf(
				'[FIELD-ID-START]Field %d[FIELD-ID-END] "%s" is not empty',
				$field_id,
				$field_label
			);
		}

		// Standard condition format
		return sprintf(
			'[FIELD-ID-START]Field %d[FIELD-ID-END] "%s" %s %s',
			$field_id,
			$field_label,
			$operator_label,
			$value
		);
	}

	/**
	 * Generate "used by" lines for a field
	 *
	 * @param object $field        Field object
	 * @param array  $usage_map    Usage map
	 * @param array  $operator_map Operator map
	 * @return array Array of lines
	 */
	private function generate_used_by_lines($field, $usage_map, $operator_map)
	{
		$lines = array();

		if (! isset($usage_map[$field->id]) || ! is_array($usage_map[$field->id])) {
			return $lines;
		}

		foreach ($usage_map[$field->id] as $usage) {
			if (! isset($usage['field_id']) || ! isset($usage['operator'])) {
				continue;
			}

			$operator = isset($operator_map[$usage['operator']]) ? $operator_map[$usage['operator']] : $usage['operator'];
			$value    = isset($usage['value']) ? $usage['value'] : '';

			// Format condition description
			if ($usage['operator'] === 'is' && empty($value)) {
				$condition_desc = 'is empty';
			} elseif ($usage['operator'] === 'isnot' && empty($value)) {
				$condition_desc = 'is not empty';
			} else {
				$condition_desc = sprintf('%s %s', $operator, $value);
			}

			$lines[] = sprintf(
				'  └─> IS USED BY [FIELD-ID-START]Field %d[FIELD-ID-END] (condition: %s)',
				$usage['field_id'],
				$condition_desc
			);
		}

		return $lines;
	}

	/**
	 * Render the map UI
	 *
	 * @param array $form Form object
	 * @return void
	 */
	private function render_map_ui($form)
	{
		$map_content = $this->generate_map($form);
		$form_info   = $this->get_form_info($form);
?>
		<!-- Form Builder Section -->
		<div class="gform-settings-panel">
			<header class="gform-settings-panel__header">
				<h4 class="gform-settings-panel__title"><?php esc_html_e('Form builder settings', 'gf-conditional-compass'); ?></h4>
			</header>

			<div class="gform-settings-panel__content">
				<div class="gfcl-filters">
					<label class="gfcl-toggle">
						<input type="checkbox" id="gfcc-hide-field-id-badges-toggle" class="gfcl-toggle-input">
						<span class="gfcl-toggle-slider"></span>
						<span class="gfcl-toggle-label"><?php esc_html_e('Hide Field ID badges', 'gf-conditional-compass'); ?></span>
					</label>

					<label class="gfcl-toggle">
						<input type="checkbox" id="gfcc-hide-depends-deps-toggle" class="gfcl-toggle-input">
						<span class="gfcl-toggle-slider"></span>
						<span class="gfcl-toggle-label"><?php esc_html_e('Hide "Depends on" badges', 'gf-conditional-compass'); ?></span>
					</label>

					<label class="gfcl-toggle">
						<input type="checkbox" id="gfcc-hide-used-deps-toggle" class="gfcl-toggle-input">
						<span class="gfcl-toggle-slider"></span>
						<span class="gfcl-toggle-label"><?php esc_html_e('Hide "Used by" badges', 'gf-conditional-compass'); ?></span>
					</label>

					<label class="gfcl-toggle">
						<input type="checkbox" id="gfcc-hide-copy-badge-toggle" class="gfcl-toggle-input">
						<span class="gfcl-toggle-slider"></span>
						<span class="gfcl-toggle-label"><?php esc_html_e('Hide "Copy" badges', 'gf-conditional-compass'); ?></span>
					</label>
				</div>
			</div>
		</div>

		<!-- Conditional Logic Map Section -->
		<div class="gform-settings-panel">
			<header class="gform-settings-panel__header">
				<h4 class="gform-settings-panel__title"><?php esc_html_e('Conditional Logic Map', 'gf-conditional-compass'); ?></h4>
			</header>

			<div class="gform-settings-panel__content">
				<div class="gfcl-map-container">
					<div class="gfcl-map-header">
						<label class="gform-settings-label">
							<?php echo esc_html($this->get_map_title($form)); ?>
						</label>
						<button type="button" class="button button-secondary gfcl-copy-button" id="gfcl-copy-map">
							<span class="dashicons dashicons-clipboard"></span>
							<?php esc_html_e('Copy to Clipboard', 'gf-conditional-compass'); ?>
						</button>
					</div>

					<!-- Filter Toggles -->
					<div class="gfcl-filters">
						<label class="gfcl-toggle">
							<input type="checkbox" id="gfcl-hide-field-number" class="gfcl-toggle-input">
							<span class="gfcl-toggle-slider"></span>
							<span class="gfcl-toggle-label"><?php esc_html_e('Hide field number', 'gf-conditional-compass'); ?></span>
						</label>

						<label class="gfcl-toggle">
							<input type="checkbox" id="gfcl-hide-field-type" class="gfcl-toggle-input">
							<span class="gfcl-toggle-slider"></span>
							<span class="gfcl-toggle-label"><?php esc_html_e('Hide field type', 'gf-conditional-compass'); ?></span>
						</label>

						<label class="gfcl-toggle">
							<input type="checkbox" id="gfcl-hide-unused" class="gfcl-toggle-input">
							<span class="gfcl-toggle-slider"></span>
							<span class="gfcl-toggle-label"><?php esc_html_e('Hide fields not in any condition', 'gf-conditional-compass'); ?></span>
						</label>

						<label class="gfcl-toggle">
							<input type="checkbox" id="gfcl-hide-used-by" class="gfcl-toggle-input">
							<span class="gfcl-toggle-slider"></span>
							<span class="gfcl-toggle-label"><?php esc_html_e('Hide "is used" dependencies', 'gf-conditional-compass'); ?></span>
						</label>

						<label class="gfcl-toggle">
							<input type="checkbox" id="gfcl-hide-depends-on" class="gfcl-toggle-input">
							<span class="gfcl-toggle-slider"></span>
							<span class="gfcl-toggle-label"><?php esc_html_e('Hide "depends on" dependencies', 'gf-conditional-compass'); ?></span>
						</label>

						<label class="gfcl-toggle">
							<input type="checkbox" id="gfcl-full-english-toggle" class="gfcl-toggle-input">
							<span class="gfcl-toggle-slider"></span>
							<span class="gfcl-toggle-label"><?php esc_html_e('Natural Language', 'gf-conditional-compass'); ?></span>
						</label>
					</div>

					<textarea
						id="gfcl-map-textarea"
						class="gfcl-map-textarea"><?php echo esc_textarea($map_content); ?></textarea>
					<p class="gfcl-help-text">
						<?php esc_html_e('This is a text-based map showing all conditional logic relationships in your form. Use the button above to copy the entire map to your clipboard.', 'gf-conditional-compass'); ?>
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
