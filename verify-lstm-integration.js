#!/usr/bin/env node

/**
 * Script de verificación para la integración LSTM
 * Verifica que todos los archivos necesarios estén presentes
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  const color = exists ? 'green' : 'red';
  log(`${status} ${description}: ${filePath}`, color);
  return exists;
}

function checkDirectory(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  const status = exists ? '✅' : '❌';
  const color = exists ? 'green' : 'red';
  log(`${status} ${description}: ${dirPath}`, color);
  return exists;
}

async function main() {
  log('\n🔍 Verificación de integración LSTM\n', 'cyan');

  let allChecks = true;

  // Modelo TFJS
  log('📦 Modelo TensorFlow.js:', 'blue');
  allChecks &= checkDirectory('public/models/lstm_gestos', 'Directorio del modelo');
  allChecks &= checkFile('public/models/lstm_gestos/model.json', 'Arquitectura del modelo');
  allChecks &= checkFile('public/models/lstm_gestos/group1-shard1of1.bin', 'Pesos del modelo');
  allChecks &= checkFile('public/models/lstm_gestos/words.json', 'Etiquetas de clases');

  // Código fuente
  log('\n📝 Código fuente:', 'blue');
  allChecks &= checkFile('src/lib/gestureRecognitionLSTM.js', 'Utilidades LSTM');
  allChecks &= checkFile('src/hooks/useGestureRecognitionLSTM.js', 'Hook personalizado');
  allChecks &= checkFile('src/app/(main)/gestures/page.js', 'Página de gestos');

  // Dependencias
  log('\n📚 Dependencias:', 'blue');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = packageJson.dependencies || {};
  
  const requiredDeps = {
    '@tensorflow/tfjs': 'TensorFlow.js',
    '@mediapipe/holistic': 'MediaPipe Holistic',
    '@mediapipe/camera_utils': 'MediaPipe Camera Utils',
  };

  for (const [dep, name] of Object.entries(requiredDeps)) {
    const installed = dep in deps;
    const status = installed ? '✅' : '❌';
    const color = installed ? 'green' : 'red';
    const version = installed ? deps[dep] : 'No instalada';
    log(`${status} ${name}: ${version}`, color);
    allChecks &= installed;
  }

  // Verificar words.json
  log('\n🏷️  Etiquetas del modelo:', 'blue');
  if (fs.existsSync('public/models/lstm_gestos/words.json')) {
    const words = JSON.parse(fs.readFileSync('public/models/lstm_gestos/words.json', 'utf8'));
    if (words.word_ids && Array.isArray(words.word_ids)) {
      log(`✅ Etiquetas cargadas: ${words.word_ids.length} clases`, 'green');
      words.word_ids.forEach((word, idx) => {
        log(`   ${idx + 1}. ${word}`, 'cyan');
      });
    } else {
      log('❌ Formato incorrecto en words.json', 'red');
      allChecks = false;
    }
  }

  // Resultado final
  log('\n' + '='.repeat(60), 'cyan');
  if (allChecks) {
    log('✅ Todas las verificaciones pasaron correctamente', 'green');
    log('🚀 Puedes iniciar el servidor con: npm run dev', 'cyan');
  } else {
    log('❌ Algunas verificaciones fallaron', 'red');
    log('⚠️  Revisa los errores anteriores y corrige los problemas', 'yellow');
    process.exit(1);
  }
  log('='.repeat(60) + '\n', 'cyan');
}

main().catch(err => {
  log(`\n❌ Error durante la verificación: ${err.message}`, 'red');
  process.exit(1);
});
