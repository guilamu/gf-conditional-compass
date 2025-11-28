/**
 * Gravity Forms Conditional Compass - JavaScript v1.1
 * Handles conditional logic badge updates and interactions with toggle functionality
 */

jQuery(document).ready(function($) {
    // Translations and plugin URL are passed inline from PHP
    // gfFieldIdCondTranslations = { ... }
    // gfFieldIdCondPluginUrl = 'https://...'

    // Special field identifiers mapping (GravityPerks Conditional Logic Dates, etc.)
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

    // Function to get field label or admin label by field ID
    function getFieldDisplayLabel(fieldId) {
        if (typeof fieldId === 'string' && specialFieldLabels[fieldId]) {
            return specialFieldLabels[fieldId];
        }

        if (typeof form === 'undefined') return gfFieldIdCondTranslations.field + ' ' + fieldId;

        var field = GetFieldById(fieldId);
        if (field) {
            return field.adminLabel || field.label || gfFieldIdCondTranslations.field + ' ' + fieldId;
        }
        return gfFieldIdCondTranslations.field + ' ' + fieldId;
    }

    // Function to open conditional logic settings for a field
    function openConditionalLogicSettings(fieldId) {
        var field = GetFieldById(fieldId);
        if (!field) return;

        var $field = $('#field_' + fieldId);
        if ($field.length) {
            $field.trigger('click');

            setTimeout(function() {
                var $condLogicButton = $('.conditional_logic_accordion__toggle_button');

                if ($condLogicButton.length) {
                    var $accordion = $condLogicButton.closest('.conditional_logic_accordion');
                    var isOpen = $accordion && $accordion.hasClass('conditional_logic_accordion--open');

                    if (!isOpen) {
                        $condLogicButton[0].click();
                    }

                    setTimeout(function() {
                        $condLogicButton[0].scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'nearest' 
                        });
                    }, 100);
                }
            }, 300);
        }
    }

    // Function to update "CONDITION TO" badges (fields used as conditions by other fields)
    function updateConditionToBadges() {
        if (typeof form === 'undefined') return;
        
        // First, remove all existing "CONDITION TO" badges
        $('.gw-cond-to-separator, .gw-cond-to-field-id').remove();
        
        // Build a map of which fields are used as conditions by other fields
        var fieldUsageMap = {}; // { fieldId: [array of field IDs that use it] }
        
        form.fields.forEach(function(field) {
            if (field.conditionalLogic && field.conditionalLogic.rules && field.conditionalLogic.rules.length > 0) {
                field.conditionalLogic.rules.forEach(function(rule) {
                    var condFieldId = rule.fieldId;
                    
                    // Skip special fields (like _gpcld_current_date)
                    if (typeof condFieldId === 'string' && condFieldId.startsWith('_gpcld')) {
                        return;
                    }
                    
                    if (!fieldUsageMap[condFieldId]) {
                        fieldUsageMap[condFieldId] = [];
                    }
                    // Avoid duplicates
                    if (fieldUsageMap[condFieldId].indexOf(field.id) === -1) {
                        fieldUsageMap[condFieldId].push(field.id);
                    }
                });
            }
        });
        
        // Now add "CONDITION TO" badges to fields that are used as conditions
        Object.keys(fieldUsageMap).forEach(function(usedFieldId) {
            var $container = $('.gw-field-badges[data-field-id="' + usedFieldId + '"]');
            if (!$container.length) return;
            
            var usingFieldIds = fieldUsageMap[usedFieldId];
            
            // Check if this field's CONDITION TO badges were previously collapsed
            var isCollapsed = $container.data('cond-to-collapsed') === true;
            
            // Create mirrored separator (arrows pointing left)
            var separator = $('<span></span>')
                .addClass('gw-cond-to-separator')
                .attr('title', 'Used in conditional logic')
                .attr('data-field-id', usedFieldId)
                .html('<img src="' + gfFieldIdCondPluginUrl + 'randomize.png" style="width:15px;height:15px;display:block;transform:scaleX(-1);" alt="←" />');
            
            // Apply collapsed state if needed
            if (isCollapsed) {
                separator.addClass('collapsed');
            }
            
            $container.append(separator);
            
            // Add badges for each field that uses this field
            usingFieldIds.forEach(function(usingFieldId) {
                var usingField = GetFieldById(usingFieldId);
                var fieldLabel = usingField ? (usingField.adminLabel || usingField.label || 'Field ' + usingFieldId) : 'Field ' + usingFieldId;
                
                var tooltip = 'Used as condition in: ' + fieldLabel;
                var badgeText = 'COND: ' + usingFieldId;
                
                var badge = $('<span></span>')
                    .addClass('gw-cond-to-field-id')
                    .attr('data-tooltip', tooltip)
                    .attr('data-target-field-id', usingFieldId)
                    .text(badgeText);
                
                // Hide if collapsed
                if (isCollapsed) {
                    badge.hide();
                }
                
                $container.append(badge);
            });
        });
        
        // Add click handler for CONDITION TO separator (toggle)
        $('.gw-cond-to-separator').off('click').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var $separator = $(this);
            var fieldId = $separator.attr('data-field-id');
            var $container = $separator.closest('.gw-field-badges');
            var $badges = $container.find('.gw-cond-to-field-id');
            
            // Toggle visibility
            $badges.toggle();
            $separator.toggleClass('collapsed');
            
            // Store collapsed state
            var isCollapsed = $separator.hasClass('collapsed');
            $container.data('cond-to-collapsed', isCollapsed);
        });
        
        // Add click handler for CONDITION TO badges
        $('.gw-cond-to-field-id').off('click').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var targetFieldId = parseInt($(this).attr('data-target-field-id'));
            openConditionalLogicSettings(targetFieldId);
        });
    }

    // Function to update conditional logic badges (CONDITION FROM)
    function updateConditionalBadges(specificFieldId) {
        if (typeof form === 'undefined') return;

        var selector = specificFieldId 
            ? '.gw-field-badges[data-field-id="' + specificFieldId + '"]'
            : '.gw-field-badges';

        $(selector).each(function() {
            var $container = $(this);
            var fieldId = parseInt($container.data('field-id'));
            var field = GetFieldById(fieldId);

            if (!field) return;

            // Check if CONDITION FROM badges were previously collapsed
            var isCondFromCollapsed = $container.data('cond-from-collapsed') === true;

            $container.find('.gw-cond-field-id, .gw-cond-separator, .gw-inline-field-id:not(:first)').remove();

            if (field.conditionalLogic && field.conditionalLogic.rules && field.conditionalLogic.rules.length > 0) {
                var rules = field.conditionalLogic.rules;
                var logicType = field.conditionalLogic.logicType || 'all';
                var actionType = field.conditionalLogic.actionType || 'show';

                var currentFieldLabel = field.adminLabel || field.label || gfFieldIdCondTranslations.thisField;

                // Determine action text based on actionType
                var actionText = actionType === 'hide' 
                    ? gfFieldIdCondTranslations.willBeHiddenIf 
                    : gfFieldIdCondTranslations.willBeDisplayedIf;

                // Create separator with randomize.png image
                var separator = $('<span></span>')
                    .addClass('gw-cond-separator')
                    .attr('title', gfFieldIdCondTranslations.hasConditionalLogic)
                    .attr('data-field-id', fieldId)
                    .html('<img src="' + gfFieldIdCondPluginUrl + 'randomize.png" style="width:15px;height:15px;display:block;" alt="→" />');
                
                // Apply collapsed state if needed
                if (isCondFromCollapsed) {
                    separator.addClass('collapsed');
                }
                
                $container.append(separator);

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

                var badgeClass = 'gw-cond-field-id';
                if (logicType.toLowerCase() === 'any') {
                    badgeClass += ' gw-cond-field-id-any';
                }

                rules.forEach(function(rule) {
                    var condFieldId = rule.fieldId;
                    var operator = rule.operator || 'is';
                    var value = rule.value;

                    var fieldLabel = getFieldDisplayLabel(condFieldId);
                    var operatorDisplay = operatorMap[operator] || operator;

                    var tooltip = currentFieldLabel + ' ' + actionText + ' ' + fieldLabel + ' ' + operatorDisplay;

                    if (typeof value === 'undefined' || value === null || value === '') {
                        if (operator === 'is') {
                            tooltip = currentFieldLabel + ' ' + actionText + ' ' + fieldLabel + ' ' + gfFieldIdCondTranslations.isEmpty;
                        } else if (operator === 'isnot') {
                            tooltip = currentFieldLabel + ' ' + actionText + ' ' + fieldLabel + ' ' + gfFieldIdCondTranslations.isNotEmpty;
                        }
                    } else {
                        var escapedValue = $('<div/>').text(value).html();
                        tooltip += ' ' + escapedValue;
                    }

                    var badgeText = 'COND: ' + condFieldId;

                    var badge = $('<span></span>')
                        .addClass(badgeClass)
                        .attr('data-tooltip', tooltip)
                        .attr('data-field-id', fieldId)
                        .text(badgeText);
                    
                    // Hide if collapsed
                    if (isCondFromCollapsed) {
                        badge.hide();
                    }

                    $container.append(badge);
                });

                if (rules.length > 1) {
                    var logicTypeDisplay = logicType.toUpperCase();
                    var logicTypeTooltip = logicType === 'all' 
                        ? gfFieldIdCondTranslations.allConditionsMustBeMet
                        : gfFieldIdCondTranslations.anyConditionCanBeMet;
                    var logicTypeClass = 'gw-inline-field-id gw-logic-type-' + logicType.toLowerCase();
                    var logicBadge = $('<span></span>')
                        .addClass(logicTypeClass)
                        .attr('data-tooltip', logicTypeTooltip)
                        .text(logicTypeDisplay);
                    
                    // Hide if collapsed
                    if (isCondFromCollapsed) {
                        logicBadge.hide();
                    }
                    
                    $container.append(logicBadge);
                }
            }
        });

        // Update CONDITION TO badges after updating CONDITION FROM badges
        updateConditionToBadges();

        // Add click handler for CONDITION FROM separator (toggle)
        $('.gw-cond-separator').off('click').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var $separator = $(this);
            var fieldId = $separator.attr('data-field-id');
            var $container = $separator.closest('.gw-field-badges');
            var $badges = $container.find('.gw-cond-field-id, .gw-logic-type-all, .gw-logic-type-any');
            
            // Toggle visibility
            $badges.toggle();
            $separator.toggleClass('collapsed');
            
            // Store collapsed state
            var isCollapsed = $separator.hasClass('collapsed');
            $container.data('cond-from-collapsed', isCollapsed);
        });

        // Add click handler for CONDITION FROM badges
        $('.gw-cond-field-id').off('click').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var fieldId = parseInt($(this).attr('data-field-id'));
            openConditionalLogicSettings(fieldId);
        });
    }

    // Initial update
    setTimeout(updateConditionalBadges, 500);

    // Update when field settings are loaded
    $(document).on('gform_load_field_settings', function(event, field, form) {
        setTimeout(function() {
            updateConditionalBadges();
        }, 100);
    });

    // Update when field properties change
    if (typeof gform !== 'undefined' && gform.addAction) {
        gform.addAction('gform_post_set_field_property', function(property, field, value, prevValue) {
            if (property === 'conditionalLogic' || property === 'enableConditionalLogic') {
                updateConditionalBadges(field.id);
            }

            if (property === 'label' || property === 'adminLabel') {
                updateConditionalBadges();
            }
        });
    }

    // Update when conditional logic is updated
    $(document).on('gform_field_conditional_logic_updated', updateConditionalBadges);

    // Update when settings panel is closed
    $(document).on('click', '.gform-settings-panel__header-icon--close', function() {
        setTimeout(updateConditionalBadges, 300);
    });

    // Update after conditional logic field action
    if (typeof gform !== 'undefined' && gform.addAction) {
        gform.addAction('gform_post_conditional_logic_field_action', function() {
            setTimeout(updateConditionalBadges, 100);
        });
    }

    // Monitor DOM changes for dynamic updates
    var observer = new MutationObserver(function(mutations) {
        var shouldUpdate = false;
        mutations.forEach(function(mutation) {
            if (mutation.target.classList && 
                (mutation.target.classList.contains('gform-settings-panel__content') ||
                 mutation.target.classList.contains('gfield_conditional_logic_rules_container'))) {
                shouldUpdate = true;
            }
        });
        if (shouldUpdate) {
            setTimeout(updateConditionalBadges, 200);
        }
    });

    var formEditorTarget = document.querySelector('#gform_fields, .gform-form-editor');
    if (formEditorTarget) {
        observer.observe(formEditorTarget, {
            childList: true,
            subtree: true,
            attributes: false
        });
    }
});
