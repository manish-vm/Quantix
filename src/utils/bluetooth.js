// Web Bluetooth API wrapper for weight machine integration
class BluetoothWeightScale {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.onWeightUpdate = null;
  }

  async isSupported() {
    return 'bluetooth' in navigator;
  }

  async connect(serviceUuid, characteristicUuid, onWeightUpdate) {
    if (!await this.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    this.onWeightUpdate = onWeightUpdate;

    try {
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [serviceUuid || '0000181d-0000-1000-8000-00805f9b34fb']
      });

      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(serviceUuid || '0000181d-0000-1000-8000-00805f9b34fb');
      this.characteristic = await service.getCharacteristic(characteristicUuid || '00002a9d-0000-1000-8000-00805f9b34fb');

      await this.characteristic.startNotifications();
      this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value;
        const weight = value.getFloat32(0, true);
        if (this.onWeightUpdate) {
          this.onWeightUpdate(weight);
        }
      });

      return true;
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.device && this.device.gatt.connected) {
      await this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.characteristic = null;
  }

  isConnected() {
    return this.device && this.device.gatt.connected;
  }
}

const bluetoothInstance = new BluetoothWeightScale();
export default bluetoothInstance;
