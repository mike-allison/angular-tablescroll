/*!
 * angular-tablescroll
 * http://mikeallisononline.com/
 *
 * Copyright 2015 Mike Allison
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 */
/// <reference path="typings/browser.d.ts" />

//extend JQuery interface definition to allow for bkgcolor method
interface JQuery {
	bkgcolor? (fallback?:string): string;
}

// Get this browser's take on no fill
// Must be appended else Chrome etc return 'initial'
let $temp:any = document.createElement('div');
$temp.style.background = 'none';
$temp.style.display = 'none';
document.body.appendChild($temp);
const transparent = window.getComputedStyle($temp, null).getPropertyValue('background-color');
document.body.removeChild($temp);

function NgTablecroll() {
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			let self:any = element[0];

			//skip if not table element
			if (self.tagName.toLowerCase() !== 'table')
				return;

			//get options values
			let o:any = scope.$eval(attrs.ngTablescroll) || {};

			let parent:any = self.parentElement;
			let prevParentWidth:number = parent.offsetWidth;

			//get parent dimensions
			const divWidth:number = parseInt(o.width || parent.offsetWidth);
			const divHeight:number = parseInt(o.height || parent.offsetHeight);

			//bypass if table size smaller than given dimesions
			if (self.offsetWidth <= divWidth && self.offsetHeight <= divHeight)
				return;

			const scrollbarpx:number = getScrollbarPx();
			self.style.width = self.offsetWidth; //reinforce table width so it doesn't change dynamically

			//Create outer div
			let outerdiv:any = document.createElement('div');
			outerdiv.style.overflow = 'hidden';
			outerdiv.style.width = divWidth + 'px';
			outerdiv.style.height = divHeight + 'px';

			//Create header div
			let headerdiv:any = document.createElement('div');
			headerdiv.style.overflow = 'hidden';
			headerdiv.style.position = 'relative';
			headerdiv.style.width = divWidth + 'px';
			if (o.headerCss)
				headerdiv.style.cssText += o.headerCss;

			//Create header clone
			let cloneTable:any = self.cloneNode(true);
			cloneTable.width = self.offsetWidth;
			cloneTable.removeChild(cloneTable.getElementsByTagName('tbody')[0]);
			cloneTable.deleteTFoot();

			//Create footer clone
			let cloneFoot:any = self.cloneNode(true);
			cloneFoot.width = self.offsetWidth;
			cloneFoot.removeChild(cloneFoot.getElementsByTagName('tbody')[0]);
			cloneFoot.deleteTHead();

			let headBgColor:any = null;
			//Set header/footer column widths and click events
			let header = self.getElementsByTagName('thead');
			let cloneTableCells = cloneTable.getElementsByTagName('th');
			let cloneFootCells = cloneFoot.getElementsByTagName('td');
			if (header[0]) {
				let cells = header[0].getElementsByTagName('th');
				for(let index = 0; index < cells.length; index++) {
					let val = cells[index];
					const tdwidth:number = val.offsetWidth;
					if (headBgColor == null) {
						headBgColor = o.backgroundcolor || bkgcolor(val);
					}
					if (headBgColor == "rgba(0, 0, 0, 0)" || headBgColor == "transparent")
						headBgColor = "#fff";

					val.style.width = tdwidth + 'px'; //reinforce width
					if (cloneTableCells[index]){
						cloneTableCells[index].onclick = () => {
							val.click();
						};
						cloneTableCells[index].style.width = tdwidth + 'px';
					}
					if (cloneFootCells[index]) {
						cloneFootCells[index].onclick = () => {
							val.click();
						};
						cloneFootCells[index].style.width = tdwidth + 'px';
					}
				}
			}

			//Create footer div
			let footerdiv:any = document.createElement('div');
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
			let bodydiv:any = document.createElement('div');

			//Add horizontal scroll event
			bodydiv.onscroll = () => {
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
			const combinedHeight:number = self.offsetHeight + headerdiv.offsetHeight + footerdiv.offsetHeight;
			if (combinedHeight >= divHeight) {
				headerdiv.style.width = (headerdiv.offsetWidth - scrollbarpx) + 'px';
				footerdiv.style.width = (footerdiv.offsetWidth - scrollbarpx) + 'px';
			}

			//Set body height after other content added to parent
			let marginTop:number = parseFloat(bodydiv.style.marginTop || 0);
			marginTop -= headerdiv.offsetHeight;
			let marginBottom:number = parseFloat(bodydiv.style.marginBottom || 0);
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
				window.addEventListener('resize', () => {
					if (prevParentWidth != parent.offsetWidth) {
						const newWidth:number = parent.offsetWidth;
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
			function isIE8(): boolean {
				let rv:number = -1;
				const ua:string = navigator.userAgent;
				const re:RegExp = new RegExp("Trident\/([0-9]{1,}[\.0-9]{0,})");
				if (re.exec(ua)) {
					rv = parseFloat(RegExp.$1);
				}
				return rv == 4;
			}

			function getScrollbarPx(): number {
				//get scrollbar size
				let dummy:any = document.createElement('div');
				dummy.style.visible = 'hidden';
				dummy.style.height = '50px';
				dummy.style.width = '50px';
				dummy.style.overflow = 'scroll';
				document.body.appendChild(dummy);
				let filler = document.createElement('div');
				filler.style.height = '99px';
				dummy.appendChild(filler);
				const scrollbarpx:number = 50 - dummy.offsetWidth;
				document.body.removeChild(dummy);
				return scrollbarpx;
			}

			function bkgcolor(element, fallback) {
				function test($elem) {
					if (window.getComputedStyle($elem, null).getPropertyValue('background-color') == transparent) {
						return $elem.tagName.toLowerCase() !== 'body' ? test($elem.parentNode) : fallback || transparent;
					} else {
						return window.getComputedStyle($elem, null).getPropertyValue('background-color');
					}
				}
				return test(element);
			}
		}
	}
}

angular.module('ngTablescroll', [])
	.directive('ngTablescroll', NgTablecroll);
