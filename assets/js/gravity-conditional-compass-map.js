/**
 * Gravity Forms Conditional Compass - JavaScript v1.1
 * Handles conditional logic badge updates and interactions with toggle functionality
 */

jQuery(document).ready(function($) {
    // Translations and plugin URL are passed inline from PHP

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

    // CONDITION TO badges (IS USED BY)
    function updateConditionToBadges() {
        if (typeof form === 'undefined') return;

        $('.gw-cond-to-separator, .gw-cond-to-field-id').remove();

        var fieldUsageMap = {};

        form.fields.forEach(function(field) {
            if (field.conditionalLogic && field.conditionalLogic.rules && field.conditionalLogic.rules.length > 0) {
                field.conditionalLogic.rules.forEach(function(rule) {
                    var condFieldId = rule.fieldId;

                    if (typeof condFieldId === 'string' && condFieldId.startsWith('_gpcld')) {
                        return;
                    }

                    if (!fieldUsageMap[condFieldId]) {
                        fieldUsageMap[condFieldId] = [];
                    }
                    if (fieldUsageMap[condFieldId].indexOf(field.id) === -1) {
                        fieldUsageMap[condFieldId].push(field.id);
                    }
                });
            }
        });

        Object.keys(fieldUsageMap).forEach(function(usedFieldId) {
            var $container = $('.gw-field-badges[data-field-id="' + usedFieldId + '"]');
            if (!$container.length) return;

            var usingFieldIds = fieldUsageMap[usedFieldId];

            var isCollapsed = $container.data('cond-to-collapsed') === true;

            var separator = $('<span></span>')
                .addClass('gw-cond-to-separator')
                .attr('title', 'Used in conditional logic')
                .attr('data-field-id', usedFieldId)
                .html('<img src="' + gfFieldIdCondPluginUrl + 'randomize.png" style="width:15px;height:15px;display:block;transform:scaleX(-1);" alt="←" />');

            if (isCollapsed) {
                separator.addClass('collapsed');
            }

            $container.append(separator);

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

                if (isCollapsed) {
                    badge.hide();
                }

                $container.append(badge);
            });
        });

        $('.gw-cond-to-separator').off('click').on('click', function(e) {
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

        $('.gw-cond-to-field-id').off('click').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var targetFieldId = parseInt($(this).attr('data-target-field-id'));
            openConditionalLogicSettings(targetFieldId);
        });
    }

    // CONDITION FROM badges (DEPENDS ON)
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

            var isCondFromCollapsed = $container.data('cond-from-collapsed') === true;

            $container.find('.gw-cond-field-id, .gw-cond-separator, .gw-inline-field-id:not(:first)').remove();

            if (field.conditionalLogic && field.conditionalLogic.rules && field.conditionalLogic.rules.length > 0) {
                var rules = field.conditionalLogic.rules;
                var logicType = field.conditionalLogic.logicType || 'all';
                var actionType = field.conditionalLogic.actionType || 'show';

                var currentFieldLabel = field.adminLabel || field.label || gfFieldIdCondTranslations.thisField;

                var actionText = actionType === 'hide'
                    ? gfFieldIdCondTranslations.willBeHiddenIf
                    : gfFieldIdCondTranslations.willBeDisplayedIf;

                var separator = $('<span></span>')
                    .addClass('gw-cond-separator')
                    .attr('title', gfFieldIdCondTranslations.hasConditionalLogic)
                    .attr('data-field-id', fieldId)
                    .html('<img src="' + gfFieldIdCondPluginUrl + 'randomize.png" style="width:15px;height:15px;display:block;" alt="→" />');

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

                    if (isCondFromCollapsed) {
                        logicBadge.hide();
                    }

                    $container.append(logicBadge);
                }
            }
        });

        updateConditionToBadges();

        $('.gw-cond-separator').off('click').on('click', function(e) {
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

        $('.gw-cond-field-id').off('click').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var fieldId = parseInt($(this).attr('data-field-id'));
            openConditionalLogicSettings(fieldId);
        });
    }

    // Global toggles in "No field selected" panel
    function initGlobalFieldIdToggle() {
        var $nothing = $('#nothing_selected');
        if (!$nothing.length || $nothing.data('gw-field-id-toggle-init')) {
            return;
        }

        $nothing.data('gw-field-id-toggle-init', true);

        var labelField   = gfFieldIdCondTranslations.hideFieldIdBadges || 'Hide field ID badges';
        var labelUsed    = gfFieldIdCondTranslations.hideUsedDependencies || 'Hide "is used" dependencies';
        var labelDepends = gfFieldIdCondTranslations.hideDependsOnDependencies || 'Hide "depends on" dependencies';

        var idField   = 'gw-hide-field-id-badges-toggle';
        var idUsed    = 'gw-hide-used-deps-toggle';
        var idDepends = 'gw-hide-depends-deps-toggle';

        var $wrapper = $('<div class="gw-global-field-id-toggle"></div>');

        var html =
            '<div class="gw-toggle-row">' +
                '<label class="gw-toggle">' +
                    '<input type="checkbox" id="' + idField + '" class="gw-toggle-input" />' +
                    '<span class="gw-toggle-slider"></span>' +
                    '<span class="gw-toggle-label">' + labelField + '</span>' +
                '</label>' +
            '</div>' +
            '<div class="gw-toggle-row">' +
                '<label class="gw-toggle">' +
                    '<input type="checkbox" id="' + idUsed + '" class="gw-toggle-input" />' +
                    '<span class="gw-toggle-slider"></span>' +
                    '<span class="gw-toggle-label">' + labelUsed + '</span>' +
                '</label>' +
            '</div>' +
            '<div class="gw-toggle-row">' +
                '<label class="gw-toggle">' +
                    '<input type="checkbox" id="' + idDepends + '" class="gw-toggle-input" />' +
                    '<span class="gw-toggle-slider"></span>' +
                    '<span class="gw-toggle-label">' + labelDepends + '</span>' +
                '</label>' +
            '</div>';

        $wrapper.html(html);
        $nothing.append($wrapper);

        $(document).on('change', '#' + idField, function() {
            var checked = $(this).is(':checked');
            $('body').toggleClass('gw-hide-field-id-badges', checked);
        });

        $(document).on('change', '#' + idUsed, function() {
            var checked = $(this).is(':checked');
            $('body').toggleClass('gw-hide-cond-used', checked);
        });

        $(document).on('change', '#' + idDepends, function() {
            var checked = $(this).is(':checked');
            $('body').toggleClass('gw-hide-cond-depends', checked);
        });
    }

    setTimeout(updateConditionalBadges, 500);
    setTimeout(initGlobalFieldIdToggle, 500);

    $(document).on('gform_load_field_settings', function(event, field, form) {
        setTimeout(function() {
            updateConditionalBadges();
        }, 100);
    });

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

    $(document).on('gform_field_conditional_logic_updated', updateConditionalBadges);

    $(document).on('click', '.gform-settings-panel__header-icon--close', function() {
        setTimeout(updateConditionalBadges, 300);
    });

    if (typeof gform !== 'undefined' && gform.addAction) {
        gform.addAction('gform_post_conditional_logic_field_action', function() {
            setTimeout(updateConditionalBadges, 100);
        });
    }

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
            setTimeout(initGlobalFieldIdToggle, 200);
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
