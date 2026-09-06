# XIAO PowerConsole Web

通过 Web Serial 连接 XIAO PowerBread 的双通道功率测量台。
React 19 + TypeScript + Vite + Tailwind CSS + Zustand + ECharts，纯前端，无后端服务。

## 开发与验证

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

构建输出为 `dist/`。请通过 localhost 或 HTTPS 使用串口功能；应用会在不支持 Web Serial 的环境中给出错误提示。

`npm test` 使用模拟串口验证生命周期、协议、测量精度、积分与峰值抽样，不需要硬件。
开发服务器下的 `/tests/preview.html` 提供确定性测试数据，包括正负单点峰值和断流；该夹具不进入生产构建。

## 使用

1. 连接设备并点击 Connect，在浏览器中选择串口。
2. 应用以 115200 波特率执行 START → CONFIG → CONFIG_ACK，然后接收采样。
3. 主工作区上方显示双通道 V / mA / mW，下方显示真实时间轴上的电压、电流和功率趋势。
4. 设备校准参数和日志默认折叠；侧栏支持桌面拖拽与键盘左右键调整，窄屏采用单栏滚动布局。
5. Disconnect 可取消连接或关闭采集；关闭完成后才能再次连接。浏览器端口选择器若仍打开，需要先完成选择或取消。

## 测量语义

- 协议为 XPB 二进制帧：`AA 55 TYPE LEN PAYLOAD CRC8`；CRC-8/MAXIM 覆盖 TYPE、LEN 和 PAYLOAD。
- CONFIG 为 9 字节：两路 little-endian float32 分流电阻与一个版本字节。
- DATA 为 20 字节：两路总线/分流电压 float32 与 uint32 毫秒时间戳。
- 计算使用完整 float32 解码精度；格式化仅发生在显示层。无效载荷、非有限数值和非正分流电阻会终止会话并显示错误。
- 电荷通过原始采样电流的梯形积分得到，单位 µAh/mAh；它不是能量 mWh。
- 只对 `0 < dt ≤ 500ms` 的有效间隔积分和计时；等待连接、断流和时钟复位不计入时长。
- 断开连接清空实时图表与读数；累计电荷和有效时长跨连接保留，由各通道 Reset 独立清除。
- 图表保留每桶首尾和极值，默认直线连接；超过 500ms 的缺口显示断线。抽样仅用于显示，不参与计算。
- 环形缓冲区保存最近 3000 个样本（100Hz 时约 30 秒）。设备时钟倒退时清空图表，开始新时间段。

## 架构

```text
设备 → SerialConnection（单 reader）→ SerialSession（握手/重握手/采样）
    → FrameParser → codec → measurement-store → 原始电荷积分
                                             → 图表极值抽样，15fps
                                             → 双通道读数，10Hz
```

详细模块地图与维护规范见 [AGENTS.md](AGENTS.md)。
真实硬件的长时间采集、拔插与操作系统驱动差异仍需设备联调验证。
