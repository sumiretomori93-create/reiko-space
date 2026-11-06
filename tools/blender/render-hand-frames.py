"""Render the same editable 3D model into a transparent compatibility atlas."""
import bpy,math,os
from mathutils import Vector
ROOT=os.getcwd();bpy.ops.wm.open_mainfile(filepath=ROOT+'/tools/blender/reiko-arm.blend')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=False
scene.render.resolution_x=1024;scene.render.resolution_y=384;scene.render.resolution_percentage=100
scene.render.film_transparent=True;scene.render.image_settings.color_mode='RGBA'
scene.camera.location=(5,0,12);scene.camera.rotation_euler=(Vector((5,0,0))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
arm=bpy.data.objects['Reiko arm / real cups'];key=arm.data.shape_keys.key_blocks['Gentle contact']
OUT='/workspace/scratch/reiko-hand-render-frames';os.makedirs(OUT,exist_ok=True)
for i in range(24):
 t=i/23;key.value=t;arm.rotation_euler.x=.22*t
 scene.render.filepath=OUT+'/%02d.png'%i;bpy.ops.render.render(write_still=True)
print('FRAME_RENDER_COMPLETE')
