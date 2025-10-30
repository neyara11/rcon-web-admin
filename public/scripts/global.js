"use strict";

/**
 * Simple debug message, must be enabled via debug.set() in browser console
 */
function debug() {
    var flag = sessionStorage.getItem("debug");
    if (!flag) return;
    console[flag].apply(this, arguments);
}

/**
 * Set debug flag
 * @param {string} flag Set to "log" or "trace", set false to disable it
 */
debug.set = function (flag) {
    sessionStorage.setItem("debug", flag ? flag : "");
};

/**
 * Just get a translation value for given key
 * @param {string} key
 * @param {object=} params
 * @return {string}
 */
function t(key, params) {
    return lang.get(key, params)
}

/**
 * Display a loading spinner in a given element
 * @param {string|JQuery} el
 */
function spinner(el) {
    el = $(el);
    el.html('<div class="spinner">' +
        '<div class="bounce1"></div>' +
        '<div class="bounce2"></div>' +
        '<div class="bounce3"></div>' +
        '</div>');
}

/**
 * Show a note message on top
 * @param {string} message
 * @param {string=} type
 * @param {number=} delay
 */
function note(message, type, delay) {
    if (delay === -1) delay = 0; // Для Bootstrap Toast autohide=false если delay=-1

    var toastType = typeof type == "undefined" ? "info" : type;
    var toastClass = "text-bg-" + toastType; // Используем Bootstrap 5 классы типа text-bg-info, text-bg-success и т.д.

    var toastHtml = '<div class="toast align-items-center ' + toastClass + ' border-0" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="' + (delay || 5000) + '">' +
        '<div class="d-flex">' +
            '<div class="toast-body">' + t(message) + '</div>' +
            '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' +
        '</div>' +
    '</div>';

    var toastContainer = document.getElementById('toast-container');
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);

    var newToast = toastContainer.lastElementChild;
    var bsToast = new bootstrap.Toast(newToast);

    if (delay === -1) {
        bsToast._element.dataset.bsAutohide = "false"; // Отключаем автоскрытие для delay=-1
    }

    bsToast.show();

    newToast.addEventListener('hidden.bs.toast', function() {
        newToast.remove();
    });
}

/**
 * Populate form data properties
 * @param {JQuery} form
 * @param {object} data
 */
function populateForm(form, data) {
    if (!form || !form.length) return;
    $.each(data, function (key, value) {
        var ctrl = $('[name=' + key + ']', form);
        if (ctrl.is("select.selectpicker")) {
            if (value === true) value = "yes";
            if (value === false) value = "no";
            ctrl.val(value);
        } else {
            switch (ctrl.prop("type")) {
                case "radio":
                case "checkbox":
                    ctrl.each(function () {
                        if ($(this).attr('value') == value) $(this).attr("checked", value);
                    });
                    break;
                default:
                    ctrl.val(value);
            }
        }
    });
}

/**
 * Escape html characters for secure dom injection
 * @param {string} string
 * @return {string}
 */
function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
        return escapeHtml.map[s];
    });
}

/**
 * Initialize all collapsables in given container
 * @param {JQuery} container
 */
function collapsable(container) {
    container.find(".collapsable-trigger").not("activated").addClass("activated").trigger("collapsable-init");
}

/**
 * Initialize all dismissable in given container
 * @param {JQuery} container
 */
function dismissable(container) {
    container.find(".dismissable").not("activated").addClass("activated").each(function () {
        if (!$(this).find("button").length) {
            $(this).prepend('<button type="button" class="close "><span>&times;</span></button>');
        }
    }).find("button.close").trigger("dismissable-init")
}

/**
 * Initialize all textarea autoheights
 * @param {JQuery} container
 */
function textareaAutoheight(container) {
    container.find('textarea.autoheight').not(".autoheight-activated").each(function () {
        this.setAttribute('style', 'height:' + (Math.max(20, this.scrollHeight)) + 'px;overflow-y:hidden;');
    }).addClass("autoheight-activated").on('input focus', function () {
        this.style.height = 'auto';
        this.style.height = (Math.max(20, this.scrollHeight)) + 'px';
    }).triggerHandler("input");
}

/**
 * Start downloading a file with given contents
 * @param {string} data
 * @param {string} fileName
 */
function downloadFile(data, fileName) {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    var blob = new Blob([data], {type: "octet/stream"});
    var url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
}

/**
 * The escape html mapping
 * @type {{}}
 */
escapeHtml.map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
};

$(function () {
    if (typeof WebSocket == "undefined") {
        note("Your browser is not supported in this application (Outdated Browser). Please upgrade to the newest version");
        return;
    }
    // do some hamburger and navigation magic
    (function () {
        var trigger = $('.hamburger'),
            overlay = $('.overlay'),
            isClosed = false;

        debug('Hamburger initialization: trigger found:', trigger.length, 'overlay found:', overlay.length);
        debug('Sidebar wrapper:', $('#sidebar-wrapper').length, 'wrapper:', $('#wrapper').length);

        trigger.click(function () {
            debug('Hamburger clicked, current isClosed:', isClosed);
            hamburger_cross();
        });

        function hamburger_cross() {
            debug('hamburger_cross called, isClosed:', isClosed);

            if (isClosed == true) {
                overlay.hide();
                trigger.removeClass('is-open');
                trigger.addClass('is-closed');
                isClosed = false;
                debug('Menu closed');
            } else {
                overlay.show();
                trigger.removeClass('is-closed');
                trigger.addClass('is-open');
                isClosed = true;
                debug('Menu opened');
            }
        }

        $('[data-toggle="offcanvas"]').click(function () {
            debug('Offcanvas toggle clicked');
            var wrapper = $('#wrapper');
            var sidebar = $('#sidebar-wrapper');
            var pageContent = $('#page-content-wrapper');
            debug('Wrapper before toggle:', wrapper.hasClass('toggled'));
            wrapper.toggleClass('toggled');
            debug('Wrapper after toggle:', wrapper.hasClass('toggled'));
            debug('Sidebar wrapper after toggle, width:', sidebar.css('width'));
            // Принудительно применить стили после toggle для Bootstrap 5 совместимости
            if (wrapper.hasClass('toggled')) {
                sidebar.css('width', '220px');
                pageContent.css('left', '220px');
            } else {
                sidebar.css('width', '0px');
                pageContent.css('left', '0px');
            }
            debug('Styles applied: sidebar width =', sidebar.css('width'), 'page content left =', pageContent.css('left'));
        });
    })();
    var body = $("body");
    var hasTouch = true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
    body.addClass(hasTouch ? "no-touch" : "touch");
    // bind tooltips
    $('[data-tooltip]').each(function() {
        $(this).tooltip({
            "container": "body",
            "html": true,
            "title": function () {
                return t($(this).attr("data-tooltip"));
            }
        });
    });
    $(document).on("inserted.bs.tooltip", function (ev) {
        // hide if we are on mobile touch device
        if (hasTouch) {
            setTimeout(function () {
                $(ev.target).trigger("mouseout");
            }, 1000);
        }
    }).on("click collapsable-init", ".collapsable-trigger", function (ev) {
        var e = $(this);
        var targetId = e.attr("data-collapsable-target");
        var target = $(".collapsable-target").filter("[data-collapsable-id='" + targetId + "']");
        if (target.length) {
            if (ev.type != "collapsable-init") {
                e.toggleClass("collapsed");
                target.toggleClass("collapsed");
                Storage.set("collapsable." + targetId, target.hasClass("collapsed"));
            } else {
                // collapsed is stored or initially collapsed
                var flag = Storage.get("collapsable." + targetId) || target.hasClass("collapsed") || false;
                e.toggleClass("collapsed", flag);
                target.toggleClass("collapsed", flag);
            }
        }
    }).on("click dismissable-init", ".dismissable button", function (ev) {
        var target = $(this).closest(".alert");
        var targetId = target.attr("data-id");
        if (!targetId) {
            note("Dismissable data-id attribute missing", "danger");
            return;
        }
        if (target.length) {
            var o = Storage.get("dismissable") || {};
            if (ev.type != "dismissable-init") {
                target.removeClass("visible");
                o[targetId] = true;
                Storage.set("dismissable", o);
                note("dismissed.info", "info");
            } else {
                if (o[targetId] !== true) {
                    target.addClass("visible");
                }
            }
        }
    }).on("click", ".show-dismissable", function (ev) {
        Storage.set("dismissable", null);
        window.location.reload();
    });
    collapsable(body);
    dismissable(body);
    lang.replaceInHtml(body);
    // socket stuff
    Socket.connectAndLoadView();
});

$(window).on("popstate", function (ev) {
    // if the state is the page you expect, pull the name and load it.
    if (ev.originalEvent.state && ev.originalEvent.state.hash) {
        var hashData = View.getViewDataByHash("#" + ev.originalEvent.state.hash);
        View.load(hashData.view, hashData.messageData);
    }
});

// here we have defined all possible callbacks just for the sake of IDE auto completion

/**
 * Node Message Callback
 * @callback NodeMessageCallback
 * @param {{action: string, messageData: *, callbackId: =int}} responseData
 */