# File API

Upload, download, and manage files with comprehensive file system operations.

## Overview

The File API provides complete file management capabilities for your miniapp. Choose files from the device, upload to servers, download from URLs, read file contents, and write data to files. Essential for document handling, media management, and data exchange.

## Available Functions

### `chooseFiles`

Open the native file picker to let users select files.

**Use Cases:**
- Document upload
- Attachment selection
- Import files

---

### `downloadFile`

Download a file from a remote URL to the device.

**Use Cases:**
- Download PDFs, documents
- Save remote resources
- Offline content caching

---

### `uploadFile`

Upload files to a remote server.

**Use Cases:**
- Document submission
- Profile picture upload
- File sharing

---

### `getFileInfo`

Retrieve metadata about a file.

**Use Cases:**
- Check file size before upload
- Verify file type
- Display file information

---

### `readFile`

Read the contents of a file.

**Use Cases:**
- Parse configuration files
- Read text files
- Process file data

---

### `writeFile`

Write data to a file.

**Use Cases:**
- Save generated reports
- Export data
- Cache content

---

### `getDataByFilePath`

Retrieve file data by file path.

**Use Cases:**
- Load local files
- Access cached data
- Read previously saved files

## Example Usage

```typescript
import {
  chooseFiles,
  uploadFile,
  downloadFile,
  getFileInfo,
  readFile,
  writeFile
} from './api/file';

// Choose and upload file
chooseFiles({
  count: 1,
  type: 'image'
})
  .then(files => {
    const file = files[0];
    return uploadFile({
      url: 'https://api.example.com/upload',
      filePath: file.path,
      name: 'file'
    });
  })
  .then(result => {
    console.log('Upload complete:', result);
  });

// Download file
downloadFile({
  url: 'https://example.com/document.pdf',
  filename: 'document.pdf'
})
  .then(filePath => {
    console.log('Downloaded to:', filePath);
  });

// Get file info
getFileInfo('/path/to/file.jpg')
  .then(info => {
    console.log('Size:', info.size);
    console.log('Type:', info.type);
  });

// Read and write files
writeFile({
  filePath: '/data/config.json',
  data: JSON.stringify({ theme: 'dark' })
})
  .then(() => {
    return readFile('/data/config.json');
  })
  .then(content => {
    const config = JSON.parse(content);
  });
```

## Common Patterns

### Image Upload Flow
```typescript
// Select image, check size, upload
chooseFiles({ type: 'image', count: 1 })
  .then(files => getFileInfo(files[0].path))
  .then(info => {
    if (info.size > 5 * 1024 * 1024) {
      throw new Error('File too large (max 5MB)');
    }
    return uploadFile({
      url: API_URL,
      filePath: info.path,
      name: 'image'
    });
  });
```

### Document Download
```typescript
// Download with progress
downloadFile({
  url: documentUrl,
  filename: 'report.pdf'
})
  .then(filePath => {
    alert('Download complete!');
    // Open or share file
  })
  .catch(error => {
    console.error('Download failed:', error);
  });
```

## Best Practices

- Validate file size before upload
- Check file types to prevent malicious uploads
- Show upload/download progress to users
- Handle network errors gracefully
- Clean up temporary files
- Compress large files before upload
- Use secure HTTPS URLs for uploads/downloads

## File Type Filters

Common file type options:
- `image` - Image files (JPEG, PNG, GIF, etc.)
- `video` - Video files
- `document` - Documents (PDF, DOC, etc.)
- `all` - All file types

## Requirements

- WindVane bridge must be available
- File system permissions may be required
- Storage permission for downloads
- Network connectivity for upload/download
- Must run within AppViettel environment
