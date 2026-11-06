"""Blender 4.3: reproducible real-geometry arm, PBR materials and GLB.
Run from repository root: blender -b --python tools/blender/build-hand.py
"""
import bpy, math, os
from mathutils import Vector, noise
from math import sin,cos,pi
bpy.context.preferences.filepaths.save_version=0
ROOT=os.getcwd(); OUT=os.path.join(ROOT,'public/reiko-assets/abyss/hand-3d')
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
verts=[];faces=[];mats=[];colors=[]
def color(p,inner=False):
    n=noise.noise_vector(Vector(p)*8)[0]*.5+.5
    if inner:return (.018+n*.023,.012+n*.012,.040+n*.035,1)
    m=noise.noise_vector(Vector(p)*2.8)[1]*.5+.5
    return (.008+n*.018,.023+n*.022,.040+m*.042,1)
def vertex(p,inner=False):
    verts.append(tuple(p));colors.append(color(p,inner));return len(verts)-1
# Skin is a real tapered tube with tiny irregularities, not a billboard.
N=128; R=40; L=10
for i in range(N+1):
    t=i/N;x=L*t;r=.74*(1-t)**1.18+.012
    for j in range(R):
        a=2*pi*j/R
        p=Vector((x,r*cos(a),r*sin(a)))
        d=noise.noise_vector(p*36)[0]*.009+noise.noise_vector(p*11)[1]*.012
        rr=max(.006,r+d*(1-t))
        vertex((x,rr*cos(a),rr*sin(a)))
for i in range(N):
 for j in range(R):
    a=i*R+j;b=i*R+(j+1)%R;c=(i+1)*R+(j+1)%R;d=(i+1)*R+j
    faces.append((a,b,c,d));mats.append(0)
faces.extend([tuple(range(R-1,-1,-1)),tuple(N*R+j for j in range(R))]);mats.extend([0,0])
# Two staggered rows. Profile runs from the planted neck over a fleshy lip,
# down into a CLOSED concave bowl. No torus holes through the arm.
profile=[(.44,0),(.58,.18),(.82,.48),(1,.7),(1.02,.83),(.94,.94),(.80,.85),(.60,.53),(.30,.36),(.035,.31)]
for row,theta in enumerate((pi/2-.58,pi/2+.58)):
 for k in range(26):
    t=(k+.45+row*.42)/27
    x=L*(1-(1-t)**1.48)
    r=.74*(1-x/L)**1.18+.012
    cr=r*.43
    normal=Vector((0,cos(theta),sin(theta)));cross=Vector((0,-sin(theta),cos(theta)));axis=Vector((1,0,0))
    origin=Vector((x,r*cos(theta),r*sin(theta)))
    rings=[]
    for pidx,(width,h) in enumerate(profile):
      ring=[]
      for j in range(28):
        a=2*pi*j/28
        wav=1+.025*cos(a*7+k*.9)
        p=origin+normal*(h*cr*.62)+axis*(cos(a)*cr*width*wav)+cross*(sin(a)*cr*width*wav)
        ring.append(vertex(p,pidx>=5))
      rings.append(ring)
    for n in range(len(rings)-1):
      for j in range(28):
        faces.append((rings[n][j],rings[n][(j+1)%28],rings[n+1][(j+1)%28],rings[n+1][j]));mats.append(1 if n>=4 else 0)
    faces.append(tuple(reversed(rings[-1])));mats.append(1)
mesh=bpy.data.meshes.new('Living arm mesh');mesh.from_pydata(verts,[],faces);mesh.update()
arm=bpy.data.objects.new('Reiko arm / real cups',mesh);bpy.context.collection.objects.link(arm)
attr=mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
for i,c in enumerate(colors):attr.data[i].color=c
for name,rough in [('Midnight skin',.34),('Violet cup bowl',.4)]:
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    ns=mat.node_tree.nodes;bs=ns.get('Principled BSDF');bs.inputs['Roughness'].default_value=rough;bs.inputs['IOR'].default_value=1.38
    bs.inputs['Coat Weight'].default_value=.16;bs.inputs['Coat Roughness'].default_value=.26
    col=ns.new('ShaderNodeVertexColor');col.layer_name='Color';mat.node_tree.links.new(col.outputs['Color'],bs.inputs['Base Color'])
    arm.data.materials.append(mat)
for i,p in enumerate(mesh.polygons):p.material_index=mats[i];p.use_smooth=True
# Include an editable bend shape in the .blend; the website deforms this geometry
# continuously in the vertex shader so normals and real lighting follow the pose.
arm.shape_key_add(name='Basis');bend=arm.shape_key_add(name='Gentle contact')
for i,p in enumerate(verts):
    x,y,z=p;t=x/L
    cy=.48*sin(pi*t)*t;dy=.48*(sin(pi*t)+pi*t*cos(pi*t))/L
    norm=Vector((-dy,1,0)).normalized();bend.data[i].co=(x+norm.x*y,cy+norm.y*y,z)
bpy.context.view_layer.objects.active=arm;arm.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'reiko-arm.glb'),export_format='GLB',use_selection=True,export_yup=False,export_animations=False,export_morph=False)
# A genuine 3D preview, under low underwater-blue area lights.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=False
scene.render.resolution_x=1200;scene.render.resolution_y=480;scene.render.resolution_percentage=100
scene.world.color=(.025,.04,.055)
def area(name,pos,power,size,col):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=col
    ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob);ob.location=pos;ob.rotation_euler=(Vector((5,0,0))-ob.location).to_track_quat('-Z','Y').to_euler()
area('Soft upper water light',(3,-3,7),750,8,(.55,.75,1))
area('Muted violet rim',(6,4,4),550,6,(.52,.4,.9))
area('Broad front fill',(8,-5,3),300,7,(.6,.8,.85))
camdata=bpy.data.cameras.new('Preview camera');cam=bpy.data.objects.new('Preview camera',camdata);bpy.context.collection.objects.link(cam)
cam.location=(5,-4.3,12);cam.rotation_euler=(Vector((5,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();camdata.type='ORTHO';camdata.ortho_scale=11.6;scene.camera=cam
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.view_settings.view_transform='AgX'
bend.value=.9
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'tools/blender/reiko-arm.blend'),compress=True)
scene.render.filepath='/workspace/shared/reiko-blender-hand.png';bpy.ops.render.render(write_still=True)
print('ARM_ASSET',len(verts),'vertices',len(faces),'faces')
