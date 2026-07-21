const DEFAULT_BAUD_RATE = 9600;
const DEFAULT_SERVICE_UUID = '0000181d-0000-1000-8000-00805f9b34fb';
const DEFAULT_CHARACTERISTIC_UUID = '00002a9d-0000-1000-8000-00805f9b34fb';

const parseWeightFromText = (text) => {
  if (!text) return null;

  const normalized = String(text).replace(/,/g, '.');
  const match = normalized.match(/[-+]?\d+(?:\.\d+)?/);

  if (!match) return null;

  const weight = Number(match[0]);
  return Number.isFinite(weight) ? weight : null;
};

const parseWeightFromDataView = (value) => {
  if (!value || value.byteLength === 0) return null;

  try {
    const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    const text = new TextDecoder().decode(bytes);
    const textWeight = parseWeightFromText(text);
    if (textWeight !== null) return textWeight;
  } catch {
    // Fall through to binary parsing.
  }

  if (value.byteLength >= 4) {
    const binaryWeight = value.getFloat32(0, true);
    if (Number.isFinite(binaryWeight)) return binaryWeight;
  }

  return null;
};

const readSignedInt8 = (value) => (value > 127 ? value - 256 : value);

const convertHidScaleWeightToKg = (weight, unit) => {
  if (!Number.isFinite(weight)) return null;

  switch (unit) {
    case 2:
      return weight / 1000;
    case 3:
      return weight;
    case 11:
      return weight * 0.028349523125;
    case 12:
      return weight * 0.45359237;
    default:
      return weight;
  }
};

const parseWeightFromHidReport = (data) => {
  if (!data || data.byteLength === 0) return null;

  const textWeight = parseWeightFromDataView(data);
  if (textWeight !== null) return textWeight;

  if (data.byteLength < 5) return null;

  const offset = data.byteLength >= 6 ? 1 : 0;
  const unit = data.getUint8(offset + 1);
  const exponent = readSignedInt8(data.getUint8(offset + 2));
  const rawWeight = data.getUint16(offset + 3, true);
  const scaledWeight = rawWeight * Math.pow(10, exponent);

  return convertHidScaleWeightToKg(scaledWeight, unit);
};

class BluetoothWeightScale {
  constructor() {
    this.device = null;
    this.hidDevice = null;
    this.server = null;
    this.characteristic = null;
    this.port = null;
    this.reader = null;
    this.readLoopActive = false;
    this.onWeightUpdate = null;
    this.connectionType = null;
  }

  async isSupported() {
    return 'serial' in navigator || 'hid' in navigator || 'bluetooth' in navigator;
  }

  async connect(serviceUuid, characteristicUuid, onWeightUpdate, options = {}) {
    if (!await this.isSupported()) {
      throw new Error('Scale connection is not supported in this browser. Use Chrome or Edge over HTTPS/localhost.');
    }

    this.onWeightUpdate = onWeightUpdate;
    const mode = options.mode || 'serial';

    if (mode === 'ble') {
      return this.connectBle(serviceUuid, characteristicUuid);
    }

    if (mode === 'usb') {
      return this.connectUsbScale(options);
    }

    if ('serial' in navigator) {
      try {
        return await this.connectSerial(options);
      } catch (error) {
        if (error?.name === 'NotFoundError' || !('bluetooth' in navigator)) {
          throw error;
        }
      }
    }

    return this.connectBle(serviceUuid, characteristicUuid);
  }

  async connectUsbScale(options = {}) {
    if ('serial' in navigator) {
      try {
        return await this.connectSerial({
          ...options,
          label: options.label || 'USB Serial Scale',
          requireUsbDevice: true
        });
      } catch (error) {
        if (error?.message?.includes('selected port is not a USB device')) {
          throw error;
        }

        if (error?.name === 'NotFoundError' && 'hid' in navigator) {
          return this.connectUsbHid(options);
        }

        if (!('hid' in navigator)) {
          throw error;
        }

        return this.connectUsbHid(options);
      }
    }

    if ('hid' in navigator) {
      return this.connectUsbHid(options);
    }

    throw new Error('USB scale connection is not supported in this browser. Use Chrome or Edge over HTTPS/localhost.');
  }

  async connectSerial(options = {}) {
    this.port = await navigator.serial.requestPort();
    const portInfo = this.port.getInfo?.() || {};

    if (options.requireUsbDevice && !portInfo.usbVendorId) {
      this.port = null;
      throw new Error('The selected port is not a USB device. Select the COM port created by the scale USB cable, not the Bluetooth port.');
    }

    await this.port.open({
      baudRate: options.baudRate || DEFAULT_BAUD_RATE,
      dataBits: options.dataBits || 8,
      stopBits: options.stopBits || 1,
      parity: options.parity || 'none',
      flowControl: options.flowControl || 'none'
    });

    this.connectionType = 'serial';
    this.readLoopActive = true;
    this.readSerialWeights();

    return {
      type: 'serial',
      label: options.label || 'Serial Scale',
      baudRate: options.baudRate || DEFAULT_BAUD_RATE,
      usbVendorId: portInfo.usbVendorId,
      usbProductId: portInfo.usbProductId
    };
  }

  async readSerialWeights() {
    const decoder = new TextDecoder();
    let buffer = '';

    while (this.port?.readable && this.readLoopActive) {
      this.reader = this.port.readable.getReader();

      try {
        while (this.readLoopActive) {
          const { value, done } = await this.reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || '';

          lines.forEach((line) => this.emitTextWeight(line));

          if (buffer.length > 40) {
            this.emitTextWeight(buffer);
            buffer = '';
          }
        }
      } catch (error) {
        console.error('Bluetooth serial read error:', error);
      } finally {
        this.reader?.releaseLock();
        this.reader = null;
      }
    }
  }

  emitTextWeight(text) {
    const weight = parseWeightFromText(text);

    if (weight !== null && this.onWeightUpdate) {
      this.onWeightUpdate(weight);
    }
  }

  async connectUsbHid() {
    const devices = await navigator.hid.requestDevice({ filters: [] });

    if (!devices.length) {
      throw new Error('No USB scale was selected');
    }

    this.hidDevice = devices[0];
    await this.hidDevice.open();

    this.hidDevice.addEventListener('inputreport', (event) => {
      const weight = parseWeightFromHidReport(event.data);

      if (weight !== null && this.onWeightUpdate) {
        this.onWeightUpdate(weight);
      }
    });

    this.connectionType = 'hid';

    return {
      type: 'hid',
      label: 'USB HID Scale',
      baudRate: DEFAULT_BAUD_RATE
    };
  }

  async connectBle(serviceUuid, characteristicUuid) {
    const service = serviceUuid || DEFAULT_SERVICE_UUID;
    const characteristic = characteristicUuid || DEFAULT_CHARACTERISTIC_UUID;

    this.device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [service]
    });

    this.server = await this.device.gatt.connect();
    const primaryService = await this.server.getPrimaryService(service);
    this.characteristic = await primaryService.getCharacteristic(characteristic);

    await this.characteristic.startNotifications();
    this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const weight = parseWeightFromDataView(event.target.value);

      if (weight !== null && this.onWeightUpdate) {
        this.onWeightUpdate(weight);
      }
    });

    this.connectionType = 'ble';

    return {
      type: 'ble',
      label: 'BLE Bluetooth'
    };
  }

  async disconnect() {
    this.readLoopActive = false;

    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {
        // Ignore cancellation errors while closing the port.
      }
    }

    if (this.port) {
      try {
        await this.port.close();
      } catch (error) {
        console.error('Bluetooth serial disconnect error:', error);
      }
    }

    if (this.hidDevice?.opened) {
      try {
        await this.hidDevice.close();
      } catch (error) {
        console.error('USB HID disconnect error:', error);
      }
    }

    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }

    this.device = null;
    this.hidDevice = null;
    this.server = null;
    this.characteristic = null;
    this.port = null;
    this.reader = null;
    this.connectionType = null;
  }

  isConnected() {
    return Boolean(this.port?.readable || this.hidDevice?.opened || this.device?.gatt?.connected);
  }
}

const bluetoothInstance = new BluetoothWeightScale();
export default bluetoothInstance;
