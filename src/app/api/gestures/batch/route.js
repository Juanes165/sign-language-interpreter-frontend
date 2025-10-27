import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * API Route para guardar múltiples muestras en batch
 * POST /api/gestures/batch
 */
export async function POST(request) {
  try {
    const { samples } = await request.json();
    
    if (!Array.isArray(samples) || samples.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de muestras' },
        { status: 400 }
      );
    }

    // Crear directorio
    const samplesDir = path.join(process.cwd(), 'captured_samples');
    await mkdir(samplesDir, { recursive: true });

    // Guardar todas las muestras
    const savedFiles = [];
    for (const sample of samples) {
      const filename = `${sample.gesture}_${sample.timestamp}.json`;
      const filepath = path.join(samplesDir, filename);
      await writeFile(filepath, JSON.stringify(sample, null, 2));
      savedFiles.push(filename);
    }

    console.log(`✅ ${savedFiles.length} muestras guardadas en batch`);

    return NextResponse.json({
      success: true,
      count: savedFiles.length,
      files: savedFiles,
      message: `${savedFiles.length} muestras guardadas correctamente`
    });

  } catch (error) {
    console.error('❌ Error en batch save:', error);
    return NextResponse.json(
      { error: 'Error del servidor', details: error.message },
      { status: 500 }
    );
  }
}
