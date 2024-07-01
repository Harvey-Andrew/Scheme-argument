import * as Cesium from "cesium";
/**
 * @descripion:
 * @param {tileset} 3d瓦片
 * @param {car3_ps} 压平区域(笛卡尔坐标数组)
 */
const toFlatten = (tileset, car3_ps) => {
  let arr = toModelXyz(tileset, car3_ps);
  let length = arr.length
  let customShader = new Cesium.CustomShader({
    uniforms: {
      u_height: {
        type: Cesium.UniformType.FLOAT,
        value: 0.0
      },
    },
    vertexShaderText: `//glsl
        void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
            ` + getStr(arr) + `
            float y = vsOutput.positionMC.z;
            float x = vsOutput.positionMC.x;
            const int len =` + length + `;
            const int j =` + (length - 1) + `;
            bool c = false;
            for(int i=0; i< len;i++){
              if(i==0){
                if((vs[i].y >= y && y > vs[j].y) || (vs[j].y >= y && y > vs[i].y)){
                  if(x < (vs[j].x - vs[i].x) * (y - vs[i].y) / (vs[j].y - vs[i].y) + vs[i].x){
                    c = !c;
                  }
                }
              }else{
                if((vs[i].y >= y && y > vs[i-1].y) || (vs[i-1].y >= y && y > vs[i].y)){
                  if(x < (vs[i-1].x - vs[i].x) * (y - vs[i].y) / (vs[i-1].y - vs[i].y) + vs[i].x){
                    c = !c;
                  }
                }
              }
            }
            if(c){
              vsOutput.positionMC.y =u_height;
            }
        }
        `,
  });
  tileset.customShader = customShader;
}

const clearFlatten = (tileset) => {
  tileset.customShader = null;
}


/**
 * @descripion:
 * @param {tileset} 3d瓦片
 * @param {height} 压平高度(小数点保留一位)
 */
const changeHeight = (tileset, height) => {
  tileset.customShader.setUniform("u_height", height);
}

const getStr = (arr) => {
  let str = "vec2 vs[" + arr.length + "];\n";
  arr.forEach((item, index) => {
    str += "vs[" + index + "] = vec2(" + item[0] + "," + item[1] + ");\n";
  });
  return str;
};

const toModelXyz = (tileset, arr) => {
  let m = tileset.clippingPlanesOriginMatrix.clone();
  let n = Cesium.Matrix4.inverseTransformation(m, new Cesium.Matrix4());
  let newArr = [];
  arr.forEach((item) => {
    let xyz = Cesium.Matrix4.multiplyByPoint(n, item, new Cesium.Cartesian3());
    newArr.push([xyz.x, -xyz.y]);
  });
  return newArr;
};

export { toFlatten, clearFlatten, changeHeight }
