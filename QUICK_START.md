# Quick Start Guide for VPS Deployment

## Step 1: Upload to VPS
```bash
scp -r vanguard-vps-package/ root@your-vps-ip:/tmp/
```

## Step 2: Connect to VPS
```bash
ssh root@your-vps-ip
cd /tmp/vanguard-vps-package
```

## Step 3: Run Setup Script
```bash
chmod +x vps-setup.sh
./vps-setup.sh
```

## Step 4: Upload Database
If you haven't uploaded the database yet:
1. On your local machine: run `./upload_databases.sh`
2. On VPS: download using the provided URLs

## Step 5: Verify
```bash
./health_check.sh
```

That's it! Your system should be running.
