# 🧪 Test Frontend Integration - Quick Guide

## Step-by-Step Testing

### 1. Start the Servers (2 minutes)

#### Terminal 1 - Backend
```bash
cd backend
npm run start:dev
```
Wait for: `Application is running on: http://[::1]:3001`

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
Wait for: `ready - started server on 0.0.0.0:3000`

---

### 2. Login (1 minute)

1. Open browser: `http://localhost:3000`
2. Login with your credentials
3. Navigate to: **Dashboard → Knowledge Base**

---

### 3. Check the New Tab (30 seconds)

You should see **4 tabs** at the top:
- ✅ **🔄 Data Source Sync** (NEW! - Should be the first/default tab)
- Data Sources
- Documents
- Analytics

**Expected Result:** The "Data Source Sync" tab should be selected by default and showing the DataSourceManager component.

---

### 4. Test Empty State (30 seconds)

If you have no data sources yet, you should see:

```
┌─────────────────────────────────────────┐
│              📚                          │
│                                         │
│        No data sources yet              │
│                                         │
│  Connect external platforms to          │
│  automatically sync content             │
│                                         │
│      [+ Add Your First Data Source]     │
└─────────────────────────────────────────┘
```

**Test:**
- Click "Add Your First Data Source" button
- Should see a modal with platform options

---

### 5. Create a Test Data Source via API (3 minutes)

#### Open Terminal 3
```bash
cd backend

# Set your JWT token
export JWT_TOKEN="your-jwt-token-here"

# Set GitHub token (optional, for testing)
export GITHUB_TOKEN="ghp_your-github-token"

# Run test script
node test-data-source-sync.js
```

**Or create manually via curl:**
```bash
curl -X POST http://localhost:3001/knowledge-base/data-sources \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceType": "github",
    "name": "Test GitHub Repo",
    "description": "Testing data source sync",
    "authType": "api_key",
    "credentials": {
      "accessToken": "ghp_your_token"
    },
    "config": {
      "owner": "octocat",
      "repo": "Hello-World",
      "branch": "master",
      "fileExtensions": [".md"]
    },
    "syncFrequency": "manual"
  }'
```

---

### 6. Verify Data Source Appears (1 minute)

**Refresh the Knowledge Base page**

You should now see a data source card:

```
┌─────────────────────────────────────────┐
│ 🐙 Test GitHub Repo             ✅      │
│    github                               │
├─────────────────────────────────────────┤
│ Testing data source sync                │
├─────────────────────────────────────────┤
│ Status: active                          │
│ Frequency: manual                       │
│ Last Synced: Never                      │
├─────────────────────────────────────────┤
│               [🔄] [⚙️] [🗑️]            │
└─────────────────────────────────────────┘
```

**Check:**
- ✅ Card appears
- ✅ GitHub icon shows (🐙)
- ✅ Status is "active" (green checkmark)
- ✅ Name and description display
- ✅ Frequency shows "manual"
- ✅ Three buttons visible (Sync, Settings, Delete)

---

### 7. Test Sync Button (1 minute)

**Click the 🔄 (Sync) button**

**Expected behavior:**
1. Icon starts spinning
2. Status changes to "syncing" (blue spinning icon)
3. After a few seconds, completes
4. Status returns to "active" or "error"
5. Toast notification appears with result
6. "Last Synced" updates to current time

**Watch for:**
- Loading animation on button
- Status indicator changes
- Success/error notification
- Updated timestamp

---

### 8. Test Error Display (30 seconds)

If sync fails (e.g., invalid credentials):

**Expected:**
- Status shows red ❌ icon
- Error message appears in card
- Error is clear and helpful

---

### 9. Test Delete (30 seconds)

**Click the 🗑️ (Delete) button**

**Expected:**
1. Confirmation dialog appears
2. Click "OK"
3. Data source removed from view
4. Toast notification: "Data source deleted"
5. Back to empty state (if no other sources)

---

### 10. Test Dark Mode (30 seconds)

**Toggle dark mode** (if your app supports it)

**Check:**
- ✅ Component background changes
- ✅ Text remains readable
- ✅ Icons remain visible
- ✅ Cards have proper contrast
- ✅ Hover states work

---

### 11. Test Responsive Design (1 minute)

**Resize browser window** or use dev tools:

**Mobile (< 768px):**
- Cards should stack vertically
- One card per row
- Buttons remain accessible

**Tablet (768px - 1024px):**
- 2 cards per row
- Comfortable spacing

**Desktop (> 1024px):**
- 3 cards per row
- Full layout visible

---

### 12. Test Multiple Sources (2 minutes)

**Create 2-3 more data sources** via API

**Expected:**
- All cards display in grid
- Each has unique icon
- Scroll works if needed
- Layout remains organized

---

## ✅ Checklist

### Visual Tests
- [ ] Sync tab appears as first tab
- [ ] Empty state displays correctly
- [ ] Data source cards render properly
- [ ] Icons show correctly
- [ ] Status indicators work
- [ ] Buttons are visible and clickable
- [ ] Dark mode works
- [ ] Responsive layout works

### Functional Tests
- [ ] Can click sync button
- [ ] Sync status updates in real-time
- [ ] Error messages display
- [ ] Delete prompts for confirmation
- [ ] Toast notifications appear
- [ ] Last synced timestamp updates
- [ ] Modal opens when clicking "Add"

### API Integration Tests
- [ ] Data sources load from API
- [ ] Sync triggers API call
- [ ] Delete calls API
- [ ] Loading states show
- [ ] Errors handled gracefully

---

## 🐛 Common Issues & Solutions

### Issue: Tab Doesn't Appear
**Solution:**
```bash
# Clear Next.js cache
rm -rf frontend/.next
cd frontend && npm run dev
```

### Issue: Component Shows Error
**Check browser console for:**
- Import errors
- API connection errors
- Authentication issues

**Solution:**
```bash
# Verify imports
grep -r "DataSourceManager" frontend/src/

# Check API is running
curl http://localhost:3001/knowledge-base/sync/supported-sources
```

### Issue: No Data Sources Show
**Verify backend:**
```bash
# Check if data sources exist
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/knowledge-base/data-sources
```

### Issue: Sync Button Does Nothing
**Check:**
1. Network tab in browser dev tools
2. Backend logs
3. Console errors

**Debug:**
```bash
# Check endpoint exists
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/knowledge-base/sync/data-sources/YOUR_ID
```

---

## 📸 Screenshots to Verify

### 1. Empty State
![Empty State](Should show emoji, text, and button)

### 2. With Data Sources
![Data Sources](Should show cards in grid)

### 3. Syncing State
![Syncing](Should show spinning icon)

### 4. Error State
![Error](Should show red icon and message)

### 5. Success Toast
![Toast](Should show notification)

---

## 🎯 Success Criteria

✅ All visual elements render correctly
✅ All interactive elements respond to clicks
✅ API calls execute successfully
✅ Loading states display properly
✅ Error states handled gracefully
✅ Dark mode works correctly
✅ Responsive design functions
✅ Toast notifications appear

---

## 📊 Expected Performance

- **Load Time:** < 1 second for component
- **Sync Trigger:** Instant response
- **API Call:** 1-3 seconds depending on platform
- **Re-render:** Smooth, no flicker
- **Animations:** Smooth 60fps

---

## 🎓 Next Steps After Testing

### If Everything Works:
1. ✅ Mark integration as complete
2. ✅ Update documentation with screenshots
3. ✅ Demo to team/users
4. ✅ Deploy to staging/production

### If Issues Found:
1. 📝 Document the issue
2. 🔍 Check relevant logs
3. 🐛 Debug using browser tools
4. 💬 Ask for help if needed

---

## 💡 Pro Testing Tips

1. **Test in Incognito** - Ensures clean state
2. **Check Console** - Always have dev tools open
3. **Watch Network** - Monitor API calls
4. **Try Edge Cases** - Invalid data, slow connections
5. **Test Errors** - Intentionally break things to see handling

---

## 📞 Need Help?

**Backend not starting?**
→ Check [TROUBLESHOOTING-RAG-ISSUES.md](./TROUBLESHOOTING-RAG-ISSUES.md)

**API errors?**
→ Check backend logs: `cd backend && npm run start:dev`

**Component not rendering?**
→ Check browser console for errors

**Sync not working?**
→ Review [DATA-SOURCE-SYNC-IMPLEMENTATION.md](./DATA-SOURCE-SYNC-IMPLEMENTATION.md)

---

**Happy Testing!** 🧪✨

Once you complete this checklist, your frontend integration is fully verified and ready for use!
