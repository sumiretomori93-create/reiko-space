# Reiko's Abyss contact arm

`reiko-arm.blend` is the editable Blender 4.3 source: a tapered mesh, two staggered rows of closed concave cups, vertex color materials, a contact bend shape key, area lights and a preview camera. No photographic texture is used.

From the repository root:

```sh
blender -b --python tools/blender/build-hand.py
blender -b --python tools/blender/render-hand-frames.py
```

The first script exports the straight mesh as `public/reiko-assets/abyss/hand-3d/reiko-arm.glb`. The second renders 24 transparent contact poses into `/workspace/scratch/reiko-hand-render-frames`. Combine them into an 8-column by 3-row WebP atlas with 1024 by 384 pixel tiles, preserving alpha, at `public/reiko-assets/abyss/hand-3d/contact-atlas.webp`.

The website uses a dynamically imported Three.js renderer. Its vertex shader bends actual geometry along a cubic curve and rotates surface normals with it, so lighting follows the pose. Browsers without WebGL use complete Blender-rendered frames. Both retain horizontal left/right entry, the existing native scrolling behavior, and the separate light-tap jellyfish interaction. Reduced-motion users bypass the decorative interaction.

Validation: Blender mesh export and transparent renders; TypeScript; production build; browser hold/release and tap regression on the Blender-frame path. The QA browser has WebGL disabled, so the realtime WebGL branch and physical-phone drag behavior remain unverified. This is a draft visual prototype, not a published theme.
