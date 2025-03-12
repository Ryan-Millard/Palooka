# Compiles & uploads code, then uploads static files in data directory
# Usage: pio run -t deploy

Import("env")

def deploy_firmware_and_filesystem(source, target, env):
    # Upload firmware
    env.Execute("pio run -t upload")
    # Upload filesystem
    env.Execute("pio run -t uploadfs")

# Register the custom target "deploy"
env.AddTarget("deploy", None, deploy_firmware_and_filesystem)
