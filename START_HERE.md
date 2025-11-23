# 🚀 Quick Start Guide - Bunny.net Video Management

Your VegaPilot portal is now configured with your actual Bunny.net account!

## ✅ Configuration Complete

Your credentials are securely stored in `.env`:
- **API Key**: `cd6da829-5ed4-4beb-b771784ac76e-01ed-43fa`
- **Library ID**: `534211`
- **CDN Hostname**: `vz-031fe1cb-299.b-cdn.net`

---

## 📋 Step-by-Step Setup

### Step 1: Install Dependencies

Open Terminal and run:

```bash
cd /Users/abhijithcs/personal/vegaPilot
npm install
```

This will install:
- express (web server)
- axios (HTTP client)
- cors (cross-origin support)
- multer (file upload handling)
- dotenv (environment variables)

### Step 2: Start the Server

```bash
npm start
```

You should see:
```
🚀 Bunny.net Proxy Server Started!
📡 Server running at: http://localhost:3000
📹 Video Library ID: 534211
🔗 CDN Hostname: vz-031fe1cb-299.b-cdn.net
🌐 Admin Portal: http://localhost:3000/bunny-admin.html

✅ Ready to manage your Bunny.net videos!
```

### Step 3: Open the Portal

Open your browser and go to:

```
http://localhost:3000/bunny-admin.html
```

🎉 **You're now connected to your real Bunny.net account!**

---

## 🎬 What You Can Do Now

### ✅ View Your Actual Videos
- All your existing Bunny.net videos will load automatically
- Organized by the folders/collections you have in Bunny.net

### ✅ Create New Folders
1. Click the **+** button next to "Video Folders"
2. Enter folder name and description
3. Click "Create Folder"
4. Folder is created directly in your Bunny.net account

### ✅ Rename Folders
1. Hover over any folder in the sidebar
2. Click the pencil icon that appears
3. Enter the new folder name
4. Click "Rename Folder"
5. Folder is renamed directly in your Bunny.net account

### ✅ Upload Videos
1. Click "Upload Videos" button
2. Select destination folder
3. Drag & drop video files or browse
4. Videos upload directly to Bunny.net

### ✅ Manage Videos
- **Play**: Click any video card to stream
- **Rename**: Click "Rename" button on video card
- **Delete**: Click "Delete" button (with confirmation)

### ✅ Search & Filter
- Search across all videos
- Sort by name, date, duration, or size
- Filter by folder

---

## 🔧 Server Commands

### Start Server (Production)
```bash
npm start
```

### Start with Auto-Reload (Development)
```bash
npm run dev
```
(Auto-restarts when you change code)

### Stop Server
Press `Ctrl + C` in the terminal

---

## 📁 File Structure

```
vegaPilot/
├── .env                        # Your Bunny.net credentials (KEEP SECRET!)
├── .gitignore                  # Prevents committing secrets to git
├── package.json                # Node.js dependencies
├── bunny-proxy-server.js       # Backend API server
├── bunny-admin.html            # Admin portal interface
├── controllers/
│   └── bunny-admin.js          # Frontend logic
└── uploads/                    # Temporary upload directory (created automatically)
```

---

## 🔐 Security Notes

### ⚠️ IMPORTANT:

1. **Never commit `.env` to git!**
   - It's already in `.gitignore`
   - Contains your secret API key

2. **Keep your API key private**
   - Anyone with this key can manage your Bunny.net videos
   - Regenerate it in Bunny.net dashboard if compromised

3. **Production deployment**
   - Use HTTPS (not HTTP)
   - Set `NODE_ENV=production` in `.env`
   - Add authentication to the admin portal

---

## 📊 Testing the Connection

### Check Health
Visit: `http://localhost:3000/health`

You should see:
```json
{
  "status": "ok",
  "bunnynet": {
    "connected": true,
    "libraryId": "534211",
    "cdnHostname": "vz-031fe1cb-299.b-cdn.net"
  }
}
```

### API Endpoints Available

All these endpoints are working with your account:

- `GET /api/bunny/folders` - Get all folders
- `POST /api/bunny/folders` - Create new folder
- `PUT /api/bunny/folders/:id` - Rename folder
- `GET /api/bunny/videos?folderId=X` - Get videos
- `POST /api/bunny/upload` - Upload video
- `POST /api/bunny/rename` - Rename video
- `POST /api/bunny/delete` - Delete video
- `GET /api/bunny/stream?id=X` - Stream video

---

## 🐛 Troubleshooting

### Server won't start
**Error**: `Cannot find module 'express'`
**Solution**: Run `npm install` first

### Port 3000 already in use
**Solution**: Change port in `.env`:
```
PORT=3001
```

### Can't see videos
**Check**:
1. Server is running (`npm start`)
2. Visit `http://localhost:3000/health` - should show "ok"
3. Check browser console for errors (F12)
4. Check server terminal for error messages

### Upload fails
**Common causes**:
- File too large (check Bunny.net limits)
- Invalid file format
- Network timeout

**Check server logs** in the terminal for detailed error messages

---

## 📞 Next Steps

### 1. Test Basic Operations
- ✅ View existing videos
- ✅ Create a test folder
- ✅ Upload a small test video
- ✅ Rename it
- ✅ Delete it

### 2. Customize (Optional)
- Update colors in `bunny-admin.html`
- Add more filtering options
- Implement user authentication

### 3. Deploy to Production
- Set up on a cloud server (AWS, DigitalOcean, etc.)
- Configure HTTPS with SSL certificate
- Set environment variables on server
- Add authentication/authorization

---

## 🎉 You're All Set!

Your VegaPilot portal is now connected to your Bunny.net account and ready to use!

**Questions?**
- Check `BUNNY_ADMIN_README.md` for detailed documentation
- Check `BUNNY_NET_SETUP_GUIDE.md` for setup information
- Look at server logs for debugging

**Happy video managing! 🎬**
