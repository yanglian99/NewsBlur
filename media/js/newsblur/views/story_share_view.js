NEWSBLUR.Views.StoryShareView = Backbone.View.extend({
    
    events: {
        "click .NB-feed-story-share"            : "toggle_feed_story_share_dialog",
        "click .NB-sideoption-share-save"       : "mark_story_as_shared",
        "click .NB-sideoption-share-unshare"    : "mark_story_as_unshared",
        "click .NB-sideoption-share-crosspost-twitter"  : "toggle_twitter",
        "click .NB-sideoption-share-crosspost-facebook" : "toggle_facebook",
        "click .NB-sideoption-share-crosspost-appdotnet" : "toggle_appdotnet",
        "keyup .NB-sideoption-share-comments"   : "update_share_button_label",
        "keydown .NB-sideoption-share-comments" : "maybe_close"
    },
    
    initialize: function() {
        this.model.story_share_view = this;
    },
    
    render: function() {
        this.$el.html(this.template({
            story: this.model,
            social_services: NEWSBLUR.assets.social_services,
            profile: NEWSBLUR.assets.user_profile
        }));
        
        return this;
    },
    
    template: _.template('\
    <div class="NB-sideoption-share-wrapper">\
        <div class="NB-sideoption-share">\
            <div class="NB-sideoption-share-wordcount"></div>\
            <div class="NB-sideoption-share-title">Comments:</div>\
            <textarea class="NB-sideoption-share-comments"><%= story.get("shared_comments") %></textarea>\
            <% if (!profile.get("private") && \
                   ((social_services.twitter && social_services.twitter.twitter_uid) || \
                    (social_services.facebook && social_services.facebook.facebook_uid) || \
                    (social_services.facebook && social_services.facebook.appdotnet_uid))) { %>\
                <div class="NB-sideoption-share-crosspost">\
                    <% _.each(social_services, function(service, service_name) { %>\
                        <% if (service[service_name+"_uid"]) { %>\
                            <div class="NB-sideoption-share-crosspost-<%= service_name %>"></div>\
                        <% } %>\
                    <% }) %>\
                </div>\
            <% } %>\
            <div class="NB-menu-manage-story-share-save NB-modal-submit-green NB-sideoption-share-save NB-modal-submit-button">Share</div>\
            <div class="NB-menu-manage-story-share-unshare NB-modal-submit-grey NB-sideoption-share-unshare NB-modal-submit-button">Delete share</div>\
        </div>\
    </div>\
    '),
    
    toggle_feed_story_share_dialog: function(options) {
        options = options || {};
        var feed_id = this.model.get('story_feed_id');
        var $sideoption = this.$('.NB-sideoption.NB-feed-story-share');
        var $sideoption_container = this.$('.NB-feed-story-sideoptions-container');
        var $share = this.$('.NB-sideoption-share-wrapper');
        var $story_content = this.$('.NB-feed-story-content,.NB-story-content');
        var $story_wrapper = this.$('.NB-story-content-container');
        var $comment_input = this.$('.NB-sideoption-share-comments');
        var $story_comments = this.$('.NB-feed-story-comments');
        var $unshare_button = this.$('.NB-sideoption-share-unshare');
        var $twitter_button = this.$('.NB-sideoption-share-crosspost-twitter');
        var $facebook_button = this.$('.NB-sideoption-share-crosspost-facebook');
        var $appdotnet_button = this.$('.NB-sideoption-share-crosspost-appdotnet');
        
        if (options.close ||
            ($sideoption.hasClass('NB-active') && !options.resize_open)) {
            // Close
            $share.animate({
                'height': 0
            }, {
                'duration': 300,
                'easing': 'easeInOutQuint',
                'queue': false,
                'complete': _.bind(function() {
                    this.$('.NB-error').remove();
                    if (NEWSBLUR.app.story_list) {
                        NEWSBLUR.app.story_list.fetch_story_locations_in_feed_view();
                    }
                }, this)
            });
            $comment_input.blur();
            $sideoption.removeClass('NB-active');
            if ($story_content.data('original_height')) {
                $story_content.animate({
                    'height': $story_content.data('original_height')
                }, {
                    'duration': 300,
                    'easing': 'easeInOutQuint',
                    'queue': false,
                    'complete': function() {
                        if (NEWSBLUR.app.story_list) {
                            NEWSBLUR.app.story_list.fetch_story_locations_in_feed_view();
                        }
                    }
                });
                $story_content.removeData('original_height');
            }
        } else {
            // Open/resize
            if (!options.resize_open) {
                this.$('.NB-error').remove();
            }
            $sideoption.addClass('NB-active');
            $unshare_button.toggleClass('NB-hidden', !this.model.get("shared"));
            $twitter_button.removeClass('NB-active');
            $facebook_button.removeClass('NB-active');
            $appdotnet_button.removeClass('NB-active');
            this.update_share_button_label();
            
            var $share_clone = $share.clone();
            var dialog_height = $share_clone.css({
                'height': 'auto',
                'position': 'absolute',
                'visibility': 'hidden'
            }).appendTo($share.parent()).height();
            $share_clone.remove();

            if (options.animate_scroll) {
                var $scroll_container = NEWSBLUR.reader.$s.$story_titles;
                if (_.contains(['split', 'full'], NEWSBLUR.assets.preference('story_layout'))) {
                    $scroll_container = this.model.latest_story_detail_view.$el.parent();
                }
                $scroll_container.stop().scrollTo(this.$el, {
                    duration: 600,
                    queue: false,
                    easing: 'easeInOutQuint',
                    offset: this.model.latest_story_detail_view.$el.height() -
                            $scroll_container.height()
                });
            }
            $share.animate({
                'height': dialog_height
            }, {
                'duration': options.immediate ? 0 : 350,
                'easing': 'easeInOutQuint',
                'queue': false,
                'complete': _.bind(function() {
                    if ($comment_input.length == 1) {
                        $comment_input.focus();
                    }
                    if (NEWSBLUR.app.story_list) {
                        NEWSBLUR.app.story_list.fetch_story_locations_in_feed_view();
                    }

                }, this)
            });
            
            var sideoptions_height  = $sideoption_container.outerHeight(true);
            var wrapper_height      = $story_wrapper.height();
            var content_height      = $story_content.height();
            var content_outerheight = $story_content.outerHeight(true);
            var comments_height     = $story_comments.outerHeight(true);
            var container_offset    = $sideoption_container.length &&
                                      ($sideoption_container.position().top - 32);
            
            if (content_outerheight + comments_height < sideoptions_height) {
                $story_content.css('height', $sideoption_container.height());
                $story_content.animate({
                    'height': sideoptions_height + dialog_height - comments_height
                }, {
                    'duration': 350,
                    'easing': 'easeInOutQuint',
                    'queue': false,
                    'complete': function() {
                        if (NEWSBLUR.app.story_list) {
                            NEWSBLUR.app.story_list.fetch_story_locations_in_feed_view();
                        }
                    }
                }).data('original_height', content_height);
            } else if (sideoptions_height + dialog_height > wrapper_height) {
                $story_content.animate({
                    'height': content_height + dialog_height - container_offset
                }, {
                    'duration': 350,
                    'easing': 'easeInOutQuint',
                    'queue': false,
                    'complete': function() {
                        if (NEWSBLUR.app.story_list) {
                            NEWSBLUR.app.story_list.fetch_story_locations_in_feed_view();
                        }
                    }
                }).data('original_height', content_height);
            } else if (NEWSBLUR.app.story_list) {
                NEWSBLUR.app.story_list.fetch_story_locations_in_feed_view();
            }
            var share = _.bind(function(e) {
                e.preventDefault();
                this.mark_story_as_shared({'source': 'sideoption'});
            }, this);
            var $comments = $('.NB-sideoption-share-comments', $share);
            $comments.unbind('keydown.story_share')
                     .bind('keydown.story_share', 'ctrl+return', share)
                     .bind('keydown.story_share', 'meta+return', share);
        }
    },
    
    mark_story_as_shared: function(options) {
        options = options || {};
        var $share_button = this.$('.NB-sideoption-share-save');
        var $share_button_menu = $('.NB-menu-manage .NB-menu-manage-story-share-save');
        var $share_menu = $share_button_menu.closest('.NB-sideoption-share');
        var $twitter_button = this.$('.NB-sideoption-share-crosspost-twitter');
        var $facebook_button = this.$('.NB-sideoption-share-crosspost-facebook');
        var $appdotnet_button = this.$('.NB-sideoption-share-crosspost-appdotnet');
        var $comments_sideoptions = this.$('.NB-sideoption-share-comments');
        var $comments_menu = $('.NB-sideoption-share-comments', $share_menu);
        var comments = _.string.trim((options.source == 'menu' ? $comments_menu : $comments_sideoptions).val());
        if (this.options.on_social_page) {
            var source_user_id = NEWSBLUR.Globals.blurblog_user_id;
        } else if (_.contains(['river:blurblogs', 'river:global'], NEWSBLUR.reader.active_feed)) {
            var friends = this.model.get('friend_user_ids');
            var source_user_id = friends && friends[0];
        } else {
            var feed = NEWSBLUR.assets.get_feed(NEWSBLUR.reader.active_feed);
            var source_user_id = feed && feed.get('user_id');
        }
        var post_to_services = _.compact([
            $twitter_button.hasClass('NB-active') && 'twitter',
            $facebook_button.hasClass('NB-active') && 'facebook',
            $appdotnet_button.hasClass('NB-active') && 'appdotnet'
        ]);
        
        $share_button.addClass('NB-saving').addClass('NB-disabled').text('Sharing...');
        $share_button_menu.addClass('NB-saving').addClass('NB-disabled').text('Sharing...');
        
        var data = {
            story_id: this.model.id, 
            story_feed_id: this.model.get('story_feed_id'), 
            comments: comments,
            source_user_id: source_user_id,
            relative_user_id: NEWSBLUR.Globals.blurblog_user_id,
            post_to_services: post_to_services
        };
        NEWSBLUR.assets.mark_story_as_shared(data, _.bind(this.post_share_story, this, true), _.bind(function(data) {
            this.post_share_error(data, true);
        }, this));
        
        if (NEWSBLUR.reader) {
            NEWSBLUR.reader.blur_to_page();
        }
    },
    
    mark_story_as_unshared: function(options) {
        options = options || {};
        var $unshare_button = this.$('.NB-sideoption-share-unshare');
        var $unshare_button_menu = $('.NB-menu-manage-story-share-unshare');
        var $share_menu = $unshare_button_menu.closest('.NB-sideoption-share');

        $unshare_button.addClass('NB-saving').addClass('NB-disabled').text('Deleting...');
        var params = {
            story_id: this.model.id, 
            story_feed_id: this.model.get('story_feed_id'),
            relative_user_id: NEWSBLUR.Globals.blurblog_user_id
        };
        NEWSBLUR.assets.mark_story_as_unshared(params, _.bind(this.post_share_story, this, false), _.bind(function(data) {
            this.post_share_error(data, false);
        }, this));
        
        if (NEWSBLUR.reader) {
            NEWSBLUR.reader.blur_to_page();
        }
    },
    
    post_share_story: function(shared, data) {
        this.model.set("shared", shared);
        this.model.trigger('change:comments', data);
        
        var $share_star = this.model.story_title_view && this.model.story_title_view.$('.NB-storytitles-share');
        var $share_button = this.$('.NB-sideoption-share-save');
        var $unshare_button = this.$('.NB-sideoption-share-unshare');
        var $share_sideoption = this.$('.NB-feed-story-share .NB-sideoption-title');
        var $comments_sideoptions = this.$('.NB-sideoption-share-comments');
        var shared_text = this.model.get('shared') ? 'Shared' : 'Unshared';
        
        this.toggle_feed_story_share_dialog({'close': true});
        $share_button.removeClass('NB-saving').removeClass('NB-disabled').text('Share');
        $unshare_button.removeClass('NB-saving').removeClass('NB-disabled').text('Delete Share');
        $share_sideoption.text(shared_text).closest('.NB-sideoption');
        $comments_sideoptions.val(this.model.get('shared_comments'));
        
        if (this.options.on_social_page) {
            this.model.social_page_story.$el.toggleClass('NB-story-shared', this.model.get('shared'));
            this.model.social_page_story.replace_shares_and_comments(data);
        } else {
            NEWSBLUR.reader.hide_confirm_story_share_menu_item(true);
        }
        
        if (this.model.get('shared') && $share_star) {
            $share_star.attr({'title': shared_text + '!'});
            $share_star.tipsy({
                gravity: 'sw',
                fade: true,
                trigger: 'manual',
                offsetOpposite: -1
            });
            var tipsy = $share_star.data('tipsy');
            tipsy.enable();
            tipsy.show();

            _.delay(function() {
                if (tipsy.enabled) {
                    tipsy.hide();
                    tipsy.disable();
                }
            }, 850);
        }
        
        if (NEWSBLUR.app.story_list) {
            NEWSBLUR.app.story_list.fetch_story_locations_in_feed_view();
        }
    },
    
    post_share_error: function(data, shared) {
        var $share_button = this.$('.NB-sideoption-share-save');
        var $unshare_button = this.$('.NB-sideoption-share-unshare');
        var $share_button_menu = $('.NB-menu-manage .NB-menu-manage-story-share-save');
        var message = data && data.message || ("Sorry, this story could not be " + (shared ? "" : "un") + "shared. Probably a bug.");
        
        if (!NEWSBLUR.Globals.is_authenticated) {
            message = "You need to be logged in to share a story.";
        }
        var $error = $.make('div', { className: 'NB-error' }, message);
        
        $share_button.removeClass('NB-saving').removeClass('NB-disabled').text('Share');
        $unshare_button.removeClass('NB-saving').removeClass('NB-disabled').text('Delete Share');
        $share_button.siblings('.NB-error').remove();
        $share_button.after($error);
        
        if ($share_button_menu.length) {
            $share_button_menu.removeClass('NB-disabled').text('Share');
            $share_button_menu.siblings('.NB-error').remove();
            $share_button_menu.after($error.clone());
        }
        this.toggle_feed_story_share_dialog({'resize_open': true});
        NEWSBLUR.log(["post_share_error", data, shared, message, $share_button, $unshare_button, $share_button_menu, $error]);
    },
    
    update_share_button_label: function() {
        var $share = this.$('.NB-sideoption-share');
        var $comment_input = this.$('.NB-sideoption-share-comments');
        var $share_button = this.$('.NB-sideoption-share-save,.NB-menu-manage-story-share-save');
        
        $share_button.removeClass('NB-saving').removeClass('NB-disabled');
        
        if (!_.string.isBlank($comment_input.val())) {
            $share_button.text('Share with comment');
        } else {
            $share_button.text('Share');
        }
    },
    
    count_selected_words_when_sharing_story: function($feed_story) {
        var $wordcount = $('.NB-sideoption-share-wordcount', $feed_story);
        
    },
    
    toggle_twitter: function() {
        var $twitter_button = this.$('.NB-sideoption-share-crosspost-twitter');
        
        $twitter_button.toggleClass('NB-active', !$twitter_button.hasClass('NB-active'));
    },
    
    toggle_facebook: function() {
        var $facebook_button = this.$('.NB-sideoption-share-crosspost-facebook');
        
        $facebook_button.toggleClass('NB-active', !$facebook_button.hasClass('NB-active'));
    },
    
    toggle_appdotnet: function() {
        var $appdotnet_button = this.$('.NB-sideoption-share-crosspost-appdotnet');
        
        $appdotnet_button.toggleClass('NB-active', !$appdotnet_button.hasClass('NB-active'));
    },
    
    maybe_close: function(e) {
        if (e.which == 27) {
            e.preventDefault();
            e.stopPropagation();
            this.toggle_feed_story_share_dialog({close: true});
            return false;
        }
    }
    
        
});