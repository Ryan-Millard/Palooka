# Contributing to **Palooka**

## Code of Conduct
This repository has adopted the the [**Contributor Covenant**](https://github.com/Ryan-Millard/Palooka/blob/main/CODE_OF_CONDUCT.md) and all participants in the community are expected to adhere to it.
Please read through it to understand what you may and may not do in this community.

## Open to Everyone
Every contribution to this project happens on this repository and **all contributions are welcome** and treated equally.
Core team members and external contributors send pull requests that go through the same review processes.

## Branching Strategy
All changes should be submitted directly to the **main** branch via a pull request since there are no distinct development or production branches -
the aim is to ensure every change is fully-functional and compatible with the latest version.
This means that every contribution should be suitable for production/release.

## Bugs/Vulnerabilities
### Location
The [GitHub Issues](https://github.com/features/issues) tab for this repository is where public bugs and vulnerabilities are reported.
Try to make sure the bug/vulnerability doesn't already exist before filling out a new report.
### New Reports
Since this project does not involve highly sensitive data and vulnerabilities are likely to be mild, most bugs and vulnerabilities can safely (and should) be directed to this respository's [**Issues**](https://github.com/Ryan-Millard/Palooka/issues) section.

## Before You Contribute
Time is valuable, so we recommend first creating an [**issue**](https://github.com/Ryan-Millard/Palooka/issues) before you put large amounts of effort into any non-trivial change.

If you are fixing a bug or vulnerability, you don't need to create an issue beforehand, but it may be more beneficial in case the implementation of the patch doesn't get accepted.

## Your First Pull Request
### New to this?
You can find out how to create your first pull request from this free video playlist: [How to Contribute to an Open Source Project on GitHub](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github)
### Honing in on Your First Issue
Issues marked with the [**good first issue label**](https://github.com/Ryan-Millard/Palooka/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22good%20first%20issue%22) are perfect for newcomers as they contain bugs, vulnerabilities, or new features
that have limited scopes and will gradually introduce you to our codebase.
### Before You Start
Make sure to check the comments section of the issue before you start working on it to ensure you don't accidentally duplicate anyone else's work.
In the same breath, please leave a comment stating that you intend to work on it to avoid other people doing your work.
If a comment that claims an issue is older than 3 weeks and no changes have been made in that time, it is declared stale and others may take over it. In this case, please still leave a comment to claim the issue for yourself.

## Submitting Pull Requests
Pull requests are constantly monitored and will be reviewed and either merged, have changes requested, or closed with clear reasons.
If the reasons are not clear enough, you are welcome to ask for clarity.

## Prerequisites
### Software
* [PlatformIO](https://platformio.org/install)
* [Node.js](https://nodejs.org/) (for Vite)
* [Vite](https://vitejs.dev/)
  * Once installed, paste the below into your shell to install the project's dependencies:
    ```bash
    cd frontend
    npm install
    cd ..
    ```
* [Python 3.8+](https://www.python.org/downloads/)
  * Some Python libraries must be installed if you intend to run any of the Python scripts (see the following section or [**requirements.txt**](https://github.com/Ryan-Millard/Palooka/blob/main/dev_scripts/requirements.txt)).
### Hardware
* **Development board** matching the specifications in the [**hardware folder.**](https://github.com/Ryan-Millard/Palooka/tree/main/hardware)
* **Micro USB** (USB-B) to **USB-A** cable capable of data transfer and charging.
* **9g micro servo** - only necessary if you intend on working on the servo's logic.
* **2 Motors** that can run on 5V.

## Custom Development Scripts
### Installing Dependencies
#### 1️⃣ Create & Activate Virtual Environment
**Windows:**
```cmd
python -m venv .venv
.venv\Scripts\activate
```
**macOS/Linux:**
```bash
python -m venv .venv
source .venv/bin/activate
```
#### 2️⃣ Install Python Dependencies
**Windows, macOS, & Linux:**
```python
python -m pip install -r requirements.txt
```
### PlatformIO Custom Targets
> [!IMPORTANT]
> Always activate the virtual environment before running any Python scripts.
>
> **On Windows:**
> ```cmd
> .venv\Scripts\activate.bat
> ```
>
> **On macOS/Linux:**
> ```bash
> source .venv/bin/activate
> ```

The following commands are defined via PlatformIO extra scripts in `platformio.ini`, `envs/dev.ini`, and `envs/prod.ini`. They automate flashing, QR code generation, and filesystem uploads. Run them from the project root:
| Command                       | Purpose                                                                                                                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pio run -t deploy`           | Compiles and uploads firmware to the connected ESP32. Also builds & uploads the filesystem (`data/`) if `deployfs.py` is included.                                                 |
| `pio run -t deployfs`         | Builds the frontend (`frontend/`) using Vite, then uploads the static files to the ESP32 filesystem.                                                                               |
| `pio run -t dev`              | Shortcut to `deploy` + `pio device monitor`. Uploads firmware & filesystem, then opens a serial monitor for debugging.                                                             |
| `pio run -t qr_gen`           | Detects the attached ESP32, reads its MAC address, and generates a Wi-Fi QR sticker PNG in `assets/qr/`.                                                                           |
| `pio run -t append_qr_to_pdf` | Appends the QR sticker of the currently attached ESP32 to a PDF (`assets/qr/stickers.pdf`) with index and layout.                                                                  |
| `pio run -t qrflashstorm`     | Watches for new ESP32 devices on serial ports. Automatically runs `deploy` and `append_qr_to_pdf` for each device as it is connected. Useful for flashing multiple boards quickly. |

**Notes:**
* `UPLOAD_PORT` or `PIO_UPLOAD_PORT` environment variable can be set manually to specify a particular device. Otherwise, scripts attempt to auto-detect the ESP32.
* `qrflashstorm` may require manual termination if Ctrl+C doesn’t stop it (see the script header for OS-specific instructions).
* The default environment is development (`dev`). To use the production environment (`prod`), make sure to add `-e prod` or `--environment prod` to the command.

### Frontend Build & Preview
The frontend uses [Vite](https://vitejs.dev/) and is located in [**frontend/**](https://github.com/Ryan-Millard/Palooka/tree/main/frontend).
These scripts build the HTML/CSS/JS that are uploaded to the ESP32 filesystem:
| Command           | Purpose                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `npm run dev`     | Runs Vite in development mode with live reload. Useful for local testing of the frontend. |
| `npm run build`   | Builds production-ready static files and outputs them to `data/` (used by PlatformIO).    |
| `npm run preview` | Serves the production build locally so you can preview before uploading to the ESP32.     |

**Notes:**
- Always run these commands from the [**frontend/**](https://github.com/Ryan-Millard/Palooka/tree/main/frontend) folder.
- When running `pio run -t deployfs`, the script will automatically run npm run build for you and copy the files to the ESP32 filesystem.
- Make sure you have [Node.js](https://nodejs.org/) installed and dependencies installed via npm install before running any Vite commands.

## License
By contributing to Palooka, you agree that your contributions will be licensed under its [GPL-3.0 license](https://github.com/Ryan-Millard/Palooka#GPL-3.0-1-ov-file).
