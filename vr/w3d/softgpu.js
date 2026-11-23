/* Desktop lag (bug batch): profiling under a software GPU showed per-frame JS under 1 ms of every ~1.2 s frame - the time is spent
   rasterising ~1M triangles plus the sun's shadow pass on the CPU. On a software renderer (SwiftShader / llvmpipe, e.g. a VM, remote
   desktop or a machine with GPU acceleration off) turn the shadow pass off and render at a lower pixel ratio so input keeps up.
   Real GPUs and headsets are untouched. */
(function () {
  function go() { const sc = document.querySelector('a-scene'); if (!sc || !sc.renderer) return setTimeout(go, 200);
    const r = sc.renderer, gl = r.getContext(); let name = '';
    try { const ext = gl.getExtension('WEBGL_debug_renderer_info'); name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) {}
    if (!/swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(name)) return;
    window.W3D = window.W3D || {}; W3D.softGPU = name;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 0.6));
    // world.js switches shadows on while it builds, so turn them off once the world is ready and recompile the materials once
    const off = () => { if (!window.W3D_READY) return setTimeout(off, 500); r.shadowMap.enabled = false; r.shadowMap.autoUpdate = false;
      sc.object3D.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); }); };
    off();
    console.log('softgpu: software renderer (' + name.slice(0, 60) + ') - shadows off, pixel ratio 0.6'); }
  go();
})();
