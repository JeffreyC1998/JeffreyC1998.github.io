/* Interactive globe for the "Journey" section: Guangzhou → Regina → Osaka. */
(function () {
  var card = document.querySelector('.journey');
  if (!card) return;

  var stopEls = Array.prototype.slice.call(card.querySelectorAll('.stop'));
  var stops = stopEls.map(function (el) {
    return { el: el, label: el.dataset.label, coord: [parseFloat(el.dataset.lon), parseFloat(el.dataset.lat)] };
  });
  var lang = document.documentElement.lang || 'en';

  // ---- Distances (great-circle, works even without the globe) ----
  function km(a, b) {
    var r = Math.PI / 180, R = 6371;
    var dLat = (b[1] - a[1]) * r, dLon = (b[0] - a[0]) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function fmt(n) { return (Math.round(n / 100) * 100).toLocaleString(lang); }
  var total = 0;
  for (var i = 1; i < stops.length; i++) {
    var d = km(stops[i - 1].coord, stops[i].coord);
    total += d;
    var leg = stops[i].el.querySelector('.leg');
    if (leg) leg.textContent = '+ ≈ ' + fmt(d) + ' km';
  }
  var totalEl = card.querySelector('.km-total');
  if (totalEl) totalEl.textContent = '≈ ' + fmt(total);

  function setActive(idx) {
    stops.forEach(function (s, j) { s.el.setAttribute('aria-pressed', String(j === idx)); });
    active = idx;
  }
  var active = 0;

  // ---- Globe (needs d3 + topojson from the CDN) ----
  var svgEl = card.querySelector('svg.globe');
  if (!window.d3 || !window.topojson || !svgEl) { card.classList.add('no-globe'); return; }
  var d3 = window.d3;

  fetch('data/land-110m.json')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (topo) { init(window.topojson.feature(topo, topo.objects.land)); })
    .catch(function () { card.classList.add('no-globe'); });

  function init(land) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var proj = d3.geoOrthographic().scale(232).translate([250, 250]).clipAngle(90).precision(0.4);
    var path = d3.geoPath(proj);
    var svg = d3.select(svgEl);

    var defs = svg.append('defs');
    var shine = defs.append('radialGradient').attr('id', 'g-shine').attr('cx', '35%').attr('cy', '28%').attr('r', '75%');
    shine.append('stop').attr('offset', '0%').attr('stop-color', '#fff').attr('stop-opacity', 0.22);
    shine.append('stop').attr('offset', '55%').attr('stop-color', '#fff').attr('stop-opacity', 0);
    shine.append('stop').attr('offset', '100%').attr('stop-color', '#000').attr('stop-opacity', 0.18);

    var sphere = svg.append('path').datum({ type: 'Sphere' }).attr('class', 'g-sphere');
    var grat = svg.append('path').datum(d3.geoGraticule10()).attr('class', 'g-grat');
    var landPath = svg.append('path').datum(land).attr('class', 'g-land');
    svg.append('path').datum({ type: 'Sphere' }).attr('class', 'g-shine').attr('fill', 'url(#g-shine)');

    var legs = [];
    for (var i = 1; i < stops.length; i++) {
      legs.push({
        interp: d3.geoInterpolate(stops[i - 1].coord, stops[i].coord),
        glow: svg.append('path').attr('class', 'g-arc-glow leg-' + i),
        line: svg.append('path').attr('class', 'g-arc leg-' + i),
        t: 0
      });
    }
    var plane = svg.append('circle').attr('class', 'g-plane').attr('r', 4.5).style('display', 'none');

    var pts = stops.map(function (s, j) {
      var g = svg.append('g').attr('class', 'g-pt');
      g.append('circle').attr('class', 'g-pulse').attr('r', 7);
      g.append('circle').attr('class', 'g-dot').attr('r', 6);
      g.append('text').attr('class', 'g-label').attr('x', 11).attr('y', 4).text(s.label);
      g.on('click', function () { focus(j); });
      return g;
    });

    var rot = rotFor(stops[0].coord);

    function rotFor(c) { return [-c[0], -c[1] * 0.7, 0]; }
    function nearest(from, to) {
      while (to - from > 180) to -= 360;
      while (to - from < -180) to += 360;
      return to;
    }
    function legLine(leg) {
      var n = Math.max(2, Math.ceil(80 * leg.t)), coords = [];
      for (var k = 0; k <= n; k++) coords.push(leg.interp(leg.t * k / n));
      return { type: 'LineString', coordinates: coords };
    }

    function render() {
      proj.rotate(rot);
      sphere.attr('d', path);
      grat.attr('d', path);
      landPath.attr('d', path);
      svg.select('.g-shine').attr('d', path);
      legs.forEach(function (leg) {
        var d = leg.t > 0 ? path(legLine(leg)) : null;
        leg.line.attr('d', d);
        leg.glow.attr('d', d);
      });
      var center = [-rot[0], -rot[1]];
      pts.forEach(function (g, j) {
        var c = stops[j].coord;
        var visible = d3.geoDistance(c, center) < Math.PI / 2 - 0.08;
        var p = proj(c);
        g.style('display', visible ? null : 'none')
          .attr('transform', 'translate(' + p[0] + ',' + p[1] + ')')
          .classed('active', j === active);
      });
    }

    // ---- Animation helpers (a new run cancels the previous one) ----
    var token = 0;
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function animate(ms, step, done, my) {
      var start = performance.now();
      (function frame(now) {
        if (my !== token) return;
        var t = Math.min(1, (now - start) / ms);
        if (step) step(t);
        if (t < 1) requestAnimationFrame(frame); else if (done) done();
      })(start);
    }
    function rotateTo(target, ms, my, done, onStep) {
      var from = rot.slice(), to = target.slice();
      to[0] = nearest(from[0], to[0]);
      animate(ms, function (t) {
        var e = ease(t);
        rot = [from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e, 0];
        if (onStep) onStep(t, e);
        render();
      }, done, my);
    }
    function overview() { return [-172, -36, 0]; }

    function tour() {
      var my = ++token;
      legs.forEach(function (l) { l.t = 0; });
      setActive(0);
      rot = rotFor(stops[0].coord);
      render();
      var idx = 0;
      (function next() {
        if (idx >= legs.length) {
          plane.style('display', 'none');
          setTimeout(function () { if (my === token) rotateTo(overview(), 1400, my); }, 500);
          return;
        }
        var leg = legs[idx];
        setTimeout(function () {
          if (my !== token) return;
          rotateTo(rotFor(stops[idx + 1].coord), 2600, my, function () {
            setActive(idx + 1);
            render();
            idx++;
            next();
          }, function (t, e) {
            leg.t = e;
            var p = proj.rotate(rot)(leg.interp(e));
            plane.style('display', null).attr('cx', p[0]).attr('cy', p[1]);
          });
        }, idx === 0 ? 600 : 350);
      })();
    }

    function finishArcs() {
      legs.forEach(function (l) { l.t = 1; });
      plane.style('display', 'none');
    }

    function focus(j) {
      var my = ++token;
      finishArcs();
      setActive(j);
      if (reduce) { rot = rotFor(stops[j].coord); render(); return; }
      rotateTo(rotFor(stops[j].coord), 1100, my);
    }

    stops.forEach(function (s, j) { s.el.addEventListener('click', function () { focus(j); }); });

    var replay = card.querySelector('.replay');
    if (replay) replay.addEventListener('click', function () {
      if (reduce) { finishArcs(); setActive(stops.length - 1); rot = overview(); render(); return; }
      tour();
    });

    // Drag to spin (mouse / pen only, so touch scrolling still works on phones)
    svg.call(d3.drag()
      .filter(function (e) { return !e.touches && !e.button; })
      .on('start', function () { token++; finishArcs(); svg.classed('dragging', true); })
      .on('drag', function (e) {
        rot = [rot[0] + e.dx * 0.32, Math.max(-75, Math.min(75, rot[1] - e.dy * 0.32)), 0];
        render();
      })
      .on('end', function () { svg.classed('dragging', false); }));

    card.classList.add('has-globe');

    if (reduce || !('IntersectionObserver' in window)) {
      finishArcs();
      setActive(stops.length - 1);
      rot = overview();
      render();
      return;
    }
    render();
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); tour(); }
    }, { threshold: 0.35 });
    io.observe(svgEl);
  }
})();
