$(window).bind('keydown', function (event) {
    if (event.ctrlKey || event.metaKey) {
        switch (String.fromCharCode(event.which).toLowerCase()) {
            case 'p':
            case 's':
                event.preventDefault();
                break;
        }
    }
});

$.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();

    $.each(a, function () {
        if (o[this.name]) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });

    return o;
};

$.validator.methods.required = function (value, element, param) {
    // Check if dependency is met
    if (!this.depend(param, element)) {
        return "dependency-mismatch";
    }
    if (element.nodeName.toLowerCase() === "select") {

        // Could be an array for select-multiple or a string, both are fine this way
        var val = $(element).val();
        return val && val.length > 0;
    }
    if (this.checkable(element)) {
        return this.getLength(value, element) > 0;
    }
    if (element.nodeName.toLowerCase() === "textarea" && element.classList.contains('summernote') && element.hasAttribute("required")) {
        return $(element).summernote("code").length > 0;
    }

    return value.length > 0;
}

function setupPhoneNumberValidation(phoneNumberField) {
    $(phoneNumberField).rules("add", {
        phoneNumber: "(^[0-9\.\(\)\+\/\\\-\ ]+)$"
    });

    $.validator.addMethod("phoneNumber", function (value, element, regexp) {
        let regex = new RegExp(regexp);
        return this.optional(element) || regex.test(value);
    },
        L("Account:Edit:InvalidCharactersAndSymbols")
    );
}

function setUpNumberRangeValidation(fromField, toField) {

    $(fromField).rules("add", {
        lessThanNumber: toField
    });

    $(toField).rules("add", {
        greaterThanNumber: fromField
    });

    $.validator.addMethod("greaterThanNumber",
        function (value, element, param) {
            let $otherElement = $(param);
            if ($otherElement.val() === "" || value === "") {
                return true;
            }

            return parseInt(value, 10) > parseInt($otherElement.val(), 10);
        }, L("Validation:GreaterThanNumber"));

    $.validator.addMethod("lessThanNumber",
        function (value, element, param) {
            let $otherElement = $(param);
            if ($otherElement.val() === "" || value === "") {
                return true;
            }

            return parseInt(value, 10) < parseInt($otherElement.val(), 10);
        }, L("Validation:LessThanNumber"));
}

function setupValidateCsv(field) {
   $(field).rules("add", {
        csv: "(\\s,)|(,\\s)"
   });
   
   $.validator.addMethod("csv", function (value, element, regexp) {
        let regex = new RegExp(regexp);
        return !regex.test(value);
   },
        L("Account:Edit:NoSpacesAllowed")
   );
}

var formatIcon = function (icon) {
    return $('<span><i class="far fa-' + icon.text + '" />  ' + icon.text + '</span>')
};

$('select[data-toggle="icon"]').select2({
    templateSelection: formatIcon,
    templateResult: formatIcon
});

$(".summernote").summernote({
    height: 150,
    onCreateLink: link => link,
});

var yesNoFormat = function (input) {
    return input ? L("LabelYes") : L("LabelNo");
};

$('body').tooltip({ selector: '[data-toggle="tooltip"]' });

$("body").on("click", "[data-select]", function (event) {

    var checked = $(this).prop("checked");
    var selector = $(this).attr("data-select");
    var checkBoxes = $("input[data-select-parent=" + selector + "]");
    checkBoxes.prop("checked", checked);
    var checkedBoxes = $("input[data-select-parent=" + selector + "]:checked");

    var handler = $(this).attr("data-handler");

    if (window[handler]) {
        window[handler](checkBoxes.length, checkedBoxes.length);
    }
});

$("body").on("click", "[data-select-parent]", function (event) {

    var checked = $(this).prop("checked");
    var selector = $(this).attr("data-select-parent");
    var parentCheckBox = $("input[data-select=" + selector + "]");

    var checkBoxes = $("input[data-select-parent=" + selector + "]");
    var checkedBoxes = $("input[data-select-parent=" + selector + "]:checked");

    parentCheckBox.prop("checked", checkBoxes.length === checkedBoxes.length);

    var handler = $(this).attr("data-handler");

    if (window[handler]) {
        window[handler](checkBoxes.length, checkedBoxes.length);
    }

});

$("body").on("click", "[data-submit]", function (event) {
    event.preventDefault();

    var selector = $(this).attr("data-submit");
    $(selector).data("redirect", $(this).data("redirect"));
    $(selector).submit();
});

$("body").on("click", "[data-clone]", function (event) {
    event.preventDefault();
    var selector = $(this).attr("data-clone");
    var target = $(this).attr("data-target");
    var handler = $(this).attr("data-handler");

    var nodeCount = $(selector).length + 1;
    var clonedNode = $(selector + ":first").clone().attr("id", "row-" + nodeCount);
    clonedNode.children('input-group').children("m--hide").removeClass("m--hide");
    clonedNode.removeClass("m--hide");

    if (window[handler]) {
        clonedNode = window[handler](clonedNode);
    }

    clonedNode.insertAfter(target);
});

$("body").on("click", "[data-remove]", function (event) {
    event.preventDefault();
    var selector = $(this).attr("data-remove");
    var handler = $(this).attr("data-handler");

    if (!selector) {
        abp.message.warn(L("MissingIdMessage"), L("MissingIdTitle"));
        return;
    }
    if (!handler) {
        abp.message.warn(L("MissingHandlerMessage"), L("MissingHandlerTitle"));
        return;
    }

    RemoveRecord(handler, window, $(this).closest(selector));
});


function RemoveRecord(handler, window, selector) {
    abp.message.confirm(L("DeleteRecordMessage"),
        L("DeleteRecordTitle"),
        function (isConfirmed) {
            if (isConfirmed) {
                executeFunctionByName(handler, window, selector);
                selector.remove();
            }
        });
}

function initSwitch() {
    $('[data-switch=true]').bootstrapSwitch();
}

initSwitch();

function initSelect2(selector) {

    if (selector === undefined) {
        selector = ".m-select2:not(.select2-hidden-accessible,.manual-load)";
    } else {
        selector = selector + " .m-select2";
    }

    $(selector).each(function (index, select) {

        var selectData = $(select).data();
        var config = {
            placeholder: selectData["placeholder"],
            allowClear: selectData["allowClear"]
        };

        $(select).select2(config);
    });
}

initSelect2();

function initSelect2Remote(selector) {

    if (selector === undefined)
        selector = "";

    $(selector + " .m-select2-remote:not(.select2-hidden-accessible)").each(function (index, select) {

        var selectData = $(select).data();
        var requestData = {};
        $.each(selectData,
            function (index, item) {
                if (index.indexOf("data") === 0) {
                    requestData[index.replace("data", "")] = item;
                }
            });

        var config = {
            placeholder: selectData["placeholder"],
            allowClear: selectData["allowClear"],
            ajax: {
                url: selectData["ajax-Url"],
                dataType: 'json',
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                delay: 250,
                data: function (params) {
                    var request = requestData;
                    request.page = params.page;
                    request.perPage = params.perPage;
                    request[selectData["searchField"]] = params.term;

                    return JSON.stringify(request);
                },
                processResults: function (data, params) {

                    // parse the results into the format expected by Select2
                    // since we are using custom formatting functions we do not need to
                    // alter the remote JSON data, except to indicate that infinite
                    // scrolling can be used
                    params.page = params.page || 1;
                    params.perPage = 5;

                    return {
                        results: data.items,
                        pagination: {
                            more: (params.page * params.perPage) < data.total
                        }
                    };
                },
                cache: true
            },
            escapeMarkup: function (markup) {
                return markup;
            }, // let our custom formatter work
            minimumInputLength: 1,
            //initSelection: function (element, callback) {
            //    var id = $(element).data("selected");
            //    if (id !== "") {
            //        $.ajax(selectData["ajax-Url"], {
            //            dataType: 'json',
            //            method: "POST",
            //            data: {
            //                id: id
            //            },
            //            headers: {
            //                "content-type": "application/json"
            //            }
            //        }).done(function (data) {
            //            callback(data);
            //        });
            //    }
            //},
        };

        $(select).select2(config);
    });
}

initSelect2Remote();

$('.m-datetimepicker, .kt-datetimepicker').datetimepicker({
    todayHighlight: true,
    autoclose: true,
    pickerPosition: 'top-left',
    todayBtn: true,
    clearBtn: true,
    format: 'dd/mm/yyyy hh:ii'
}).on("changeDate", function (e) {
    $(e.target).data("value", moment(e.date).format("YYYY-MM-DD HH:mm"));
}).on("clearDate", function (e) {
    $(e.target).data("value", "");
}).change(function () {
    $(this).valid();
});

$('.m-datetimepicker, .kt-datetimepicker').inputmask("99/99/9999 99:99", {
    prefix: '',
    rightAlign: false
});

$('.m-datetimepicker, .kt-datetimepicker').on("keypress", function (event) {
    if ($(this).val().length === 15) {
        $(this).trigger("changeDate");
    }
});


function initDatepicker(container) {
    $(container).find('.m-datepicker, .kt-datepicker').datetimepicker({
        format: "dd/mm/yyyy",
        todayHighlight: true,
        autoclose: true,
        clearBtn: true,
        startView: 2,
        minView: 2,
        forceParse: 0,
        pickerPosition: 'bottom-left'
    }).on("changeDate", function (e) {
        if (e.date === undefined) {
            $(e.target).data("value", moment($(e.target).val(), "DD/MM/YYYY").format("YYYY-MM-DD"));
        } else {
            $(e.target).data("value", moment(e.date).format("YYYY-MM-DD"));
        }
    }).on("clearDate", function (e) {
        $(e.target).data("value", "");
    }).change(function () {
        $(this).valid();
    });

    $(container).find('.m-datepicker, .kt-datepicker').inputmask("99/99/9999", {
        prefix: '',
        rightAlign: false
    });

    $(container).find('.m-datepicker, .kt-datepicker').on("keypress", function (event) {
        if ($(this).val().length === 10) {
            $(this).trigger("changeDate");
        }
    });

    $(container).find('.m-datepicker, .kt-datepicker').on("paste", function (event) {
        if ($(this).val().length === 10) {
            $(this).trigger("changeDate");
        }
    });
}

initDatepicker("body");

$('.m-timepicker,.kt-timepicker').datetimepicker({
    format: "hh:ii",
    showMeridian: true,
    todayHighlight: true,
    autoclose: true,
    clearBtn: true,
    startView: 1,
    minView: 0,
    maxView: 1,
    forceParse: 0,
    pickerPosition: 'bottom-left'
}).on("changeDate", function (e) {
    $(e.target).data("value", moment(e.date).format("HH:mm"));
}).on("clearDate", function (e) {
    $(e.target).data("value", "");
}).change(function () {
    $(this).valid();
});

$('.m-datepicker, .kt-datepicker').keydown(function (e) {
    var keyCode = e.keyCode || e.which;

    if (keyCode !== 9) { //prevent keyboard trap and allow tabbing
        e.preventDefault();
        return false;
    }

    return true;
});

$('.m-datepicker, .kt-datepicker').prop("readonly", true);

$('[maxlength]').maxlength({
    threshold: 10,
    placement: 'top-left',
    warningClass: "m-badge m-badge--primary m-badge--rounded m-badge--wide",
    limitReachedClass: "m-badge m-badge--warning m-badge--rounded m-badge--wide"
});

$('[data-mask="currency"]').inputmask({
    'alias': 'numeric',
    'groupSeparator': ',',
    'digits': 2,
    'digitsOptional': true,
    'placeholder': '0'
});

$('[data-mask="textonly"]').inputmask("(a){+}");

$('[data-mask="alphanumeric"]').inputmask("(*){+}");
$('[data-mask="numeric"]').inputmask("(9){+}");

$('.m_selectpicker').selectpicker();

// Show / hide container
$('[data-containertoggle]').on("click", function (e) {

    e.preventDefault();

    var button = $(this);
    var container = $(this).data("containertoggle");
    var duration = $(this).data("duration");
    var callback = $(this).data("callback");
    var currentText = button.text();
    var openText = $(this).data("opentext");
    var closedText = $(this).data("closedtext");

    button.text((openText === currentText) ? closedText : openText);

    if (container !== null && container !== undefined) {
        $(container).slideToggle({
            duration: duration,
            complete: function () {
                if ($(container).hasClass("open")) {
                    $(container).removeClass("open");
                    $(container).addClass("closed");
                } else {
                    $(container).removeClass("closed");
                    $(container).addClass("open");
                }

                if (callback !== undefined && callback !== "") {
                    executeFunctionByName(callback, window);
                }
            }
        });
    }

});

function getFormData(selector) {
    const data = $(selector).data();
    const customData = {};

    $(selector).find(":input").each(function (index, input) {
        var name = $(input).attr("name");
        var field = $(input);
        if (name !== undefined) {
            var dataValue = $(input).data("value");

            var value = dataValue === "" || dataValue === undefined ? $(input).val() : dataValue;

            // Handle types 
            if (field.data("switch") !== undefined) {
                value = field.is(":checked");
            }

            if (field.hasClass("custom-data") && customData[name] === undefined) {
                if ($(input).is(":radio")) {
                    customData[name] = $(abp.utils.formatString("input[name='{0}']:checked", name)).val();
                } else if ($(input).is(":checkbox")) {
                    $(abp.utils.formatString("input[name='{0}']:checked", name)).each(function () {
                        customData[name] = (customData[name] === undefined
                            ? this.value
                            : abp.utils.formatString("{0},{1}", customData[name], this.value));
                    });
                } else {
                    customData[name] = value;
                }
            } else {
                data[name] = value;
            }
        }
    });

    if ($(selector).find(":input.custom-data").length > 0)
        data.customData = JSON.stringify(customData);

    return data;
}

function executeFunctionByName(functionName, context /*, args*/) {

    if (functionName === undefined || functionName === "" || functionName === null) {
        return null;
    }
    var args = [].slice.call(arguments).splice(2);
    var namespaces = functionName.split(".");
    var func = namespaces.pop();
    for (var i = 0; i < namespaces.length; i++) {
        context = context[namespaces[i]];
    }

    return context[func].apply(context, args);
}

$('form:not([action]):not([data-ignore])').each(function (index, form) {
    initValidation($(this).attr("id"));
});

function initValidation(formId, ruleSet, addEvents) {
    if (formId === undefined)
        return;

    if (addEvents === undefined)
        addEvents = true;

    var $form = $("#" + formId);
    var submitHandle = "";
    var submitEvent = "";
    var redirect = "";
    var button;

    if (addEvents) {
        $(abp.utils.formatString("[data-form='{0}']", formId)).on("click",
            function (e) {
                e.preventDefault();
                button = $(this);
                redirect = button.data("form-Redirect");
                submitHandle = button.data("form-Handler");
                submitEvent = button.data("form-Event");

                $form.submit();
            });
    }

    var tabErrors = [];
    var invalidFields = [];

    var validator = $form.validate({
        onkeyup: false, //turn off auto validate whilst typing
        rules: ruleSet,
        ignore: "",
        highlight: function (input) {
            var id = $(input).attr("id");
            $(input).parents('.form-group').addClass('has-danger is-invalid');
            $(input).addClass('has-danger is-invalid');
            tabErrors.push($(input).parents('.tab-pane').attr("id"));

            if (!invalidFields.includes(id))
                invalidFields.push(id);
        },
        unhighlight: function (input) {
            $(input).parents('.form-group').removeClass('has-danger is-invalid');
            $(input).removeClass('has-danger is-invalid');
            invalidFields = arrayRemove(invalidFields, $(input).attr("id"));

            if (invalidFields.length === 0)
                $(".m-tabs__link.has-danger").removeClass("has-danger is-invalid");
        },
        errorPlacement: function (error, element) {

            error.addClass("invalid-feedback");

            const hideMessage = $(element).closest("form").data("hidemessage");
            if (hideMessage) {
                return;
            }

            const parent = $(element).parent();
            if (parent.hasClass("input-group")) {
                parent.parent().append(error);
            } else {
                $(element).parent().append(error);
            }
        }
    });

    $form.submit(function (e) {
        e.stopImmediatePropagation();
        e.preventDefault();

        if (!$form.valid()) {
            $.each(tabErrors,
                function (index, tabId) {
                    $("a[href='#" + tabId + "']").addClass("has-danger is-invalid");
                });
            return;
        } else {
            tabErrors = [];
            $(".m-tabs__link.has-danger").removeClass("has-danger is-invalid");
        }

        var data = getFormData('#' + formId);

        const regex = new RegExp("[^a-zA-Z0-9-&()/\\\\_ \-\u0600-\u06ff\u0750-\u077f\ufb50-\ufbc1\ufbd3-\ufd3f\ufd50-\ufd8f\ufd50-\ufd8f\ufe70-\ufefc\uFDF0-\uFDFD\u0370-\u03ff\u1f00-\u1fff\u0400-\u04FFÀ-ÿœı ' -]");
        const addressRegex = new RegExp("[^a-zA-Z0-9-&\u0600-\u06ff\u0750-\u077f\ufb50-\ufbc1\ufbd3-\ufd3f\ufd50-\ufd8f\ufd50-\ufd8f\ufe70-\ufefc\uFDF0-\uFDFD\u0370-\u03ff\u1f00-\u1fff\u0400-\u04FFÀ-ÿœı ' - , /]");
        
        for (var id in data) {
            var idLower = id.toLowerCase();
            var ids = ["name", "code", "displayname", "reference", "optionaltext1", "optionaltext2", "optionaltext3", "optionaltext4", "middlename", "surname",
                "recipientname", "reasoninfo", "basketnoticemessage", "title", "icon"]

            if (ids.includes(idLower)) {

                var val = data[id];
                
                if (regex.test(val)) {
                    abp.message.error(L("AlertInvalidCharacters"));
                    return;
                }
            }

            var addressIds = ["firstname", "lastname", "deliveryinstructions", "addressline1", "addressline2", "city", "county", "postcode"]

            if (addressIds.includes(idLower)) {
                var addressVal = data[id];

                if (addressRegex.test(addressVal)) {
                    abp.message.error(L("AlertInvalidCharacters"));
                    return;
                }
            }
        }

        if (submitHandle && submitEvent) {
            abp.message.warn("You cannot use both handler and event at the same time.", 'Form configuration');
            return;
        }

        var newData = $.extend(true, {}, data);
        delete newData.validator;

        if (submitHandle) {
            executeFunctionByName(submitHandle, window, formId, newData, button, redirect);
        }

        if (submitEvent) {
            abp.event.trigger(submitEvent, newData, redirect);
        }
    });

    return validator;
};

function arrayRemove(arr, value) {
    return arr.filter(function (ele) {
        return ele != value;
    });
}

// pass field name as elem
function removeColumn(array, elem) {
    var fields = array.map(a => a.field);
    var index = fields.indexOf(elem);
    if (index > -1) {
        array.splice(index, 1);
    }
}

function currencyFormat(num) {
    return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

function escapeHtml(string) {
    var entityMap = {
        '<': '&lt;',
        '>': '&gt;',
        '/': '&#x2F;',
        '`': '&#x60;'
    };

    return String(string).replace(/[<>`/]/g, function (s) {
        return entityMap[s];
    });
}

// using the spread operator to take multiple parameters
function L(translationKey, ...args) {
    var source = abp.localization.getSource("DCWEB");
    var translation = source(translationKey, ...args);

    return translation;
}

function LWithSource(sourceName, translationKey, ...args) {
    var source = abp.localization.getSource(sourceName);
    var translation = source(translationKey, ...args);

    return translation;
}

function initSessionWatch() {

    $.sessionTimeout({
        title: L('SessionTimeoutNotification'),
        message: L('SessionAboutToExpire'),
        keepAliveUrl: '/Alive',
        redirUrl: '/Account/Logout',
        logoutUrl: '/Account/Logout',
        warnAfter: parseInt(abp.setting.get("Session.Timeout.Warning")) * 60000,
        redirAfter: (parseInt(abp.setting.get("Session.Timeout.Redirect")) +
            parseInt(abp.setting.get("Session.Timeout.Warning"))) *
            60000,
        ignoreUserActivity: true,
        countdownMessage: L('RedirectInSeconds'),
        countdownBar: true
    });

}

var waitForEl = function (selector, callback) {
    if (jQuery(selector).is(":visible")) {
        callback();
    } else {
        setTimeout(function () {
            waitForEl(selector, callback);
        }, 100);
    }
};

function initSpinner() {
    $('[data-spinner]').TouchSpin({
        buttondown_class: 'btn btn-danger',
        buttonup_class: 'btn btn-success',
        min: 1,
        max: 100,
        step: 1,
        decimals: 0,
        boostat: 5,
        maxboostedstep: 10
    }).attr("readonly", "readonly");
}

initSpinner();

function setTemplateSettings() {
    _.templateSettings = {
        evaluate: /\{\{(.+?)\}\}/g,
        interpolate: /\{\{=(.+?)\}\}/g,
        escape: /\{\{-(.+?)\}\}/g
    };
}

// Formats the result of submitting a checkbox field from on/off to true/false
// Has side effects on the passed data object
function formatSwitchResults(containerId, data) {
    $('#' + containerId + ' input[type="checkbox"]').each(function (index, input) {
        data[$(input).prop("name")] = $(input).is(":checked");
    });
}

// check if an element exists in array using a comparer function
// comparer : function(currentElement)
Array.prototype.inArray = function (comparer) {
    for (var i = 0; i < this.length; i++) {
        if (comparer(this[i])) return true;
    }
    return false;
};

// adds an element to the array if it does not already exist using a comparer 
// function
Array.prototype.pushIfNotExist = function (element, comparer) {
    if (!this.inArray(comparer)) {
        this.push(element);
    }
};

// changes the first letter in a string to be uppercase
String.prototype.uppercaseFirst = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

var selectAllConfig = {
    width: '100%',
    closeOnSelect: false
};

var handleSelectAll = function () {
    switch ($(".select-action").data("action")) {
        case "All":
            $('#' + $(".select-action").data("forId")).find('option').prop('selected', 'selected').end().select2(selectAllConfig);
            $(".select-action").data("action", "Deselect");
            $("#btnSelectAll").text(L("Deselect"));
            break;

        case "Deselect":
            $('#' + $(".select-action").data("forId")).find('option').prop('selected', false).end().select2(selectAllConfig);
            $(".select-action").data("action", "All");
            $("#btnSelectAll").text(L("SelectAll"));
            break;
    }
};

var getQueryParam = function (param) {

    var params = new URLSearchParams(window.location.search);
    return params.get(param);
};

// Delete single record
$("body").on("click",
    "[data-action='delete']",
    function (event) {

        event.preventDefault();
        var handler = $(this).attr("data-handler");

        var id = $(this).attr("data-id");
        var reference = $(this).attr("data-reference");
        if (!id && !handler) {
            abp.message.warn(L("MissingHandlerIdMessage"), L("MissingHandlerIdTitle"));
        } else if (!id) {
            abp.message.warn(L("MissingIdMessage"), L("MissingIdTitle"));
        } else if (!handler) {
            abp.message.warn(L("MissingHandlerMessage"), L("MissingHandlerTitle"));
        } else {
            abp.message.confirm(
                L("ConfirmDeleteMessage"),
                L("ConfirmDeleteTitle"),
                function (isConfirmed) {
                    if (isConfirmed) {
                        executeFunctionByName(handler, window, id, reference);
                    }
                }
            );
        }
    });

// Delete multiple records
$("body").on("click", "[data-action='massdelete']", function (event) {

    event.preventDefault();
    var handler = $(this).attr("data-handler");

    if (!handler) {
        abp.message.warn(L("MissingHandlerMessage"), L("MissingHandlerTitle"));
    } else {
        abp.message.confirm(L("DeleteMassRecordMessage"), L("DeleteMassRecordTitle"), function (isConfirmed) {
            if (isConfirmed) {
                executeFunctionByName(handler, window);
            }
        }
        );
    }
});

$("body").on("click", "[data-action='release']", function (event) {

    event.preventDefault();
    var handler = $(this).attr("data-handler");

    if (!handler) {
        abp.message.warn(L("MissingHandlerMessage"), L("MissingHandlerTitle"));
    } else {
        abp.message.confirm(L("ReleaseRecordsMessage"), L("releaseRecordsTitle"), function (isConfirmed) {
            if (isConfirmed) {
                executeFunctionByName(handler, window);
            }
        }
        );
    }
});

function filterTemplates(isElectronic, templatesArray) {
    var id = $("select[name='recordTypeSearch']").val();
    var templates = jQuery.grep(templatesArray, function (a) {
        var index = a.RecordTypeIds.indexOf(id);
        if (index !== -1 && a.IsElectronic === isElectronic) {
            return a;
        }
    });

    return templates;
}

function addRemoteValidationRule(field, url, dataValues) {
    var errorMessage = "";
    var rule = {
        remote: {
            type: "post",
            url: url,
            data: dataValues,
            dataType: "json",
            dataFilter: function (response) {
                response = $.parseJSON(response);
                if (response.error) {
                    errorMessage = response.message
                    return false;
                } else {
                    return true;
                }
            }
        },
        messages: {
            remote: function () {
                return errorMessage.replace(/[\n]/gm, "<br />");
            }
        }
    };

    $(field).rules("add", rule);
}

function initDataTable(dataSourceUrl, columns, params) {
    var dataTable = $('.m_datatable').KTDatatable({
        data: {
            type: 'remote',
            dataType: 'json',
            source: {
                read: {
                    url: dataSourceUrl,
                    method: 'POST',
                    headers: {
                        "content-type": "application/json"
                    },
                    params: params
                }
            },
            pageSize: 20,
            serverPaging: true,
            serverFiltering: true,
            serverSorting: true
        },
        layout: {
            scroll: false,
            footer: false
        },
        sortable: true,
        pagination: true,
        toolbar: {
            items: {
                pagination: {
                    pageSizeSelect: [10, 20, 30, 50, 100]
                }
            }
        },
        columns: columns
    });

    return dataTable;
}

jQuery.validator.addMethod("greaterThan", function (value, element, params) {
    const fromValue = $(params).val();

    if (!value || !fromValue) {
        return true;
    }

    if (isNaN(value)) {
        const fromDate = moment(fromValue, "DD/MM/YYYY");
        const toDate = moment(value, "DD/MM/YYYY");

        return fromDate.isBefore(toDate);
    }

    return Number(fromValue) < Number(value);

}, L('GreaterThan')
);

jQuery.validator.addMethod("lessThan", function (value, element, params) {

    const toValue = $(params).val();

    if (!value || !toValue) {
        return true;
    }

    if (isNaN(value)) {
        const toDate = moment(toValue, "DD/MM/YYYY");
        const fromDate = moment(value, "DD/MM/YYYY");

        return fromDate.isBefore(toDate);
    }

    return Number(value) < Number(toValue);

}, L('LessThan')
);

function ChangeAvatarImage(userId) {
    var version = new Date();
    $(".kt-avatar__holder").css("background-image", abp.utils.formatString('url(/img/user/{0}.png?v={1})', userId, version.getTime()));
    $("#kt_apps_user_add_avatar").removeClass("kt-avatar--changed");

}

function DisplayAvatarImage(userId) {
    ChangeAvatarImage(userId);
    $("#kt_apps_user_add_avatar").addClass("kt-avatar--changed");
}

function HideAvatarImage(userId) {
    ChangeAvatarImage(userId);
    $("#kt_apps_user_add_avatar").removeClass("kt-avatar--changed");
}

function UpdateHeaderProfileImage(userId) {
    var version = new Date();
    $(".kt-header__topbar-item--user img").attr("src", abp.utils.formatString('/img/user/{0}.png?v={1}', userId, version.getTime())).removeClass("kt-hidden");
    $(".kt-header__topbar-item--user .kt-badge--username, .kt-user-card .kt-badge--username").addClass("kt-hidden");
}

function UpperLimit(lowerLimit, upperLimit) {
    $(upperLimit).rules('add',
        {
            greaterThan: lowerLimit,
            messages:
            {
                greaterThan: L("GreaterThanFromDate")
            }
        });

    $(upperLimit).on("change", function () {
        const value = $(lowerLimit).val();
        if (value == "") {
            return;
        }

        $(lowerLimit).valid();
    });
}

function LowerLimit(lowerLimit, upperLimit) {
    $(lowerLimit).rules('add',
        {
            lessThan: upperLimit,
            messages:
            {
                lessThan: L("LessThanToDate")
            }
        });

    $(lowerLimit).on("change", function () {
        const value = $(upperLimit).val();
        if (value == "") {
            return;
        }
        $(upperLimit).valid();
    });
}

function getObjectFromSelector(selector) {
    if (typeof (selector) === "string") {
        return $(selector);
    }

    return selector;
}

function blockButton(buttonSelector) {
    const button = getObjectFromSelector(buttonSelector);
    const text = button.data("busyText");
    const iconClasses = button.find("i").attr("class");
    const options = {
        "alignment": button.data("busyAlignment")
    };

    if (text === "" || text === undefined) {
        return;
    }

    button.data("icon", iconClasses);
    button.prop("disabled", true);
    button.text(text);

    KTApp.progress(button, options);
}

function unblockButton(buttonSelector) {
    const button = getObjectFromSelector(buttonSelector);
    const text = button.data("text");
    const iconClasses = button.data("icon");

    if (text === "" || text === undefined) {
        return;
    }

    button.prop("disabled", false);
    button.text(text);

    if (iconClasses) {
        const icon = $("<i/>");
        icon.addClass(iconClasses);
        icon.attr("aria-hidden", true);
        button.prepend(icon);
    }

    KTApp.unprogress(button);
}

function ResetElements() {
    var formElement = $("#SearchForm");
    var validator = formElement.validate();

    $('[name]', formElement).each(function () {
        const element = $(this);

        if (element.prop("tagName") === "SELECT") {
            if (element.hasClass("select2-hidden-accessible")) {
                element.val(null).trigger('change');
            }
        }

        if (element.hasClass("rangedatepicker")) {
            element.trigger("cancel");
            element.value = undefined;
        }

        validator.successList.push(this);
        validator.showErrors();
    });

    validator.resetForm();
    abp.event.trigger("advancedSearch.reset");
}

function initRangeDatePicker(container) {
    const selector = $('input[class*="rangedatepicker"]');
    const elements = $(container).find(selector);

    $(elements).daterangepicker({
        "autoUpdateInput": false,
        "showDropdowns": true,
        "linkedCalendars": false,
        "locale": {
            "format": "DD/MM/YYYY"
        }
    }).on('apply.daterangepicker', function (ev, picker) {
        $(this).val(`${picker.startDate.format("DD/MM/YYYY")} - ${picker.endDate.format("DD/MM/YYYY")}`);
        $(elements).data("startDate", picker.startDate.format("YYYY/MM/DD"));
        $(elements).data("endDate", picker.endDate.format("YYYY/MM/DD"));
    }).on('cancel.daterangepicker', function (ev, picker) {
        $(elements).data("startDate", new Date(-8640000000000));
        $(elements).data("endDate", new Date(8640000000000));
    });
}

initRangeDatePicker("body");

const helpButton = $("a[help-text='help']");

if (helpButton != null) {
    const offCanvas = new KTOffcanvas('helpTextViewerDrawer', {
        overlay: true,
        baseClass: 'kt-quick-panel',
        closeBy: 'kt_quick_panel_close_btn',
    });

    $(helpButton).on("click", function () {
        offCanvas.show();
    });
}