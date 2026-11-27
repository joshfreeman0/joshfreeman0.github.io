/* xrhold.js - hold a Quest in-VR hand-off session from the very first moment of page load (Fowling Pond and /vr/mars/).
   Quest Browser carries an immersive session across a SAME-ORIGIN navigation: the new page gets navigator.xr 'sessiongranted'
   and has a short window (about 5 s) to call requestSession and start submitting frames, or the compositor ends the session
   and drops you to Meta Home. Both of our destination pages are heavy (A-Frame world / Red Planet Lounge), so waiting for the
   engine missed that window. Load this as the FIRST script: on sessiongranted it requests the session at once, draws black
   frames to keep it alive, and gives that same session to the engine when the engine calls requestSession('immersive-vr').
   data-features on the script tag = the engine's own session features (JSON). window.JFXR exposes state for the page. */
(function () {
  var me = document.currentScript, feats = {};
  try { feats = JSON.parse(me && me.dataset.features || '{}'); } catch (e) {}
  var X = navigator.xr, H = window.JFXR = { granted: false, pending: null, session: null, handed: false, frames: 0, log: [], waiters: [] };
  function log(m) { H.log.push(Math.round(performance.now()) + ' ' + m); try { console.log('xr: ' + m); } catch (e) {} }
  H.whenFrames = function (n, cb) { H.waiters.push([n, cb]); check(); };
  function check() { H.waiters = H.waiters.filter(function (w) { if (H.frames >= w[0] || H.handed || (!H.pending && H.granted)) { try { w[1](); } catch (e) {} return false; } return true; }); }
  if (!X || !X.requestSession || !X.addEventListener) return;
  var origReq = X.requestSession.bind(X), raf = 0;
  function keepAlive(s) {
    try {
      var c = document.createElement('canvas'), gl = c.getContext('webgl2', { xrCompatible: true, alpha: false }) || c.getContext('webgl', { xrCompatible: true });
      var bind = null, proj = null, fb = gl.createFramebuffer(), ref = null;
      if (s.renderState.layers !== undefined && window.XRWebGLBinding) { bind = new XRWebGLBinding(s, gl); proj = bind.createProjectionLayer({}); s.updateRenderState({ layers: [proj] }); }
      else s.updateRenderState({ baseLayer: new XRWebGLLayer(s, gl) });
      s.requestReferenceSpace('local').then(function (r) { ref = r; });
      var tick = function (t, f) {
        if (H.handed) return; raf = s.requestAnimationFrame(tick);
        gl.clearColor(0, 0, 0, 1);
        if (proj) { var pose = ref && f.getViewerPose(ref); if (!pose) return; gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
          for (var i = 0; i < pose.views.length; i++) { var sub = bind.getViewSubImage(proj, pose.views[i]);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sub.colorTexture, 0);
            var v = sub.viewport; gl.viewport(v.x, v.y, v.width, v.height); gl.clear(gl.COLOR_BUFFER_BIT); } }
        else { gl.bindFramebuffer(gl.FRAMEBUFFER, s.renderState.baseLayer.framebuffer); gl.clear(gl.COLOR_BUFFER_BIT); }
        H.frames++; if (H.waiters.length) check();
      };
      raf = s.requestAnimationFrame(tick); log('keep-alive on (' + (proj ? 'projection layer' : 'baseLayer') + ')');
      setTimeout(function () { if (!H.handed && H.session === s) { log('engine never took the session; ending it'); try { s.end(); } catch (e) {} } }, 45000);
    } catch (e) { log('keep-alive failed: ' + e); }
  }
  X.addEventListener('sessiongranted', function (ev) {
    if (ev && ev.jfResent) return; if (H.granted) return; H.granted = true; window.JFVR_GRANTED = true; log('sessiongranted');
    H.pending = origReq('immersive-vr', feats).then(function (s) {
      H.session = s; log('session live');
      s.addEventListener('end', function () { log('session ended'); if (H.session === s) { H.session = null; H.pending = null; check(); } });
      if (!H.handed) keepAlive(s); return s;
    }, function (e) { log('requestSession failed: ' + e); H.pending = null; check(); throw e; });
    H.pending.catch(function () {});
  });
  X.requestSession = function (mode, init) {
    if (mode === 'immersive-vr' && H.pending && !H.handed) {
      H.handed = true; log('handing session to the engine'); check();
      return H.pending.then(function (s) { if (raf) try { s.cancelAnimationFrame(raf); } catch (e) {} return s; });
    }
    return origReq(mode, init);
  };
})();
