# Test Session Flow - Step by Step

## 🎯 **The Issue**
You're not getting a session code because you need to complete the authentication flow first.

## 📋 **Step-by-Step Solution**

### **Step 1: Sign Up or Sign In**

1. **Go to your Auth Bridge**: https://trackmail-production.up.railway.app
2. **You should see the TrackMail login form**
3. **If you don't have an account**:
   - Enter your email and password
   - Click "Don't have an account? Sign up"
   - Click "Sign Up"
   - Check your email for confirmation
4. **If you already have an account**:
   - Enter your email and password
   - Click "Sign In"

### **Step 2: Get Session Handle**

After successful sign-in, you should see:
- ✅ "Sign-in complete! Copy your session handle below:"
- A session handle (long string of letters/numbers)
- A "Copy to Clipboard" button
- Expiration time

### **Step 3: Use Session Handle in Gmail Add-on**

1. **Copy the session handle** (click the button or select and copy)
2. **Go back to Gmail**
3. **Open the TrackMail add-on**
4. **Paste the session handle** in the "Session Handle" field
5. **Click "Save Session"**

## 🔧 **If You're Still Having Issues**

### **Check 1: Are you signed in to Supabase?**
- Go to: https://trackmail-production.up.railway.app
- You should see the login form, not an error

### **Check 2: Test the session endpoint directly**
Let me test if the session creation is working:
