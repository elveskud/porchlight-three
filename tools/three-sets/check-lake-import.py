import bpy, json, math
from pathlib import Path
root=Path(__file__).resolve().parents[2]
results=[]
for name in ['lake','lake_night','lake_storm']:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(root/'art/three/sets/exports'/f'{name}.glb'))
 objects=list(bpy.data.objects);meshes=[o for o in objects if o.type=='MESH'];invalid=0
 for mesh in bpy.data.meshes:
  for v in mesh.vertices:
   if not all(math.isfinite(x) for x in v.co):invalid+=1
 assert not invalid,name
 assert len(meshes)>6000,(name,len(meshes))
 assert any('continuous lakeside terrain' in o.name for o in objects),name
 results.append({'id':name,'objects':len(objects),'meshObjects':len(meshes),'invalidVertices':invalid})
 print('LAKE GLB IMPORT PASS',results[-1],flush=True)
(root/'art/three/sets/lake-world/blender-verification.json').write_text(json.dumps({'result':'PASS','version':bpy.app.version_string,'reports':results},indent=2)+'\n')
