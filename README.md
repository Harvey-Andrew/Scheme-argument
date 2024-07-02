个人博客：https://douglas.blog.csdn.net

# 1. 场景加载

加载`Cesium的Melbourne Photogrammetry`的倾斜摄影作为底图，本身是贴地的，使用 Cesium 的**primitives**功能加载特定 ID 的数据集。

```js
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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiNGNjMTg5Zi02ZjBkLTQyOGItOWUzMS1iYmU0OTdjMWJlZTUiLCJpZCI6MTk2NDAxLCJpYXQiOjE3MDgzMzI4MzJ9.Ig6iAuXmLNdwcJlSmvSHhaR6xsmKCRhAkEkjAo7PYPM";

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

```

![image-20240625223050356](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240625223050356.png)

# 2. 3D 模型

## 2.1. 坐标转换

先将世界坐标转屏幕坐标，再将屏幕坐标转世界坐标，如果转换后还是同一个点，那转换成功。

```js
// 世界坐标转屏幕坐标 （笛卡尔坐标高度为0）
const xy = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
  global.$viewer.scene,
  res.position._value
);
// 屏幕转世界坐标
const cartesian3 = global.$viewer.scene.globe.pick(
  global.$viewer.camera.getPickRay(xy),
  global.$viewer.scene
);
```

如果笛卡尔坐标的高度不为 0，就会出现下面的情况，点跑到下面去。

![QQ录屏20240625230232 -original-original](https://gitee.com/dongxiaogit/image2/raw/master/image/QQ录屏20240625230232 -original-original.gif)

解决办法：

将坐标扔进来会有一个高度，这时不要传高度进去，转出来也要带着高度，高度不变

1. 世界坐标转为弧度坐标，带着高度
2. 转为经纬度，不要高度，凑一个新的笛卡尔坐标，转为屏幕坐标
3. 再重新转为笛卡尔坐标，这时是没有高度的，可以将转为弧度的高度传进去，这时高度就保持不变
4. 这时点的位置就是对的。

![image-20240625235423510](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240625235423510.png)

```js
// 将世界坐标转为弧度
const cartographic1 = Cesium.cartographic.fromCartesian(res.position._value);
let lon1 = Cesium.Math.toDegrees(cartographic1.longitude);
let lat1 = Cesium.Math.toDegrees(cartographic1.latitude);
// 世界坐标转屏幕坐标 （笛卡尔坐标高度为0）
const xy = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
  global.$viewer.scene,
  Cesium.Cartesian3.fromDegrees(lon1, lat1)
);
// 屏幕转世界坐标
const cartesian3 = global.$viewer.scene.globe.pick(
  global.$viewer.camera.getPickRay(xy),
  global.$viewer.scene
);
const cartographic2 = Cesium.cartographic.fromCartesian(cartesian3);
let lon2 = Cesium.Math.toDegrees(cartographic2.longitude);
let lat2 = Cesium.Math.toDegrees(cartographic2.latitude);
res.position = Cesium.Cartesian3.fromDegrees(lon2, lat2, cartographic1.height);
```

需要先保证笛卡尔转屏幕，再转笛卡尔流程是正确的，再来进行移动，移动就是对应的屏幕 xy 移动

## 2.2. 放置模型

- 激活画笔工具，允许用户通过鼠标点击或拖拽来放置点（可能是放置模型的参考点）。
- 当用户点击一个点时，获取该点的坐标，并基于该坐标将所选模型放置到场景中。

## 2.3. 调整模型

- 在模型放置后，显示调整按钮或调整面板。
- 旋转：提供一个滑块或输入框来改变模型的 heading（朝向）。
- 位置移动：提供四个按钮（上、下、左、右）或输入框来移动模型的位置。
- 放大、缩小：通过滑块或输入框来调整模型的大小。

## 2.4. 提交方案

调整完后，提交方案，输入方案名称，点击确定后，通过请求，将方案保存到数据库，因为你无法永久性地改变 3D 瓦片，只能把旋转、位置移动，尺寸都放在数据库中，可以用来还原方案。

![image-20240701084415828](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240701084415828.png)

# 3. 查看方案

开始需要先从后台请求方案数据。

```js
// 初始化数据
const initData = () => {
  getScheme().then((res) => {
    console.log(res);
    data.list = res.data;
  });
};
```

## 3.1. 场景还原

点击方案，回到保存前的视角，也要有场景还原。

![image-20240701094028785](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240701094028785.png)

## 3.2. 删除

根据 id 删除对应的方案，并删除数据库的方案。

![image-20240701093953710](https://gitee.com/dongxiaogit/image2/raw/master/image/image-20240701093953710.png)
