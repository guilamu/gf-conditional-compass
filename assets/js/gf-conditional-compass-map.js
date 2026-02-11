/**
 * Conditional Logic Map JavaScript
 *
 * Handles the Conditional Logic Map settings page functionality including:
 * - Copy to clipboard functionality
 * - Filter toggles for map display
 * - Full English mode conversion
 * - Field ID badge toggle
 *
 * @package Gravity_Conditional_Compass
 * @since 0.9.4
 */

(function ($) {
	'use strict';

	// Ensure translations are available
	if (typeof gfCondLogicMapL10n === 'undefined') {
		console.warn('Gravity Conditional Compass Map: Translations not loaded');
		return;
	}

	/**
	 * Main Conditional Logic Map object
	 *
	 * @type {Object}
	 */
	var ConditionalLogicMap = {
		/**
		 * Original map content (with markers)
		 *
		 * @type {string}
		 */
		originalContent: '',

		/**
		 * Cached DOM elements
		 *
		 * @type {Object}
		 */
		elements: {},

		/**
		 * Compiled regex patterns for better performance
		 *
		 * @type {Object}
		 */
		patterns: {
			fieldIdStart: /\[FIELD-ID-START\]/g,
			fieldIdEnd: /\[FIELD-ID-END\]/g,
			fieldTypeStart: /\[FIELD-TYPE-START\]/g,
			fieldTypeEnd: /\[FIELD-TYPE-END\]/g,
			unusedStart: /\[UNUSED-START\]/g,
			unusedEnd: /\[UNUSED-END\]/g,
			unusedBlock: /\[UNUSED-START\][\s\S]*?\[UNUSED-END\]\s*\n?/g,
			dependsOnLine: /^[ \t]*╚═\[[^\]]*]═> .*$(?:\r?\n)?/gm,
			usedByLine: /^[ \t]*└─> IS USED BY .*$(?:\r?\n)?/gm,
			fieldNumber: /\[FIELD-ID-START\]Field \d+\[FIELD-ID-END\]\s*/g,
			fieldType: /\[FIELD-TYPE-START\]\[.*?\]\[FIELD-TYPE-END\]\s*/g,
			fieldLine: /\[FIELD-ID-START\]Field (\d+)\[FIELD-ID-END\]\s*\[FIELD-TYPE-START\]\[([^\]]+)\]\s*\[FIELD-TYPE-END\]\s*"([^"]+)"/,
			showIfLine: /╚═\[(SHOW IF|HIDE IF)\]═>\s*\[FIELD-ID-START\]Field (\d+)\[FIELD-ID-END\]\s*"([^"]+)"\s*(.+)/,
			logicType: /^\s+\[(ALL|ANY)\]/,
			usedByMarker: /└─> IS USED BY/,
			fieldIdInText: /\[FIELD-ID-START\]Field \d+\[FIELD-ID-END\]\s*/g,
			fieldTypeInText: /\[FIELD-TYPE-START\].*?\[FIELD-TYPE-END\]\s*/g,
		},

		/**
		 * Initialize all functionality
		 *
		 * @return {void}
		 */
		init: function () {
			this.cacheElements();
			this.initCopyButton();
			this.initTextareaInteractions();
			this.initFilterToggles();
			// Note: Field ID badge toggle is handled by gf-conditional-compass.js
			// via initGlobalFieldIdToggle() which handles all three toggles
		},

		/**
		 * Cache frequently used DOM elements
		 *
		 * @return {void}
		 */
		cacheElements: function () {
			this.elements = {
				textarea: $('#gfcl-map-textarea'),
				copyButton: $('#gfcl-copy-map'),
				copyNotice: $('#gfcl-copy-notice'),
				copyNoticeText: $('#gfcl-copy-notice .gfcl-copy-notice-text'),
				hideFieldNumber: $('#gfcl-hide-field-number'),
				hideFieldType: $('#gfcl-hide-field-type'),
				hideUnused: $('#gfcl-hide-unused'),
				hideUsedBy: $('#gfcl-hide-used-by'),
				hideDependsOn: $('#gfcl-hide-depends-on'),
				fullEnglish: $('#gfcl-full-english-toggle'),
			};
		},


		/**
		 * Initialize copy to clipboard functionality
		 *
		 * @return {void}
		 */
		initCopyButton: function () {
			var self = this;
			var copyButton = this.elements.copyButton;
			var textarea = this.elements.textarea;
			var notice = this.elements.copyNotice;
			var noticeText = this.elements.copyNoticeText;

			if (!copyButton.length || !textarea.length) {
				return;
			}

			copyButton.on('click', function (e) {
				e.preventDefault();
				self.copyToClipboard(textarea, notice, noticeText);
			});
		},

		/**
		 * Copy textarea content to clipboard
		 *
		 * @param {jQuery} textarea   Textarea element
		 * @param {jQuery} notice      Notice element
		 * @param {jQuery} noticeText  Notice text element
		 * @return {void}
		 */
		copyToClipboard: function (textarea, notice, noticeText) {
			var self = this;

			// Select the textarea content
			textarea.focus();
			textarea.select();

			try {
				textarea[0].setSelectionRange(0, textarea.val().length);
			} catch (e) {
				// setSelectionRange may fail in some browsers, continue anyway
			}

			// Try to copy using the Clipboard API (modern browsers)
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(textarea.val())
					.then(function () {
						self.showNotice(notice, noticeText, 'success', gfCondLogicMapL10n.copiedToClipboard);
					})
					.catch(function () {
						// Fallback to execCommand
						self.fallbackCopy(textarea, notice, noticeText);
					});
			} else {
				// Fallback to execCommand for older browsers
				this.fallbackCopy(textarea, notice, noticeText);
			}
		},

		/**
		 * Fallback copy method using execCommand
		 *
		 * @param {jQuery} textarea   Textarea element
		 * @param {jQuery} notice      Notice element
		 * @param {jQuery} noticeText  Notice text element
		 * @return {void}
		 */
		fallbackCopy: function (textarea, notice, noticeText) {
			var self = this;
			var successful = false;

			try {
				successful = document.execCommand('copy');
			} catch (err) {
				// execCommand may fail, show error
			}

			if (successful) {
				this.showNotice(notice, noticeText, 'success', gfCondLogicMapL10n.copiedToClipboard);
			} else {
				this.showNotice(notice, noticeText, 'error', gfCondLogicMapL10n.copyFailed);
			}
		},

		/**
		 * Show copy notice
		 *
		 * @param {jQuery} notice     Notice element
		 * @param {jQuery} noticeText Notice text element
		 * @param {string} type       Notice type (success/error)
		 * @param {string} message    Notice message
		 * @return {void}
		 */
		showNotice: function (notice, noticeText, type, message) {
			// Update notice content
			noticeText.text(message);

			// Remove previous type classes
			notice.removeClass('success error');

			// Add current type class
			notice.addClass(type);

			// Update dashicon
			var icon = notice.find('.dashicons');
			icon.removeClass('dashicons-yes-alt dashicons-warning');
			if (type === 'success') {
				icon.addClass('dashicons-yes-alt');
			} else {
				icon.addClass('dashicons-warning');
			}

			// Show notice
			notice.fadeIn(300);

			// Hide notice after 3 seconds
			setTimeout(function () {
				notice.fadeOut(300);
			}, 3000);
		},

		/**
		 * Initialize textarea interactions
		 *
		 * @return {void}
		 */
		initTextareaInteractions: function () {
			var textarea = this.elements.textarea;

			if (!textarea.length) {
				return;
			}

			// Store original content
			this.originalContent = textarea.val();

			// Clean markers from initial display
			this.cleanAndDisplayContent(this.originalContent);
		},

		/**
		 * Clean markers from content and display
		 *
		 * Uses compiled regex patterns for better performance.
		 *
		 * @param {string} content Content to clean
		 * @return {void}
		 */
		cleanAndDisplayContent: function (content) {
			var textarea = this.elements.textarea;
			var patterns = this.patterns;

			// Remove field/type/unused marker tags but keep their visible text
			var cleaned = content
				.replace(patterns.fieldIdStart, '')
				.replace(patterns.fieldIdEnd, '')
				.replace(patterns.fieldTypeStart, '')
				.replace(patterns.fieldTypeEnd, '')
				.replace(patterns.unusedStart, '')
				.replace(patterns.unusedEnd, '');

			textarea.val(cleaned);
		},

		/**
		 * Initialize filter toggles
		 *
		 * @return {void}
		 */
		initFilterToggles: function () {
			var self = this;
			var elements = this.elements;

			// Validate required elements exist
			if (!elements.hideFieldNumber.length || !elements.hideFieldType.length || !elements.textarea.length) {
				return;
			}

			// Add change event listeners to toggles
			elements.hideFieldNumber.on('change', function () {
				self.applyFilters();
			});

			elements.hideFieldType.on('change', function () {
				self.applyFilters();
			});

			if (elements.hideUnused.length) {
				elements.hideUnused.on('change', function () {
					self.applyFilters();
				});
			}

			if (elements.hideUsedBy.length) {
				elements.hideUsedBy.on('change', function () {
					self.applyFilters();
				});
			}

			if (elements.hideDependsOn.length) {
				elements.hideDependsOn.on('change', function () {
					self.applyFilters();
				});
			}

			if (elements.fullEnglish.length) {
				elements.fullEnglish.on('change', function () {
					self.applyFilters();
				});
			}
		},

		/**
		 * Convert map to full English format
		 * Only shows fields with conditional logic (SHOW IF/HIDE IF conditions)
		 *
		 * @param {string} content Original map content
		 * @return {string} Full English formatted content
		 */
		convertToFullEnglish: function (content) {
			var lines = content.split('\n');
			var result = [];
			var currentField = null;
			var currentConditions = [];
			var currentLogicType = 'all'; // 'all' or 'any'
			var currentAction = null;
			var title = '';
			var patterns = this.patterns;

			// Extract title from first line (before separator)
			if (lines.length > 0 && lines[0].trim() !== '') {
				title = lines[0].trim();
			}

			// Parse the map line by line
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];

				// Skip title line (already extracted)
				if (i === 0 && title) {
					continue;
				}

				// Skip separator lines
				if (line.indexOf('═') === 0 && line.trim().length > 10) {
					continue;
				}

				// Skip "No fields found" message
				if (line.indexOf('No fields found') !== -1) {
					continue;
				}

				// Detect field line: Field N [Type] "Label"
				var fieldMatch = line.match(patterns.fieldLine);
				if (fieldMatch) {
					// Process previous field if exists
					if (currentField && currentConditions.length > 0) {
						result.push(this.formatFullEnglishSentence(currentField, currentConditions, currentLogicType, currentAction));
					}

					// Start new field
					currentField = {
						id: fieldMatch[1],
						type: fieldMatch[2],
						label: fieldMatch[3]
					};
					currentConditions = [];
					currentLogicType = 'all';
					currentAction = null;
					continue;
				}

				// Detect SHOW IF or HIDE IF condition
				var showIfMatch = line.match(patterns.showIfLine);
				if (showIfMatch && currentField) {
					var action = showIfMatch[1];
					var conditionFieldId = showIfMatch[2];
					var conditionFieldLabel = showIfMatch[3];
					var conditionText = showIfMatch[4].trim();

					// Set action for this field (should be same for all conditions)
					if (!currentAction) {
						currentAction = action;
					}

					// Format condition text
					var formattedCondition = this.formatConditionText(conditionFieldLabel, conditionFieldId, conditionText);
					currentConditions.push(formattedCondition);
					continue;
				}

				// Detect logic type indicator [ALL] or [ANY]
				var logicMatch = line.match(patterns.logicType);
				if (logicMatch && currentField) {
					currentLogicType = logicMatch[1].toLowerCase();
					continue;
				}

				// Skip "IS USED BY" lines - we only care about SHOW IF/HIDE IF
				if (patterns.usedByMarker.test(line)) {
					continue;
				}
			}

			// Process last field if exists
			if (currentField && currentConditions.length > 0) {
				result.push(this.formatFullEnglishSentence(currentField, currentConditions, currentLogicType, currentAction));
			}

			// Build final output with title
			var output = [];
			if (title) {
				output.push(title);
				output.push(''); // Empty line after title
			}
			if (result.length > 0) {
				output.push(result.join('\n\n'));
			}

			return output.join('\n');
		},

		/**
		 * Format condition text for full English
		 *
		 * @param {string} fieldLabel    Condition field label
		 * @param {string} fieldId       Condition field ID
		 * @param {string} conditionText Raw condition text
		 * @return {string} Formatted condition text
		 */
		formatConditionText: function (fieldLabel, fieldId, conditionText) {
			var patterns = this.patterns;

			// Clean up the condition text - remove any remaining field ID markers
			conditionText = conditionText
				.replace(patterns.fieldIdInText, '')
				.replace(patterns.fieldTypeInText, '')
				.trim();

			// Return formatted: "the [Label] field ([ID]) [condition]"
			// Uses localized pattern: 'conditionPart' => 'the %1$s field (%2$s) %3$s'
			var pattern = gfCondLogicMapL10n.conditionPart;
			return pattern
				.replace('%1$s', fieldLabel)
				.replace('%2$s', fieldId)
				.replace('%3$s', conditionText);
		},

		/**
		 * Format full English sentence for a field
		 *
		 * @param {Object} field      Field object with id, type, label
		 * @param {Array}  conditions Array of condition text strings
		 * @param {string} logicType  'all' or 'any'
		 * @param {string} action     'SHOW IF' or 'HIDE IF'
		 * @return {string} Formatted sentence
		 */
		formatFullEnglishSentence: function (field, conditions, logicType, action) {
			var actionText = action === 'SHOW IF' ? gfCondLogicMapL10n.willBeShown : gfCondLogicMapL10n.willBeHidden;

			// Join conditions with AND or OR
			var connector = logicType === 'all' ? gfCondLogicMapL10n.connectorAnd : gfCondLogicMapL10n.connectorOr;
			var conditionsText = conditions.join(connector);

			// Format: "The [Label] field ([ID]), will be shown if [conditions]."
			// Uses localized pattern: 'sentenceStart' => 'The %1$s field (%2$s),'
			var start = gfCondLogicMapL10n.sentenceStart
				.replace('%1$s', field.label)
				.replace('%2$s', field.id);

			return start + ' ' + actionText + ' ' + conditionsText + '.';
		},

		/**
		 * Apply filters to the textarea content
		 *
		 * @return {void}
		 */
		applyFilters: function () {
			var content = this.originalContent;
			var elements = this.elements;
			var patterns = this.patterns;

			// Get toggle states
			var hideFieldNumberChecked = elements.hideFieldNumber.is(':checked');
			var hideFieldTypeChecked = elements.hideFieldType.is(':checked');
			var hideUnusedChecked = elements.hideUnused.length ? elements.hideUnused.is(':checked') : false;
			var hideUsedByChecked = elements.hideUsedBy.length ? elements.hideUsedBy.is(':checked') : false;
			var hideDependsOnChecked = elements.hideDependsOn.length ? elements.hideDependsOn.is(':checked') : false;
			var fullEnglishChecked = elements.fullEnglish.length ? elements.fullEnglish.is(':checked') : false;

			// If Full English mode is enabled, convert to full English format
			if (fullEnglishChecked) {
				content = this.convertToFullEnglish(this.originalContent);
				elements.textarea.val(content);
				return;
			}

			// Hide entire blocks for unused fields
			if (hideUnusedChecked) {
				content = content.replace(patterns.unusedBlock, '');
			}

			// Hide "DEPENDS ON" (SHOW/HIDE IF) dependencies
			if (hideDependsOnChecked) {
				content = content.replace(patterns.dependsOnLine, '');
			}

			// Hide "IS USED BY" dependencies
			if (hideUsedByChecked) {
				content = content.replace(patterns.usedByLine, '');
			}

			// Field number handling
			if (hideFieldNumberChecked) {
				// Remove the full "Field N" token everywhere
				content = content.replace(patterns.fieldNumber, '');
			} else {
				// Keep "Field N" but remove the marker tags
				content = content
					.replace(patterns.fieldIdStart, '')
					.replace(patterns.fieldIdEnd, '');
			}

			// Field type handling
			if (hideFieldTypeChecked) {
				// Remove the full "[Type]" token everywhere
				content = content.replace(patterns.fieldType, '');
			} else {
				// Keep type label but remove the marker tags
				content = content
					.replace(patterns.fieldTypeStart, '')
					.replace(patterns.fieldTypeEnd, '');
			}

			// Always strip any remaining unused markers from display
			content = content
				.replace(patterns.unusedStart, '')
				.replace(patterns.unusedEnd, '');

			elements.textarea.val(content);
		}
	};

	/**
	 * Initialize when document is ready
	 */
	$(document).ready(function () {
		ConditionalLogicMap.init();
	});

})(jQuery);
