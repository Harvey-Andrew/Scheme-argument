import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import ElementPlus from "element-plus";
import "element-plus/theme-chalk/index.css";
// import locale from "element-plus/es/locale/lang/zh-cn";
import locale from "element-plus/es/locale/lang/zh-cn";
import "./assets/tailwind.css";
const app = createApp(App);
app.config.globalProperties.$viewer = null;

// 自定义长按事件 使用递归
app.directive("longpress", {
  mounted: function (el, binding, vNode) {
    // Make sure expression provided is a function
    if (typeof binding.value !== "function" && vNode.context !== undefined) {
      // pass warning to console
      let warn = `[longpress:] provided expression '${binding.expression}' is not a function, but has to be`;

      console.warn(warn);
    }

    // Define variable
    let pressTimer = null;

    // Define funtion handlers
    // Create timeout ( run function after 1s )
    let start = (e) => {
      if (e instanceof MouseEvent && e.type === "click" && e.button !== 0) {
        return;
      }
      handler(e);
    };

    // Cancel Timeout
    let cancel = () => {
      // Check if timer has a value or not
      if (pressTimer !== null) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };
    // Run Function 按下60毫秒触发
    const handler = (e) => {
          pressTimer = setTimeout(() => {
        binding.value(e);
        // 执行递归 调用自身
        handler(e);
      }, 60);
    };

    // Add Event listeners
    el.addEventListener("mousedown", start);
    // Cancel timeouts if this events happen
    el.addEventListener("click", cancel);
    el.addEventListener("mouseup", cancel);
    el.addEventListener("mouseout", cancel);
  },
});
app.use(router).use(ElementPlus, { locale }).mount("#app");
