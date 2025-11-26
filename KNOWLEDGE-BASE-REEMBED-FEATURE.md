# Knowledge Base: Re-embed Button Feature

## ✨ Feature Added

Added a **Re-embed** button to the Knowledge Base documents interface, allowing users to regenerate embeddings for documents.

## 🎯 What It Does

The re-embed button triggers the re-indexing of a document in the vector store, which:
1. Regenerates embeddings for all document chunks
2. Updates the vector store with new embeddings
3. Improves search results if embeddings were outdated or corrupted

## 📍 Location

The re-embed button appears in both view modes:

### Grid View
```
┌─────────────────────┐
│ Document.pdf        │
│ 📁 docs/            │
│ ✓ completed         │
│                     │
│ [👁️ View] [✨] [🗑️] │
│           ↑         │
│      Re-embed       │
└─────────────────────┘
```

### List View
```
┌──────────────┬────────┬─────────────────┐
│ Document     │ Status │ Actions         │
├──────────────┼────────┼─────────────────┤
│ Document.pdf │   ✓    │ [👁️] [✨] [🗑️] │
│              │        │       ↑         │
└──────────────┴────────┴────Re-embed─────┘
```

## 🎨 Visual Design

- **Icon:** ✨ Sparkles (SparklesIcon from Heroicons)
- **Color:** Purple theme
  - Light mode: Purple-600 text on purple-50 background
  - Dark mode: Purple-400 text on purple-900/20 background
- **Position:** Between "View" and "Delete" buttons
- **Tooltip:** "Re-embed document" on hover

## 🔧 Implementation Details

### Backend Endpoint
```
POST /knowledge-base/documents/:id/index
```

**Response:**
```json
{
  "message": "Document indexed successfully"
}
```

### Frontend Changes

#### 1. Added Import
```typescript
import { SparklesIcon } from '@heroicons/react/24/outline'
```

#### 2. Created Mutation
```typescript
const reembedDocumentMutation = useMutation({
  mutationFn: (id: string) => api.post(`/knowledge-base/documents/${id}/index`),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['documents'] })
  },
})
```

#### 3. Added Handler
```typescript
const handleReembedDocument = (id: string, title: string) => {
  if (confirm(`Re-embed "${title}"? This will regenerate embeddings for all chunks.`)) {
    reembedDocumentMutation.mutate(id)
  }
}
```

#### 4. Added Buttons (Grid & List views)
```tsx
<button
  onClick={() => handleReembedDocument(doc.id, doc.title)}
  className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
  title="Re-embed document"
>
  <SparklesIcon className="w-4 h-4" />
</button>
```

## 🎯 Use Cases

### When to Re-embed

1. **After Model Updates**
   - When you upgrade your embedding model
   - When you switch embedding providers
   - To take advantage of improved models

2. **Search Quality Issues**
   - Document not appearing in relevant searches
   - Poor search result rankings
   - Suspected embedding corruption

3. **Content Updates**
   - After significant document edits
   - When metadata changes
   - After chunking strategy changes

4. **Troubleshooting**
   - Vector store sync issues
   - Debugging search problems
   - Testing search configurations

## 📋 User Experience

### Confirmation Dialog
```
Re-embed "Document.pdf"?
This will regenerate embeddings for all chunks.

[Cancel]  [OK]
```

### Process Flow
```
User clicks Re-embed button
         ↓
Confirmation dialog appears
         ↓
User confirms
         ↓
API call to backend
         ↓
Document re-indexed
         ↓
Document list refreshes
         ↓
Success!
```

## 🔄 What Happens During Re-embedding

1. **Backend receives request** for document ID
2. **Fetches document chunks** from database
3. **Generates new embeddings** for each chunk
4. **Updates vector store** (Qdrant) with new embeddings
5. **Returns success message**
6. **Frontend refreshes** document list

## 💡 Tips

### For Users
- **When in doubt, re-embed:** It's safe and non-destructive
- **Watch for status:** Document remains accessible during re-embedding
- **Batch operations:** For multiple documents, use the "Re-index All" feature
- **Test searches:** Re-embed if document isn't showing up in searches

### For Developers
- **Idempotent operation:** Safe to call multiple times
- **No data loss:** Original content unchanged
- **Async-friendly:** Can be made async for large documents
- **Error handling:** Gracefully handles failures

## 🚀 Quick Test

### Test the Feature:
```bash
1. Start the application
2. Go to Knowledge Base → Documents
3. Find any document
4. Click the sparkles icon (✨)
5. Confirm the dialog
6. Wait for completion
7. Document embeddings are now refreshed!
```

## 📊 Button Layout

### Grid View Actions
```
[View (Blue)]  [Re-embed (Purple)]  [Delete (Red)]
    Full width      Icon only          Icon only
```

### List View Actions
```
[View Icon]  [Re-embed Icon]  [Delete Icon]
   Blue          Purple           Red
```

## 🎨 Color Scheme

| Button | Light Mode | Dark Mode | Hover |
|--------|-----------|-----------|-------|
| **View** | Blue-600 on Blue-50 | Blue-400 on Blue-900/20 | Blue-100 / Blue-900/40 |
| **Re-embed** | Purple-600 on Purple-50 | Purple-400 on Purple-900/20 | Purple-100 / Purple-900/40 |
| **Delete** | Red-600 on Red-50 | Red-400 on Red-900/20 | Red-100 / Red-900/40 |

## 🔐 Security

- ✅ **Authentication required** (JWT guard on endpoint)
- ✅ **Organization scoped** (can only re-embed own documents)
- ✅ **User confirmation** (prevents accidental clicks)
- ✅ **No destructive actions** (doesn't delete original data)

## 📈 Future Enhancements

### Potential Improvements:
1. **Bulk Re-embed**
   - Select multiple documents
   - Re-embed all at once
   - Progress indicator

2. **Smart Re-embed**
   - Detect outdated embeddings
   - Auto-suggest re-embedding
   - Schedule periodic re-indexing

3. **Status Indicator**
   - Show "Re-embedding..." status
   - Progress percentage
   - Estimated time remaining

4. **Analytics**
   - Track re-embed frequency
   - Measure embedding quality
   - Compare before/after search performance

5. **Batch Operations**
   - Re-embed by category
   - Re-embed by data source
   - Re-embed by date range

## 🐛 Troubleshooting

### Button Not Visible
**Issue:** Re-embed button not showing

**Solutions:**
1. Clear browser cache
2. Check if you're logged in
3. Verify document permissions
4. Refresh the page

### Re-embed Fails
**Issue:** Error when clicking re-embed

**Solutions:**
1. Check backend logs
2. Verify vector store is running
3. Check document has chunks
4. Try again after a moment

### No Confirmation Dialog
**Issue:** Button clicks without confirmation

**Solutions:**
1. Check browser console for errors
2. Verify handler function is called
3. Update browser if outdated

## ✅ Testing Checklist

- [x] Button appears in grid view
- [x] Button appears in list view
- [x] Confirmation dialog works
- [x] API call successful
- [x] Document list refreshes
- [x] Tooltip shows on hover
- [x] Colors correct in light mode
- [x] Colors correct in dark mode
- [x] Hover effects work
- [x] Works with all document types

## 📝 Files Modified

- `frontend/src/app/(dashboard)/dashboard/knowledge-base/page.tsx`
  - Added SparklesIcon import
  - Added reembedDocumentMutation
  - Added handleReembedDocument function
  - Added re-embed button to grid view
  - Added re-embed button to list view

## 🎉 Result

Users can now easily regenerate embeddings for any document with a single click, improving search quality and making it easy to update the vector store when needed!

**Status: ✅ Complete and Ready**
