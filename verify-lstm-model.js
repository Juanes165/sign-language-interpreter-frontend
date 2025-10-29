/**
 * Script de verificación del modelo LSTM
 * Ejecutar con: node verify-lstm-model.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración del modelo LSTM...\n');

// Verificar archivos requeridos
const modelDir = path.join(__dirname, 'public', 'models');
const requiredFiles = ['model.json', 'words.json', 'group1-shard1of2.bin', 'group1-shard2of2.bin'];

let allFilesExist = true;

console.log('📂 Verificando archivos...');
requiredFiles.forEach(file => {
  const filePath = path.join(modelDir, file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${file}`);
  
  if (!exists) {
    allFilesExist = false;
  } else if (file.endsWith('.json')) {
    const stats = fs.statSync(filePath);
    console.log(`     Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
  } else if (file.endsWith('.bin')) {
    const stats = fs.statSync(filePath);
    console.log(`     Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  }
});

console.log('');

if (!allFilesExist) {
  console.log('❌ Faltan archivos requeridos. Por favor, ejecuta la conversión del modelo.');
  process.exit(1);
}

// Verificar model.json
console.log('🔧 Verificando model.json...');
const modelJson = JSON.parse(fs.readFileSync(path.join(modelDir, 'model.json'), 'utf-8'));

console.log(`  Formato: ${modelJson.format}`);
console.log(`  Generado por: ${modelJson.generatedBy}`);
console.log(`  Convertido por: ${modelJson.convertedBy}`);

if (modelJson.format !== 'graph-model') {
  console.log('  ⚠️  ADVERTENCIA: El formato debería ser "graph-model"');
}

// Verificar inputs
if (modelJson.signature && modelJson.signature.inputs) {
  const inputInfo = modelJson.signature.inputs.inputs || modelJson.signature.inputs.input_1;
  if (inputInfo) {
    console.log(`  Input name: ${inputInfo.name}`);
    console.log(`  Input dtype: ${inputInfo.dtype}`);
    
    if (inputInfo.tensorShape && inputInfo.tensorShape.dim) {
      const shape = inputInfo.tensorShape.dim.map(d => d.size).join(', ');
      console.log(`  Input shape: [${shape}]`);
      
      // Verificar que la forma sea correcta
      const dims = inputInfo.tensorShape.dim;
      if (dims.length === 3 && dims[1].size === '15' && dims[2].size === '1662') {
        console.log('  ✅ Input shape es correcto: [-1, 15, 1662]');
      } else {
        console.log('  ⚠️  Input shape no coincide con lo esperado');
      }
    }
  }
}

// Verificar outputs
if (modelJson.signature && modelJson.signature.outputs) {
  const outputKeys = Object.keys(modelJson.signature.outputs);
  console.log(`  Outputs: ${outputKeys.length} encontrado(s)`);
  
  outputKeys.forEach(key => {
    const output = modelJson.signature.outputs[key];
    console.log(`    - ${key}: ${output.name}`);
    if (output.tensorShape && output.tensorShape.dim) {
      const shape = output.tensorShape.dim.map(d => d.size).join(', ');
      console.log(`      Shape: [${shape}]`);
    }
  });
}

console.log('');

// Verificar words.json
console.log('🏷️  Verificando words.json...');
const wordsJson = JSON.parse(fs.readFileSync(path.join(modelDir, 'words.json'), 'utf-8'));

if (wordsJson.word_ids && Array.isArray(wordsJson.word_ids)) {
  console.log(`  ✅ Encontrados ${wordsJson.word_ids.length} gestos:`);
  wordsJson.word_ids.forEach((word, idx) => {
    console.log(`     ${idx}: ${word}`);
  });
} else {
  console.log('  ❌ Formato incorrecto en words.json');
  process.exit(1);
}

console.log('');

// Verificar que las dimensiones coincidan
console.log('🎯 Verificación de compatibilidad...');
const expectedClasses = wordsJson.word_ids.length;

if (modelJson.signature && modelJson.signature.outputs) {
  const outputInfo = modelJson.signature.outputs.output_0 || 
                     modelJson.signature.outputs.Identity || 
                     Object.values(modelJson.signature.outputs)[0];
  
  if (outputInfo && outputInfo.tensorShape && outputInfo.tensorShape.dim) {
    const outputDim = outputInfo.tensorShape.dim[outputInfo.tensorShape.dim.length - 1];
    const numClasses = parseInt(outputDim.size);
    
    if (numClasses === expectedClasses) {
      console.log(`  ✅ Dimensión de salida (${numClasses}) coincide con número de gestos (${expectedClasses})`);
    } else {
      console.log(`  ⚠️  ADVERTENCIA: Dimensión de salida (${numClasses}) no coincide con gestos (${expectedClasses})`);
    }
  }
}

console.log('');
console.log('=' .repeat(60));
console.log('✅ Verificación completada');
console.log('=' .repeat(60));
console.log('');
console.log('📋 Resumen:');
console.log(`  - Formato del modelo: ${modelJson.format}`);
console.log(`  - Número de gestos: ${wordsJson.word_ids.length}`);
console.log(`  - Input esperado: [batch, 15, 1662]`);
console.log('');
console.log('🚀 Para probar el modelo:');
console.log('   1. npm run dev');
console.log('   2. Abrir http://localhost:3000/gestures');
console.log('   3. Verificar la consola del navegador');
console.log('');
