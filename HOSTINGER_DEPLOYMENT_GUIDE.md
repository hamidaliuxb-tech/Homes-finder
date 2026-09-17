# Homes Finder — Complete Hostinger Deployment Guide
(होस्टिंगर पर वेबसाइट और एडमिन पैनल लाइव करने की पूरी गाइड)

---

## 📌 Project Overview
- **Website Name**: Homes Finder (UAE Real Estate Advisory)
- **Frontend**: React 19 (Tailwind CSS, Radix UI / Shadcn, Framer Motion)
- **Backend**: FastAPI (Python 3.10+)
- **Database**: MongoDB (Local or MongoDB Atlas Cloud)
- **Admin Panel**: `/admin` (Manage Properties, Leads CRM, Website Content)
- **Default Admin Login**:
  - **Email**: `admin@homesfinder.ae`
  - **Password**: `Admin@HomesFinder2026`

---

## 🚀 Option 1: Hostinger VPS Deployment (Recommended - सब कुछ एक ही VPS पर)

Hostinger VPS (Ubuntu 22.04 or 24.04) सबसे बेस्ट और आसान तरीका है क्योंकि इसमें Backend (FastAPI), Database (MongoDB), और Frontend (React Nginx) सब कुछ 1-Click में Docker के जरिए चल जाता है।

### Step 1: VPS में SSH से कनेक्ट करें
Terminal (PowerShell / Command Prompt) खोलें:
```bash
ssh root@YOUR_SERVER_IP
```
*(Hostinger VPS Dashboard से अपना Server IP और Root Password लें)*

### Step 2: VPS में Docker और Git इनस्टॉल करें
```bash
apt update && apt upgrade -y
apt install -y git curl docker.io docker-compose
systemctl enable --now docker
```

### Step 3: Project Files VPS पर अपलोड करें
आप Git से क्लोन कर सकते हैं या `scp` / FileZilla (SFTP) से पूरा फोल्डर VPS पर `/var/www/homesfinder` में डाल सकते हैं:
```bash
mkdir -p /var/www/homesfinder
cd /var/www/homesfinder
# (Upload files here)
```

### Step 4: Docker Compose से Live करें
`/var/www/homesfinder` डायरेक्टरी के अंदर:
```bash
cd deploy
docker-compose up -d --build
```
यह कमांड:
1. MongoDB डेटाबेस शुरू करेगा
2. FastAPI बैकएंड बनाएगा और स्टार्ट करेगा (Port 8000)
3. React फ्रंटएंड को बिल्ड करके Nginx के जरिए Port 80 पर लाइव कर देगा
4. डेटाबेस में सारी प्रॉपर्टीज और डिफॉल्ट एडमिन यूजर ऑटोमैटिकली सीड कर देगा।

### Step 5: Domain Point करें और SSL (HTTPS) लगाएं
Hostinger DNS Management में जाकर:
- **Type**: `A Record` | **Host**: `@` | **Points to**: `YOUR_SERVER_IP`
- **Type**: `A Record` | **Host**: `www` | **Points to**: `YOUR_SERVER_IP`

Certbot से फ्री SSL लगाएं:
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.ae -d www.yourdomain.ae
```

---

## 🌐 Option 2: Hostinger Web / Cloud Hosting (hPanel - Shared Hosting)

अगर आपके पास Hostinger का Web Hosting (Shared/Cloud hPanel) प्लान है:
Web hosting केवल PHP/HTML/Static files सर्व करता है। इसलिए:
1. **Frontend**: React का प्रोडक्शन बिल्ड Hostinger के `public_html` में जाएगा।
2. **Backend & Database**: 
   - Database: **MongoDB Atlas** (100% Free Cloud Database)
   - Backend: Hostinger VPS या किसी फ्री/सस्ती Python होस्टिंग (Render.com / Railway.app / VPS) पर चलेगा।

### Step 1: MongoDB Atlas (फ्री क्लाउड डेटाबेस) सेटअप
1. [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) पर फ्री अकाउंट बनाएं।
2. **M0 Free Cluster** क्रिएट करें।
3. **Database Access** में जाकर एक Database User (Username & Password) बनाएं।
4. **Network Access** में जाकर `0.0.0.0/0` (Allow Access from Anywhere) ऐड करें।
5. **Connect** -> **Drivers** (Python) पर क्लिक करें और Connection String कॉपी करें:
   `mongodb+srv://username:password@cluster.mongodb.net/homesfinder_db?retryWrites=true&w=majority`

### Step 2: Backend को होस्ट करें (Render.com Web Service)
Backend के Environment Variables में:
```env
MONGO_URL=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/?appName=Cluster0
DB_NAME=homesfinder_db
DEFAULT_ADMIN_EMAIL=admin@homesfinder.ae
DEFAULT_ADMIN_PASSWORD=Admin@HomesFinder2026
ADMIN_EMAILS=admin@homesfinder.ae,hamid.aliuxb@gmail.com,hamid.a@homesfinder.ae
OWNER_EMAIL=hamid.aliuxb@gmail.com
CORS_ORIGINS=*
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=Homes Finder <onboarding@resend.dev>
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```
Backend को Render.com पर स्टार्ट करें:
- **Build Command**: `pip install -r requirements-prod.txt`
- **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`

मान लीजिए आपकी बैकएंड का URL बना: `https://homesfinder-api.onrender.com`

### Step 3: Frontend का Production Build बनाएं
अपने लोकल कंप्यूटर पर `frontend` फोल्डर में जाएं:
1. `frontend/.env` खोलें और अपना बैकएंड URL सेट करें:
   ```env
   REACT_APP_BACKEND_URL=https://api.yourdomain.ae
   ```
2. Build कमांड चलाएं:
   ```bash
   npm run build
   ```
3. यह `frontend/build` नाम का एक फोल्डर तैयार करेगा।

### Step 4: Hostinger File Manager में अपलोड करें
1. Hostinger hPanel लॉगिन करें -> **Websites** -> **Manage** -> **File Manager** खोलें।
2. `public_html` फोल्डर में जाएं।
3. `frontend/build` फोल्डर के अंदर की सारी फाइल्स (index.html, static, etc.) को `public_html` में सीधे अपलोड कर दें।
4. `public_html` में एक `.htaccess` फाइल बनाएं (React Router के लिए):
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

---

## 🔑 Admin Panel & Leads Testing (एडमिन लॉगिन और टेस्ट)

### 1. Admin Login कैसे करें:
- Browser में खोलें: `https://yourdomain.com/admin/login`
- **Email**: `admin@homesfinder.ae`
- **Password**: `Admin@HomesFinder2026`
- **Sign In to Admin** पर क्लिक करें।
- आप सीधे `/admin` डैशबोर्ड पर पहुंच जाएंगे।

### 2. Leads कैसे चेक और मैनेज करें:
- Admin Dashboard में **Leads / CRM** टैब खोलें।
- वेबसाइट पर कोई भी इंक्वायरी (Contact form, Sell property valuation form, Property detail enquiry) सबमिट करेगा, वह तुरंत यहाँ दिखेगी।
- आप लीड का स्टेटस (New, Contacted, Viewing, Negotiation, Closed, Lost) अपडेट कर सकते हैं।
- **Export CSV** बटन पर क्लिक करके सारी लीड्स को Excel/CSV फाइल में डाउनलोड कर सकते हैं।

### 3. Properties Add / Edit करना:
- **Properties** टैब में जाकर **Add Property** पर क्लिक करें।
- Title, Price, Emirate (Dubai, Abu Dhabi, etc.), Photos (Upload या Image URL) डालकर सेव करें।
- वेबसाइट पर Real-time में लिस्टिंग लाइव हो जाएगी।

### 4. Website Content एडिट करना:
- **Website Content** टैब में जाकर Hero text, Phone, WhatsApp number, FAQs, Social links एडिट करके **Save All Changes** दबाएं।

---

## 📞 Support & Configuration Checklist
- [x] Direct Admin Login enabled (no Google OAuth dependency)
- [x] Full UAE properties seeded across Dubai, Abu Dhabi, Sharjah
- [x] Invest page populated with curated high-yield listings
- [x] Interactive Map Embed fixed
- [x] FAQ section rendered on Home page
- [x] Export to CSV enabled on Leads CRM
- [x] Production Docker and Nginx configs ready
