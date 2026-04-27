// WiFi/HTTP weight machine integration utility
class WifiWeightScale {
  constructor() {
    this.url = null;
    this.intervalId = null;
    this.onWeightUpdate = null;
    this.isPolling = false;
  }

  async connect(url, onWeightUpdate, interval = 1000) {
    if (!url) {
      throw new Error('URL is required');
    }
    this.url = url;
    this.onWeightUpdate = onWeightUpdate;
    this.isPolling = true;

    // Perform an initial fetch immediately
    await this.fetchWeight();

    this.intervalId = setInterval(() => {
      this.fetchWeight();
    }, interval);

    return true;
  }

  async fetchWeight() {
    try {
      const response = await fetch(this.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      let weight;

      if (contentType.includes('application/json')) {
        const data = await response.json();
        weight = parseFloat(data.weight ?? data.value ?? data);
      } else {
        const text = await response.text();
        weight = parseFloat(text);
      }

      if (!isNaN(weight) && this.onWeightUpdate) {
        this.onWeightUpdate(weight);
      }
    } catch (error) {
      console.error('WiFi scale fetch error:', error);
    }
  }

  disconnect() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPolling = false;
    this.url = null;
  }

  isConnected() {
    return this.isPolling;
  }
}

const wifiInstance = new WifiWeightScale();
export default wifiInstance;

