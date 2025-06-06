import * as FileSystem from 'expo-file-system';
import * as mammoth from 'mammoth';

export const convertDocxToHtml = async (docxPath: string): Promise<string> => {
  try {
    console.log('Reading DOCX file from:', docxPath);
    
    // Read the DOCX file
    const docxContent = await FileSystem.readAsStringAsync(docxPath, {
      encoding: FileSystem.EncodingType.Base64
    });
    console.log('DOCX content length:', docxContent.length);

    // Convert base64 to ArrayBuffer
    const binaryString = atob(docxContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;
    console.log('ArrayBuffer size:', arrayBuffer.byteLength);

    // Convert DOCX to HTML using mammoth
    console.log('Converting DOCX to HTML...');
    const result = await mammoth.convertToHtml({ arrayBuffer });
    console.log('HTML conversion result:', result.value.length);
    
    // Add mobile-optimized styling
    const styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * {
              box-sizing: border-box;
              -webkit-text-size-adjust: 100%;
              margin: 0;
              padding: 0;
            }
            html, body {
              width: 100%;
              height: 100%;
              overflow-x: hidden;
              background-color: #ffffff;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.5;
              padding: 12px;
              color: #333333;
              font-size: 14px;
              -webkit-font-smoothing: antialiased;
              max-width: 100vw;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #1a1a1a;
              margin: 1em 0 0.5em;
              line-height: 1.3;
              font-weight: 600;
            }
            h1 { font-size: 1.5em; }
            h2 { font-size: 1.3em; }
            h3 { font-size: 1.2em; }
            h4 { font-size: 1.1em; }
            h5, h6 { font-size: 1em; }
            p {
              margin: 0.8em 0;
              line-height: 1.6;
              text-align: justify;
              font-size: 14px;
            }
            img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 0.8em auto;
              border-radius: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 0.8em 0;
              overflow-x: auto;
              display: block;
              background: #ffffff;
              border-radius: 4px;
              font-size: 13px;
            }
            th, td {
              border: 1px solid #e0e0e0;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: 600;
              color: #333333;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            ul, ol {
              margin: 0.8em 0;
              padding-left: 1.5em;
            }
            li {
              margin: 0.4em 0;
              line-height: 1.5;
              font-size: 14px;
            }
            blockquote {
              margin: 0.8em 0;
              padding: 0.8em;
              border-left: 3px solid #007AFF;
              background-color: #f8f9fa;
              color: #555555;
              font-style: italic;
              font-size: 13px;
            }
            code {
              font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
              background-color: #f5f5f5;
              padding: 0.1em 0.3em;
              border-radius: 3px;
              font-size: 12px;
            }
            pre {
              background-color: #f5f5f5;
              padding: 0.8em;
              border-radius: 4px;
              overflow-x: auto;
              margin: 0.8em 0;
              font-size: 12px;
            }
            pre code {
              background-color: transparent;
              padding: 0;
            }
            a {
              color: #007AFF;
              text-decoration: none;
              font-size: 14px;
            }
            hr {
              border: none;
              border-top: 1px solid #e0e0e0;
              margin: 1em 0;
            }
            .page-break {
              page-break-after: always;
              border-bottom: 1px dashed #e0e0e0;
              margin: 1em 0;
            }
            @media screen and (max-width: 480px) {
              body {
                padding: 8px;
                font-size: 13px;
              }
              h1 { font-size: 1.3em; }
              h2 { font-size: 1.2em; }
              h3 { font-size: 1.1em; }
              p, li, a {
                font-size: 13px;
              }
              th, td {
                padding: 6px;
                font-size: 12px;
              }
            }
          </style>
        </head>
        <body>
          ${result.value}
        </body>
      </html>
    `;

    // Save HTML to a temporary file
    const tempDir = `${FileSystem.cacheDirectory}conversion/`;
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    const htmlPath = `${tempDir}converted_${Date.now()}.html`;
    
    console.log('Saving HTML to:', htmlPath);
    await FileSystem.writeAsStringAsync(htmlPath, styledHtml);
    
    // Verify the saved file
    const fileInfo = await FileSystem.getInfoAsync(htmlPath);
    console.log('Saved HTML file exists:', fileInfo.exists);

    return htmlPath;
  } catch (error) {
    console.error('Error in convertDocxToHtml:', error);
    throw new Error('Failed to convert document to HTML');
  }
}; 