/**
 * 4 dean :)
 * @author Sean Fridman
 */
var fadeInDuration = 500; // Content fade in duration.

var createStarWorld = function() {
  var initialStars = 1;
  var spawnRate = 50; // Milliseconds between star spawns
  var starGroup = null;
  var size = view.viewSize;
  var center = view.center;
  var mousePos = center.clone();
  var spawnRadius = 200;
  var parallaxFactor = .035;
  var scaleFactor = 1.02;
  var fadeDecrement = .05;
  var fps = 50; // Animation frames per second.
  var spf = 1 / fps; // Seconds per frame.
  var lastSpawn = null; // Time deltas to throttle onFrame
  var lastDraw = null;
  var isRunning = false;


  onMouseMove = function(e) {
    var e = e.event;
    mousePos = new Point(e.x, e.y);
  };

  onFrame = function(e) {
    if (isRunning) {
      if (!lastSpawn || e.time - lastSpawn > spawnRate / 1000) {
        starGroup.spawnStar();
        lastSpawn = e.time;
      }
      if (!lastDraw || e.time - lastDraw > spf) {
        starGroup.update();
      }
    }
  };

  onResize = function(e) {
    size = view.viewSize;
    center = new Point(view.center);
    Star.updateBounds();
  };

  var StarGroup = (function() {
    return Base.extend({
      initialize: function() {
        this.stars = [];
        this.group = new Group();
      },
      fadeOut: function(callback) {
        this.isFading = true;
        $(this).on('fadeout', _.bind(function() {
          this.reset();
          callback();
        }, this));
      },
      fadeStep: function() {
        this.group.opacity -= fadeDecrement;
        if (this.group.opacity <= 0) {
          this.group.opacity = 0;
          $(this).trigger('fadeout');
        }
      },
      reset: function() {
        this.group.opacity = 1;
        this.isFading = false;
        this.stars = [];
        this.group.removeChildren();
      },
      spawnStar: function() {
        var star = new Star();
        this.stars.push(star);
        this.group.addChild(star.symbol);
      },
      removeStar: function(star) {
        star.remove();
        this.stars = _.reject(this.stars, function(_star) {
          return star.id === _star.id;
        });
      },
      fadeStar: function(star) {
        var removeStar = _.bind(this.removeStar, this);
        star.fadeOut(function() {
          removeStar(star);
        });
      },
      checkBounds: function(star) {
        if (star.isOutOfBounds()) {
          this.removeStar(star);
        } else if (star.isInYourFace()) {
          this.fadeStar(star);
        }
      },
      update: function() {
        this.group.scale(scaleFactor, center);
        if (this.isFading) {
          this.fadeStep();
        }
        _.each(this.stars, function(star) {
          star.update();
          this.checkBounds(star);
        }, this);
        console.log(this.group.children.length, this.stars.length);
      }
    });
  })();

  var Star = (function() {
    var starPath = new Path.Circle(new Point(0, 0),
        Math.sqrt(1 / Math.PI));
    starPath.fillColor = 'white';
    var starSymbol = new Symbol(starPath);

    var starBounds = new Rectangle(0 - center.x, 0 - center.y,
        size.width + center.x, size.height + center.y);

    var getRandomStartPos = function() {
      var pointMin = new Point(center.x - spawnRadius,
          center.y - spawnRadius);
      var pointMax = new Point(center.x + spawnRadius,
          center.y + spawnRadius);
      var pointRange = pointMax - pointMin;
      var pos = Point.random() * pointRange + pointMin;
      if (pos == center) {
        pos = getRandomStartPos();
      }
      return pos;
    };

    var getMouseDeltaPan = function() {
      var dx = (center.x - mousePos.x) * parallaxFactor,
        dy = (center.y - mousePos.y) * parallaxFactor;
      return new Matrix(1, 0, 0, 1, dx, dy);
    }

    var Star = Base.extend({
      initialize: function() {
        this.symbol = new PlacedSymbol(starSymbol);
        this.symbol.position = getRandomStartPos();
        this.id = this.symbol.id;
      },
      update: function() {
        if (this.isFading) {
          this.fadeStep();
        }
      },
      remove: function() {
        return this.symbol.remove();
      },
      fadeOut: function(callback) {
        console.log('fade out star!');
        this.isFading = true;
        $(this).on('fadeout', callback);
      },
      fadeStep: function() {
        this.symbol.opacity -= fadeDecrement;
        if (this.symbol.opacity <= 0) {
          this.symbol.opacity = 0;
          $(this).trigger('fadeout');
        }
      },
      isOutOfBounds: function() {
        var bounds = this.symbol.bounds;
        return bounds.right < starBounds.left ||
            bounds.left > starBounds.right ||
            bounds.bottom < starBounds.top ||
            bounds.top > starBounds.bottom;
      },
      isInYourFace: function() {
        var bounds = this.symbol.bounds;
        return (bounds.left < 0 && bounds.right > size.width) ||
            (bounds.top < 0 && bounds.bottom > size.height);
      }
    });

    Star.updateBounds = function() {
      starBounds = new Rectangle(0 - center.x, 0 - center.y,
        size.width + center.x, size.height + center.y);
    };

    return Star;
  })();

  // Initialize + return API
  starGroup = new StarGroup();
  return {
    run: function() {
      if (!isRunning) {
        console.log('run!');
        isRunning = true;
        for (var i = 0; i < initialStars; i++) {
          starGroup.spawnStar();
        }
      }
    },
    stop: function() {
      if (isRunning) {
        console.log('stop!');
        starGroup.fadeOut(function() {
          isRunning = false;
          console.log('fadeout callback', isRunning);
        });
      }
    }
  }
};

function initTracks(world) {
  var clientId = 'a2fa3d6c0a1b528e51fa12143f86444f';
  var redirectUrl = 'www.deanfridman.com';
  var scUsername = 'degobah';
  var baseRequest = 'http://api.soundcloud.com';
  var userTracksRequest = appendClientId(baseRequest + '/users/'+ scUsername + '/tracks.json');
  var baseTrackRequest = baseRequest + '/tracks/';
  var trackExceptions = [52186394];
  var $trackEl = $('.tracks');
  var widget = SC.Widget($('iframe')[0]);
  var currentTrackId = null;
  var $currentTrackLink = null;
  var preloaderSelector = '.tracks a.active:before';

  $.ajaxSetup({
    dataType: 'jsonp'
  });

  widget.bind(SC.Widget.Events.READY, function() {


    fetchTracks(function(trackData) {
      $.each(trackData, function(i, track) {
        // Don't include certain tracks cuz THEY SUCK
        if ($.inArray(track.id, trackExceptions) === -1) {
          var $li = $('<li></li>');
          var $link = $('<a href=""></a>');
          $link.attr({
            id: track.id
          });
          $link.html(track.title);
          $li.append($link);
          $trackEl.append($li);
        }
      });

      $('.tracks li a').on('click', function(e) {
        e.preventDefault();
      });
      $('.tracks li a').on('click', onClickTrack);
      // Show stuff after loaded
      $('aside').css('visibility', 'visible')
          .animate({opacity: 1}, fadeInDuration);
    });


    function onClickTrack(e) {
      var $currentTarget = $(e.currentTarget);
      var isActive = $currentTarget.hasClass('active');
      var id = e.currentTarget.id;

      world.stop();
      $('.tracks a').each(function(i, link) {
        $(link).removeClass('active');
      });

      if (isActive) {
        $currentTarget.removeClass('active loading');
        widget.pause();
      } else {
        $currentTrackLink = $currentTarget;
        $currentTarget.addClass('active loading');
        if (currentTrackId == id) {
          playActiveTrack();
        } else {
          currentTrackId = id;
          loadTrackInPlayer(id, function() {
            playActiveTrack();
          });
        }
      }

      function playActiveTrack() {
        $currentTarget.addClass('loading');
        // Don't play if we paused while loading.
        if ($currentTarget.hasClass('active')) {
          // Play actually starts the loading...
          widget.play();
          widget.bind(SC.Widget.Events.PLAY_PROGRESS, function(e) {
            // First LOAD_PROGRESS trigger signifies start of song
            widget.unbind(SC.Widget.Events.PLAY_PROGRESS);
            world.run();
            $currentTarget.removeClass('loading');
          });
        } else {
          $currentTarget.removeClass('loading');
        }
      }
    }

    function onClickActiveTrack(e) {
    }

    widget.bind(SC.Widget.Events.FINISH, function(e) {
      world.stop();
      $currentTrackLink.removeClass('active');
      var $nextTrackLi = $currentTrackLink.parent().next();
      if ($nextTrackLi.length) {
        $nextTrackLi.children('a').trigger('click');
      }
    });
  });

  function loadTrackInPlayer(id, callback) {
    widget.load(createTrackRequest(id), {
      callback: callback
    });
  }

  function fetchTracks(callback) {
    $.ajax(userTracksRequest, {
      success: callback,
      error: function(e) {
        console.log('error!!!! :O', e.message, e.trace);
      }
    });
  }

  function createTrackRequest(id) {
    return appendClientId(baseTrackRequest + id + '.json');
  }

  function appendClientId(request) {
    if (!request.match(/\?/)) {
      request += '?client_id=' + clientId;
    } else {
      request += '&client_id=' + clientId;
    }
    return request;
  }
}

function centerContent() {
  var minY = 16;
  var $el = $('aside');
  var elHeight = $el.outerHeight();
  var windowHeight = $(document).height();
  var pos = $el.offset();
  var xOffset = pos.x;
  var yOffset = windowHeight / 2 - elHeight / 2;

  yOffset = yOffset > minY ? yOffset : minY;
  $el.css({
    'margin-top': yOffset + 'px'
  });
}

/* RUN CODE */
$(document).ready(function() {
  try {
    var world = createStarWorld();
    console.log(world)
    initTracks(world);
  } catch (e) {
    console.log(e.message, e.trace);
  }
});

