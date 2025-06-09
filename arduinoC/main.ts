//% color="#0062DB" iconWidth=50 iconHeight=40 name="TOF400C测距"
namespace tof400cSensor {

    const SENSOR_OBJ_NAME = "tof400c";
    const SOFT_WIRE_OBJ_NAME = "tof400cSoftWire";

    // --- 枚举定义区 ---
    // 当 I2C_SEL 和 BUDGET 改为从 JSON 加载后，这两个 enum 理论上不再直接用于填充下拉框，
    // 但在 TypeScript 代码逻辑中进行类型比较时仍然有用。
    // 如果你希望完全移除对TS enum的依赖，也可以直接在代码中使用原始值比较。
    enum TOF400C_TimingBudget {
        TB_20 = 20,
        TB_33 = 33,
        TB_50 = 50,
        TB_100 = 100,
        TB_200 = 200,
        TB_500 = 500
    }

    enum TOF400C_I2CType {
        Hardware = 0,
        Software = 1
    }

    // --- 辅助函数 ---
    function _ensureBaseSensorDeclared(xshutPin: string, irqPin: string) {
        Generator.addInclude('TOF400C_Driver_H', '#include "Adafruit_VL53L1X.h"');
        Generator.addObject(SENSOR_OBJ_NAME, 'Adafruit_VL53L1X', `${SENSOR_OBJ_NAME}(${xshutPin}, ${irqPin});`);
    }

    // --- 积木块定义 ---

    //% block="初始化 TOF400C XSHUT [XPIN] IRQ [IPIN] 类型 [I2C_SEL] 地址 [ADDR] || 当软件I2C时: SDA [SDA_PIN] SCL [SCL_PIN]" blockType="command"
    //% XPIN.shadow="dropdown" XPIN.options="PIN_DigitalWrite" XPIN.defl="3"
    //% IPIN.shadow="dropdown" IPIN.options="PIN_DigitalWrite" IPIN.defl="2"
    //% I2C_SEL.shadow="dropdown" I2C_SEL.options="MY_TOF_I2C_TYPES" I2C_SEL.defl="0" // options 指向 JSON 键名, defl 为代码值 "0" (硬件I2C)
    //% ADDR.shadow="number" ADDR.defl="0x29"
    //% SDA_PIN.shadow="dropdown" SDA_PIN.options="PIN_DigitalWrite" SDA_PIN.defl="A4"
    //% SCL_PIN.shadow="dropdown" SCL_PIN.options="PIN_DigitalWrite" SCL_PIN.defl="A5"
    //% inlineInputMode="external"
    export function init(parameter: any, block: any) {
        let xpin = parameter.XPIN.code;
        let ipin = parameter.IPIN.code;
        let i2cSelection = parseInt(parameter.I2C_SEL.code); // 获取的是 JSON 中定义的代码值, 如 "0" 或 "1"
        let addr = parameter.ADDR.code;

        _ensureBaseSensorDeclared(xpin, ipin);
        let i2cBusObjectIdentifier;

        // 这里用 TOF400C_I2CType.Software (值为1) 进行比较仍然是有效的，
        // 因为 parseInt(parameter.I2C_SEL.code) 会将从JSON获取的 "1" 转为数字 1
        if (i2cSelection === TOF400C_I2CType.Software) {
            let sdaPin = parameter.SDA_PIN.code;
            let sclPin = parameter.SCL_PIN.code;
            Generator.addInclude('SoftWire_H', '#include <SoftWire.h>');
            Generator.addObject(SOFT_WIRE_OBJ_NAME, 'SoftWire', `${SOFT_WIRE_OBJ_NAME}(${sdaPin}, ${sclPin});`);
            Generator.addSetup(`${SOFT_WIRE_OBJ_NAME}_begin`, `${SOFT_WIRE_OBJ_NAME}.begin();`, false);
            i2cBusObjectIdentifier = `&${SOFT_WIRE_OBJ_NAME}`;
        } else {
            Generator.addSetup('wire_begin_tof400c', 'Wire.begin();', false);
            i2cBusObjectIdentifier = `&Wire`;
        }
        let sensorBeginCode = `if (!${SENSOR_OBJ_NAME}.begin(${addr}, ${i2cBusObjectIdentifier})) { while (1) delay(10); }`;
        Generator.addSetup(`${SENSOR_OBJ_NAME}_begin`, sensorBeginCode, true);
    }

    //% block="TOF400C 设置采样间隔 [BUDGET]" blockType="command"
    //% BUDGET.shadow="dropdown" BUDGET.options="MY_TOF_TIMING_BUDGETS" BUDGET.defl="50" // options 指向 JSON 键名, defl 为代码值 "50"
    export function setTimingBudget(parameter: any, block: any) {
        let budget = parameter.BUDGET.code; // 获取的是 JSON 中定义的选定代码值, 如 "50"
        Generator.addCode(`${SENSOR_OBJ_NAME}.setTimingBudget(${budget});\n`);
    }
    
    // (其他积木块定义: startRanging, isDataReady, getDistance, clearInterruptFlag, getSensorID 保持不变)
    // ... 请从之前的回复中复制代码补全其他函数 ...
    //% block="TOF400C 开始连续测距" blockType="command"
    export function startRanging(parameter: any, block: any) {
        let rangingCode = `if (!${SENSOR_OBJ_NAME}.startRanging()) { while (1) delay(10); }`;
        Generator.addSetup(`${SENSOR_OBJ_NAME}_startRanging`, rangingCode, true);
    }

    //% block="TOF400C 数据准备就绪?" blockType="boolean"
    export function isDataReady(parameter: any, block: any) {
        Generator.addCode([`${SENSOR_OBJ_NAME}.dataReady()`, Generator.ORDER_ATOMIC]);
    }

    //% block="TOF400C 读取距离 (mm)" blockType="reporter"
    export function getDistance(parameter: any, block: any) {
        Generator.addCode([`${SENSOR_OBJ_NAME}.distance()`, Generator.ORDER_ATOMIC]);
    }

    //% block="TOF400C 清除中断状态" blockType="command"
    export function clearInterruptFlag(parameter: any, block: any) {
        Generator.addCode(`${SENSOR_OBJ_NAME}.clearInterrupt();\n`);
    }

    //% block="TOF400C 获取传感器ID" blockType="reporter"
    export function getSensorID(parameter: any, block: any) {
        Generator.addCode([`${SENSOR_OBJ_NAME}.sensorID()`, Generator.ORDER_ATOMIC]);
    }
}