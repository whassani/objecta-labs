# Testing Document Upload Feature

## Quick Start

1. **Start the services**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run start:dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Access the application**:
   - Open http://localhost:3000
   - Login or register an account

3. **Test Document Upload**:
   - Navigate to Knowledge Base section
   - Click "Documents" tab
   - Click "Upload Document" button
   - Drag and drop `tmp_rovodev_test_document_upload.md` or browse to select it
   - Click "Upload"
   - Wait for processing to complete
   - Verify document appears with status "completed"

## API Testing

### Using cURL (after obtaining JWT token)

1. **Login to get token**:
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

2. **Upload document**:
   ```bash
   TOKEN="your-jwt-token-here"
   
   curl -X POST http://localhost:3001/api/knowledge-base/documents/upload \
     -H "Authorization: Bearer $TOKEN" \
     -F "file=@tmp_rovodev_test_document_upload.md" \
     -F "title=Test Document"
   ```

3. **List documents**:
   ```bash
   curl http://localhost:3001/api/knowledge-base/documents \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Get document chunks** (replace DOCUMENT_ID):
   ```bash
   curl http://localhost:3001/api/knowledge-base/documents/DOCUMENT_ID/chunks \
     -H "Authorization: Bearer $TOKEN"
   ```

## Expected Results

### Successful Upload
- Document record created with status "completed"
- Multiple chunks created (depending on document size)
- Chunks accessible via API
- Document visible in UI with correct status badge

### UI Features to Verify
- ✅ Drag and drop works
- ✅ File validation (size, type)
- ✅ Upload progress indication
- ✅ Success toast notification
- ✅ Document appears in grid
- ✅ Status badge shows "completed"
- ✅ Chunk count displayed
- ✅ Delete button works

### File Type Testing
1. **PDF** - Upload a PDF file (should work)
2. **TXT** - Upload a .txt file (should work)
3. **MD** - Upload a .md file (should work)
4. **DOCX** - Upload a .docx file (should fail with error message)
5. **Large File** - Upload file > 10MB (should fail with error message)

## Troubleshooting

### Issue: "Failed to upload document"
- Check backend logs for errors
- Verify JWT token is valid
- Ensure file size < 10MB
- Confirm file type is PDF, TXT, or MD

### Issue: "Processing status stuck"
- Check backend logs for processing errors
- Verify pdf-parse is installed
- Check database connection

### Issue: "Chunks not created"
- Verify document content is not empty
- Check backend logs for chunking errors
- Ensure LangChain dependencies are installed

## Next Steps After Testing

Once document upload is verified:
1. Proceed to Priority 3: Vector Search
2. Implement Qdrant integration
3. Generate embeddings for chunks
4. Enable semantic search
5. Integrate with agent conversations
