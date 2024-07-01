<!--
 * @FilePath     : /Scheme/src/views/AddScheme copy.vue
 * @Description  : 
 * @Author       : Harvey-Andrew
 * @Version      : 0.0.1
 * @LastEditors  : Harvey-Andrew 
 * @LastEditTime : 2024-06-25 13:12:41
 * Copyright © 2024 by Harvey-Andrew.
-->


<template>
  <el-card class="addscheme rounded-lg">
    <!-- 标题 -->
    <template #header>
      <!-- 左边 -->
      <div class="card-header">
        <span class="font-semibold text-lg">方案论证</span>
      </div>
      <!-- 右边 -->
      <div class="rightTop" style="margin-top: -15px">
        <span :style="{ color: data.active ? '' : '#409eff' }">地形平压</span>
        <ArrowRightBold
          class="w-8 relative top-2"
          style="margin-top: -20px; color: cadetblue"
        />
        <span :style="{ color: data.active ? '#409eff' : '' }">模型放置</span>
      </div>
    </template>

    <!-- 内容 -->
    <div class="mx-4">
      <!-- 第一页 -->
      <div v-show="data.active === 0">
        <!-- 中间 -->
        <div class="h-10">
          <div class="myIcon" @click="drawPolygon">
            <Crop />{{ isEdit ? "重新绘制" : "绘制区域" }}
          </div>
          <div v-show="data.polygonEntity" class="setH">
            高度调整：<Top
              v-longpress="() => toChange('up')"
              @click="toChange('up')"
            /><Bottom
              class="ml-2"
              v-longpress="() => toChange('down')"
              @click="toChange('down')"
            />
          </div>
        </div>
        <div v-show="data.polygonGeoJson">
          <el-input readonly style="width: 40%" value="区域坐标"> </el-input>
          <el-input
            readonly
            style="width: 55%"
            :value="
              data.polygonGeoJson
                ? data.polygonGeoJson.geometry.coordinates.toString()
                : ''
            "
          >
          </el-input>
          <el-input readonly style="width: 40%" value="平均高度"> </el-input>
          <el-input readonly style="width: 55%" :value="data.tileHeight">
          </el-input>
        </div>

        <!-- 下一步 -->
        <el-button
          size="small"
          type="info"
          class="float-right my-5"
          @click="
            () => {
              endDraw();
              data.active = 1;
            }
          "
          >下一步</el-button
        >
      </div>

      <!-- 第二页 -->
      <div v-show="data.active === 1">
        <div class="h-10">
          <span class="myIcon" @click="drawPoint"> <School />模型位置 </span>
        </div>

        <!-- 模型展示 -->
        <div class="list">
          <div class="model" v-for="(item, index) in list" :key="item">
            <span
              :style="{ color: data.pickModelID == index + 1 ? '#409eff' : '' }"
              @click="
                () => {
                  data.pickModelID = index + 1;
                }
              "
              >{{ item }}</span
            >
            <img :src="'/src/assets/model/' + (index + 1) + '.png'" />
          </div>
        </div>

        <!-- 调整 -->
        <div class="adjust">
          <span>调整：</span>
          <CaretLeft @click="toAdjust('left')" />
          <CaretRight @click="toAdjust('right')" />
          <CaretTop @click="toAdjust('top')" />
          <CaretBottom @click="toAdjust('bottom')" />
          <RefreshRight
            v-longpress="() => toAdjust('clockwise')"
            @click="toAdjust('clockwise')"
          />
          <RefreshLeft
            v-longpress="() => toAdjust('anticlockwise')"
            @click="toAdjust('anticlockwise')"
          />
          <ZoomIn @click="toAdjust('amplify')" />
          <ZoomOut @click="toAdjust('reduce')" />
        </div>
        <el-button
          v-show="data.modelEntity"
          type="primary"
          size="small"
          class="float-right mt-3 mb-3 ml-3 p-3"
          @click="data.dialogVisible = true"
          >提&nbsp;&nbsp;&nbsp;&nbsp;交</el-button
        >
        <el-button
          type="info"
          size="small"
          class="float-right mt-3 mb-3"
          @click="
            () => {
              endDraw();
              data.active = 0;
            }
          "
          >上一步</el-button
        >
      </div>
      <el-button
        type="success"
        size="small"
        class="float-left mt-2"
        @click="toScheme"
        >查看方案</el-button
      >
    </div>
  </el-card>

  <!-- 对话框 -->
  <el-dialog
    v-model="data.dialogVisible"
    title="请输入方案"
    width="24%"
    center
    :close-on-click-modal="false"
  >
    <div style="width: 80%; margin: 0 auto">
      <el-input style="text-align: center" v-model="data.name"></el-input>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="onSumbit"> 确定 </el-button>
        <el-button @click="data.dialogVisible = false">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import * as Cesium from "cesium";
import * as turf from "@turf/turf";
import { reactive, getCurrentInstance, ref, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import { toFlatten, changeHeight, clearFlatten } from "../tool/flatten";
import {
  Crop,
  School,
  ArrowRightBold,
  Top,
  Bottom,
  CaretLeft,
  CaretTop,
  CaretRight,
  CaretBottom,
  RefreshRight,
  RefreshLeft,
  ZoomIn,
  ZoomOut,
} from "@element-plus/icons-vue";
import { endDraw, toDraw } from "@/tool/draw";
import { addScheme } from "../api/schemeApi";
import { useRouter } from "vue-router";
const { appContext } = getCurrentInstance();
const global = appContext.config.globalProperties;

const $router = useRouter();
const toScheme = () => {
  $router.push("/scheme");
};
const data = reactive({
  active: 0,
  polygonEntity: "",
  tileHeight: 0,
  polygonGeoJson: "",
  modelEntity: "",
  pickModelID: 0,
  dialogVisible: false,
  name: "",
});
const isEdit = ref(false);
const list = ["购物商城", "L型办公楼", "政务大楼", "教学楼"];
let positionList = [],
  heading = 0,
  scale = 0.001;

// 将数据提交到后台
const onSumbit = () => {
  if (!data.name) {
    ElMessage.info("请输入方案名称");
  } else {
    let camera = global.$viewer.camera;
    addScheme({
      name: data.name,
      polygonJson: data.polygonEntity
        ? JSON.stringify(data.polygonGeoJson.geometry)
        : "",
      src: data.pickModelID + "",
      position: positionList.toString(),
      heading,
      scale,
      tileHeight: Number(data.tileHeight),
      cameraPosition:
        camera.position.x + "," + camera.position.y + "," + camera.position.z,
      cameraOrt: camera.heading + "," + camera.pitch + "," + camera.roll,
    }).then((res) => {
      if (res.code === 200) {
        reset();
        ElMessage.success("添加方案成功！");
      }
    });
  }
};

// 重置
const reset = () => {
  data.active = 0;
  data.pickModelID = 0;
  data.tileHeight = 0;
  data.modelEntity = null;
  data.polygonEntity = null;
  data.dialogVisible = false;
  data.polygonGeoJson = null;
  data.name = "";
  global.$viewer.entities.removeAll();
  clearFlatten(global.$tileset);
};
// 位置调整
const toAdjust = (type) => {
  // 世界坐标转屏幕坐标
  let xy = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
    global.$viewer.scene,
    Cesium.Cartesian3.fromDegrees(positionList[0], positionList[1], 0)
  );

  if (type == "left") {
    xy.x -= 10;
  } else if (type == "right") {
    xy.x += 10;
  } else if (type == "top") {
    xy.y -= 10;
  } else if (type == "bottom") {
    xy.y += 10;
  } else if (type == "clockwise") {
    heading += 1;
  } else if (type == "anticlockwise") {
    heading -= 1;
  } else if (type == "amplify") {
    scale += 0.00005;
  } else if (type == "reduce") {
    scale -= 0.00005;
  }

  // 屏幕坐标转世界坐标
  const cartesian = global.$viewer.scene.globe.pick(
    global.$viewer.camera.getPickRay(xy),
    global.$viewer.scene
  );
  let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  let lon = Cesium.Math.toDegrees(cartographic.longitude);
  let lat = Cesium.Math.toDegrees(cartographic.latitude);
  positionList = [lon, lat, positionList[2]];
  const position = Cesium.Cartesian3.fromDegrees(...positionList);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(
    position,
    Cesium.HeadingPitchRoll.fromDegrees(heading, 0, 0)
  );
  data.modelEntity.position = position;
  data.modelEntity.orientation = orientation;
  data.modelEntity.model.scale = scale;


};

// 画点
const drawPoint = () => {
  if (!data.pickModelID) {
    ElMessage.info("请选择放置的模型");
    return;
  }
  heading = 0;
  scale = 0.001;
  ElMessage.info("请绘制模型放置位置");
  data.modelEntity && global.$viewer.entities.remove(data.modelEntity);
  data.modelEntity = null;
  toDraw(global.$viewer, "point", (res) => {
    // console.log(res);
    endDraw();

    // 将笛卡尔坐标转为弧度坐标
    let cartographic = Cesium.Cartographic.fromCartesian(res.position._value);
    let lon = Cesium.Math.toDegrees(cartographic.longitude);
    let lat = Cesium.Math.toDegrees(cartographic.latitude);
    positionList = [lon, lat, cartographic.height];
    // console.log(positionList);
    global.$viewer.entities.remove(res);
    const position = Cesium.Cartesian3.fromDegrees(...positionList);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      position,
      Cesium.HeadingPitchRoll.fromDegrees(0, 0, 0)
    );

    // 添加模型
    data.modelEntity = global.$viewer.entities.add({
      position,
      orientation,
      model: {
        uri: "/src/assets/model/" + data.pickModelID + ".gltf",
        scale,
        minimumPixelSize: 10,
      },
    });
  });
};
// 高度调整
const toChange = (type) => {
  if (type === "up") {
    data.tileHeight = (Number(data.tileHeight) + 0.5).toFixed(1);
  } else {
    data.tileHeight = (Number(data.tileHeight) - 0.5).toFixed(1);
  }
  changeHeight(global.$tileset, data.tileHeight);
};

// 绘制多边形
const drawPolygon = () => {
  ElMessage.info("请绘制压平区域，右键结束绘制");
  global.$viewer.entities.removeAll();
  data.polygonEntity = null;
  isEdit.value = true;
  data.tileHeight = 0.0;
  data.polygonGeoJson = null;
  clearFlatten(global.$tileset);

  toDraw(global.$viewer, "polygon", (res) => {
    // console.log(res);
    data.polygonEntity = res;
    res.polygon.material = Cesium.Color.SLATEGRAY;
    // 获得笛卡尔坐标 转为geojson
    let car3_ps = res.polygon.hierarchy._value.positions;
    let arr = [];
    for (let i = 0; i < car3_ps.length; i++) {
      // 转为弧度
      let _cartographic3 = Cesium.Cartographic.fromCartesian(car3_ps[i]);
      let _lon = Cesium.Math.toDegrees(_cartographic3.longitude);
      let _lat = Cesium.Math.toDegrees(_cartographic3.latitude);
      arr.push([_lon, _lat]);
    }
    // 面需要首尾连接
    arr.push(arr[0]);
    // console.log(car3_ps);
    // console.log(arr);

    // 使用turf转为geojson
    data.polygonGeoJson = turf.polygon([arr]);
    console.log(data.polygonGeoJson);
    // 压平区域
    toFlatten(global.$tileset, car3_ps);
  });
};

// 释放资源
onUnmounted(() => {
  reset();
});
</script>

<style lang="scss">
.el-input__inner {
  text-align: center;
}

.addscheme {
  width: 22%;
  position: absolute;
  top: 4%;
  left: 4%;
  z-index: 999;
  font-size: 15px;
  font-weight: 600;

  .rightTop {
    float: right;
  }

  .el-input {
    margin: 5px 1%;

    .el-input__inner {
      text-align: center;
    }
  }

  .myIcon {
    cursor: pointer;
    float: left;

    svg {
      width: 23px;
      position: relative;
      top: 5px;
      margin-right: 3px;
    }
  }

  .setH {
    float: right;
    user-select: none;

    svg {
      background: rgb(85, 84, 84);
      color: #fff;
      width: 23px;
      position: relative;
      top: 5px;
      margin-right: 3px;
      border-radius: 50%;
      cursor: pointer;
    }
  }

  .list {
    border: 1px solid #dcdfe6;
    border-radius: 4px;

    .model {
      display: flex;
      justify-content: space-around;

      &:not(:last-child) {
        border-bottom: 1px solid #dcdfe6;
      }

      span {
        cursor: pointer;
        line-height: 65px;
      }

      img {
        width: 90px;
        height: 65px;
      }
    }
  }

  .adjust {
    display: flex;
    justify-content: space-around;
    margin-top: 9px;
    user-select: none;

    svg {
      background: rgb(85, 84, 84);
      color: #fff;
      width: 25px;
      margin-right: 3px;
      border-radius: 50%;
      cursor: pointer;
    }
  }
}
</style>
