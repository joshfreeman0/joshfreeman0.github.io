/* HD rendering helpers for Josh's VR World.
   - hd-renderer (on <a-scene>): renders the headset view at a higher resolution
     (WebXR framebuffer scale) and turns off foveated (blurry-edge) rendering.
   - hd-sky (on an entity): a high-resolution 360 photo sphere with sharp texture
     filtering; switch scenes with el.setAttribute('hd-sky','src','file.jpg').
     Frees the previous photo from GPU memory on each switch (Quest-friendly). */
AFRAME.registerComponent('hd-renderer', {
  schema: { scale: {default: 1.3} },
  init: function () {
    const apply = () => {
      const r = this.el.renderer; if (!r) return;
      try { r.xr.setFramebufferScaleFactor(this.data.scale); } catch (e) {}
      try { r.xr.setFoveation(0); } catch (e) {}
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };
    if (this.el.renderer) apply(); else this.el.addEventListener('renderstart', apply);
    this.el.addEventListener('enter-vr', () => { try { this.el.renderer.xr.setFoveation(0); } catch (e) {} });
  }
});
AFRAME.registerComponent('hd-sky', {
  schema: { src: {type: 'string'}, radius: {default: 500}, yaw: {default: -90} },
  init: function () {
    const geo = new THREE.SphereGeometry(this.data.radius, 160, 96);
    geo.scale(-1, 1, 1);
    this.mat = new THREE.MeshBasicMaterial({color: 0xffffff, depthWrite: false, fog: false});
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.renderOrder = -1000;
    this.mesh.rotation.y = THREE.MathUtils.degToRad(this.data.yaw);
    this.el.setObject3D('mesh', this.mesh);
    this.loader = new THREE.TextureLoader(); this.loader.setCrossOrigin('anonymous');
    this.cache = {};
  },
  update: function (old) {
    if (this.data.src && this.data.src !== old.src) this.load(this.data.src);
  },
  load: function (src) {
    const want = src;
    this.el.emit('hd-sky-loading', {src});
    this.loader.load(src, tex => {
      if (this.data.src !== want) { tex.dispose(); return; }
      const r = this.el.sceneEl.renderer;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = r ? r.capabilities.getMaxAnisotropy() : 16;
      tex.generateMipmaps = false;           // no mipmap blur
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.RepeatWrapping;       // seamless at 0/360
      const prev = this.mat.map;
      this.mat.map = tex; this.mat.needsUpdate = true;
      if (prev) prev.dispose();
      this.el.emit('hd-sky-loaded', {src});
    });
  },
  remove: function () { if (this.mat.map) this.mat.map.dispose(); this.mesh.geometry.dispose(); this.mat.dispose(); this.el.removeObject3D('mesh'); }
});
