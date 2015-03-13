/*!
 * angular-tablescroll
 * http://mikeallisononline.com/
 *
 * Copyright 2015 Mike Allison
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 */
/// <reference path="bower_components/dt-jquery/jquery.d.ts" />
/// <reference path="bower_components/dt-angular/angular.d.ts" />

//extend JQuery interface definition to allow for bkgcolor method
interface JQuery {
    bkgcolor? (fallback?: string): string;
}

angular.module('ngTablescroll', []).directive('ngTablescroll', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var self: JQuery = $(element);
            //skip if not table element
            if (self.prop("tagName").toLowerCase() !== 'table')
                return;

            var o: any = scope.$eval(attrs.ngTablescroll);
            if (o == null)
                o = {};

            var parent: JQuery = self.parent();
            var prevParentWidth: number = parent.width();
            var divWidth: number = parseInt(o.width ? o.width : parent.width());
            var divHeight: number = parseInt(o.height ? o.height : parent.height());

            //get scrollbar size
            var dummy: JQuery = $('<div>').css({ visibility: 'hidden', width: '50px', height:'50px', overflow: 'scroll' }).appendTo('body');
            var scrollbarpx: number = 50 - $('<div>').height(99).appendTo(dummy).outerWidth();
            dummy.remove();

            //IE8 browser test (because it's bad)s
            var rv: number = -1;
            var ua: string = navigator.userAgent;
            var re: RegExp = new RegExp("Trident\/([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) != null) {
                rv = parseFloat(RegExp.$1);
            }
            var ie8: boolean = (rv == 4);

            //bypass if table size smaller than given dimesions
            if (self.width() <= divWidth && self.height() <= divHeight)
                return;

            var width: number = self.width();
            self.width(width); //reinforce table width so it doesn't change dynamically

            //Create outer div
            var outerdiv: JQuery = $(document.createElement('div'));
            outerdiv.css({ 'overflow': 'hidden' }).width(divWidth).height(divHeight);

            //Create header div
            var headerdiv: JQuery = $(document.createElement('div'));
            headerdiv.css({ 'overflow': 'hidden', 'position': 'relative' }).width(divWidth);
            if (o.headerCss)
                headerdiv.addClass(o.headerCss);

            //Create header clone
            var cloneTable: JQuery = self.clone();
            cloneTable.find('tbody').remove();
            cloneTable.find('tfoot').remove();

            //Create footer clone
            var cloneFoot: JQuery = self.clone();
            cloneFoot.find('tbody').remove();
            cloneFoot.find('thead').remove();

            var headBgColor: any = null;
            //Set header/footer column widths and click events
            self.find('thead').find('th').each(function(index, value) {
                var val = $(value);
                var tdwidth: number = val.width();
                if (headBgColor == null) {
                    if (o.backgroundcolor == null)
                        headBgColor = val.bkgcolor();
                    else
                        headBgColor = o.backgroundcolor;
                }
                if (headBgColor == "rgba(0, 0, 0, 0)" || headBgColor == "transparent")
                    headBgColor = "#fff";

                val.css("width", tdwidth + 'px'); //reinforce width
                $(cloneTable.find('th')[index]).click(function() { val.click(); });
                $(cloneTable.find('th')[index]).width(tdwidth);
                $(cloneFoot.find('th')[index]).click(function () { val.click(); });
                $(cloneFoot.find('td')[index]).width(tdwidth);
            });

            //Create footer div
            var footerdiv: JQuery = $(document.createElement('div'));
            footerdiv.css({ 'overflow': 'hidden', 'position': 'relative', 'background-color': headBgColor }).width(divWidth);

            cloneTable.css({ 'table-layout': 'fixed', 'background-color': headBgColor });
            cloneFoot.css({ 'table-layout': 'fixed', 'background-color': headBgColor });
            self.css({ 'table-layout': 'fixed' });

            //Create body div
            var bodydiv: JQuery = $(document.createElement('div'));

            //Add horizontal scroll event
            bodydiv.scroll(function () {
                headerdiv.scrollLeft(bodydiv.scrollLeft());
                footerdiv.scrollLeft(bodydiv.scrollLeft());
            });

            //Add to DOM
            headerdiv.append(cloneTable);
            footerdiv.append(cloneFoot);
            self.before(outerdiv);
            self.appendTo(bodydiv);
            outerdiv.append(headerdiv);
            outerdiv.append(bodydiv);
            outerdiv.append(footerdiv);

            //Adjust header and footer div width if vertical scrollbar present
            var combinedHeight: number = self.height() + headerdiv.height() + footerdiv.height();
            if (combinedHeight >= divHeight) {
                headerdiv.width(headerdiv.width() - scrollbarpx);
                footerdiv.width(footerdiv.width() - scrollbarpx);
            }

            //Set body height after other content added to parent
            var marginTop: number = parseFloat(bodydiv.css("margin-top"));
            marginTop -= headerdiv.height();
            var marginBottom: number = parseFloat(bodydiv.css("margin-bottom"));
            marginBottom -= footerdiv.height();
            if (self.width() + scrollbarpx >= divWidth)
                marginBottom -= scrollbarpx;
            bodydiv.css({ 'overflow': 'auto', 'margin-top': marginTop + 'px', 'margin-bottom': marginBottom + 'px' }).width(divWidth).height(divHeight);

            if (ie8)
                self.find('thead').hide();

            //Add reactive resizing
            if (o.reactive) {
                $(window).resize(function () {
                    if (prevParentWidth != parent.width()) {
                        var newWidth: number = parent.width();
                        if (o.width && newWidth > o.width)
                            return;
                        outerdiv.css({ 'overflow': 'hidden' }).width(newWidth).height(divHeight);
                        headerdiv.css({ 'overflow': 'hidden', 'position': 'relative' }).width(newWidth - scrollbarpx);
                        bodydiv.css({ 'overflow': 'auto', 'margin-top': marginTop + 'px', 'margin-bottom': marginBottom + 'px' }).width(newWidth).height(divHeight - scrollbarpx);
                        footerdiv.css({ 'overflow': 'hidden', 'position': 'relative', 'background-color': headBgColor }).width(newWidth - scrollbarpx);
                        prevParentWidth = newWidth;
                    }
                });
            }
        }
    }
});


(function($) {
    // Get this browser's take on no fill
    // Must be appended else Chrome etc return 'initial'
    var $temp: JQuery = $('<div style="background:none;display:none;"/>').appendTo('body');
    var transparent = $temp.css('backgroundColor');
    $temp.remove();

    jQuery.fn.bkgcolor = function( fallback ) {
        function test( $elem ) {
            if ( $elem.css('backgroundColor') == transparent ) {
                return !$elem.is('body') ? test( $elem.parent() ) : fallback || transparent ;
            } else {
                return $elem.css('backgroundColor');
            }
        }
        return test( $(this) );
    };

})(jQuery);