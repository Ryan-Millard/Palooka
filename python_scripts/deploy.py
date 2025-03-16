# Compiles & uploads code, then uploads static files in data directory
# Usage: pio run -t deploy

Import("env")
import sys

def deploy_firmware_and_filesystem(source, target, env):
    # Upload firmware
    result = env.Execute("pio run -t upload")
    if result != 0:
        print("Firmware upload failed. Exiting.")
        sys.exit(result)
    # Upload filesystem
    result = env.Execute("pio run -t uploadfs")
    if result != 0:
        print("Filesystem upload failed. Exiting.")
        sys.exit(result)
    # Monitor device
    result = env.Execute("pio device monitor")
    if result != 0:
        print("Monitoring failed. Exiting.")
        sys.exit(result)

# Register the custom target "deploy"
env.AddTarget("deploy", None, deploy_firmware_and_filesystem)
