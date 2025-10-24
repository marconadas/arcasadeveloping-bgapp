#!/usr/bin/env node

/**
 * Script to verify layer state configuration
 * Checks that chlorophyll layer is not in the default active layers
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verifying Layer State Configuration\n');
console.log('='.repeat(50));

// Read RealtimeProvider.tsx to check initial state
const providerPath = path.join(__dirname, 'apps/realtime-angola/src/providers/RealtimeProvider.tsx');
const providerContent = fs.readFileSync(providerPath, 'utf8');

// Extract the initial state configuration
const stateMatch = providerContent.match(/const \[activeLayers, setActiveLayers\] = useState<string\[\]>\(\[([\s\S]*?)\]\)/);

if (stateMatch) {
  const activeLayersDefault = stateMatch[1];
  console.log('📋 Default Active Layers:');
  console.log('-'.repeat(30));

  // Parse and display each layer
  const layers = activeLayersDefault
    .split(',')
    .map(l => l.trim().replace(/['"]/g, ''))
    .filter(l => l);

  layers.forEach(layer => {
    const icon = layer === 'chloropleth' ? '❌' : '✅';
    console.log(`  ${icon} ${layer}`);
  });

  // Check if chloropleth is in default state
  const hasChloropleth = layers.includes('chloropleth');

  console.log('\n📊 Analysis Results:');
  console.log('-'.repeat(30));

  if (hasChloropleth) {
    console.log('❌ ERROR: Chlorophyll layer ("chloropleth") is in default active layers!');
    console.log('   This means it will be visible on page load regardless of checkbox state.');
    console.log('\n🔧 FIX: Remove "chloropleth" from the activeLayers initial state in RealtimeProvider.tsx');
  } else {
    console.log('✅ SUCCESS: Chlorophyll layer is NOT in default active layers');
    console.log('   The layer will start disabled and can be toggled via the checkbox');
  }

  // Check LayersPanel configuration
  console.log('\n📝 LayersPanel Configuration:');
  console.log('-'.repeat(30));

  const panelPath = path.join(__dirname, 'apps/realtime-angola/src/components/map/LayersPanel.tsx');
  const panelContent = fs.readFileSync(panelPath, 'utf8');

  const layerConfigMatch = panelContent.match(/{ id: 'chloropleth', label: '([^']+)'/);
  if (layerConfigMatch) {
    console.log(`✅ Chlorophyll layer ID: "chloropleth"`);
    console.log(`   Label: "${layerConfigMatch[1]}"`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📈 SUMMARY:');
  console.log('='.repeat(50));

  if (!hasChloropleth) {
    console.log('✅ Layer toggle fix is correctly implemented!');
    console.log('\n🎯 Expected Behavior:');
    console.log('  1. Chlorophyll layer starts HIDDEN when page loads');
    console.log('  2. Clicking checkbox in LayersPanel will SHOW the layer');
    console.log('  3. Clicking checkbox again will HIDE the layer');
    console.log('\n💡 To test: Refresh the browser at http://localhost:3002');
  } else {
    console.log('❌ Layer toggle fix needs to be applied');
    console.log('   The chlorophyll layer will always start visible');
  }

} else {
  console.error('❌ Could not find activeLayers state configuration in RealtimeProvider.tsx');
}

console.log('\n' + '='.repeat(50));
console.log('✨ Verification Complete\n');