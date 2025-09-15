<h1 align="center">🥊 Palooka</h1>

<p align="center">
  <strong>An open-source ESP32-powered battle robot project</strong><br>
  Hackable. Modular. Fun to build.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-in_development-orange?style=for-the-badge">
  <img src="https://img.shields.io/badge/license-GPLv3-blue?style=for-the-badge">
  <img src="https://img.shields.io/badge/made_with-ESP32-00ccff?style=for-the-badge">
</p>

---

## ✨ Features

- 🧠 **ESP32-based brain** – Fast, Wi-Fi enabled, ready for WebSocket & HTTP control.
- 🎛 **Web Dashboard** – Control and monitor your Palooka from any device.
- 🛠 **Fully Open Source** – Hardware diagrams + firmware all in one repo.
- 🔌 **Plug & Play Setup** – Minimal dependencies, fast deployment scripts.
- 🔄 **OTA Updates** – Keep your robot up-to-date without plugging in.

## 📸 Demo

<p align="center">
  🚧 <strong>Coming Soon:</strong> A slick GIF/video of Palooka in action will go here!<br>
  <em>(Imagine a little robot doing donuts right now...)</em>
</p>

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Ryan-Millard/Palooka.git
cd Palooka
````

### 2️⃣ Install Dependencies

* [PlatformIO](https://platformio.org/install)
* [Node.js](https://nodejs.org/) (for Vite)
* [Vite](https://vitejs.dev/)
* Python 3.8+

### 3️⃣ Build & Upload Firmware & Filesystem

```bash
pio run -t deploy
```

### 4️⃣ Launch Web Dashboard

1. Open your WiFi settings and connect to the access point with `Palooka_` as its prefix. The other characters will differ from the example below as it will be your device's MAC address, which is unique.
![Screenshot_20250915_021911_Settings](https://github.com/user-attachments/assets/28e253ff-50cb-4df2-9528-f1e1d16a51cb)
2. Open your browser and search `192.168.4.1`.
![Screenshot_20250915_020314_Chrome - Copy](https://github.com/user-attachments/assets/32806f59-ce1a-49c2-9d63-dbbbd48e23b4)
3. You should now have the dashboard open and it should look like the screenshot below:
<div align="center">
  <img style="height: 60vh;" src="https://github.com/user-attachments/assets/fcbd0640-aa34-43d8-9e77-f0d575f4eb5f" alt="Web Dashboard">
</div>

## 🛠 Hardware
Check out the [hardware folder](https://github.com/Ryan-Millard/Palooka/tree/main/hardware) for this section.

<details>
  <summary><h4>Quick Overview (screenshots)</h4></summary>
  <div align="center">
    <img width="1153" height="808" alt="SCH_mootbotv2_2025-08-07 screenshot" src="https://github.com/user-attachments/assets/c8762552-96aa-46a9-9586-58da33ba80d7" />
    <img width="642" height="532" alt="PCB_mootbotv2_2025-08-07 screenshot" src="https://github.com/user-attachments/assets/b92520e2-db4a-49b7-bd0e-cf7a3a4a76e9" />
  </div>
</details>

## 📚 Documentation

Full documentation is **coming soon** – but key files are already annotated,
and the [Issues](https://github.com/Ryan-Millard/Palooka/issues) tab is open for questions.

## 🤝 Contributing

Contributions are welcome!
Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) and check out the `CONTRIBUTING.md` (coming soon) before submitting PRs.

## 📜 License

This project is licensed under **GPL v3** – see the [LICENSE](./LICENSE) file for details.

## 🥂 Acknowledgements

* **[Magtouch Electronics](https://www.magtouchelectronics.co.za/)🔌** – Board design, funding, and hardware support  
* **Marc d'Hotman de Villiers** – Hardware design input and software brainstorming  
* **Ryan Millard** – Software development and firmware  
* ESP32 + [PlatformIO](https://platformio.org/)👽 community  
* Everyone testing early builds and sharing feedback  
* Joan 🦔 & Bruce 🐕, for moral support 🖤


<p align="center">
  <em>"Palooka is not just a robot — it's your new favorite science project."</em><br>
  — <strong>Ryan Millard</strong>
</p>
