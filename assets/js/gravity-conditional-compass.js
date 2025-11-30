/**
 * Gravity Forms Conditional Compass - Form Builder JavaScript
 *
 * Handles conditional logic badge updates and interactions in the Gravity Forms editor.
 * Displays field IDs and conditional logic dependencies with live updates and clickable badges.
 *
 * @package Gravity_Conditional_Compass
 * @version 1.2
 */

(function($) {
	'use strict';

	// Ensure translations are available
	if (typeof gfFieldIdCondTranslations === 'undefined') {
		console.warn('Gravity Conditional Compass: Translations not loaded');
		return;
	}

	// Ensure plugin URL is available
	if (typeof gfFieldIdCondPluginUrl === 'undefined') {
		console.warn('Gravity Conditional Compass: Plugin URL not loaded');
		return;
	}

	/**
	 * Special field labels for date/time conditions
	 *
	 * @type {Object<string, string>}
	 */
	var specialFieldLabels = {
		'_gpcld_current_time': gfFieldIdCondTranslations.currentTime,
		'_gpcld_current_date': gfFieldIdCondTranslations.currentDate,
		'_gpcld_yesterday': gfFieldIdCondTranslations.yesterday,
		'_gpcld_tomorrow': gfFieldIdCondTranslations.tomorrow,
		'_gpcld_last_week': gfFieldIdCondTranslations.lastWeek,
		'_gpcld_next_week': gfFieldIdCondTranslations.nextWeek,
		'_gpcld_last_month': gfFieldIdCondTranslations.lastMonth,
		'_gpcld_next_month': gfFieldIdCondTranslations.nextMonth,
		'_gpcld_last_year': gfFieldIdCondTranslations.lastYear,
		'_gpcld_next_year': gfFieldIdCondTranslations.nextYear
	};

	/**
	 * Cached DOM elements for better performance
	 *
	 * @type {Object}
	 */
	var $cachedElements = {
		body: null,
		formEditor: null
	};

	/**
	 * Debounce timer for badge updates
	 *
	 * @type {number|null}
	 */
	var updateDebounceTimer = null;

	/**
	 * Debounce delay in milliseconds
	 *
	 * @type {number}
	 */
	var DEBOUNCE_DELAY = 150;

	/**
	 * Safely get field by ID
	 *
	 * @param {number} fieldId Field ID
	 * @return {Object|null} Field object or null
	 */
	function safelyGetFieldById(fieldId) {
		if (typeof GetFieldById === 'function') {
			return GetFieldById(fieldId);
		}
		return null;
	}

	/**
	 * Get display label for a field
	 *
	 * @param {number|string} fieldId Field ID or special field identifier
	 * @return {string} Display label for the field
	 */
	function getFieldDisplayLabel(fieldId) {
		// Check for special field labels first
		if (typeof fieldId === 'string' && specialFieldLabels[fieldId]) {
			return specialFieldLabels[fieldId];
		}

		// Ensure form object exists
		if (typeof form === 'undefined' || !form) {
			return gfFieldIdCondTranslations.field + ' ' + fieldId;
		}

		// Get field from form
		var field = safelyGetFieldById(fieldId);
		if (field && (field.adminLabel || field.label)) {
			return field.adminLabel || field.label;
		}

		return gfFieldIdCondTranslations.field + ' ' + fieldId;
	}

	/**
	 * Open conditional logic settings for a field
	 *
	 * @param {number} fieldId Field ID to open settings for
	 * @return {void}
	 */
	function openConditionalLogicSettings(fieldId) {
		if (!fieldId || isNaN(fieldId)) {
			return;
		}

		var field = safelyGetFieldById(fieldId);
		if (!field) {
			return;
		}

		var $field = $('#field_' + fieldId);
		if (!$field.length) {
			return;
		}

		// Trigger field click to open settings
		$field.trigger('click');

		// Wait for panel to open, then open conditional logic accordion
		setTimeout(function() {
			var $condLogicButton = $('.conditional_logic_accordion__toggle_button');
			if (!$condLogicButton.length) {
				return;
			}

			var $accordion = $condLogicButton.closest('.conditional_logic_accordion');
			var isOpen = $accordion && $accordion.hasClass('conditional_logic_accordion--open');

			if (!isOpen) {
				$condLogicButton[0].click();
			}

			// Scroll into view after opening
			setTimeout(function() {
				if ($condLogicButton[0] && $condLogicButton[0].scrollIntoView) {
					$condLogicButton[0].scrollIntoView({
						behavior: 'smooth',
						block: 'nearest'
					});
				}
			}, 100);
		}, 300);
	}

	/**
	 * Update "IS USED BY" badges (condition TO badges)
	 *
	 * Shows which fields use this field in their conditional logic.
	 *
	 * @return {void}
	 */
	function updateConditionToBadges() {
		// Ensure form object exists
		if (typeof form === 'undefined' || !form || !form.fields) {
			return;
		}

		// Remove existing badges
		$('.gw-cond-to-separator, .gw-cond-to-field-id').remove();

		// Build usage map: which fields use which other fields
		var fieldUsageMap = {};

		form.fields.forEach(function(field) {
			if (!field || !field.conditionalLogic || !field.conditionalLogic.rules) {
				return;
			}

			if (!Array.isArray(field.conditionalLogic.rules) || field.conditionalLogic.rules.length === 0) {
				return;
			}

			field.conditionalLogic.rules.forEach(function(rule) {
				if (!rule || !rule.fieldId) {
					return;
				}

				var condFieldId = rule.fieldId;

				// Skip special fields
				if (typeof condFieldId === 'string' && condFieldId.startsWith('_gpcld')) {
					return;
				}

				// Initialize array if needed
				if (!fieldUsageMap[condFieldId]) {
					fieldUsageMap[condFieldId] = [];
				}

				// Add field ID if not already present
				if (fieldUsageMap[condFieldId].indexOf(field.id) === -1) {
					fieldUsageMap[condFieldId].push(field.id);
				}
			});
		});

		// Create badges for each field that is used
		Object.keys(fieldUsageMap).forEach(function(usedFieldId) {
			var $container = $('.gw-field-badges[data-field-id="' + usedFieldId + '"]');
			if (!$container.length) {
				return;
			}

			var usingFieldIds = fieldUsageMap[usedFieldId];
			var isCollapsed = $container.data('cond-to-collapsed') === true;

			// Create separator icon
			var separator = $('<span></span>')
				.addClass('gw-cond-to-separator')
				.attr('title', gfFieldIdCondTranslations.usedInConditionalLogic)
				.attr('data-field-id', usedFieldId)
				.attr('role', 'button')
				.attr('tabindex', '0')
				.html('<img src="' + gfFieldIdCondPluginUrl + 'randomize.png" style="width:15px;height:15px;display:block;transform:scaleX(-1);" alt="←" />');

			if (isCollapsed) {
				separator.addClass('collapsed');
			}

			$container.append(separator);

			// Create badges for each field that uses this field
			usingFieldIds.forEach(function(usingFieldId) {
				var usingField = safelyGetFieldById(usingFieldId);
				var fieldLabel = usingField
					? (usingField.adminLabel || usingField.label || 'Field ' + usingFieldId)
					: 'Field ' + usingFieldId;

				var tooltip = gfFieldIdCondTranslations.usedAsConditionIn + ': ' + fieldLabel;
				var badgeText = 'COND: ' + usingFieldId;

				var badge = $('<span></span>')
					.addClass('gw-cond-to-field-id')
					.attr('data-tooltip', tooltip)
					.attr('data-target-field-id', usingFieldId)
					.attr('role', 'button')
					.attr('tabindex', '0')
					.text(badgeText);

				if (isCollapsed) {
					badge.hide();
				}

				$container.append(badge);
			});
		});

		// Bind click handlers for separators
		$('.gw-cond-to-separator').off('click keypress').on('click keypress', function(e) {
			if (e.type === 'keypress' && e.which !== 13 && e.which !== 32) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();

			var $separator = $(this);
			var $container = $separator.closest('.gw-field-badges');
			var $badges = $container.find('.gw-cond-to-field-id');

			$badges.toggle();
			$separator.toggleClass('collapsed');

			var isCollapsed = $separator.hasClass('collapsed');
			$container.data('cond-to-collapsed', isCollapsed);
		});

		// Bind click handlers for badges
		$('.gw-cond-to-field-id').off('click keypress').on('click keypress', function(e) {
			if (e.type === 'keypress' && e.which !== 13 && e.which !== 32) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();

			var targetFieldId = parseInt($(this).attr('data-target-field-id'), 10);
			if (!isNaN(targetFieldId)) {
				openConditionalLogicSettings(targetFieldId);
			}
		});
	}

	/**
	 * Update "DEPENDS ON" badges (condition FROM badges)
	 *
	 * Shows which fields this field depends on in its conditional logic.
	 *
	 * @param {number|null} specificFieldId Optional field ID to update only that field
	 * @return {void}
	 */
	function updateConditionalBadges(specificFieldId) {
		// Ensure form object exists
		if (typeof form === 'undefined' || !form || !form.fields) {
			return;
		}

		var selector = specificFieldId
			? '.gw-field-badges[data-field-id="' + specificFieldId + '"]'
			: '.gw-field-badges';

		$(selector).each(function() {
			var $container = $(this);
			var fieldId = parseInt($container.data('field-id'), 10);

			if (isNaN(fieldId)) {
				return;
			}

			var field = safelyGetFieldById(fieldId);
			if (!field) {
				return;
			}

			var isCondFromCollapsed = $container.data('cond-from-collapsed') === true;

			// Remove existing conditional badges (keep the first field ID badge)
			$container.find('.gw-cond-field-id, .gw-cond-separator, .gw-inline-field-id:not(:first)').remove();

			// Check if field has conditional logic
			if (field.conditionalLogic && field.conditionalLogic.rules && field.conditionalLogic.rules.length > 0) {
				var rules = field.conditionalLogic.rules;
				var logicType = field.conditionalLogic.logicType || 'all';
				var actionType = field.conditionalLogic.actionType || 'show';

				var currentFieldLabel = field.adminLabel || field.label || gfFieldIdCondTranslations.thisField;
				var actionText = actionType === 'hide'
					? gfFieldIdCondTranslations.willBeHiddenIf
					: gfFieldIdCondTranslations.willBeDisplayedIf;

				// Create separator icon
				var separator = $('<span></span>')
					.addClass('gw-cond-separator')
					.attr('title', gfFieldIdCondTranslations.hasConditionalLogic)
					.attr('data-field-id', fieldId)
					.attr('role', 'button')
					.attr('tabindex', '0')
					.html('<img src="' + gfFieldIdCondPluginUrl + 'randomize.png" style="width:15px;height:15px;display:block;" alt="→" />');

				if (isCondFromCollapsed) {
					separator.addClass('collapsed');
				}

				$container.append(separator);

				// Operator translation map
				var operatorMap = {
					'is': gfFieldIdCondTranslations.operators.is,
					'isnot': gfFieldIdCondTranslations.operators.isnot,
					'>': gfFieldIdCondTranslations.operators.greaterThan,
					'<': gfFieldIdCondTranslations.operators.lessThan,
					'>=': gfFieldIdCondTranslations.operators.greaterThanOrEqual,
					'<=': gfFieldIdCondTranslations.operators.lessThanOrEqual,
					'contains': gfFieldIdCondTranslations.operators.contains,
					'starts_with': gfFieldIdCondTranslations.operators.startsWith,
					'ends_with': gfFieldIdCondTranslations.operators.endsWith,
					'greater_than': gfFieldIdCondTranslations.operators.greaterThan,
					'less_than': gfFieldIdCondTranslations.operators.lessThan,
					'is_in': gfFieldIdCondTranslations.operators.isIn,
					'is_not_in': gfFieldIdCondTranslations.operators.isNotIn
				};

				// Determine badge class based on logic type
				var badgeClass = 'gw-cond-field-id';
				if (logicType.toLowerCase() === 'any') {
					badgeClass += ' gw-cond-field-id-any';
				}

				// Create badges for each rule
				rules.forEach(function(rule) {
					if (!rule || !rule.fieldId) {
						return;
					}

					var condFieldId = rule.fieldId;
					var operator = rule.operator || 'is';
					var value = rule.value;

					var fieldLabel = getFieldDisplayLabel(condFieldId);
					var operatorDisplay = operatorMap[operator] || operator;

					// Build tooltip text
					var tooltip = currentFieldLabel + ' ' + actionText + ' ' + fieldLabel + ' ' + operatorDisplay;

					// Handle empty/not empty conditions
					if (typeof value === 'undefined' || value === null || value === '') {
						if (operator === 'is') {
							tooltip = currentFieldLabel + ' ' + actionText + ' ' + fieldLabel + ' ' + gfFieldIdCondTranslations.isEmpty;
						} else if (operator === 'isnot') {
							tooltip = currentFieldLabel + ' ' + actionText + ' ' + fieldLabel + ' ' + gfFieldIdCondTranslations.isNotEmpty;
						}
					} else {
						// Escape value for HTML display
						var $tempDiv = $('<div/>');
						$tempDiv.text(value);
						tooltip += ' ' + $tempDiv.html();
					}

					var badgeText = 'COND: ' + condFieldId;

					var badge = $('<span></span>')
						.addClass(badgeClass)
						.attr('data-tooltip', tooltip)
						.attr('data-field-id', fieldId)
						.attr('role', 'button')
						.attr('tabindex', '0')
						.text(badgeText);

					if (isCondFromCollapsed) {
						badge.hide();
					}

					$container.append(badge);
				});

				// Add logic type indicator if multiple rules
				if (rules.length > 1) {
					var logicTypeDisplay = logicType.toUpperCase();
					var logicTypeTooltip = logicType === 'all'
						? gfFieldIdCondTranslations.allConditionsMustBeMet
						: gfFieldIdCondTranslations.anyConditionCanBeMet;
					var logicTypeClass = 'gw-inline-field-id gw-logic-type-' + logicType.toLowerCase();

					var logicBadge = $('<span></span>')
						.addClass(logicTypeClass)
						.attr('data-tooltip', logicTypeTooltip)
						.attr('role', 'button')
						.attr('tabindex', '0')
						.text(logicTypeDisplay);

					if (isCondFromCollapsed) {
						logicBadge.hide();
					}

					$container.append(logicBadge);
				}
			}
		});

		// Update "IS USED BY" badges
		updateConditionToBadges();

		// Bind click handlers for separators
		$('.gw-cond-separator').off('click keypress').on('click keypress', function(e) {
			if (e.type === 'keypress' && e.which !== 13 && e.which !== 32) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();

			var $separator = $(this);
			var $container = $separator.closest('.gw-field-badges');
			var $badges = $container.find('.gw-cond-field-id, .gw-logic-type-all, .gw-logic-type-any');

			$badges.toggle();
			$separator.toggleClass('collapsed');

			var isCollapsed = $separator.hasClass('collapsed');
			$container.data('cond-from-collapsed', isCollapsed);
		});

		// Bind click handlers for badges
		$('.gw-cond-field-id').off('click keypress').on('click keypress', function(e) {
			if (e.type === 'keypress' && e.which !== 13 && e.which !== 32) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();

			var fieldId = parseInt($(this).attr('data-field-id'), 10);
			if (!isNaN(fieldId)) {
				openConditionalLogicSettings(fieldId);
			}
		});
	}

	/**
	 * Debounced version of updateConditionalBadges
	 *
	 * Prevents excessive updates during rapid changes.
	 *
	 * @param {number|null} specificFieldId Optional field ID to update only that field
	 * @return {void}
	 */
	function debouncedUpdateConditionalBadges(specificFieldId) {
		// Clear existing timer
		if (updateDebounceTimer !== null) {
			clearTimeout(updateDebounceTimer);
		}

		// Set new timer
		updateDebounceTimer = setTimeout(function() {
			updateConditionalBadges(specificFieldId);
			updateDebounceTimer = null;
		}, DEBOUNCE_DELAY);
	}

	/**
	 * Initialize global field ID toggle functionality
	 *
	 * Handles the three global toggles for hiding badges in the form builder.
	 * State is persisted in localStorage.
	 *
	 * @return {void}
	 */
	function initGlobalFieldIdToggle() {
		// Cache body element
		if (!$cachedElements.body) {
			$cachedElements.body = $('body');
		}

		var $body = $cachedElements.body;

		// Toggle IDs
		var ids = {
			field: 'gw-hide-field-id-badges-toggle',
			used: 'gw-hide-used-deps-toggle',
			depends: 'gw-hide-depends-deps-toggle'
		};

		// localStorage keys
		var keys = {
			field: 'gw-hide-field-id-badges',
			used: 'gw-hide-cond-used',
			depends: 'gw-hide-cond-depends'
		};

		// Avoid binding handlers multiple times
		if ($body.data('gw-global-toggle-handlers-init')) {
			return;
		}
		$body.data('gw-global-toggle-handlers-init', true);

		/**
		 * Apply state from localStorage to body classes and checkboxes
		 *
		 * @return {void}
		 */
		function applyStateFromStorage() {
			var hideField = window.localStorage.getItem(keys.field) === '1';
			var hideUsed = window.localStorage.getItem(keys.used) === '1';
			var hideDepends = window.localStorage.getItem(keys.depends) === '1';

			// Apply body classes
			$body.toggleClass('gw-hide-field-id-badges', hideField);
			$body.toggleClass('gw-hide-cond-used', hideUsed);
			$body.toggleClass('gw-hide-cond-depends', hideDepends);

			// Sync checkboxes if they exist (on Conditional Compass settings page)
			var $fieldToggle = $('#' + ids.field);
			var $usedToggle = $('#' + ids.used);
			var $dependsToggle = $('#' + ids.depends);

			if ($fieldToggle.length) {
				$fieldToggle.prop('checked', hideField);
			}
			if ($usedToggle.length) {
				$usedToggle.prop('checked', hideUsed);
			}
			if ($dependsToggle.length) {
				$dependsToggle.prop('checked', hideDepends);
			}
		}

		// Apply saved state immediately
		applyStateFromStorage();

		// Bind change handlers using event delegation
		$(document).on('change', '#' + ids.field, function() {
			var checked = $(this).is(':checked');
			try {
				window.localStorage.setItem(keys.field, checked ? '1' : '0');
			} catch (e) {
				console.warn('Gravity Conditional Compass: Could not save to localStorage', e);
			}
			$body.toggleClass('gw-hide-field-id-badges', checked);
		});

		$(document).on('change', '#' + ids.used, function() {
			var checked = $(this).is(':checked');
			try {
				window.localStorage.setItem(keys.used, checked ? '1' : '0');
			} catch (e) {
				console.warn('Gravity Conditional Compass: Could not save to localStorage', e);
			}
			$body.toggleClass('gw-hide-cond-used', checked);
		});

		$(document).on('change', '#' + ids.depends, function() {
			var checked = $(this).is(':checked');
			try {
				window.localStorage.setItem(keys.depends, checked ? '1' : '0');
			} catch (e) {
				console.warn('Gravity Conditional Compass: Could not save to localStorage', e);
			}
			$body.toggleClass('gw-hide-cond-depends', checked);
		});
	}

	/**
	 * Initialize all functionality when document is ready
	 *
	 * @return {void}
	 */
	function init() {
		// Initial badge update after a short delay to ensure DOM is ready
		setTimeout(function() {
			updateConditionalBadges();
			initGlobalFieldIdToggle();
		}, 500);

		// Listen for field settings load
		$(document).on('gform_load_field_settings', function(event, field, form) {
			debouncedUpdateConditionalBadges();
		});

		// Listen for field property changes
		if (typeof gform !== 'undefined' && gform.addAction) {
			gform.addAction('gform_post_set_field_property', function(property, field, value, prevValue) {
				if (property === 'conditionalLogic' || property === 'enableConditionalLogic') {
					debouncedUpdateConditionalBadges(field.id);
				} else if (property === 'label' || property === 'adminLabel') {
					debouncedUpdateConditionalBadges();
				}
			});
		}

		// Listen for conditional logic updates
		$(document).on('gform_field_conditional_logic_updated', function() {
			debouncedUpdateConditionalBadges();
		});

		// Listen for settings panel close
		$(document).on('click', '.gform-settings-panel__header-icon--close', function() {
			setTimeout(function() {
				debouncedUpdateConditionalBadges();
			}, 300);
		});

		// Listen for conditional logic field actions
		if (typeof gform !== 'undefined' && gform.addAction) {
			gform.addAction('gform_post_conditional_logic_field_action', function() {
				debouncedUpdateConditionalBadges();
			});
		}

		// Set up MutationObserver for DOM changes
		var formEditorTarget = document.querySelector('#gform_fields, .gform-form-editor');
		if (formEditorTarget && window.MutationObserver) {
			var observer = new MutationObserver(function(mutations) {
				var shouldUpdate = false;

				mutations.forEach(function(mutation) {
					if (mutation.target && mutation.target.classList) {
						if (mutation.target.classList.contains('gform-settings-panel__content') ||
							mutation.target.classList.contains('gfield_conditional_logic_rules_container')) {
							shouldUpdate = true;
						}
					}
				});

				if (shouldUpdate) {
					debouncedUpdateConditionalBadges();
					initGlobalFieldIdToggle();
				}
			});

			observer.observe(formEditorTarget, {
				childList: true,
				subtree: true,
				attributes: false
			});
		}
	}

	// Initialize when document is ready
	$(document).ready(init);

})(jQuery);
