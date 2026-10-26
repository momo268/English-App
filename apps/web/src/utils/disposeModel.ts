import * as THREE from 'three'

// 从场景里移除模型不会自动释放显存，还需要清理几何体、材质和纹理。
export const disposeModel = (model: THREE.Object3D) => {
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.geometry.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) value.dispose()
      }
      material.dispose()
    }
  })
}
