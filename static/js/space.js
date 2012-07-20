/**
 * 4 dean :)
 * @author Sean Fridman
 */
var fadeInDuration = 500; // Initial fade in.

$(document).ready(function() {
  var world = createStarWorld();
  initTracks(world);
});

function createStarWorld() {
  var numStars = 1; // Initial number of stars
  var spawnRate = 50; // Milliseconds between star spawns
  var stars = []; // All the stars :O
  var size = view.viewSize;
  var center = view.center;
  var mousePos = center.clone();
  var spawnRadius = 100;
  var parallaxFactor = .035;
  var scaleFactor = 1.05;
  var scaleMatrix = getScaleMatrix();
  var fadeDecrement = .05;
  var fps = 24; // Animation frames per second.
  var spf = 1 / fps; // Seconds per frame.
  var starBounds = {};
  var lastSpawn = null; // Time deltas to throttle onFrame
  var lastDraw = null;
  var isRunning = false;

  starBounds.left = 0 - center.x;
  starBounds.right = size.width + center.x;
  starBounds.top = 0 - center.y;
  starBounds.bottom = size.height + center.y;

  onMouseMove = function(e) {
    var e = e.event;
    mousePos = new Point(e.x, e.y);
  }

  function spawnStar() {
      stars.push(new Star());
  }

  onFrame = function(e) {
    if (isRunning && (!lastSpawn || e.time - lastSpawn > spawnRate / 1000)) {
      stars.push(new Star());
      lastSpawn = e.time;
    }

    if (!lastDraw || e.time - lastDraw > spf) {
      for (var i = 0; i < stars.length; i++) {
        (function(i) {
          var star = stars[i];
          star.update();

          if (star.isOutOfBounds()) {
            stars[i].remove();
            stars.splice(i, 1);
          } else if (star.isInYourFace()) {
            star.fadeOut(function() {
              stars[i].remove();
              stars.splice(i, 1);
            });
          }
        })(i)
      }
      lastDraw = e.time;
    }
  };

  onResize = function(e) {
    size = view.viewSize;
    center = new Point(view.center);
    scaleMatrix = getScaleMatrix();
    starBounds.left = 0 - (center.x * parallaxFactor);
    starBounds.right = size.width + (center.x * parallaxFactor);
    starBounds.top = 0 - (center.y * parallaxFactor);
    starBounds.bottom = size.height + (center.y * parallaxFactor);
  };

  var Star = (function() {
    // Star art
    var starPath = new Path.Circle(new Point(0, 0),
        Math.sqrt(1 / Math.PI));
    starPath.fillColor = 'white';
    var starSymbol = new Symbol(starPath);

    var randStartPos = (function() {
      // Radius in center of canvas where points can spawn.
      // Refers to a square radius.
      var pointMin = new Point(center.x - spawnRadius,
          center.y - spawnRadius);
      var pointMax = new Point(center.x + spawnRadius,
          center.y + spawnRadius);
      var pointRange = pointMax - pointMin;

      return function() {
        var pos = Point.random() * pointRange + pointMin;
        if (pos == center) {
          pos = getRandomPos();
        }
        return pos;
      };
    })();

    var getMouseDeltaPan = function() {
      var dx = (center.x - mousePos.x) * parallaxFactor,
        dy = (center.y - mousePos.y) * parallaxFactor;
      return new Matrix(1, 0, 0, 1, dx, dy);
    }

    return Base.extend({
      initialize: function() {
        var star = new Path.Circle(new Point(0, 0), .5);
        star.fillColor = new RgbColor(Math.random(), Math.random(), Math.random());
        star.fillColor = 'rgb(245, 245, 245)';
        var starSymbola = new Symbol(star);
        this.symbol = new PlacedSymbol(starSymbola);
        this.symbol.position = randStartPos();
        this.matrix = this.symbol.matrix.clone();
      },
      update: function() {
        // Resolve position
        this.matrix.preConcatenate(scaleMatrix);
        this.scale = this.matrix.scaleX;
        var transMatrix = this.matrix.clone(),
          panMatrix = getMouseDeltaPan();
        transMatrix.concatenate(panMatrix);
        this.symbol.matrix = transMatrix;

        // Resolve fading
        if (this.isFading) {
          var opacity = this.symbol.opacity - fadeDecrement;
          this.symbol.opacity = opacity > 0 ? opacity : 0;
          if (opacity === 0) {
            $(this).trigger('fadeout:done');
          }
        }
      },
      remove: function() {
        this.symbol.remove();
      },
      fadeOut: function(callback) {
        this.isFading = true;
        $(this).on('fadeout:done', callback);
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
  })();

  function getScaleMatrix() {
    var leftPanTransform = new Matrix(1, 0, 0, 1, -center.x, -center.y),
      rightPanTransform = new Matrix(1, 0, 0, 1, center.x, center.y),
      scaleTransform = new Matrix(scaleFactor, 0, 0, scaleFactor, 0, 0);
    return rightPanTransform
        .concatenate(scaleTransform)
        .concatenate(leftPanTransform);
  }

  // API
  return {
    run: function() {
      isRunning = true;
      for (var i = 0; i < numStars; i++) {
        stars.push(new Star());
      }
    },
    stop: function() {
      isRunning = false;
      var length = stars.length;
      for (var i = 0; i < length; i++) {
        (function(i) {
          var star = stars[i];
          star.fadeOut(function() {
            delete stars[i];
          });
        })(i);
      }
    }
  };
}

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
          console.log(track.id);
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
        world.stop();
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
      $currentTrackLink.removeClass('active');
      world.stop();
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
  console.log(pos, elHeight, windowHeight);
  var xOffset = pos.x;
  var yOffset = windowHeight / 2 - elHeight / 2;

  yOffset = yOffset > minY ? yOffset : minY;
  $el.css({
    'margin-top': yOffset + 'px'
  });
}
