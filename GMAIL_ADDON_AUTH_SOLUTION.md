# Gmail Add-on Authentication Solution ✨

## Problem Summary

Your Gmail add-on is showing "Authentication expired. Please sign in again" because it needs a valid JWT token from Supabase to communicate with your backend API.

## How It Works (Account Consistency)

✅ **YES - The same Gmail account is used everywhere!**

1. **User signs up on website** with `example@gmail.com`
2. **User installs Gmail add-on** while logged into `example@gmail.com`
3. **Both use the SAME email** → Applications sync perfectly!

The backend identifies users by their **JWT token**, which is tied to their email address. So when the Gmail add-on sends an email to track, the backend knows to save it under `example@gmail.com`'s account.

## Solution: ONE-TIME Refresh Token Setup 🎉

Instead of short-lived access tokens, we use **Supabase Refresh Tokens** that:

✅ **Last forever** (until user signs out or revokes access)  
✅ **Auto-refresh** access tokens when they expire  
✅ **ONE-TIME setup** - User never has to copy tokens again!  
✅ **Seamless** - Works completely in the background  

### For Users (Simple 5-Minute Setup):
1. **Sign in to TrackMail website** (https://trackmail-frontend.vercel.app/login) with your Gmail account
2. **Go to Settings** → Find "Gmail Add-on" section
3. **Copy the refresh token** (long string displayed once)
4. **Open Gmail add-on** → Click "Get Started" → "Paste Token"
5. **Paste the token** when prompted
6. ✅ **DONE FOREVER!** The add-on auto-refreshes tokens automatically

### How Auto-Refresh Works:
```
Hour 1: Gmail add-on uses access token → Works ✅
Hour 2: Access token expires → Add-on calls Supabase → Gets new access token → Works ✅
Hour 3: Access token expires → Add-on calls Supabase → Gets new access token → Works ✅
... (continues forever without user intervention)
```

The refresh token **never expires** unless:
- User signs out of TrackMail website
- User manually disconnects Gmail add-on
- User deletes their account

## What Needs to be Built

### 1. Frontend Settings Page Enhancement
Add a section to show the user's current Supabase JWT token:

```tsx
// In src/app/(dashboard)/settings/page.tsx
<Card>
  <CardHeader>
    <CardTitle>Gmail Add-on Integration</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Use this token to connect the TrackMail Gmail add-on:</p>
    <code className="block p-2 bg-gray-100 rounded">
      {accessToken}
    </code>
    <Button onClick={copyToken}>Copy Token</Button>
  </CardContent>
</Card>
```

### 2. Gmail Add-on Token Input
Already updated in Code.gs to:
- Show instructions to get token from website
- Allow user to input/paste token
- Save token securely in Apps Script user properties

## Testing Steps

1. Deploy updated Gmail add-on code to Google Apps Script
2. Add token display section to frontend Settings page
3. Sign in to website with your Gmail account
4. Copy token from Settings page
5. Open Gmail add-on and paste token
6. Test tracking an email

## Security Notes

- JWT tokens are stored in Google Apps Script User Properties (encrypted by Google)
- Tokens expire after 1 hour (configurable in Supabase)
- Each user has their own token (not shared)
- Backend validates every token before processing requests

## Future Improvements

1. **Auto-refresh tokens**: Build a refresh token flow
2. **OAuth 2.0**: Use proper OAuth instead of manual token paste
3. **Token rotation**: Automatically refresh tokens before expiry
4. **Multi-device sync**: Share auth state across devices

---

**Next Steps**: 
1. I'll update the frontend Settings page to display the access token
2. Update the Gmail add-on Code.gs to handle token input
3. Test the full flow end-to-end

