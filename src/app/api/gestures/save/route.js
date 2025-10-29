import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * API Route para guardar muestras de gestos directamente en el servidor
 * POST /api/gestures/save
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

    // Crear directorio si no existe
    const samplesDir = path.join(process.cwd(), 'captured_samples');
    await mkdir(samplesDir, { recursive: true });

    // Guardar archivo JSON
    const filename = `${sample.gesture}_${sample.timestamp}.json`;
    const filepath = path.join(samplesDir, filename);
    
    await writeFile(filepath, JSON.stringify(sample, null, 2));

    console.log(`✅ Muestra guardada: ${filename}`);

    return NextResponse.json({
      success: true,
      filename,
      message: 'Muestra guardada correctamente'
    });

  } catch (error) {
    console.error('❌ Error guardando muestra:', error);
    return NextResponse.json(
      { error: 'Error del servidor', details: error.message },
      { status: 500 }
    );
  }
}
