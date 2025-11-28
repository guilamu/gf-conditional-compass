/**
 * Conditional Logic Map JavaScript
 * 
 * @package Gravity_Conditional_Compass
 * @since 0.9.4
 */

(function($) {
	'use strict';

	// Store original content
	var originalContent = '';

	/**
	 * Initialize when document is ready
	 */
	$(document).ready(function() {
		initCopyButton();
		initTextareaInteractions();
		initFilterToggles();
	});

	/**
	 * Initialize copy to clipboard functionality
	 */
	function initCopyButton() {
		var copyButton = $('#gfcl-copy-map');
		var textarea = $('#gfcl-map-textarea');
		var notice = $('#gfcl-copy-notice');
		var noticeText = notice.find('.gfcl-copy-notice-text');

		if (!copyButton.length || !textarea.length) {
			return;
		}

		copyButton.on('click', function(e) {
			e.preventDefault();

			// Select the textarea content
			textarea.select();
			textarea[0].setSelectionRange(0, textarea.val().length);

			// Try to copy using the Clipboard API (modern browsers)
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(textarea.val())
					.then(function() {
						showNotice('success', gfCondLogicMapL10n.copiedToClipboard);
					})
					.catch(function() {
						// Fallback to execCommand
						fallbackCopy();
					});
			} else {
				// Fallback to execCommand for older browsers
				fallbackCopy();
			}

			/**
			 * Fallback copy method using execCommand
			 */
			function fallbackCopy() {
				try {
					var successful = document.execCommand('copy');
					if (successful) {
						showNotice('success', gfCondLogicMapL10n.copiedToClipboard);
					} else {
						showNotice('error', gfCondLogicMapL10n.copyFailed);
					}
				} catch (err) {
					showNotice('error', gfCondLogicMapL10n.copyFailed);
				}
			}

			/**
			 * Show copy notice
			 * 
			 * @param {string} type - Notice type (success/error)
			 * @param {string} message - Notice message
			 */
			function showNotice(type, message) {
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
				setTimeout(function() {
					notice.fadeOut(300);
				}, 3000);
			}
		});
	}

	/**
	 * Initialize textarea interactions
	 */
	function initTextareaInteractions() {
		var textarea = $('#gfcl-map-textarea');

		if (!textarea.length) {
			return;
		}

		// Store original content
		originalContent = textarea.val();
		
		// Clean markers from initial display
		cleanAndDisplayContent(originalContent);

		// Select all text when clicking on the textarea
		textarea.on('click', function() {
			this.select();
			this.setSelectionRange(0, this.value.length);
		});

		// Prevent deselection when clicking inside
		textarea.on('mouseup', function(e) {
			e.preventDefault();
		});
	}

	/**
	 * Clean markers from content and display
	 * 
	 * @param {string} content - Content to clean
	 */
	function cleanAndDisplayContent(content) {
		var textarea = $('#gfcl-map-textarea');
		
		// Remove all marker tags
		var cleaned = content
			.replace(/\[HAS-DEPENDS-ON\]/g, '')
			.replace(/\[HAS-USED-BY\]/g, '')
			.replace(/\[DEPENDS-ON-START\]\n/g, '')
			.replace(/\[DEPENDS-ON-END\]\n/g, '')
			.replace(/\[USED-BY-START\]\n/g, '')
			.replace(/\[USED-BY-END\]\n/g, '')
			.replace(/\[FIELD-ID-START\]/g, '')
			.replace(/\[FIELD-ID-END\]/g, '')
			.replace(/\[FIELD-TYPE-START\]/g, '')
			.replace(/\[FIELD-TYPE-END\]/g, '');
		
		textarea.val(cleaned);
	}

	/**
	 * Initialize filter toggles
	 */
	function initFilterToggles() {
		var hideDependsOn = $('#gfcl-hide-depends-on');
		var hideUsedBy = $('#gfcl-hide-used-by');
		var onlyWithDeps = $('#gfcl-only-with-deps');
		var hideFieldNumber = $('#gfcl-hide-field-number');
		var hideFieldType = $('#gfcl-hide-field-type');
		var textarea = $('#gfcl-map-textarea');

		if (!hideDependsOn.length || !hideUsedBy.length || !onlyWithDeps.length || 
		    !hideFieldNumber.length || !hideFieldType.length || !textarea.length) {
			return;
		}

		// Add change event listeners to all toggles
		hideDependsOn.on('change', applyFilters);
		hideUsedBy.on('change', applyFilters);
		onlyWithDeps.on('change', applyFilters);
		hideFieldNumber.on('change', applyFilters);
		hideFieldType.on('change', applyFilters);

		/**
		 * Apply filters to the textarea content
		 */
		function applyFilters() {
			var content = originalContent;
			var hideDependsOnChecked = hideDependsOn.is(':checked');
			var hideUsedByChecked = hideUsedBy.is(':checked');
			var onlyWithDepsChecked = onlyWithDeps.is(':checked');
			var hideFieldNumberChecked = hideFieldNumber.is(':checked');
			var hideFieldTypeChecked = hideFieldType.is(':checked');

			// Split content into fields
			var lines = content.split('\n');
			var filteredLines = [];
			var inField = false;
			var currentField = [];
			var skipField = false;
			var hasDepends = false;
			var hasUsedBy = false;
			var inDependsOn = false;
			var inUsedBy = false;

			// Add header
			filteredLines.push(lines[0]); // "Form Conditional Logic Map"
			filteredLines.push(lines[1]); // separator line
			filteredLines.push(lines[2]); // empty line

			for (var i = 3; i < lines.length; i++) {
				var line = lines[i];

				// Check if it's a field header line
				if (line.match(/\[FIELD-ID-START\]Field \d+/)) {
					// Process previous field if exists
					if (currentField.length > 0) {
						processField();
					}

					// Start new field
					inField = true;
					currentField = [line];
					skipField = false;
					hasDepends = line.includes('[HAS-DEPENDS-ON]');
					hasUsedBy = line.includes('[HAS-USED-BY]');
					inDependsOn = false;
					inUsedBy = false;

					// Check if we should skip this field based on "only with deps" filter
					if (onlyWithDepsChecked && !hasDepends && !hasUsedBy) {
						skipField = true;
					}
				} else if (inField) {
					// Check for section markers
					if (line.includes('[DEPENDS-ON-START]')) {
						inDependsOn = true;
						// Don't add marker line
					} else if (line.includes('[DEPENDS-ON-END]')) {
						inDependsOn = false;
						// Don't add marker line
					} else if (line.includes('[USED-BY-START]')) {
						inUsedBy = true;
						// Don't add marker line
					} else if (line.includes('[USED-BY-END]')) {
						inUsedBy = false;
						// Don't add marker line
					} else if (inDependsOn) {
						// In DEPENDS ON section
						if (!hideDependsOnChecked && !skipField) {
							currentField.push(line);
						}
					} else if (inUsedBy) {
						// In USED BY section
						if (!hideUsedByChecked && !skipField) {
							currentField.push(line);
						}
					} else {
						// Regular line or empty line
						currentField.push(line);
					}
				} else {
					// Not in a field (shouldn't happen but handle it)
					filteredLines.push(line);
				}
			}

			// Process last field
			if (currentField.length > 0) {
				processField();
			}

			/**
			 * Process and add current field to filtered lines
			 */
			function processField() {
				if (!skipField && currentField.length > 0) {
					// Process field header
					var header = currentField[0];
					
					// Remove markers
					header = header
						.replace(' [HAS-DEPENDS-ON]', '')
						.replace(' [HAS-USED-BY]', '');
					
					// Hide field number if toggle is checked
					if (hideFieldNumberChecked) {
						header = header.replace(/\[FIELD-ID-START\]Field \d+\[FIELD-ID-END\]\s*/g, '');
					} else {
						header = header.replace(/\[FIELD-ID-START\]/g, '').replace(/\[FIELD-ID-END\]/g, '');
					}
					
					// Hide field type if toggle is checked
					if (hideFieldTypeChecked) {
						header = header.replace(/\[FIELD-TYPE-START\]\[.*?\]\[FIELD-TYPE-END\]\s*/g, '');
					} else {
						header = header.replace(/\[FIELD-TYPE-START\]/g, '').replace(/\[FIELD-TYPE-END\]/g, '');
					}
					
					currentField[0] = header;
					
					// Process remaining lines in the field
					for (var j = 1; j < currentField.length; j++) {
						var line = currentField[j];
						
						// Hide field numbers in dependency lines if toggle is checked
						if (hideFieldNumberChecked) {
							line = line.replace(/\[FIELD-ID-START\]Field \d+\[FIELD-ID-END\]/g, '');
						} else {
							line = line.replace(/\[FIELD-ID-START\]/g, '').replace(/\[FIELD-ID-END\]/g, '');
						}
						
						currentField[j] = line;
					}
					
					filteredLines = filteredLines.concat(currentField);
				}
				currentField = [];
			}

			// Update textarea with filtered content
			textarea.val(filteredLines.join('\n'));
		}
	}

})(jQuery);
