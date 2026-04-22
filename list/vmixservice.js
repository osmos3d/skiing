const net = require("net");

class vMixService {
  constructor(host = "localhost", port = 8099) {
    this.host = host;
    this.port = port;
    this.client = new net.Socket();
    this.queue = [];
    this.isConnected = false;
    this.processingQueue = false;
    this.reconnecting = false;
    this.currentCommand = null;
    this.reconnectionInterval = null;

    this.client.on("connect", () => {
      console.log("Connected to vMix");
      this.isConnected = true;
      this.reconnecting = false;
      if (this.reconnectionInterval) {
        clearInterval(this.reconnectionInterval);
        this.reconnectionInterval = null;
      }
      this.processQueue();
    });

    this.client.on("error", (err) => {
      console.error("vMix connection error:", err);
      this.isConnected = false;
    });

    this.client.on("close", () => {
      if (this.reconnecting) return;
      console.log("vMix connection closed, attempting to reconnect...");
      this.isConnected = false;

      this.reconnectionInterval = setInterval(() => {
        this.connect();
      }, 3000);
    });

    this.client.on("data", (data) => {
      this.handleResponse(data.toString());
    });

    this.connect();
  }

  connect() {
    if (this.isConnected) return;
    this.client.connect(this.port, this.host);
  }

  handleResponse(response) {
    if (this.currentCommand) {
      const { command, resolve, reject } = this.currentCommand;
      if (response.split(" ")[1] === "OK") {
        resolve();
      } else {
        console.error(`Command "${command}" failed with response: ${response}`);
        resolve();
        //reject(new Error(`Command failed with response: ${response}`));
      }
      this.currentCommand = null;
      this.processQueue();
    }
  }

  async sendCommand(command) {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      this.queue.push({ command, resolve, reject, timestamp });

      if (this.isConnected && !this.processingQueue) {
        this.processQueue();
      }
    });
  }

  async processQueue() {
    if (this.processingQueue || this.currentCommand) return;

    this.processingQueue = true;
    while (this.queue.length > 0 && this.isConnected) {
      this.currentCommand = this.queue.shift();
      const { command, timestamp } = this.currentCommand;

      if (Date.now() - timestamp > 10000) {
        this.currentCommand.reject(new Error("Command timed out"));
        this.currentCommand = null;
        continue;
      }

      try {
        await new Promise((res, rej) => {
          this.client.write(`${command}\r\n`, "ascii", (err) => {
            if (err) {
              console.error("Error writing command:", err);
              rej(err);
            } else {
          //    console.log("Command sent:", command);
              res();
            }
          });
        });
        break; // Wait for the response before processing the next command
      } catch (error) {
        console.error("Command processing error:", error);
        this.currentCommand.reject(error);
        this.currentCommand = null;
      }
    }
    this.processingQueue = false;
  }

  buildCommand(functionName, params) {
    const paramString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");
    return `FUNCTION ${functionName} ${paramString}`;
  }

  updateText(titleId, textField, text) {
    const command = this.buildCommand("SetText", {
      Input: titleId,
      SelectedName: textField + ".Text",
      Value: text,
    });
    return this.sendCommand(command);
  }

  setTextColor(titleId, textField, color) {
    const command = this.buildCommand("SetTextColour", {
      Input: titleId,
      SelectedName: textField + ".Text",
      Value: color,
    });
    return this.sendCommand(command);
  }

  updateImage(titleId, imageField, imageUrl) {
    const command = this.buildCommand("SetImage", {
      Input: titleId,
      SelectedName: imageField + ".Source",
      Value: imageUrl,
    });
    return this.sendCommand(command);
  }

  showTitle(titleId, layer) {
    console.log(`Show title ${titleId}, layer ${layer}`);
    const command = this.buildCommand(`OverlayInput${layer}In`, {
      Input: titleId,
    });
    return this.sendCommand(command);
  }

  hideTitle(layer) {
    const command = this.buildCommand(`OverlayInput${layer}Out`, {});
    return this.sendCommand(command);
  }

  toggleTitleVisibility(titleId, layer) {
    const command = this.buildCommand(`OverlayInput${layer}`, {
      Input: titleId,
    });
    return this.sendCommand(command);
  }

  hideAllTitles() {
    const command = this.buildCommand("OverlayInputAllOff", {});
    return this.sendCommand(command);
  }

  navigateTitle(titleId, page) {
    const command = this.buildCommand("TitleBeginAnimation", {
      Input: titleId,
      Value: page,
    });
    return this.sendCommand(command);
  }

  setCrop(titleId, x1, y1, x2, y2) {
    const command = this.buildCommand("SetCrop", {
      Input: titleId,
      Value: `${x1},${y1},${x2},${y2}`,
    });
    return this.sendCommand(command);
  }

  setPosition(titleId, x, y) {
    const panXCommand = this.buildCommand("SetPanX", {
      Input: titleId,
      Value: x,
    });
    const panYCommand = this.buildCommand("SetPanY", {
      Input: titleId,
      Value: y,
    });
    return Promise.all([
      this.sendCommand(panXCommand),
      this.sendCommand(panYCommand),
    ]);
  }

  setCountdown(titleId, duration) {
    const command = this.buildCommand("SetCountdown", {
      Input: titleId,
      Value: duration,
    });
    return this.sendCommand(command);
  }

  changeCountdown(string, duration) {
    const command = this.buildCommand("ChangeCountdown", {
      Input: titleId,
      Value: duration,
    });
    return this.sendCommand(command);
  }

  startCountdown(titleId) {
    const command = this.buildCommand("StartCountdown", {
      Input: titleId,
    });
    return this.sendCommand(command);
  }

  stopCountdown(titleId) {
    const command = this.buildCommand("StopCountdown", {
      Input: titleId,
    });
    return this.sendCommand(command);
  }

  resetCountdown(titleId) {
    const command = this.buildCommand("ResetCountdown", {
      Input: titleId,
    });
    return this.sendCommand(command);
  }
  setPreview(input) {
  const command = this.buildCommand("PreviewInput", {
    Input: input
  });
  return this.sendCommand(command);
}

}

module.exports = vMixService;
