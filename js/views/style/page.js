define([
        'jquery',
        'underscore',
        'backbone',
        'libs/marked/marked',
        'text!templates/style/page.html',
        'config',
        'jscssp',
        'less',
        'pagedown',
        'libs/highlight/highlight',
        'libs/parseuri/parseuri'
    ],
    function ($, _, Backbone, marked, stylePageTemplate, config, jscssp, less, Pagedown, hljs, parseuri) {
        var that = null;

        // This is important for some preprocessors to operate efficiently and correctly.
        // They should cascade and compute aggregate styles for all imported rules internally,
        // and following this there will be no need to update the style block assigned to the page.
        firstRun = true;

        var StylePage = Backbone.View.extend({
            el: '.kalei-style-page',
            render: function () {
                that = this;

                //add more space at the bottom of the page to avoid scrolling to last node from menu
                //but we can think for something more smarter
                var pageHeight = document.body.offsetHeight;
                var lastEl = $(".kalei-documentation:last").height();
                console.log(lastEl);
                $(that.el).css({'padding-bottom': (pageHeight / 2)});

                var styleUrl, configDir, primaryStyleFile = config.css_path;

                if (this.options.style === null) {
                    this.options.style = primaryStyleFile.substr(config.css_path.lastIndexOf('/') + 1);
                }

                if (this.options.style.substr(0, 1) === '/') {
                    // non relative
                    configDir = config.css_path.substr(0, config.css_path.lastIndexOf('/'));
                    var pUrl = parseuri(configDir);
                    styleUrl = pUrl.protocol + '://' + pUrl.host + (pUrl.port === '' ? '' : ':' + pUrl) + this.options.style;
                } else {
                    configDir = config.css_path.substr(0, config.css_path.lastIndexOf('/'));
                    styleUrl = configDir + '/' + this.options.style;
                }

                console.log('try', configDir);
                console.log('try', styleUrl);

                var parser = null,
                    page = {blocks: []};

                switch (config.css_processor) {
                    case 'jscssp':
                        // insert into page and process the 'real' CSS on first parse
                        if (firstRun) {
                            $('head').append('<link rel="stylesheet" href="' + config.css_path + '" type="text/css" />');
                        }

                        // parse this file
                        require(['text!' + styleUrl], function (stylesheet) {
                            parser = new jscssp();
                            stylesheet = parser.parse(stylesheet, false, true);

                            page = that.compute_css(stylesheet);
                            that.render_page(page);
                        });
                        break;
                    case 'less':
                        parser = new (less.Parser)({
                            filename: primaryStyleFile,
                            rootpath: configDir + '/',
                            relativeUrls: true,
                            insecure: true,
                            paths: [configDir + '/'], // Specify search paths for @import directives
                        });

                        // insert into page and process the 'real' CSS on first parse
                        if (firstRun) {
                            require(['text!' + config.css_path], function (stylesheet) {
                                parser.parse('.codedemo {' + stylesheet + '}', function (err, tree) {
                                    $('head').append('<style type="text/css">' + tree.toCSS() + '</style>');
                                });
                            });
                        }

                        require(['text!' + styleUrl], function (stylesheet) {
                            parser.parse(stylesheet, function (err, tree) {

                                page = that.compute_less(tree);
                                that.render_page(page);
                            });
                        });
                        break;
                }

                $('a.kalei-styleguide-menu-link').removeClass('active');
                if (window.location.hash === '') {
                    $('.js-kalei-home').addClass('active');
                } else {
                    $('[href="' + window.location.hash + '"]').addClass('active');
                }
            },

            render_page: function (page) {

                console.log((new Date()).getTime() + " bottom", page)

                $('.kalei-sheet-submenu').slideUp(200);
                var submenu = $('<ul>');

                ////////////NEEDS TO BE EXPORTED TO Menu.js
                _.each(page.blocks, function (block) {



                    if (block.heading != "") {

                        var jHtmlObject = jQuery(block.content);
                        var editor = jQuery("<em>").append(jHtmlObject);
                        editor.find("div, p, pre").remove();
                        var htmlString = editor.prop('outerHTML')

                        var testindex = htmlString.indexOf('<h3>');
                        var subArray = htmlString.substr(testindex).split('<h3>');

                        var tempArray = [];
                        var subNavs = $('<ul class="dons-subnav">');
                        for(var x = 0; x < subArray.length; x++){
                            if(subArray[x] !== ''){
                                var subIndex = subArray[x].indexOf('</h3>');
                                var subTitle = subArray[x].substr(0, subIndex);

                                subNavs.append($('<li>').text(subTitle));
                            }
                        }

                        var tempItem = $('<li>').append($('<div class="main-link">' + block.heading + '</div>')).append(subNavs);
                        submenu.append(tempItem);
                    }
                });
                $('li:first-child', submenu).addClass('active');
                $('.kalei-sheet-submenu', $('[data-sheet="' + that.options.style + '"]')).html(submenu).slideDown(200);
                ////////////NEEDS TO BE EXPORTED TO Menu.js

                $(that.el).html(_.template(stylePageTemplate, {_: _, page: page, config: config}));

                //Colour Coding in code Block
                $(' code').each(function (i, e) {
                    hljs.highlightBlock(e);
                });

                //Fixed by pivanov
                //that.compute_css
                $(".kalei-sheet-submenu li .main-link").on('click', function (ev) {
                    $(".dons-subnav li").removeClass('active');
                    $('html, body').animate({
                        // scrollTop: $(".kalei-comments h2:contains('" + $(ev.currentTarget).text() + "')").offset().top - 12
                        scrollTop: $(".kalei-comments h2").filter(function(){
                            return $(this).text() === $(ev.currentTarget).text();
                        }).offset().top - 12
                    }, 400);
                });

                $(".dons-subnav li").on('click', function (ev) {
                    $(".dons-subnav li").removeClass('active');
                    $(ev.currentTarget).addClass('active');
                    $('html, body').animate({
                        // scrollTop: $(".kalei-comments h3:contains('" + $(ev.currentTarget).text() + "')").offset().top - 12
                        scrollTop: $(".kalei-comments h3").filter(function(){
                            return $(this).text() === $(ev.currentTarget).text();
                        }).offset().top - 12
                    }, 400);
                });

                $(window).scroll(function () {
                    $(".kalei-documentation").each(function () {
                        if (that.is_on_screen($(this), 40)) {
                            $(".kalei-sheet-submenu > ul > li").removeClass('active');
                            var checkThisText = $(this).find('.kalei-comments > h2').text();
                            $(".kalei-sheet-submenu li > .main-link").filter(function(){
                                return $(this).text() === checkThisText;
                            }).parent().addClass('active');
                        }
                    });
                });

                $('.is-dropdown-toggle').click(function(){
                    console.log('clicked ------------------', $(this));
                    $(this).parent().toggleClass('is-open');
                });

                fixie.init();

                firstRun = false;
            },

            is_on_screen: function (el, offset) {

                var win = $(window);

                var viewport = {
                    top: win.scrollTop()
                };

                viewport.bottom = viewport.top + win.height();

                var bounds = el.offset();

                return (!(viewport.top + offset < bounds.top || viewport.top > bounds.bottom));

            },

            // process jscssp output into internal structure
            compute_css: function (stylesheet) {
                console.log("compute_css()", stylesheet)
                var page = {
                    blocks: [],
                    stylesheets: []
                };
                // console.log('stylesheet', stylesheet)
                _.each(stylesheet.cssRules, function (rule) {
                    // console.log('----------------- rule ----------------',rule);
                    switch (rule.type) {
                        case 1: //Standard rule?
                            break;
                        case 3: //Import Rule (@import)
                            //we need to import jsscp doesnt compile imports
                            stylesheet.deleteRule(rule);
                            break;
                        case 101: //Comment Block
                            page.blocks = page.blocks.concat(that.parse_commentblock(rule.parsedCssText));

                            if (page.blocks[0]) {
                                console.log('page.blocks', page.blocks[0].content);
                            }

                            break;
                    }
                });

                return page;
            },

            // process less output into internal structure
            compute_less: function (stylesheet) {
                console.log("compute_less()", stylesheet)
                var page = {
                    blocks: [],
                    stylesheets: []
                };

                _.each(stylesheet.rules, function (rule) {
                    if (rule.silent === false) { //Comment block
                        page.blocks = page.blocks.concat(that.parse_commentblock(rule.value))
                        //page.blocks.push();
                    } else if (rule.rules != null) { //Standard Rule

                    } else if (rule.path != null) { //Import Rule
                        // var previous_heading = page.blocks.length - 1;
                        // if (typeof page.blocks[previous_heading].import_rule == "undefined") {
                        //     page.blocks[previous_heading].import_rule = []
                        // }
                        // page.blocks[previous_heading].import_rule.push(rule.path)

                    }
                });

                return page;
            },

            parse_commentblock: function (comment_block_text) {
                //Remove /* & */
                comment_block_text = comment_block_text.replace(/(?:\/\*)|(?:\*\/)/gi, '');

                console.log('comment_block_text', comment_block_text)


                marked.setOptions(_.extend({sanitize: false, gfm: true}, config.marked_options || {}));
                var lexedCommentblock = marked.lexer(comment_block_text);
                var lexerLinks = lexedCommentblock.links || {}; // lexer appends definition links to returned token object

                var return_val = [];
                var block_def = {
                    content: [],
                    heading: "",
                };
                var block = _.clone(block_def);

                _.each(lexedCommentblock, function (comment) {
                    switch (comment.type) {
                        case "code":
                            //Push the code for an example
                            block.content.push({
                                type: 'html',
                                text: '<div class="codedemo">' + comment.text + '<div style="clear: both;"></div></div>'
                            });
                            //Push the code section so marked can parse it as a <pre><code> block
                            comment.text = comment.text.replace(/class=([""'])fixie\1|(?![""' ])fixie(?=[""' ])/g, "")
                            block.content.push(comment);
                            break;
                        case "heading":
                            if (block.heading != "") {  //Multiple headings in one comment block
                                //We want to break them up
                                //Parse the content blocks and return the HTML to display
                                block.content.links = lexerLinks
                                block.content = marked.parser(block.content)
                                return_val.push(block);
                                block = _.clone(block_def);
                            }
                            if (comment.depth <= 2) {
                                block.heading = comment.text;
                                block.content.push(comment);
                            } else if (comment.depth == 3) { //Import statement title
                                block.stylesheet = comment.text;
                                //block.heading = "Stylesheets"
                                //this is an import statement
                                //if ($.inArray("Stylesheets", ))
                                //console.log("else", comment)
                            }
                            break;
                        default:
                            //Push everything else
                            block.content.push(comment);
                            break;
                    } //Switch
                });

                //Parse the content blocks and return the HTML to display
                block.content.links = lexerLinks
                block.content = marked.parser(block.content)

                if (!block.content.startsWith('<h1>')) {
                    return_val.push(block);
                }


                return return_val;
            }

        });
        return StylePage;
    });
