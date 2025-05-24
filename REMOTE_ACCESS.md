# Remote Access Setup for Python Tasks HQ

This document outlines how to access your local Python Tasks HQ application from anywhere using SSH tunneling.

## Prerequisites

1. Your local machine (where the app runs) needs:
   - Node.js and npm installed
   - The Python Tasks HQ application running
   - SSH server enabled
   - A static IP address or domain name (for consistent access)

2. Your remote machine needs:
   - SSH client installed
   - A web browser

## Setup Steps

### 1. Local Machine Setup

1. Start the application:
   ```bash
   npm start
   ```
   The server should be running on port 3000.

2. Ensure SSH server is running:
   - On macOS: SSH is usually pre-installed
   - On Linux: `sudo systemctl status sshd`
   - On Windows: Enable OpenSSH Server

3. Find your local machine's IP address:
   - On macOS/Linux: `ifconfig` or `ip addr`
   - On Windows: `ipconfig`

### 2. Remote Access

1. From any remote machine, open a terminal and run:
   ```bash
   ssh -L 3000:localhost:3000 your-username@your-local-machine-ip
   ```
   Replace:
   - `your-username` with your local machine username
   - `your-local-machine-ip` with your local machine's IP address

2. Open a web browser and navigate to:
   ```
   http://localhost:3000
   ```

## Security Notes

- The SSH tunnel provides encrypted access
- Only you can access the application (requires your SSH credentials)
- No need to expose the server to the public internet
- All data remains on your local machine

## Troubleshooting

1. **Can't connect to SSH**
   - Verify SSH server is running on local machine
   - Check firewall settings
   - Ensure correct IP address

2. **Can't access localhost:3000**
   - Verify the Express server is running
   - Check if port 3000 is already in use
   - Ensure SSH tunnel is established

3. **Connection drops**
   - Check your internet connection
   - Re-establish the SSH tunnel
   - Verify the local server is still running

## Additional Tips

- Keep the SSH connection open while using the application
- Consider using SSH config file for easier connection
- You can run the application in the background using `nohup` or `pm2`
- For consistent access, consider setting up a static IP or domain name 