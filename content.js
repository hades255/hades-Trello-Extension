console.log("Hello from content.js");
const page = {};
let markSetting = {};
let triggered = {};
let changeCompleteByIcon
const $dynamicStyles = jQuery('<style id="trello-mark-dynamic-css"></style>');
let onRebuild = false;

function waitForElm(selector) {
    return new Promise((resolve) => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver((mutations) => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
}

const debounce = (func, timeout = 500) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    };
};

let renderAttrName = function (name) {
    return name
        .toLowerCase()
        .replace(/[!@#$%^&*(),.?":{}|<> ]/gi, "-") // special characters
        .replace(/(-)(?=.*\1)/g, "");
};

const store = function (key, value) {
    chrome.storage.sync.set({ [key]: value });
};

const loadSavedSetting = () => {
    chrome.storage.sync.get(
        ["tmListWidth", "tmSetting"],
        function (result) {
            markSetting = result.tmSetting || {};
            $(".single-line-toggle input").prop(
                "checked",
                markSetting.singleLine
            );
            $(".hide-icon-toggle input").prop(
                "checked",
                markSetting.hideIcon
            );
            $(".trello-mark-selector > select").val(markSetting.font);
            $(".filter-star-toggle input").prop(
                "checked",
                markSetting.filterStar
            );
            rebuildDynamicStyles();
        }
    );
};

const addControllers = (menu) => {
    waitForElm("span.r_GKTc1QQciTsV").then(() => {
        $("span.r_GKTc1QQciTsV").append(menu)
    })
}

const addSingleLineToggle = () => {
    const $toggleWrapper = jQuery(`<div class="trello-mark-toggle single-line-toggle"></div>`);
    const $toggleSwitch = jQuery(`<label class="switch"></label>`);
    const $inputElem = jQuery(`<input type="checkbox">`);
    $inputElem.on("change", () => {
        const value = $inputElem[0].checked;
        markSetting.singleLine = value
        rebuildDynamicStyles();
    });
    const $spanElem = jQuery(`<span class="slider round"></span>`);
    // $toggleWrapper
    //     .append($toggleSwitch.append($inputElem, $spanElem))
    //     .insertAfter(".js-board-views-switcher");
    addControllers($toggleWrapper.append($toggleSwitch.append($inputElem, $spanElem)))
};

const addHideIconToggle = () => {
    const $toggleWrapper = jQuery(`<div class="trello-mark-toggle hide-icon-toggle"></div>`);
    const $toggleSwitch = jQuery(`<label class="switch"></label>`);
    const $inputElem = jQuery(`<input type="checkbox">`);
    $inputElem.on("change", () => {
        const value = $inputElem[0].checked;
        markSetting.hideIcon = value;
        rebuildDynamicStyles();        
    });
    const $spanElem = jQuery(`<span class="slider round"></span>`);
    // $toggleWrapper
    //     .append($toggleSwitch.append($inputElem, $spanElem))
    //     .insertAfter(".js-board-views-switcher");
    addControllers($toggleWrapper.append($toggleSwitch.append($inputElem, $spanElem)))
};

const addStarIconToggle = () => {
    const $toggleWrapper = jQuery(`<div class="trello-mark-toggle filter-star-toggle"></div>`);
    const $toggleSwitch = jQuery(`<label class="switch"></label>`);
    const $inputElem = jQuery(`<input type="checkbox">`);
    $inputElem.on("change", () => {
        const value = $inputElem[0].checked;
        markSetting.filterStar = value;
        rebuildDynamicStyles();        
    });
    const $spanElem = jQuery(`<span class="slider round"></span>`);
    addControllers($toggleWrapper.append($toggleSwitch.append($inputElem, $spanElem)))
};

const addFontSelector = () => {
    const $fontSelectWrapper = jQuery(
        `<div class="trello-mark-selector mark-default-selector"></div>`
    );
    const $fontSelector = jQuery(`<select>
    <option value="">Default</option>
    <option value="9">Very Small</option>
    <option value="10">Small</option>
    <option value="12.5">Medium</option>
    <option value="15">Large</option>
    <option value="17">Extra Large</option>
  </select>`);
    $fontSelector.on("change", () => {
        const value = $fontSelector.val();
        markSetting.font = value;
        rebuildDynamicStyles();
    });
    // $fontSelectWrapper
    //     .append($fontSelector)
    //     .insertAfter(".js-board-views-switcher");
    addControllers($fontSelectWrapper.append($fontSelector))    
};

const addArchiveZone = () => {
    const $archiveZone = jQuery(
        `<div class="trello-mark-archive">Archive</div>`
    );

    $archiveZone.hover(
        function () {
            // document.querySelector('body').focus()
            $archiveZone.addClass("hover");
            document.querySelector("body").dispatchEvent(
                new KeyboardEvent("keydown", {
                    bubbles: true,
                    cancelable: true,
                    key: "c",
                })
            );
        },
        function () {
            $archiveZone.removeClass("hover");
        }
    );

    // $archiveZone.insertAfter(".js-board-views-switcher");
    addControllers($archiveZone)
};

const addUnshiftCard = (lastFlag = false) => {
    $(".trello-mark-unshift-card").remove();
    const $unshiftCard = jQuery(
        `<div class="trello-mark-unshift-card"><span class="icon-sm icon-add"></span></div>`
    );
    $("body").dblclick((ev) => {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        ev.stopPropagation();
    });
    $unshiftCard.on("click", function (ev) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        ev.stopPropagation();
        ev.currentTarget.dispatchEvent(
            new MouseEvent("dblclick", {
                bubbles: true,
                cancelable: true,
                view: window,
            })
        );
    });
    if (lastFlag) {
        setTimeout(
            () =>
                $unshiftCard.insertBefore(
                    ".list-wrapper:nth-last-child(2) a.list-header-extras-menu"
                ),
            1000
        );
    } else {
        $unshiftCard.insertBefore("a.list-header-extras-menu");
    }
};

const addCompleteIcon = (target) => {
    const $completeIcon = jQuery(
        `<span class="dark-hover icon-check icon-sm js-card-menu list-card-operation"></span>`
    );
    $completeIcon.on("click", function (ev) {    
        // $titleElem = $(this).closest('a.list-card').find("span.list-card-title")
        // if ($titleElem.hasClass("trello-mark-line-through")) $titleElem.removeClass("trello-mark-line-through")
        // else $titleElem.addClass("trello-mark-line-through")
        // changeCompleteByIcon = true
        waitForElm("div.card-detail-window").then((elm) => {
            // $('div.editor-sticky-toolbar').css("display", "none")
            $(
                "div.custom-field-detail-item h3.card-detail-item-header[title='Complete']+span"
            )?.click();            
            $(
                "div.editor-sticky-toolbar a.dialog-close-button"
            )[0].dispatchEvent(
                new MouseEvent("click", {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                })
            );            
        });
    });
    $completeIcon.insertAfter(target.find("span.js-open-quick-card-editor"));
};

const addArchiveIcon = (target) => {
    const $archiveIcon = jQuery(
        `<span class="dark-hover icon-archive icon-sm js-card-menu list-card-operation"></span>`
    );
    $archiveIcon.on("click", function (ev) {
        ev.stopImmediatePropagation();
        ev.preventDefault();
        ev.stopPropagation();
        document.querySelector("body").dispatchEvent(
            new KeyboardEvent("keydown", {
                bubbles: true,
                cancelable: true,
                key: "c",
            })
        );
    });
    $archiveIcon.insertBefore(target.find("span.js-open-quick-card-editor"));
};

const addClockIcon = (target) => {
    const $clockIcon = jQuery(
        `<span class="dark-hover icon-clock icon-sm js-card-menu list-card-operation"></span>`
    );
    $clockIcon.on("click", function (ev) {
        ev.stopImmediatePropagation();
        ev.preventDefault();
        ev.stopPropagation();
        let path = $(this).closest("a.list-card").prop("href").split("/");
        if (!path || path[3] != "c" || !path[4]) return;
        const cardId = path[4];
        $(this).closest('.list-card').find(".js-open-quick-card-editor").click()        
        waitForElm(".quick-card-editor-card .list-card-quick-edit").then(() => {
            $(".quick-card-editor-card .list-card-quick-edit").remove()
            $(".quick-card-editor-card .js-save-edits").remove()
            $(".quick-card-editor-card .quick-card-editor-buttons").empty()
            let timeArr = [0, 5, 10, 15, 20, 25, 30, 45, 60, 120, 180]
            for (const item of timeArr) {
                let $timeMenu = jQuery(`<a class="quick-card-editor-buttons-item" href="#">
                    <span class="quick-card-editor-buttons-item-text">${item ? item : "Remove"}</span>
                </a>`)
                $timeMenu.on('click', debounce(() => {
                    if (!markSetting.card) markSetting.card = {};
                    if (!markSetting.card[cardId])
                        markSetting.card[cardId] = {};
                    markSetting.card[cardId].timeValue = item;
                    $(".quick-card-editor").remove();
                    rebuildDynamicStyles();
                }))
                $(".quick-card-editor-card .quick-card-editor-buttons").append($timeMenu)
            }
        })
    });
    $clockIcon.insertBefore(target.find("span.js-open-quick-card-editor"));
};

const addViewIcon = (target) => {
    const $viewIcon = jQuery(
        `<span class="dark-hover icon-subscribe icon-sm js-card-menu list-card-operation"></span>`
    );    
    $viewIcon.insertBefore(target.find("span.js-open-quick-card-editor"));
};

const addPersonIcon = (target) => {
    const $personIcon = jQuery(
        `<span class="dark-hover icon-member icon-sm js-card-menu list-card-operation"></span>`
    );
    $personIcon.on("click", function (ev) {
        ev.stopImmediatePropagation();
        ev.preventDefault();
        ev.stopPropagation();
        let path = $(this).closest("a.list-card").prop("href").split("/");
        if (!path || path[3] != "c" || !path[4]) return;
        const cardId = path[4];
        if (!markSetting.card) markSetting.card = {};
        if (!markSetting.card[cardId])
            markSetting.card[cardId] = {};        
        markSetting.card[cardId].delegated = !markSetting.card[cardId].delegated;
        updateDelegated()        
    });    
    $personIcon.insertBefore(target.find("span.js-open-quick-card-editor"));
};

const addStarIcon = (target) => {
    const $starIcon = jQuery(
        `<span class="dark-hover icon-star icon-sm js-card-menu list-card-operation"></span>`
    );
    $starIcon.on("click", function (ev) {
        ev.stopImmediatePropagation();
        ev.preventDefault();
        ev.stopPropagation();
        let path = $(this).closest("a.list-card").prop("href").split("/");
        if (!path || path[3] != "c" || !path[4]) return;
        const cardId = path[4];
        if (!markSetting.card) markSetting.card = {};
        if (!markSetting.card[cardId])
            markSetting.card[cardId] = {};        
        markSetting.card[cardId].star = !markSetting.card[cardId].star;
        store("tmSetting", markSetting);
        updateStar()        
    });   
    $starIcon.insertBefore(target.find("span.js-open-quick-card-editor"));
};

const addOutcomeText = (target) => {
    let outcomeText = target.find('.custom-field-front-badges .badge-text:contains("Outcome: ")').text()
    outcomeText = outcomeText.substring(9)
    if (!outcomeText || outcomeText.length === 0) return
    const $outcomeText = jQuery(
        `<div class="badge badge-text outcome-text">${outcomeText}</div>`
    );    
    $outcomeText.insertAfter(target.find("span.js-open-quick-card-editor"));
};

const addCharcolOverlay = (target) => {
    let $charcolOverlay = jQuery(
        `<div class="charcol-overlay"></div>`
    );    
    $charcolOverlay.appendTo(target);
}

const changeWidth = (val) => {
    store("tmListWidth", val);
    if (val) {
        document
            .querySelectorAll("#board .js-list.list-wrapper")
            .forEach((el) => (el.style.width = `${val}px`));
        document
            .querySelectorAll("#board .list-card")
            .forEach((el) => (el.style.maxWidth = "100%"));
    } else {
        document
            .querySelectorAll("#board .js-list.list-wrapper")
            .forEach((el) => (el.style.width = null));
        document
            .querySelectorAll("#board .list-card")
            .forEach((el) => (el.style.maxWidth = null));
    }
};

const updateCompleteLineThrough = () => {
    setTimeout(() => {
        $("span.list-card-title").removeClass("trello-mark-line-through")
        $("span.list-card-title:has(+div.badges > .custom-field-front-badges span.badge-text:contains('Complete'))").addClass("trello-mark-line-through")
    }, 0)
}

const updateDelegated = () => {
    $("span.list-card-title").removeClass("trello-mark-delegated")
    if (markSetting.card) {
        document.querySelectorAll(".list-card").forEach((el) => {
            if (!$(el).prop("href")) return;
            let path = $(el).prop("href").split("/");
            if (!path || path[3] != "c" || !path[4]) return;
            let cardId = path[4];
            if (
                markSetting.card &&
                markSetting.card[cardId] &&
                (markSetting.card[cardId].delegated)
            )
                $(el).find("span.list-card-title").addClass(`trello-mark-delegated`);
        });
    }
}

const updateStar = () => {
    $("div.card-star-wrapper").remove()
    $(".list-card").removeClass("filter-star")
    if (markSetting.card) {
        document.querySelectorAll(".list-card").forEach((el) => {
            if (!$(el).prop("href")) return;
            let path = $(el).prop("href").split("/");
            if (!path || path[3] != "c" || !path[4]) return;
            let cardId = path[4];
            if (
                markSetting.card &&
                markSetting.card[cardId] &&
                (markSetting.card[cardId].star)
            ) {
                const $cardStarElem = jQuery(`<div class="card-star-wrapper" 
                style="width: ${markSetting.font ? markSetting.font * 18 / 14 : 18}px; height: ${markSetting.font ? markSetting.font * 18 / 14 : 18}px;">
                    <svg style="color: #0bd377;" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 512 512"><path d="M496,203.3H312.36L256,32,199.64,203.3H16L166.21,308.7,107.71,480,256,373.84,404.29,480,345.68,308.7Z" fill="#0bd377"></path></svg>
                </div>`)
                // if (!markSetting.hideIcon)
                //     $cardStarElem.insertBefore($(el).find("div.badges"))
                // else
                    $(el).find('span.list-card-title').prepend($cardStarElem)
                return
            }
            if (markSetting.filterStar)
                $(el).addClass("filter-star")
        });
    }
}

const rebuildDynamicStyles = () => {
    if (onRebuild) return
    onRebuild = true
    let css = "";
    store("tmSetting", markSetting);
    // build font enchancements    
    updateDelegated()
    updateCompleteLineThrough()
    updateStar()
    
    if (markSetting.singleLine) {
        $("#board").addClass("trello-mark-single-line");
    } else {
        $("#board").removeClass("trello-mark-single-line");
    }
    
    if (markSetting.hideIcon) {
        $("#board").addClass("trello-mark-hide-icons");
    } else {
        $("#board").removeClass("trello-mark-hide-icons");
    }

    if (markSetting.font) {
        css += `#board { font-size: ${markSetting.font}px; line-height: ${markSetting.font * 10 / 7}px;} `;
        css += `div.badge { min-height: ${markSetting.font}px; height: ${markSetting.font * 10 / 7}px;  line-height: ${markSetting.font * 10 / 7}px; } `;
        css += `div.badge span { font-size: ${markSetting.font}px; line-height: ${markSetting.font * 10 / 7}px}; height: ${markSetting.font * 10 / 7}px;} `;
        css += `.list-card-composer-textarea.js-card-title { font-size: ${markSetting.font}px; } `;
        css += `.list-card-front-labels-container button { font-size: ${markSetting.font}px; line-height: ${markSetting.font * 10 / 7}px; height: ${markSetting.font * 10 / 7}px; } `;
    }

    for (let cardId in markSetting.card) {
        if (markSetting.card[cardId].backgroundColor)
            css += `.trello-mark-card-${cardId} {background-color: ${markSetting.card[cardId].backgroundColor}}`;
        if (markSetting.card[cardId].fontColor)
            css += `.trello-mark-card-${cardId} .list-card-details.js-card-details .list-card-title {color: ${markSetting.card[cardId].fontColor} !important}`;
    }

    if (markSetting.card) {
        document.querySelectorAll(".list-card").forEach((el) => {
            if (!$(el).prop("href")) return;
            let path = $(el).prop("href").split("/");
            if (!path || path[3] != "c" || !path[4]) return;
            let cardId = path[4];
            if (
                markSetting.card &&
                markSetting.card[cardId] &&
                (markSetting.card[cardId].backgroundColor ||
                    markSetting.card[cardId].fontColor)
            )
                $(el).addClass(`trello-mark-card-${cardId}`);
            else $(el).removeClass(`trello-mark-card-${cardId}`);
        });
    }

    for (let listId in markSetting.list) {
        if (markSetting.list[listId].backgroundColor) {
            css += `.trello-mark-list-${listId} .js-list-content.list {background-color: ${markSetting.list[listId].backgroundColor}}`;
        }
        if (markSetting.list[listId].listWidth) {
            css += ".list-card { max-width: 100% !important; } ";
            css += `.trello-mark-list-${listId} {width: ${markSetting.list[listId].listWidth}px}`;
        }
    }

    if (markSetting.list) {
        document.querySelectorAll(".js-list").forEach((el) => {
            let listId = renderAttrName(
                $(el).find("textarea.list-header-name").val()
            );
            if (
                markSetting.list &&
                markSetting.list[listId] &&
                (markSetting.list[listId].backgroundColor ||
                    markSetting.list[listId].listWidth)
            )
                $(el).addClass(`trello-mark-list-${listId}`);
            else $(el).removeClass(`trello-mark-list-${listId}`);
        });
    }
    $dynamicStyles.html(css);

    $(".list-time-wrapper").remove()
    $(".card-time-wrapper").remove()
    $("textarea.mod-list-name").removeClass("with-time-wrapper")
    if (markSetting.card && !markSetting.hideIcon) {
        document.querySelectorAll(".js-list").forEach((listElem) => {
            let totalTime = 0
            listElem.querySelectorAll(".list-card").forEach((cardElem) => {
                if (!$(cardElem).prop("href")) return;
                let path = $(cardElem).prop("href").split("/");
                if (!path || path[3] != "c" || !path[4]) return;
                let cardId = path[4];
                if (markSetting.card && markSetting.card[cardId] && markSetting.card[cardId].timeValue) {
                    totalTime += markSetting.card[cardId].timeValue
                    const $cardTimeElem = jQuery(`<span class="card-time-wrapper" style="font-size: ${markSetting.font ? markSetting.font : 14}px; line-height: ${markSetting.font ? markSetting.font * 10 / 7 : 20}px">${markSetting.card[cardId].timeValue}</span>`)
                    $(cardElem).find("span.list-card-title").prepend($cardTimeElem)
                }   
            })
            if (totalTime) {
                const $listTimeElem = jQuery(`<span class="list-time-wrapper">${totalTime}</span>`)
                $listTimeElem.insertBefore($(listElem).find("textarea.mod-list-name"))
                $(listElem).find("textarea.mod-list-name").addClass("with-time-wrapper")
            }
        });
    }
    setTimeout(() => {onRebuild = false})
};

// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   console.log(
//     sender.tab
//       ? "from a content script:" + sender.tab.url
//       : "from the extension"
//   );
//   switch (request.from) {
//     case "changeWidth":
//       changeWidth(request.value);
//       break;
//     case "changeFont":
//       changeFont(request.value);
//       break;
//     default:
//       console.log("Message listener status active");
//       break;
//   }
// });

const changeBackgroundColorQuickCardEditor = (val) => {
    if (val)
        $(".quick-card-editor-card .list-card-details.js-card-details").css(
            "background-color",
            val
        );
    else
        $(".quick-card-editor-card .list-card-details.js-card-details").css(
            "background-color",
            ""
        );
};

const changeFontColorQuickCardEditor = (val) => {
    if (val)
        $(
            ".quick-card-editor-card .list-card-edit-title.js-edit-card-title"
        ).css("color", val);
    else
        $(
            ".quick-card-editor-card .list-card-edit-title.js-edit-card-title"
        ).css("color", "");
};

jQuery(document).bind("mouseup", function (e) {
    let $target = jQuery(e.target);
    // capture list settings appearance
    if ($target.hasClass("js-open-quick-card-editor")) {
        let path = $target.parents("a.list-card").prop("href").split("/");
        if (!path || path[3] != "c" || !path[4]) return;
        const cardId = path[4];
        let backgroundColor = "";
        let fontColor = "";
        if (markSetting.card && markSetting.card[cardId]) {
            if (markSetting.card[cardId].backgroundColor)
                backgroundColor = markSetting.card[cardId].backgroundColor;
            if (markSetting.card[cardId].fontColor)
                fontColor = markSetting.card[cardId].fontColor;
        }
        setTimeout(() => {
            //card background menu
            changeBackgroundColorQuickCardEditor(backgroundColor);
            changeFontColorQuickCardEditor(fontColor);
            let $backgroundColorMenu =
                jQuery(`<a class="quick-card-editor-buttons-item" href="#">
            <span class="icon-sm icon-board light"></span>
            <span class="quick-card-editor-buttons-item-text">Background</span>
        </a>`);
            let $cardBackgroundColor = jQuery(
                `<input type="text" class="trello-mark-card-menu" value="${backgroundColor}">`
            );
            $cardBackgroundColor.on(
                "input",
                debounce(() => {
                    changeBackgroundColorQuickCardEditor(
                        $cardBackgroundColor.val()
                    );
                    if (!markSetting.card) markSetting.card = {};
                    if (!markSetting.card[cardId])
                        markSetting.card[cardId] = {};
                    markSetting.card[cardId].backgroundColor =
                        $cardBackgroundColor.val();
                    rebuildDynamicStyles();
                })
            );
            $backgroundColorMenu
                .append($cardBackgroundColor)
                .insertBefore("#convert-card-role-button-react-root");

            //card font menu
            let $fontColorMenu =
                jQuery(`<a class="quick-card-editor-buttons-item" href="#">
            <span class="icon-sm icon-edit light"></span>
            <span class="quick-card-editor-buttons-item-text">Font Color</span>
        </a>`);
            let $cardFontColor = jQuery(
                `<input type="text" class="trello-mark-card-menu" value="${fontColor}">`
            );
            $cardFontColor.on(
                "input",
                debounce(() => {
                    changeFontColorQuickCardEditor($cardFontColor.val());
                    if (!markSetting.card) markSetting.card = {};
                    if (!markSetting.card[cardId])
                        markSetting.card[cardId] = {};
                    markSetting.card[cardId].fontColor = $cardFontColor.val();
                    rebuildDynamicStyles();
                })
            );
            $fontColorMenu
                .append($cardFontColor)
                .insertBefore("#convert-card-role-button-react-root");
        }, 100);
    }

    if ($target.hasClass("list-header-extras-menu")) {
        const listId = renderAttrName(
            $target
                .parents(".list-header")
                .find("textarea.list-header-name")
                .val()
        );
        let backgroundColor = "";
        let listWidth = "";
        if (markSetting.list && markSetting.list[listId]) {
            if (markSetting.list[listId].backgroundColor)
                backgroundColor = markSetting.list[listId].backgroundColor;
            if (markSetting.list[listId].listWidth)
                listWidth = markSetting.list[listId].listWidth;
        }
        setTimeout(function () {
            let $menu = jQuery('<ul class="pop-over-list"></ul>');
            //list background menu
            let $backgroundColor = jQuery(
                `<input type="text" class="trello-mark-list-menu" value="${backgroundColor}" />`
            );
            $backgroundColor.on(
                "input",
                debounce(() => {
                    if (!markSetting.list) markSetting.list = {};
                    if (!markSetting.list[listId])
                        markSetting.list[listId] = {};
                    markSetting.list[listId].backgroundColor =
                        $backgroundColor.val();
                    rebuildDynamicStyles();
                })
            );
            jQuery(
                '<li style="margin-bottom: 10px;"><strong>Background Color</strong></li>'
            )
                .append($backgroundColor)
                .appendTo($menu);

            // //list font color menu
            // let $fontColor = jQuery('<input type="text" style="float: right; width: 100px; height: 25px; margin: -2px 0 0 0" />');
            // $fontColor.on('input', debounce(() => {
            //   $target.parents('.js-list-content.list').css('font-color', $fontColor.val())
            // }));
            // jQuery('<li><strong>Font Color</strong></li>').append($fontColor).appendTo($menu);

            //list width menu
            let $inputWidth = jQuery(
                `<input type="text" class="trello-mark-list-menu" value="${listWidth}"/>`
            );
            $inputWidth.on(
                "input",
                debounce(() => {
                    if (!markSetting.list) markSetting.list = {};
                    if (!markSetting.list[listId])
                        markSetting.list[listId] = {};
                    markSetting.list[listId].listWidth = $inputWidth.val();
                    rebuildDynamicStyles();
                })
            );
            jQuery("<li><strong>List Width</strong></li>")
                .append($inputWidth)
                .appendTo($menu);
            let $insertPoint = jQuery(".pop-over.is-shown .pop-over-list:last");
            $insertPoint.before($menu);
            $insertPoint.before("<hr />");
        }, 100);
    }

    if (
        $target.hasClass("mod-list-add-button") &&
        $("input.list-name-input").val()
    ) {
        setTimeout(() => {
            addUnshiftCard();
        }, 500);
    }

    if (
        $target.hasClass("js-add-list") &&
        $("input.list-name-text-field").val()
    ) {
        setTimeout(() => {
            addUnshiftCard();
        }, 500);
    }

    if (
        $target.hasClass("charcol-overlay") || $target.hasClass("icon-archive")
    ) {
        setTimeout(() => {
            rebuildDynamicStyles();
        }, 500);
    }
});

const addHoverIcons = (target) => {    
    addArchiveIcon(target);
    // addViewIcon(target);    
    addCompleteIcon(target);
    addClockIcon(target);
    addOutcomeText(target);
    addCharcolOverlay(target);
    addPersonIcon(target);
    addStarIcon(target);
}

const removeHoverIcons = (target) => {    
    console.log("remove")
    $('[data-testid="list-card"] span.icon-archive').remove()
    $('[data-testid="list-card"] span.icon-check').remove()
    $('[data-testid="list-card"] span.icon-star').remove()
    $('[data-testid="list-card"] span.icon-clock').remove()
    $('[data-testid="list-card"] span.icon-subscribe').remove()
    $('[data-testid="list-card"] span.icon-member').remove()
    $('[data-testid="list-card"] div.outcome-text').remove()    
    $('[data-testid="list-card"] div.charcol-overlay').remove()    
}

const updateBoard = () => {
    // addArchiveZone();
    addFontSelector();
    addSingleLineToggle();
    addHideIconToggle();
    addStarIconToggle();    
    loadSavedSetting();
    addUnshiftCard();    
};

jQuery("title").bind("DOMSubtreeModified", function () {
    let title = jQuery.trim(jQuery(this).text());
    if (!window.location.href) return;
    let path = window.location.href.split("/");

    if (path[3] != "b") return; // works for boards only, not cards

    // check if board was changed
    if (title == page.boardTitle || page.boardId == path[4]) {        
        updateCompleteLineThrough()
        return
    };
    page.boardTitle = title;
    page.boardId = path[4];
    console.log("board changed");
    setTimeout(updateBoard, 500);
});

// jQuery(document).on("DOMSubtreeModified", ".list-card", function (e) {
//     if (!$(this).prop("href")) return;
//     let path = $(this).prop("href").split("/");
//     if (!path || path[3] != "c" || !path[4]) return;
//     const cardId = path[4];
//     if (markSetting.card && markSetting.card[cardId] && 
//         (markSetting.card[cardId].backgroundColor || markSetting.card[cardId].fontColor || markSetting.card[cardId].timeValue)
//     ) {
//         rebuildDynamicStyles();
//     }
// });

jQuery(document).on("mouseenter", "[data-testid='list-card']", function(e) {
    addHoverIcons($(this))
})

jQuery(document).on("mouseleave", "[data-testid='list-card']", function(e) {
    removeHoverIcons($(this))
})

const addDynamicStyles = () => {
    $dynamicStyles.appendTo(jQuery("body"));
};

setTimeout(addDynamicStyles, 500);
