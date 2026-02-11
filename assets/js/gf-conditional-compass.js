/**
 * Gravity Forms Conditional Compass - Form Builder JavaScript
 *
 * Handles conditional logic badge updates and interactions in the Gravity Forms editor.
 * Displays field IDs and conditional logic dependencies with live updates and clickable badges.
 *
 * @package Gravity_Conditional_Compass
 * @version 1.2.0
 */

(function ($) {
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
		setTimeout(function () {
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
			setTimeout(function () {
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
		$('.gfcc-cond-to-separator, .gfcc-cond-to-field-id').remove();

		// Build usage map: which fields use which other fields
		var fieldUsageMap = {};

		form.fields.forEach(function (field) {
			if (!field || !field.conditionalLogic || !field.conditionalLogic.rules) {
				return;
			}

			if (!Array.isArray(field.conditionalLogic.rules) || field.conditionalLogic.rules.length === 0) {
				return;
			}

			field.conditionalLogic.rules.forEach(function (rule) {
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
		Object.keys(fieldUsageMap).forEach(function (usedFieldId) {
			var $container = $('.gfcc-field-badges[data-field-id="' + usedFieldId + '"]');
			if (!$container.length) {
				return;
			}

			var usingFieldIds = fieldUsageMap[usedFieldId];
			var isCollapsed = $container.data('cond-to-collapsed') === true;

			// Create separator icon
			var separator = $('<span></span>')
				.addClass('gfcc-cond-to-separator')
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
			usingFieldIds.forEach(function (usingFieldId) {
				var usingField = safelyGetFieldById(usingFieldId);
				var fieldLabel = usingField
					? (usingField.adminLabel || usingField.label || 'Field ' + usingFieldId)
					: 'Field ' + usingFieldId;

				var tooltip = gfFieldIdCondTranslations.usedAsConditionIn + ': ' + fieldLabel;
				var badgeText = 'COND: ' + usingFieldId;

				var badge = $('<span></span>')
					.addClass('gfcc-cond-to-field-id')
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
		$('.gfcc-cond-to-separator').off('click keypress').on('click keypress', function (e) {
			if (e.type === 'keypress' && e.which !== 13 && e.which !== 32) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();

			var $separator = $(this);
			var $container = $separator.closest('.gfcc-field-badges');
			var $badges = $container.find('.gfcc-cond-to-field-id');

			$badges.toggle();
			$separator.toggleClass('collapsed');

			var isCollapsed = $separator.hasClass('collapsed');
			$container.data('cond-to-collapsed', isCollapsed);
		});

		// Bind click handlers for badges
		$('.gfcc-cond-to-field-id').off('click keypress').on('click keypress', function (e) {
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
			? '.gfcc-field-badges[data-field-id="' + specificFieldId + '"]'
			: '.gfcc-field-badges';

		$(selector).each(function () {
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
			$container.find('.gfcc-cond-field-id, .gfcc-cond-separator, .gfcc-copy-conditions-btn, .gfcc-inline-field-id:not(:first)').remove();

			// Mark the ID badge as clickable or not based on whether this field is used in conditional logic
			var $idBadge = $container.find('.gfcc-inline-field-id:first');
			if ($idBadge.length) {
				$idBadge.toggleClass('not-traceable', !isFieldUsedInConditionalLogic(fieldId));
			}

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
					.addClass('gfcc-cond-separator')
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
				var badgeClass = 'gfcc-cond-field-id';
				if (logicType.toLowerCase() === 'any') {
					badgeClass += ' gfcc-cond-field-id-any';
				}

				// Create badges for each rule
				rules.forEach(function (rule) {
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
					var logicTypeClass = 'gfcc-inline-field-id gfcc-logic-type-' + logicType.toLowerCase();

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
				// Add Copy badge for fields with conditions (use <span> to avoid GF admin button CSS)
				var copyBtn = $('<span></span>')
					.addClass('gfcc-copy-conditions-btn')
					.attr('title', gfFieldIdCondTranslations.copyConditions)
					.attr('data-field-id', fieldId)
					.attr('role', 'button')
					.attr('tabindex', '0')
					.text('COPY');

				if (isCondFromCollapsed) {
					copyBtn.hide();
				}

				$container.append(copyBtn);
			}
		});

		// Update "IS USED BY" badges
		updateConditionToBadges();

		// Bind click handlers for separators
		$('.gfcc-cond-separator').off('click keypress').on('click keypress', function (e) {
			if (e.type === 'keypress' && e.which !== 13 && e.which !== 32) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();

			var $separator = $(this);
			var $container = $separator.closest('.gfcc-field-badges');
			var $badges = $container.find('.gfcc-cond-field-id, .gfcc-logic-type-all, .gfcc-logic-type-any');

			$badges.toggle();
			$separator.toggleClass('collapsed');

			var isCollapsed = $separator.hasClass('collapsed');
			$container.data('cond-from-collapsed', isCollapsed);
		});

		// Bind click handlers for badges
		$('.gfcc-cond-field-id').off('click keypress').on('click keypress', function (e) {
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
		updateDebounceTimer = setTimeout(function () {
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
			field: 'gfcc-hide-field-id-badges-toggle',
			used: 'gfcc-hide-used-deps-toggle',
			depends: 'gfcc-hide-depends-deps-toggle'
		};

		// localStorage keys
		var keys = {
			field: 'gfcc-hide-field-id-badges',
			used: 'gfcc-hide-cond-used',
			depends: 'gfcc-hide-cond-depends'
		};

		// Avoid binding handlers multiple times
		if ($body.data('gfcc-global-toggle-handlers-init')) {
			return;
		}
		$body.data('gfcc-global-toggle-handlers-init', true);

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
			$body.toggleClass('gfcc-hide-field-id-badges', hideField);
			$body.toggleClass('gfcc-hide-cond-used', hideUsed);
			$body.toggleClass('gfcc-hide-cond-depends', hideDepends);

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
		$(document).on('change', '#' + ids.field, function () {
			var checked = $(this).is(':checked');
			try {
				window.localStorage.setItem(keys.field, checked ? '1' : '0');
			} catch (e) {
				console.warn('Gravity Conditional Compass: Could not save to localStorage', e);
			}
			$body.toggleClass('gfcc-hide-field-id-badges', checked);
		});

		$(document).on('change', '#' + ids.used, function () {
			var checked = $(this).is(':checked');
			try {
				window.localStorage.setItem(keys.used, checked ? '1' : '0');
			} catch (e) {
				console.warn('Gravity Conditional Compass: Could not save to localStorage', e);
			}
			$body.toggleClass('gfcc-hide-cond-used', checked);
		});

		$(document).on('change', '#' + ids.depends, function () {
			var checked = $(this).is(':checked');
			try {
				window.localStorage.setItem(keys.depends, checked ? '1' : '0');
			} catch (e) {
				console.warn('Gravity Conditional Compass: Could not save to localStorage', e);
			}
			$body.toggleClass('gfcc-hide-cond-depends', checked);
		});
	}

	/**
	 * Initialize all functionality when document is ready
	 *
	 * @return {void}
	 */
	function init() {
		// Initial badge update after a short delay to ensure DOM is ready
		setTimeout(function () {
			updateConditionalBadges();
			initGlobalFieldIdToggle();
		}, 500);

		// Listen for field settings load
		$(document).on('gform_load_field_settings', function (event, field, form) {
			debouncedUpdateConditionalBadges();
		});

		// Listen for field property changes
		if (typeof gform !== 'undefined' && gform.addAction) {
			gform.addAction('gform_post_set_field_property', function (property, field, value, prevValue) {
				if (property === 'conditionalLogic' || property === 'enableConditionalLogic') {
					debouncedUpdateConditionalBadges(field.id);
				} else if (property === 'label' || property === 'adminLabel') {
					debouncedUpdateConditionalBadges();
				}
			});
		}

		// Listen for conditional logic updates
		$(document).on('gform_field_conditional_logic_updated', function () {
			debouncedUpdateConditionalBadges();
		});

		// Listen for settings panel close
		$(document).on('click', '.gform-settings-panel__header-icon--close', function () {
			setTimeout(function () {
				debouncedUpdateConditionalBadges();
			}, 300);
		});

		// Listen for conditional logic field actions
		if (typeof gform !== 'undefined' && gform.addAction) {
			gform.addAction('gform_post_conditional_logic_field_action', function () {
				debouncedUpdateConditionalBadges();
			});
		}

		// Set up MutationObserver for DOM changes
		var formEditorTarget = document.querySelector('#gform_fields, .gform-form-editor');
		if (formEditorTarget && window.MutationObserver) {
			var observer = new MutationObserver(function (mutations) {
				var shouldUpdate = false;

				mutations.forEach(function (mutation) {
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

	// ===== Copy/Paste Conditional Logic =====

	var copiedConditions = null;
	var sourceFieldId = null;
	var lastClickedIndex = -1;

	/**
	 * Show a toast notification
	 *
	 * @param {string} message The message to display
	 */
	function showToast(message) {
		$('.gfcc-toast').remove();
		var $toast = $('<div class="gfcc-toast"></div>').text(message);
		$('body').append($toast);
		setTimeout(function () { $toast.remove(); }, 2500);
	}

	/**
	 * Get a simple text summary of a field's conditional logic
	 *
	 * @param {Object} field The field object
	 * @return {string} Text summary or empty string
	 */
	function getConditionSummaryText(field) {
		if (!field || !field.conditionalLogic || !field.conditionalLogic.rules || field.conditionalLogic.rules.length === 0) {
			return '';
		}

		var cl = field.conditionalLogic;
		var action = cl.actionType === 'hide' ? gfFieldIdCondTranslations.willBeHiddenIf : gfFieldIdCondTranslations.willBeDisplayedIf;
		var parts = cl.rules.map(function (rule) {
			return getFieldDisplayLabel(rule.fieldId) + ' ' + (gfFieldIdCondTranslations.operators[rule.operator] || rule.operator) + ' ' + (rule.value || '');
		});

		var glue = cl.logicType === 'all'
			? (gfFieldIdCondTranslations.andConnector || ' AND ')
			: (gfFieldIdCondTranslations.orConnector || ' OR ');

		return action + ' ' + parts.join(glue);
	}

	/**
	 * Open the Paste modal with field list
	 */
	function openPasteModal() {
		console.log('[GFCC DEBUG] openPasteModal() called', { copiedConditions: copiedConditions, form: !!window.form, fields: !!(window.form && window.form.fields) });
		if (!copiedConditions || !window.form || !window.form.fields) {
			console.log('[GFCC DEBUG] openPasteModal() — early return (missing data)');
			return;
		}
		console.log('[GFCC DEBUG] openPasteModal() — building modal, field count:', window.form.fields.length);

		// Remove any existing modal
		$('#gfcc-modal-overlay').remove();
		$('#gfcc-modal').remove();

		var selectedIds = {};
		lastClickedIndex = -1;

		// Build field list HTML
		var listHtml = '';
		window.form.fields.forEach(function (field, index) {
			if (!field || !field.id) return;

			// Skip the source field entirely
			if (field.id === sourceFieldId) return;

			var label = field.adminLabel || field.label || 'Field ' + field.id;
			var safeLabel = $('<span/>').text(label).html();
			var condSummary = getConditionSummaryText(field);
			var safeCond = condSummary ? $('<span/>').text(condSummary).html() : '';

			listHtml += '<div class="gfcc-modal-field-item" data-field-id="' + field.id + '" data-index="' + index + '">';
			listHtml += '<input type="checkbox" />';
			listHtml += '<div class="gfcc-modal-field-label">';
			listHtml += '<span class="gfcc-modal-field-name">' + safeLabel + '</span>';
			listHtml += '<span class="gfcc-modal-field-id">(ID: ' + field.id + ')</span>';
			if (safeCond) {
				listHtml += '<span class="gfcc-modal-field-cond">' + safeCond + '</span>';
			}
			listHtml += '</div></div>';
		});

		// Build modal HTML - overlay and modal as SIBLING elements (not nested)
		var modalHtml =
			'<div id="gfcc-modal-overlay"></div>' +
			'<div id="gfcc-modal">' +
			'<div class="gfcc-modal-header">' +
			'<h3>' + gfFieldIdCondTranslations.selectFieldsToPaste.replace('%d', sourceFieldId) + '</h3>' +
			'<button class="gfcc-modal-close" type="button">&times;</button>' +
			'</div>' +
			'<div class="gfcc-modal-search">' +
			'<input type="text" placeholder="' + gfFieldIdCondTranslations.searchFields + '" />' +
			'</div>' +
			'<div class="gfcc-modal-list">' +
			listHtml +
			'</div>' +
			'<div class="gfcc-modal-footer">' +
			'<button class="gfcc-modal-btn gfcc-modal-close" type="button">' + gfFieldIdCondTranslations.cancel + '</button>' +
			'<button class="gfcc-modal-btn gfcc-modal-btn-primary" id="gfcc-paste-btn" type="button" disabled>' +
			gfFieldIdCondTranslations.pasteConditionsTo.replace('%d', '0') +
			'</button>' +
			'</div>' +
			'</div>';

		$('body').append(modalHtml);

		// Focus search
		$('#gfcc-modal .gfcc-modal-search input').focus();

		function updatePasteButton() {
			var count = Object.keys(selectedIds).length;
			$('#gfcc-paste-btn')
				.text(gfFieldIdCondTranslations.pasteConditionsTo.replace('%d', count))
				.prop('disabled', count === 0);
		}

		function closeModal() {
			var $modal = $('#gfcc-modal');
			var $overlay = $('#gfcc-modal-overlay');
			$modal.addClass('closing');
			$overlay.addClass('closing');
			setTimeout(function () {
				$modal.remove();
				$overlay.remove();
			}, 190);
			$(document).off('keydown.gfccModal');
		}

		// Click / Shift+Click selection
		$('#gfcc-modal').on('click', '.gfcc-modal-field-item:not(.source-field)', function (e) {
			var $item = $(this);
			var fieldId = parseInt($item.attr('data-field-id'), 10);
			var index = parseInt($item.attr('data-index'), 10);

			if (e.shiftKey && lastClickedIndex >= 0) {
				// Range select
				var start = Math.min(lastClickedIndex, index);
				var end = Math.max(lastClickedIndex, index);

				$('#gfcc-modal .gfcc-modal-field-item:not(.source-field)').each(function () {
					var idx = parseInt($(this).attr('data-index'), 10);
					if (idx >= start && idx <= end) {
						var fId = parseInt($(this).attr('data-field-id'), 10);
						selectedIds[fId] = true;
						$(this).addClass('selected').find('input[type="checkbox"]').prop('checked', true);
					}
				});
			} else {
				// Toggle single
				if (selectedIds[fieldId]) {
					delete selectedIds[fieldId];
					$item.removeClass('selected').find('input[type="checkbox"]').prop('checked', false);
				} else {
					selectedIds[fieldId] = true;
					$item.addClass('selected').find('input[type="checkbox"]').prop('checked', true);
				}
			}

			lastClickedIndex = index;
			updatePasteButton();
		});

		// Search filter
		$('#gfcc-modal .gfcc-modal-search input').on('input', function () {
			var query = $(this).val().toLowerCase();
			$('#gfcc-modal .gfcc-modal-field-item').each(function () {
				var text = $(this).text().toLowerCase();
				$(this).toggle(text.indexOf(query) >= 0);
			});
		});

		// Close handlers - use event delegation like reference plugin
		$(document).on('click.gfccModal', '.gfcc-modal-close', function (e) {
			e.preventDefault();
			e.stopPropagation();
			closeModal();
		});

		$(document).on('click.gfccModal', '#gfcc-modal-overlay', function (e) {
			e.preventDefault();
			e.stopPropagation();
			closeModal();
		});

		// Escape key
		$(document).on('keydown.gfccModal', function (e) {
			if (e.key === 'Escape') {
				closeModal();
			}
		});

		// Paste action
		$(document).on('click.gfccModal', '#gfcc-paste-btn', function () {
			var ids = Object.keys(selectedIds).map(Number);
			if (ids.length === 0) return;

			ids.forEach(function (targetId) {
				var targetField = safelyGetFieldById(targetId);
				if (!targetField) return;

				// Deep copy the conditions and apply directly to field object
				targetField.conditionalLogic = JSON.parse(JSON.stringify(copiedConditions));
			});

			// Trigger GF update
			if (typeof gform !== 'undefined' && gform.doAction) {
				gform.doAction('gform_field_conditional_logic_updated');
			}

			// Refresh all badges
			updateConditionalBadges();

			closeModal();

			showToast(gfFieldIdCondTranslations.conditionsPasted.replace('%d', ids.length));
		});
	}

	// Click handler for copy button — use native capture-phase listener
	// to fire BEFORE GF's own handlers can swallow the event
	document.addEventListener('click', function (e) {
		if (!e.target || !e.target.closest) {
			return;
		}

		var btn = e.target.closest('.gfcc-copy-conditions-btn');
		if (!btn) {
			return;
		}

		console.log('[GFCC DEBUG] Copy button clicked (capture phase)!', btn);
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();

		var fieldId = parseInt(btn.getAttribute('data-field-id'), 10);
		console.log('[GFCC DEBUG] Field ID:', fieldId);
		if (isNaN(fieldId)) { console.log('[GFCC DEBUG] fieldId is NaN, aborting'); return; }

		var field = safelyGetFieldById(fieldId);
		console.log('[GFCC DEBUG] Field object:', field);
		if (!field || !field.conditionalLogic || !field.conditionalLogic.rules || field.conditionalLogic.rules.length === 0) {
			console.log('[GFCC DEBUG] No conditions to copy');
			showToast(gfFieldIdCondTranslations.noConditionsToCopy);
			return;
		}

		// Store deep copy of conditions
		copiedConditions = JSON.parse(JSON.stringify(field.conditionalLogic));
		sourceFieldId = fieldId;
		console.log('[GFCC DEBUG] Copied conditions:', copiedConditions);

		showToast(gfFieldIdCondTranslations.conditionsCopied);

		// Open paste modal immediately
		console.log('[GFCC DEBUG] About to call openPasteModal()');
		openPasteModal();
		console.log('[GFCC DEBUG] openPasteModal() returned');
	}, true); // <-- capture phase

	/**
 * Start Visual Trace for a field
 * 
 * @param {number} sourceFieldId The ID of the field that was clicked
 */
	function startVisualTrace(sourceFieldId) {


		// Check Driver.js availability
		if (!window.driver || !window.driver.js || !window.driver.js.driver) {
			console.error('Visual Trace: Driver.js is not loaded properly', window.driver);
			alert('Error: Driver.js not loaded.');
			return;
		}

		// Ensure form object exists
		var formData = window.form;
		if (typeof formData === 'undefined' || !formData || !formData.fields) {
			console.error('Visual Trace: Form data not found', formData);
			return;
		}

		var sourceField = safelyGetFieldById(sourceFieldId);
		if (!sourceField) {
			console.error('Visual Trace: Source field not found');
			return;
		}



		// Find all fields that depend on this source field
		var dependentFields = [];

		formData.fields.forEach(function (field) {
			if (!field || !field.conditionalLogic || !field.conditionalLogic.rules) {
				return;
			}

			var dependsOnSource = false;
			var relevantRules = [];

			field.conditionalLogic.rules.forEach(function (rule) {
				if (rule.fieldId == sourceFieldId) {
					dependsOnSource = true;
					relevantRules.push(rule);
				}
			});

			if (dependsOnSource) {
				dependentFields.push({
					field: field,
					rules: relevantRules
				});
			}
		});



		if (dependentFields.length === 0) {

			alert(gfFieldIdCondTranslations.field + ' ' + sourceFieldId + ' ' + gfFieldIdCondTranslations.isNotUsedInConditionalLogic || 'This field is not used in any conditional logic.');
			return;
		}

		// Build related fields:
		//  - source field (celui sur lequel on a cliqué)
		//  - upstream fields : champs utilisés dans la logique conditionnelle du champ source
		//  - downstream fields : champs qui utilisent le champ source dans leur logique
		var upstreamMap = {};
		var upstreamFields = [];

		if (sourceField.conditionalLogic && Array.isArray(sourceField.conditionalLogic.rules)) {
			sourceField.conditionalLogic.rules.forEach(function (rule) {
				if (!rule || !rule.fieldId) {
					return;
				}

				var upField = safelyGetFieldById(rule.fieldId);
				if (!upField) {
					return;
				}

				if (!upstreamMap[upField.id]) {
					upstreamMap[upField.id] = {
						field: upField,
						rules: []
					};
					upstreamFields.push(upstreamMap[upField.id]);
				}

				upstreamMap[upField.id].rules.push(rule);
			});
		}

		// Construire la liste ordonnée de tous les champs impliqués
		// 1) champ source
		// 2) champs dont il dépend (upstream)
		// 3) champs qui dépendent de lui (downstream)
		var allStepsData = [];

		allStepsData.push({
			type: 'source',
			field: sourceField,
			rules: (sourceField.conditionalLogic && Array.isArray(sourceField.conditionalLogic.rules))
				? sourceField.conditionalLogic.rules
				: []
		});

		upstreamFields.forEach(function (item) {
			allStepsData.push({
				type: 'upstream',
				field: item.field,
				rules: item.rules
			});
		});

		dependentFields.forEach(function (item) {
			// éviter les doublons si un champ est déjà dans la liste
			var exists = allStepsData.some(function (s) {
				return s.field.id === item.field.id;
			});

			if (!exists) {
				allStepsData.push({
					type: 'downstream',
					field: item.field,
					rules: item.rules
				});
			}
		});

		// Générer les steps Driver.js à partir de cette liste
		var steps = allStepsData.map(function (item, index) {
			var field = item.field;
			var description;

			if (item.type === 'source') {
				description = generateSelfDescriptionForField(sourceField, dependentFields);
			} else if (item.type === 'downstream') {
				description = generateNaturalLanguageDescription(field, sourceField, item.rules);
			} else { // 'upstream'
				description = generateNaturalLanguageDescription(sourceField, field, item.rules);
			}

			var prevItem = allStepsData[index - 1];
			var nextItem = allStepsData[index + 1];

			var nextLabel = nextItem ? getFieldDisplayLabel(nextItem.field.id) + ' →' : 'Done';
			var prevLabel = prevItem ? '← ' + getFieldDisplayLabel(prevItem.field.id) : '← Previous';

			return {
				element: '#field_' + field.id,
				popover: {
					title: getFieldDisplayLabel(field.id),
					description: description,
					nextBtnText: nextLabel,
					prevBtnText: prevLabel
				}
			};
		});






		try {
			// Configure Driver
			var driverObj = window.driver.js.driver({
				showProgress: true,
				animate: true,
				allowClose: true,
				doneBtnText: 'Done',
				nextBtnText: 'Next',
				prevBtnText: 'Previous',
				showButtons: ['next', 'previous'],
				steps: steps,
				onPopoverRendered: function () {
					// Previous button hiding is done via CSS (.driver-popover-prev-btn[disabled])
				}
			});


			driverObj.drive();
		} catch (err) {
			console.error('Visual Trace: Error initializing or running driver', err);
		}
	}

	window.startVisualTrace = startVisualTrace; // <— add this line

	/**
	 * Generate Natural Language Description for Visual Trace
	 */
	function generateNaturalLanguageDescription(targetField, sourceField, rules) {
		// "Field [Target] will be [Action] if Field [Source] [Condition]"

		var actionType = targetField.conditionalLogic.actionType || 'show';
		var actionText = actionType === 'show' ? gfFieldIdCondTranslations.willBeDisplayedIf : gfFieldIdCondTranslations.willBeHiddenIf;

		var targetLabelHtml = '<strong>' + getFieldDisplayLabel(targetField.id) + '</strong>';
		var desc = makeFieldLink(targetField.id, targetLabelHtml) + ' ' + actionText + ' ';

		var ruleDescriptions = rules.map(function (rule) {
			var operator = rule.operator || 'is';
			var value = rule.value;
			var operatorText = gfFieldIdCondTranslations.operators[operator] || operator;

			var conditionText = '';
			if ((operator === 'is' || operator === 'isnot') && !value) {
				conditionText = operator === 'is' ? gfFieldIdCondTranslations.isEmpty : gfFieldIdCondTranslations.isNotEmpty;
			} else {
				conditionText = operatorText + ' <strong>' + (value || '') + '</strong>';
			}

			var sourceLabelHtml = '<strong>' + getFieldDisplayLabel(sourceField.id) + '</strong>';
			return makeFieldLink(sourceField.id, sourceLabelHtml) + ' ' + conditionText;
		});

		desc += ruleDescriptions.join(' ' + (targetField.conditionalLogic.logicType === 'all' ? gfFieldIdCondTranslations.allConditionsMustBeMet : gfFieldIdCondTranslations.anyConditionCanBeMet) + ' ');

		return desc;
	}

	// Description pour le champ lui‑même (ses propres règles)

	// Crée un lien cliquable vers un champ dans le texte du popover
	function makeFieldLink(fieldId, labelHtml) {
		return '<span class="gfcc-vt-field-link" data-target-field-id="' +
			fieldId + '">' + labelHtml + '</span>';
	}

	// Description pour le champ lui‑même (ses propres règles) avec liens cliquables
	function generateSelfDescriptionForField(field, dependentFields) {
		// Build the "is used by" description from dependent fields
		var usedByParts = [];
		if (dependentFields && dependentFields.length > 0) {
			dependentFields.forEach(function (dep) {
				var depLabel = getFieldDisplayLabel(dep.field.id);
				var depLabelHtml = '<strong>' + depLabel + '</strong> (ID:' + dep.field.id + ')';
				usedByParts.push(makeFieldLink(dep.field.id, depLabelHtml));
			});
		}

		var usedByDesc = '';
		if (usedByParts.length > 0) {
			usedByDesc = (gfFieldIdCondTranslations.isUsedByField || 'Is used by field ') + usedByParts.join((gfFieldIdCondTranslations.andConnector || ' AND '));
		}

		if (!field.conditionalLogic || !field.conditionalLogic.rules || field.conditionalLogic.rules.length === 0) {
			return usedByDesc || gfFieldIdCondTranslations.thisField;
		}

		var actionType = field.conditionalLogic.actionType || 'show';
		var actionText = actionType === 'show'
			? gfFieldIdCondTranslations.willBeDisplayedIf
			: gfFieldIdCondTranslations.willBeHiddenIf;

		var logicType = field.conditionalLogic.logicType || 'all';
		var rules = field.conditionalLogic.rules;

		// Label du champ cible (Nom) cliquable
		var targetLabelHtml = '<strong>' + getFieldDisplayLabel(field.id) + '</strong>';
		var targetLabelLink = makeFieldLink(field.id, targetLabelHtml);

		// Règles : chaque champ conditionnel (Job, Hobbie, …) devient un lien
		var ruleParts = rules.map(function (rule) {
			var condFieldLabel = getFieldDisplayLabel(rule.fieldId);
			var operator = rule.operator || 'is';
			var value = rule.value;
			var operatorText = gfFieldIdCondTranslations.operators[operator] || operator;

			var conditionText;
			if ((operator === 'is' || operator === 'isnot') && !value) {
				conditionText = operator === 'is'
					? gfFieldIdCondTranslations.isEmpty
					: gfFieldIdCondTranslations.isNotEmpty;
			} else {
				conditionText = operatorText + ' <strong>' + (value || '') + '</strong>';
			}

			var sourceLabelHtml = '<strong>' + condFieldLabel + '</strong>';
			var sourceLabelLink = makeFieldLink(rule.fieldId, sourceLabelHtml);

			// Exemple rendu :  Job(est Second choix)  /  Hobbie(est 12)
			return sourceLabelLink + ' ' + conditionText;
		});

		// Connecteur ET / OU traduisible
		var glue = (logicType === 'all'
			? (gfFieldIdCondTranslations.andConnector || ' AND ')
			: (gfFieldIdCondTranslations.orConnector || ' OR ')
		);

		// Exemple global : Nom sera affiché si Job est Second choix ET Hobbie est 12
		var desc = targetLabelLink + ' ' + actionText + ' ' + ruleParts.join(glue);

		// Append "is used by" info if available
		if (usedByDesc) {
			desc += '<br><br>' + usedByDesc;
		}

		return desc;
	}



	/**
	 * Check if a field is used in any other field's conditional logic
	 *
	 * @param {number} fieldId The field ID to check
	 * @return {boolean} True if at least one other field references this field in its rules
	 */
	function isFieldUsedInConditionalLogic(fieldId) {
		var formData = window.form;
		if (!formData || !formData.fields) {
			return false;
		}

		for (var i = 0; i < formData.fields.length; i++) {
			var field = formData.fields[i];
			if (!field || !field.conditionalLogic || !field.conditionalLogic.rules) {
				continue;
			}
			for (var j = 0; j < field.conditionalLogic.rules.length; j++) {
				if (field.conditionalLogic.rules[j].fieldId == fieldId) {
					return true;
				}
			}
		}
		return false;
	}

	// Bind click handler for main field ID badge (Visual Trace)
	$(document).on('click', '.gfcc-inline-field-id', function (e) {
		// Only handle clicks on the main ID badge, not the conditional ones or logic type badges
		if ($(this).closest('.gfcc-cond-field-id').length > 0 ||
			$(this).closest('.gfcc-cond-to-field-id').length > 0 ||
			$(this).hasClass('gfcc-logic-type-all') ||
			$(this).hasClass('gfcc-logic-type-any')) {
			return;
		}

		var $container = $(this).closest('.gfcc-field-badges');
		var fieldId = parseInt($container.data('field-id'), 10);

		// Only trigger Visual Trace if this field is actually used by another field
		if (isNaN(fieldId) || !isFieldUsedInConditionalLogic(fieldId)) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		startVisualTrace(fieldId);
	});

	// Fallback: native capturing handler for ID badges
	document.addEventListener('click', function (e) {
		if (!e.target || !e.target.closest) {
			return;
		}

		var badge = e.target.closest('.gfcc-inline-field-id');
		if (!badge) {
			return;
		}

		// Skip conditional badges / logic-type badges (safety)
		if (badge.closest('.gfcc-cond-field-id') ||
			badge.closest('.gfcc-cond-to-field-id') ||
			badge.classList.contains('gfcc-logic-type-all') ||
			badge.classList.contains('gfcc-logic-type-any')) {
			return;
		}

		var container = badge.closest('.gfcc-field-badges');
		if (!container) {
			return;
		}

		var fieldId = parseInt(container.getAttribute('data-field-id'), 10);

		// Only trigger Visual Trace if this field is actually used by another field
		if (isNaN(fieldId) || !isFieldUsedInConditionalLogic(fieldId)) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		startVisualTrace(fieldId);
	}, true); // note the `true` to use capture phase

	// Clic sur un nom de champ dans le texte du popover Visual Trace
	// -> relance Visual Trace en partant de ce champ
	$(document).on('click', '.gfcc-vt-field-link', function (e) {
		e.preventDefault();
		e.stopPropagation();

		var targetId = parseInt($(this).attr('data-target-field-id'), 10);
		if (!isNaN(targetId) && typeof startVisualTrace === 'function') {
			startVisualTrace(targetId);
		}
	});

})(jQuery);
