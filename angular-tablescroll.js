/*!
 * angular-tablescroll
 * http://mikeallisononline.com/
 *
 * Copyright 2015 Mike Allison
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 */
/// <reference path="typings/browser.d.ts" />
// Get this browser's take on no fill
// Must be appended else Chrome etc return 'initial'
var $temp = document.createElement('div');
$temp.style.background = 'none';
$temp.style.display = 'none';
document.body.appendChild($temp);
var transparent = window.getComputedStyle($temp, null).getPropertyValue('background-color');
document.body.removeChild($temp);
function NgTablecroll() {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var self = element[0];
            //skip if not table element
            if (self.tagName.toLowerCase() !== 'table')
                return;
            //get options values
            var o = scope.$eval(attrs.ngTablescroll) || {};
            var parent = self.parentElement;
            var prevParentWidth = parent.offsetWidth;
            //get parent dimensions
            var divWidth = parseInt(o.width || parent.offsetWidth);
            var divHeight = parseInt(o.height || parent.offsetHeight);
            //bypass if table size smaller than given dimesions
            if (self.offsetWidth <= divWidth && self.offsetHeight <= divHeight)
                return;
            var scrollbarpx = getScrollbarPx();
            self.style.width = self.offsetWidth; //reinforce table width so it doesn't change dynamically
            //Create outer div
            var outerdiv = document.createElement('div');
            outerdiv.style.overflow = 'hidden';
            outerdiv.style.width = divWidth + 'px';
            outerdiv.style.height = divHeight + 'px';
            //Create header div
            var headerdiv = document.createElement('div');
            headerdiv.style.overflow = 'hidden';
            headerdiv.style.position = 'relative';
            headerdiv.style.width = divWidth + 'px';
            if (o.headerCss)
                headerdiv.style.cssText += o.headerCss;
            //Create header clone
            var cloneTable = self.cloneNode(true);
            cloneTable.width = self.offsetWidth;
            cloneTable.removeChild(cloneTable.getElementsByTagName('tbody')[0]);
            cloneTable.deleteTFoot();
            //Create footer clone
            var cloneFoot = self.cloneNode(true);
            cloneFoot.width = self.offsetWidth;
            cloneFoot.removeChild(cloneFoot.getElementsByTagName('tbody')[0]);
            cloneFoot.deleteTHead();
            var headBgColor = null;
            //Set header/footer column widths and click events
            var header = self.getElementsByTagName('thead');
            var cloneTableCells = cloneTable.getElementsByTagName('th');
            var cloneFootCells = cloneFoot.getElementsByTagName('td');
            if (header[0]) {
                var cells = header[0].getElementsByTagName('th');
                var _loop_1 = function(index) {
                    var val = cells[index];
                    var tdwidth = val.offsetWidth;
                    if (headBgColor == null) {
                        headBgColor = o.backgroundcolor || bkgcolor(val);
                    }
                    if (headBgColor == "rgba(0, 0, 0, 0)" || headBgColor == "transparent")
                        headBgColor = "#fff";
                    val.style.width = tdwidth + 'px'; //reinforce width
                    if (cloneTableCells[index]) {
                        cloneTableCells[index].onclick = function () {
                            val.click();
                        };
                        cloneTableCells[index].style.width = tdwidth + 'px';
                    }
                    if (cloneFootCells[index]) {
                        cloneFootCells[index].onclick = function () {
                            val.click();
                        };
                        cloneFootCells[index].style.width = tdwidth + 'px';
                    }
                };
                for (var index = 0; index < cells.length; index++) {
                    _loop_1(index);
                }
            }
            //Create footer div
            var footerdiv = document.createElement('div');
            footerdiv.style.overflow = 'hidden';
            footerdiv.style.position = 'relative';
            footerdiv.style.backgroundColor = headBgColor;
            footerdiv.style.width = divWidth + 'px';
            cloneTable.style.tableLayout = 'fixed';
            cloneTable.style.backgroundColor = headBgColor;
            cloneFoot.style.tableLayout = 'fixed';
            cloneFoot.style.backgroundColor = headBgColor;
            self.style.tableLayout = 'fixed';
            //Create body div
            var bodydiv = document.createElement('div');
            //Add horizontal scroll event
            bodydiv.onscroll = function () {
                headerdiv.scrollLeft = bodydiv.scrollLeft;
                footerdiv.scrollLeft = bodydiv.scrollLeft;
            };
            //Add to DOM
            headerdiv.appendChild(cloneTable);
            footerdiv.appendChild(cloneFoot);
            self.parentNode.insertBefore(outerdiv, self);
            //outerdiv.appendChild(bodydiv);
            //self.before(outerdiv);
            self.parentNode.removeChild(self);
            bodydiv.appendChild(self);
            outerdiv.appendChild(headerdiv);
            outerdiv.appendChild(bodydiv);
            outerdiv.appendChild(footerdiv);
            //Adjust header and footer div width if vertical scrollbar present
            var combinedHeight = self.offsetHeight + headerdiv.offsetHeight + footerdiv.offsetHeight;
            if (combinedHeight >= divHeight) {
                headerdiv.style.width = (headerdiv.offsetWidth - scrollbarpx) + 'px';
                footerdiv.style.width = (footerdiv.offsetWidth - scrollbarpx) + 'px';
            }
            //Set body height after other content added to parent
            var marginTop = parseFloat(bodydiv.style.marginTop || 0);
            marginTop -= headerdiv.offsetHeight;
            var marginBottom = parseFloat(bodydiv.style.marginBottom || 0);
            marginBottom -= footerdiv.offsetHeight;
            if (self.offsetWidth + scrollbarpx >= divWidth)
                marginBottom -= scrollbarpx;
            bodydiv.style.overflow = 'auto';
            bodydiv.style.marginTop = marginTop + 'px';
            bodydiv.style.marginBottom = marginBottom + 'px';
            bodydiv.style.width = divWidth + 'px';
            bodydiv.style.height = divHeight + 'px';
            if (isIE8())
                self.getElementsByTagName('thead')[0].style.display = 'none';
            //Add reactive resizing
            if (o.reactive) {
                makeReactive();
            }
            function makeReactive() {
                window.addEventListener('resize', function () {
                    if (prevParentWidth != parent.offsetWidth) {
                        var newWidth = parent.offsetWidth;
                        if (o.width && newWidth > o.width)
                            return;
                        outerdiv.style.overflow = 'hidden';
                        outerdiv.style.width = newWidth + 'px';
                        outerdiv.style.height = divHeight + 'px';
                        headerdiv.style.overflow = 'hidden';
                        headerdiv.style.position = 'relative';
                        headerdiv.style.width = (newWidth - scrollbarpx) + 'px';
                        bodydiv.style.overflow = 'auto';
                        bodydiv.style.marginTop = marginTop + 'px';
                        bodydiv.style.marginBottom = marginBottom + 'px';
                        bodydiv.style.width = newWidth + 'px';
                        bodydiv.style.height = (divHeight - scrollbarpx) + 'px';
                        footerdiv.style.overflow = 'hidden';
                        footerdiv.style.position = 'relative';
                        footerdiv.style.backgroundColor = headBgColor;
                        footerdiv.style.width = (newWidth - scrollbarpx) + 'px';
                        prevParentWidth = newWidth;
                    }
                });
            }
            //IE8 browser test (because it's bad)
            function isIE8() {
                var rv = -1;
                var ua = navigator.userAgent;
                var re = new RegExp("Trident\/([0-9]{1,}[\.0-9]{0,})");
                if (re.exec(ua)) {
                    rv = parseFloat(RegExp.$1);
                }
                return rv == 4;
            }
            function getScrollbarPx() {
                //get scrollbar size
                var dummy = document.createElement('div');
                dummy.style.visible = 'hidden';
                dummy.style.height = '50px';
                dummy.style.width = '50px';
                dummy.style.overflow = 'scroll';
                document.body.appendChild(dummy);
                var filler = document.createElement('div');
                filler.style.height = '99px';
                dummy.appendChild(filler);
                var scrollbarpx = 50 - dummy.offsetWidth;
                document.body.removeChild(dummy);
                return scrollbarpx;
            }
            function bkgcolor(element, fallback) {
                function test($elem) {
                    if (window.getComputedStyle($elem, null).getPropertyValue('background-color') == transparent) {
                        return $elem.tagName.toLowerCase() !== 'body' ? test($elem.parentNode) : fallback || transparent;
                    }
                    else {
                        return window.getComputedStyle($elem, null).getPropertyValue('background-color');
                    }
                }
                return test(element);
            }
        }
    };
}
angular.module('ngTablescroll', [])
    .directive('ngTablescroll', NgTablecroll);
//# sourceMappingURL=angular-tablescroll.js.map