import * as Cesium from 'cesium'

const getSiteTimes = (pArr, speed) => {
    let timeSum = 0, times = []  //timeSum花费时间总和,每一个轨迹点对应的时间
    for (let i = 0; i < pArr.length; i++) {
        if (i == 0) {
            times.push(0)
            continue;
        }
        timeSum += spaceDistance(pArr[i - 1], pArr[i]) / speed
        times.push(timeSum)
    }
    return { timeSum: timeSum, siteTime: times }
}

const spaceDistance = (a, b) => {
    return Cesium.Cartesian3.distance(a, b).toFixed(2)
}

const getSampleData = (pArr, start, siteTime) => {
    const position = new Cesium.SampledPositionProperty();
    for (let i = 0; i < pArr.length; i++) {
        //每一个轨迹点所对应的系统时间
        const time = Cesium.JulianDate.addSeconds(start, siteTime[i], new Cesium.JulianDate());
        position.addSample(time, pArr[i]);
    }
    return position
}

export { getSiteTimes, getSampleData, spaceDistance }