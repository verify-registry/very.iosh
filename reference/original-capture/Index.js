var VerificationIndex = function () {

    var handleButtons = function() {
        $("#btn-view-details-active").on("click", function() {
            $("#DocumentDetails").removeClass("m--hide");
            $("#btn-hide-details-active").removeClass("m--hide");
            $("#btn-view-details-active").addClass("m--hide");
        });

        $("#btn-hide-details-active").on("click", function() {
            $("#DocumentDetails").addClass("m--hide");
            $("#btn-view-details-active").removeClass("m--hide");
            $("#btn-hide-details-active").addClass("m--hide");
        });

    };

   return {
        // public functions
        init: function () {
            handleButtons();
            $("#reference").inputmask({
                "mask": "99999999-99-****", //76576176-01-OTET
            });
        }
    };

}();

 $(function() {
    VerificationIndex.init();
});