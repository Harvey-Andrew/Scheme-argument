/**
 * @descripion:
 * @param {Viewer} viewer
 * @param {Cartesian2} position
 * @param {Object} carInfo
 * @return {*}
 */
import * as Cesium from "cesium";
import { createVNode, render } from "vue"
import Popup from "../components/PopupCar.vue";

export default class Bubble {
    constructor(val) {
        this.viewer = val.viewer;
        this.vmInstance = createVNode(Popup, {
            carInfo: val.carInfo,
        })
        let mountNode = document.createElement("div");
        render(this.vmInstance, mountNode);
        this.vmInstance.closeEvent = () => {
            this.windowClose();
        }

        val.viewer.cesiumWidget.container.appendChild(this.vmInstance.el); //将模板生成的内容添加到DOM上
        this.addPostRender();
    }

    changePosition(position) {
        this.position = position;
    }

    //添加场景事件
    addPostRender() {
        this.viewer.scene.postRender.addEventListener(this.postRender, this);
    }

    //场景渲染事件 实时更新窗口的位置 使其与笛卡尔坐标一致
    postRender() {
        if (!this.vmInstance.el || !this.vmInstance.el.style || !this.position) return;
        const canvasHeight = this.viewer.scene.canvas.height;
        const windowPosition = new Cesium.Cartesian2();
        //把笛卡尔坐标转屏幕坐标
        Cesium.SceneTransforms.wgs84ToWindowCoordinates(
            this.viewer.scene,
            this.position,
            windowPosition
        );
        const elWidth = this.vmInstance.el.offsetWidth;
        this.vmInstance.el.style.bottom = canvasHeight - windowPosition.y + 205 + "px";
        this.vmInstance.el.style.left = windowPosition.x - elWidth / 2 + 130 + "px";
    }
    //关闭 
    windowClose() {
        if (this.vmInstance) {
            this.vmInstance.el.remove();
            this.vmInstance = null
        }
        this.viewer.scene.postRender.removeEventListener(this.postRender, this); //移除事件监听
    }
}
