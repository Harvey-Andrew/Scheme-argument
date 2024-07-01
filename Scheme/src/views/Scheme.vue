<!--
 * @FilePath     : /Scheme/src/views/Scheme.vue
 * @Description  : 查看方案
 * @Author       : Harvey-Andrew
 * @Version      : 0.0.1
 * @LastEditors  : Harvey-Andrew 
 * @LastEditTime : 2024-06-25 01:17:31
 * Copyright © 2024 by Harvey-Andrew.
-->

<template>
  <el-card class="scheme rounded-lg">
    <template #header>
      <div class="card-header">
        <span class="font-semibold text-lg">查看方案</span>
      </div>
      <!-- 添加方案 -->
      <!-- <el-button
        type="success"
        size="small"
        class="float-right"
        style="margin-top: -25px"
        @click="toAddScheme"
        >方案论证</el-button
      > -->
      <button
        class="float-right checkScheme"
        style="margin-top: -25px"
        @click="toAddScheme"
      >
        <span>方案论证</span>
      </button>
    </template>

    <!-- 方案 -->
    <div class="list">
      <div class="item" v-for="item in data.list" :key="item.id">
        <span
          :style="{ color: data.pickID === item.id ? '#409eff' : '' }"
          @click="toPickScheme(item)"
          >{{ item.name }}</span
        >
        <el-popconfirm
          @confirm="confirmEvent(item.id)"
          confirm-button-text="确定"
          cancel-button-text="取消"
          :icon="InfoFilled"
          icon-color="#626AEF"
          title="是否删除"
        >
          <template #reference>
            <Delete />
          </template>
        </el-popconfirm>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import * as Cesium from "cesium";
import { delScheme, getScheme } from "@/api/schemeApi";
import { onMounted, reactive, getCurrentInstance, onUnmounted } from "vue";
import { Delete } from "@element-plus/icons-vue";
import { changeHeight, clearFlatten, toFlatten } from "@/tool/flatten";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
const { appContext } = getCurrentInstance();
const global = appContext.config.globalProperties;
const data = reactive({
  list: [],
  pickID: 0,
});

const $router = useRouter();
const toAddScheme = () => {
  $router.push("/addScheme");
};
// 重置
const reset = () => {
  clearFlatten(global.$tileset);
  global.$viewer.entities.removeAll();
};
// 删除方案
const confirmEvent = (id) => {
  delScheme({ id }).then((res) => {
    if (res.code === 200) {
      ElMessage.success("删除成功");
      reset();
      initData();
    }
  });
};
// 跳到对应的方案
const toPickScheme = (item) => {
  data.pickID = item.id;
  clearFlatten(global.$tileset);
  global.$viewer.entities.removeAll();
  // console.log(item);
  // 获取面的坐标 并转为笛卡尔坐标
  let cartensianArr = Cesium.Cartesian3.fromDegreesArray(
    item.polygon.coordinates[0].flat()
  );
  // console.log(cartensianArr);
  // 压平
  toFlatten(global.$tileset, cartensianArr);
  if (item.tileHeight) {
    changeHeight(global.$tileset, item.tileHeight.toFixed(1));
  }

  // 添加面实体
  global.$viewer.entities.add({
    polygon: {
      hierarchy: {
        positions: cartensianArr,
      },
      clampToGround: true,
      material: Cesium.Color.SLATEGRAY,
    },
  });

  // 添加模型
  // 将坐标转为笛卡尔
  let positionArr = item.position.split(",").map((a) => {
    return Number(a);
  });
  const position = Cesium.Cartesian3.fromDegrees(...positionArr);
  // console.log(positionArr);
  // 获得实体的方向;
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(
    position,
    Cesium.HeadingPitchRoll.fromDegrees(item.heading, 0, 0)
  );
  global.$viewer.entities.add({
    position,
    orientation,
    model: {
      uri: "/src/assets/model/" + item.src + ".gltf",
      minimumPixelSize: 10,
      scale: item.scale,
    },
  });

  // 切换视角
  let cameraPosition = item.cameraPosition.split(",").map((a) => {
    return Number(a);
  });
  let cameraOrt = item.cameraOrt.split(",").map((a) => {
    return Number(a);
  });
  // console.log(cameraPosition);
  global.$viewer.camera.flyTo({
    destination: new Cesium.Cartesian3(...cameraPosition),
    orientation: {
      heading: cameraOrt[0],
      pitch: cameraOrt[1],
      roll: cameraOrt[2],
    },
  });
};

onMounted(() => {
  initData();
});
// 初始化数据
const initData = () => {
  getScheme().then((res) => {
    console.log(res);
    data.list = res.data;
  });
};

// 销毁事件
onUnmounted(() => {
  reset();
});
</script>

<style lang="scss">
.scheme {
  width: 20%;
  position: absolute;
  top: 4%;
  left: 4%;
  z-index: 999;
  font-size: 15px;
  font-weight: 600;

  .list {
    border: 1px solid #dcdfe6;
    border-radius: 4px;

    .item {
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;

      &:not(:last-child) {
        border-bottom: 1px solid #dcdfe6;
      }

      span {
        cursor: pointer;
      }

      svg {
        width: 20px;
        cursor: pointer;

        &:hover {
          color: red;
        }
      }
    }
  }
}
$color: #2194e0;

@keyframes sheen {
  0% {
    transform: skewY(-45deg) translateX(0);
  }
  100% {
    transform: skewY(-45deg) translateX(12.5em);
  }
}

.checkScheme {
  padding: 0.2em 0.5em;
  text-align: center;
  text-decoration: none;
  color: $color;
  border: 2px solid $color;
  display: inline-block;
  border-radius: 0.3em;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  &:before {
    content: "";
    background-color: rgba(255, 255, 255, 0.5);
    height: 100%;
    width: 3em;
    display: block;
    position: absolute;
    top: 0;
    left: -4.5em;
    transform: skewX(-45deg) translateX(0);
    transition: none;
  }
  &:hover {
    background-color: $color;
    color: #fff;
    border-bottom: 4px solid darken($color, 10%);
    &:before {
      transform: skewX(-45deg) translateX(13.5em);
      transition: all 0.5s ease-in-out;
    }
  }
}
</style>
