# ✅ Document Source Display Added

## 🎯 What Was Added

Document cards now display the source of each document:

### 1. **For Synced Documents** (from data sources)
Shows:
```
🔗 Synced from GitHub
🔗 Synced from Confluence
🔗 Synced from Notion
```

### 2. **For Uploaded Documents with URL**
Shows:
```
🔗 github.com (clickable link)
🔗 docs.example.com (clickable link)
```

### 3. **For Manual Uploads**
No source indicator (just uploaded documents)

---

## 🎨 Design

- **Small icon** - Link icon (🔗)
- **Gray text** - Subtle, not distracting
- **Truncated** - Handles long URLs
- **Clickable** - External URLs open in new tab
- **Highlighted** - Source name in blue
- **Positioned** - Below category, above chunk count

---

## 📊 Information Displayed

### Data Source Documents
```
🔗 Synced from [source name]
```
- Shows it's from a data source
- Displays the source type if available

### URL Documents
```
🔗 hostname
```
- Shows domain name only
- Clickable to open in new tab
- Hover effect

---

## 🎨 Visual Example

```
┌─────────────────────────────────────┐
│ My Document Title           ✅      │
│ Jan 15, 2024                        │
├─────────────────────────────────────┤
│ [Documentation]                     │
│ 🔗 Synced from GitHub               │
│                                     │
│ 15 chunks          text/markdown    │
├─────────────────────────────────────┤
│ [View]              [🗑️]            │
└─────────────────────────────────────┘
```

---

## ✅ Features

- **Smart Display** - Shows relevant source info
- **Clickable Links** - External URLs open in new tab
- **Truncation** - Long URLs don't break layout
- **Color Coding** - Blue for source names
- **Icon** - Link icon for clarity
- **Hover State** - URLs highlight on hover
- **Stop Propagation** - Link clicks don't trigger card click

---

**Refresh your browser to see the source information on document cards!** 🎉
