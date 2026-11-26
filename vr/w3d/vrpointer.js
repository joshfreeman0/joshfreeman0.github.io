/* Laser pointing that lands where you aim (Josh, Nov 26).
   1. Lasers ignore anything invisible (hidden menu tabs, the hidden wrist panel, a hidden menu): three.js raycasts hit invisible
      meshes, so before this a hidden button could swallow a click or a teleport, and buttons on other tabs would catch the ray.
   2. 'jf-pointer' on the right controller: a bright dot exactly where the ray meets a button or panel (the A-Frame laser line already
      stops at the first hit), and the button under the dot lights up (brighter + slightly bigger). The trigger then clicks that button
      - A-Frame's cursor sends the click to the hovered element. Panels marked data-blocker stop the ray but do nothing when clicked. */
(function () {
  'use strict';
  const RC = AFRAME.components.raycaster && AFRAME.components.raycaster.Component;
  if (RC && !RC.prototype._jfVis) { RC.prototype._jfVis = true; const orig = RC.prototype.checkIntersections;
    const shown = o => { for (; o; o = o.parent) if (o.visible === false) return false; return true; };
    RC.prototype.checkIntersections = function () {
      const r = this.raycaster;
      if (r && !r._jfVis) { r._jfVis = true; const io = r.intersectObjects.bind(r);
        r.intersectObjects = function (objs, rec, out) { out = io(objs, rec, out); let j = 0; for (let i = 0; i < out.length; i++) if (shown(out[i].object)) out[j++] = out[i]; out.length = j; return out; }; }
      return orig.call(this);
    }; }

  const WHITE = new THREE.Color(1, 1, 1);
  function btnOf(el) { for (let e = el; e && e.tagName !== 'A-SCENE'; e = e.parentNode) if (e.classList && e.classList.contains('btn')) return e; return null; }
  function meshOf(el) { const m = el.getObject3D && el.getObject3D('mesh'); return m && m.material && m.material.color ? m : null; }
  AFRAME.registerComponent('jf-pointer', {
    init: function () {
      const m = this.dot = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshBasicMaterial({color: 0xffffff, depthTest: false, depthWrite: false, transparent: true, fog: false, toneMapped: false}));
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 2.0, 24), new THREE.MeshBasicMaterial({color: 0x111111, depthTest: false, depthWrite: false, transparent: true, opacity: 0.8, side: THREE.DoubleSide, fog: false, toneMapped: false}));
      m.add(ring); this.ring = ring; m.renderOrder = 9999; ring.renderOrder = 9998; m.visible = false; m.frustumCulled = false;
      this.el.sceneEl.object3D.add(m); this.hot = null; this.cp = new THREE.Vector3();
    },
    remove: function () { this.unhover(); this.el.sceneEl.object3D.remove(this.dot); },
    hover: function (b) {
      if (b === this.hot) return; this.unhover(); if (!b || b.dataset.blocker) return; this.hot = b;
      const m = meshOf(b); if (m) { b._jfCol = m.material.color.clone(); m.material.color.lerp(WHITE, 0.45); b._jfSet = m.material.color.clone(); }
      b._jfScale = b.object3D.scale.clone(); b.object3D.scale.multiplyScalar(1.08); },
    unhover: function () { const b = this.hot; if (!b) return; this.hot = null;
      const m = meshOf(b); if (m && b._jfCol && b._jfSet && m.material.color.equals(b._jfSet)) m.material.color.copy(b._jfCol);   // someone recoloured it meanwhile: keep theirs
      if (b._jfScale) b.object3D.scale.copy(b._jfScale); b._jfCol = b._jfSet = b._jfScale = null; },
    tick: function () {
      const sc = this.el.sceneEl, rc = this.el.components.raycaster, o = this.el.object3D;
      const hit = sc.is('vr-mode') && o.visible && rc && rc.intersections && rc.intersections[0];
      if (!hit) { this.dot.visible = false; this.unhover(); return; }
      const cam = sc.camera; if (cam) cam.getWorldPosition(this.cp);
      const d = cam ? this.cp.distanceTo(hit.point) : 1, s = Math.max(0.0035, d * 0.006);
      this.dot.position.copy(hit.point); this.dot.scale.setScalar(s); if (cam) this.dot.lookAt(this.cp); this.dot.visible = true;
      this.hover(btnOf(hit.object.el));
    }
  });
  function attach() { const r = document.querySelector('[laser-controls*="right"]'); if (r && !r.hasAttribute('jf-pointer')) r.setAttribute('jf-pointer', ''); }
  const sc = document.querySelector('a-scene'); if (sc && sc.hasLoaded) attach(); else if (sc) sc.addEventListener('loaded', attach); else document.addEventListener('DOMContentLoaded', attach);
})();
