<template>
  <div id="cesiumContainer"></div>
  <!-- <button v-longpress="longClick" class="absolute z-999 left-10 top-10">
    长按
  </button> -->
  <router-view></router-view>
</template>
<script setup>
import * as Cesium from "cesium";
import { onMounted, getCurrentInstance } from "vue";
import CesiumZh from "./tool/cesiumToZh";

const { appContext } = getCurrentInstance();
const global = appContext.config.globalProperties;
let viewer;
Cesium.Ion.defaultAccessToken =
  "your token";

onMounted(() => {
  // viewer是操控地图api的开始
  viewer = new Cesium.Viewer("cesiumContainer", {
    timeline: false,
    animation: false,
    selectionIndicator: false,
    infoBox: false,
  });
  CesiumZh.load();
  global.$viewer = viewer;
  const tileset = viewer.scene.primitives.add(
    new Cesium.Cesium3DTileset({
      url: Cesium.IonResource.fromAssetId(69380),
    })
  );
  viewer.zoomTo(tileset);
  global.$tileset = tileset;
});


</script>
<style scoped>
#cesiumContainer {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
