const displayType = {
    PANEL: 0,
    INLINE: 1
};

const accessType = {
    VIEW: 0,
    REPRINT: 1,
    REPUBLISH: 2
};

const pageDirection = {
    PREVIOUS: 0,
    NEXT: 1
};

var DocumentViewer = function () {

    const localisationSource = "RenderWeb";

    const templates = {
        panel: "<div id='documentViewerDrawer' class='kt-quick-panel'>" +
            "<div class=\"kt-portlet h-100\">" +
            "<div class=\"kt-portlet__head\">" +
            "<div id='documentViewerDocuments' class=\"kt-portlet__head-label\"></div>" +
            "<div id='documentViewerHeader' class=\"kt-portlet__head\"></div>" +
            "<div id='documentViewerTools' class=\"kt-portlet__head-toolbar\">" +
            "<a href=\"#\" id='previousDocument' class=\"btn btn-md btn-icon btn-label-dark mr-1\"><i class=\"fas fa-arrow-left\" aria-hidden=\"true\"></i></a>" +
            "<a href=\"#\" id='nextDocument' class=\"btn btn-md btn-icon btn-label-success mr-3\"><i class=\"fas fa-arrow-right\" aria-hidden=\"true\"></i></a>" +
            "<a href=\"#\" class=\"btn btn-md btn-icon btn-label-danger\" id='document-viewer-panel-close'><i class=\"fas fa-times\" aria-hidden=\"true\"></i></a>" +
            "</div>" +
            "</div>" +
            "<div id='documentViewerContainer' class=\"kt-portlet__body p-0 h-100\">{0}</div>" +
            "</div>" +
            "</div>",
        loadingImage: "<img id='documentLoader' src='/images/loading.gif' alt='Loading'/>"
    }

    let config = {
        recordSelector: '[data-record-id]',
        panel: {
            selector: '#documentViewerDrawer',
        },
        inline: {
            selector: "#documentViewerContainer"
        },
        accessType: accessType.VIEW,
        displayType: displayType.PANEL,
        isPublishWizard: null
    };

    let session = {
        recordId: null,
        parentId: null,
        dataTableId: null,
        dataTableDocumentIds: [],
        electronic: false,
        documents: [],
        expired: false,
        isAdmin: null,
        expiryDate: null
    };

    function addStyleSheet() {
        $("#documentViewerStyles").remove();
        $("head").append("<link id='documentViewerStyles' href='/css/documentViewer.css' type='text/css' rel='stylesheet' />");
    }

    function setSessionRecord(id, electronic) {
        session.recordId = id;
        session.electronic = electronic;
    }

    function setSessionParent(id) {
        session.parentId = id;
    }

    function setSessionDocuments(documents) {
        if (session.recordId !== session.parentId) {
            return;
        }
        session.documents = documents;

        if (documents.length > 0) {
            session.recordId = documents[0].id;
        }
    }

    function setSessionRecordIds() {
        session.dataTableDocumentIds = session
            .dataTable
            .find("a[title='View'],a[data-original-title='View']")
            .map(function () {
                return $(this).data("record-id");
            })
            .get();
    }

    function setExpiredData(data) {
        session.expired = data.isExpired;
        session.isAdmin = data.isAdmin;
        session.expiryDate = data.expiryDate
    }

    function setSessionDataTable(id) {

        if (id === null || id === undefined) {
            return;
        }

        if (id.indexOf('#') !== 0) {
            id = abp.utils.formatString("#{0}", id);
        }

        session.dataTable = $(id).KTDatatable();
        setSessionRecordIds();
    }

    function changePage(direction) {
        switch (direction) {
            case pageDirection.PREVIOUS:
                session.dataTable.find("a[title=\"Previous\"]").click();
                break;

            case pageDirection.NEXT:
                session.dataTable.find("a[title=\"Next\"]").click();
                break;
        }

        session.dataTable.one('kt-datatable--on-layout-updated', function () {
            setSessionRecordIds();
            var pageChangedRenderId = session.dataTableDocumentIds[0];
            if (direction === pageDirection.PREVIOUS) {
                    pageChangedRenderId = session.dataTableDocumentIds[session.dataTableDocumentIds.length - 1];
            }
            setSessionParent(pageChangedRenderId);
            setSessionRecord(pageChangedRenderId, false);
            renderDocument();
        });
    }
    
    function handleDocumentResult(result) {
        setExpiredData(result.result);
        setSessionDocuments(result.result.documents);
        const dataPath = abp.utils.formatString("{0}viewer/{1}/{2}", abp.appPath, result.result.document, session.recordId);

        if (session.expired && session.isAdmin) {
            renderExpiryMessage();
            setViewerIFrame(dataPath);
        } else if(session.expired) {
            renderExpiryMessage();
        } else {
            setViewerIFrame(dataPath);
        }
        renderDropdown();
    }

    function getUrlPath(recordTypeCodes) {
        if (config.isPublishWizard !== null) {
            dataPath = abp.utils.formatString("{0}viewer/data/{1}/{2}/{3}/{4}", abp.appPath, session.electronic, config.accessType, session.recordId, config.isPublishWizard);
        }
        else {
            dataPath = abp.utils.formatString("{0}viewer/data/{1}/{2}/{3}", abp.appPath, session.electronic, config.accessType, session.recordId);
        }

        var filters = recordTypeCodes.map(x => `filters=${x}`).join("&");
        dataPath += `?${filters}`;

        return dataPath;
    }

    function renderDocument() {
        var offCanvas = addViewerCard();
        var recordTypeCodes = !("WizardSearchFilter" in window) ? [] : WizardSearchFilter?.getCodes();
        let dataPath = getUrlPath(recordTypeCodes);

        $.get(dataPath)
            .done(function (result) {
                handleDocumentResult(result);
            })
            .fail(function (response) {
                const errorMessage = response.responseJSON.error.message;
                const message = errorMessage ? errorMessage : LWithSource(localisationSource, "Exception:DocumentViewer:Data:Message");
                const title = LWithSource(localisationSource, "Exception:DocumentViewer:Data:Title");
                const noAccessMessage = LWithSource(localisationSource, "Exception:Viewer:NoAccess:Message");
                const accessErrorModal = $('#AccessErrorModal');

                if (message === noAccessMessage && accessErrorModal) {
                    accessErrorModal.modal('show');
                }
                else {
                    abp.message.error(message, title);
                }


                offCanvas.hide();
                $(config.panel.selector).remove();
            })
            .always(function () {
            });
    }

    function renderDropdown() {

        if (session.documents.length === 0) {
            return;
        }

        const select = $("<select id='documentSelector'></select>").addClass("form-control");
        $.each(session.documents, function (index, value) {
            const expiredText = LWithSource(localisationSource, "DocumentViewer:Expired");
            const recordTypeCode = value.isElectronic ? abp.utils.formatString("E-{0}", value.recordTypeCode) : value.recordTypeCode;
            const text = value.isExpired ?
                abp.utils.formatString("{0} - {1} | {2}", expiredText, recordTypeCode, value.title) :
                abp.utils.formatString("{0} | {1}", recordTypeCode, value.title);

            select.append($("<option></option>")
                .attr("value", value.id)
                .attr("data-electronic", value.isElectronic)
                .attr("selected", value.id === session.recordId && value.isElectronic === session.electronic)
                .text(text));
        });

        $("#documentViewerDocuments").html(select);

        $("#documentSelector").change(function (event) {
            event.preventDefault();
            const element = $(this);
            const option = $('option:selected', this);
            const isElectronic = option.data("electronic");
            const documentId = element.val();

            setSessionRecord(documentId, isElectronic);
            renderDocument();
        });
    }

    function renderExpiryMessage() {
        const formattedExpiryDate = moment(session.expiryDate).format("DD/MM/YYYY HH:mm:ss A");
        const warningText = LWithSource(localisationSource, "Warning:DocumentViewer:DocumentExpired", formattedExpiryDate);
        const warning = abp.utils.formatString('<div class="alert alert-danger m-3 text-center" role="alert">{0}</div>', warningText);
        
        if(session.isAdmin) {
            $("#documentViewerHeader").html(warning);
        } else {
            const containerSelector = getViewerSelector();
            $(containerSelector).html(warning);
        }
    }

    function addViewerCard() {

        if (config.displayType !== displayType.PANEL) {
            return;
        }

        const panelSelector = config.panel.selector;
        $(panelSelector).remove();

        const content = $(abp.utils.formatString(templates.panel, templates.loadingImage));

        if (session.dataTable == null) {
            content.find("#previousDocument").remove();
            content.find("#nextDocument").remove();
        }
        $("body").append(content);

        $("body").find(".kt-quick-panel-overlay").remove();

        const panel = KTUtil.get(panelSelector.replace("#", ""));
        const offCanvas = new KTOffcanvas(panel, {
            overlay: true,
            baseClass: 'kt-quick-panel',
            closeBy: 'document-viewer-panel-close',
        });

        offCanvas.show();
        return offCanvas;
    }

    function getViewerSelector() {
        switch (config.displayType) {
            case displayType.PANEL:
                return config.panel.selector + " > .kt-portlet > .kt-portlet__body";
            case displayType.INLINE:
                return config.inline.selector;
        }
    }

    function setViewerIFrame(dataPath) {
        const containerSelector = getViewerSelector();
        $(containerSelector).html("<iframe src='" + dataPath + "' class='w-100 h-100'></iframe>");
    }

    function registerButtonEvents() {
        const $body = $("body");
        $body.on("click", config.recordSelector, function (event) {
            event.preventDefault();

            const data = $(this).data();
            let recordId = data["recordId"];
            let dataTableId = data["table"];

            setSessionRecord(recordId, false);
            setSessionParent(recordId);
            setSessionDataTable(dataTableId);

            renderDocument()
        });

        $body.on("click", "#nextDocument", function (event) {
            event.preventDefault();

            var currentIndex = getCurrentIndex();
            if (session.dataTableDocumentIds.length === currentIndex + 1) {
                changePage(pageDirection.NEXT);
            } else {
                const nextId = session.dataTableDocumentIds[currentIndex + 1];
                setSessionParent(nextId);
                setSessionRecord(nextId, false);
                renderDocument();
            }
        });

        $body.on("click", "#previousDocument", function (event) {
            event.preventDefault();

            var currentIndex = getCurrentIndex();
            if (currentIndex === 0) {
                changePage(pageDirection.PREVIOUS);
            } else {
                var previousId = session.dataTableDocumentIds[currentIndex - 1];
                setSessionParent(previousId);
                setSessionRecord(previousId, false);
                renderDocument();
            }
        });
    }

    function getCurrentIndex() {
        var currentIndex = session.dataTableDocumentIds.indexOf(session.parentId);
        return currentIndex;
    }
    
    return {
        init: function (customConfig) {
            config = $.extend(true, {}, config, customConfig);
            addStyleSheet();
            registerButtonEvents();
        },

        showRecord: function (recordId) {
            setSessionParent(recordId);
            setSessionRecord(recordId, false);
            renderDocument();
        }
        
    };
    
}();