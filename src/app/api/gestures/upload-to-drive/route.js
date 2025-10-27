import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

/**
 * API Route para subir muestras directamente a Google Drive
 * POST /api/gestures/upload-to-drive
 */
export async function POST(request) {
  try {
    const sample = await request.json();
    
    // Validar datos
    if (!sample.gesture || !sample.keypoints || !sample.timestamp) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    console.log(`📤 Subiendo a Drive: ${sample.gesture}_${sample.timestamp}.json`);

    // Cargar credenciales desde archivo JSON
    const credentialsPath = path.join(process.cwd(), 'unavoz-bb3744af7f68.json');
    
    if (!fs.existsSync(credentialsPath)) {
      console.error('❌ Archivo de credenciales no encontrado:', credentialsPath);
      throw new Error('Credenciales de Google Drive no configuradas');
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
    console.log('🔑 Credenciales cargadas de:', credentials.client_email);

    // Autenticación con Service Account
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });
    
    // ID de la carpeta de Google Drive (extraído de la URL)
    const folderId = '1jNbfTqDI2nqs6xX5tFxOrbneOV0vJQzg';

    if (!folderId) {
      throw new Error('ID de carpeta de Drive no configurado');
    }

    // Crear nombre de archivo
    const filename = `${sample.gesture}_${sample.timestamp}.json`;

    // Convertir JSON a stream
    const fileContent = JSON.stringify(sample, null, 2);
    const bufferStream = new Readable();
    bufferStream.push(fileContent);
    bufferStream.push(null);

    // Subir a Drive
    const fileMetadata = {
      name: filename,
      parents: [folderId],
      mimeType: 'application/json'
    };

    const media = {
      mimeType: 'application/json',
      body: bufferStream
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
      supportsAllDrives: true // ⭐ Permite usar carpetas compartidas
    });

    console.log(`✅ Subido a Drive: ${response.data.name}`);

    return NextResponse.json({
      success: true,
      fileId: response.data.id,
      filename: response.data.name,
      webViewLink: response.data.webViewLink,
      message: 'Muestra subida a Google Drive correctamente'
    });

  } catch (error) {
    console.error('❌ Error subiendo a Drive:', error.message);
    
    // Si falla Drive, intentar guardar localmente como fallback
    return NextResponse.json(
      { 
        error: 'Error subiendo a Google Drive',
        details: error.message,
        fallback: true 
      },
      { status: 500 }
    );
  }
}
