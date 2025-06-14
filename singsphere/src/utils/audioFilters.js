//
// PUBLIC_INTERFACE
// Utility functions for applying audio effects such as reverb, auto-tune (mock as pitch-shift), and robot (bitcrusher effect)
// to a given audio buffer or audio source using the Web Audio API.
//

/**
 * Applies a chain of audio effects to an AudioBuffer and returns a new processed AudioBuffer.
 * @param {AudioBuffer} inputBuffer - The original audio buffer to process.
 * @param {Object} options - The filters to apply: { reverb: bool, autotune: bool, robot: bool }
 * @param {BaseAudioContext} ctx - The audio context to use.
 * @returns {Promise<AudioBuffer>} A Promise resolving to the processed AudioBuffer.
 */
 // PUBLIC_INTERFACE
export async function processAudioBuffer(inputBuffer, options = {}, ctx) {
  const context = ctx || new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
    inputBuffer.numberOfChannels, inputBuffer.length, inputBuffer.sampleRate
  );

  const source = context.createBufferSource();
  source.buffer = inputBuffer;

  // Build the effects chain
  let nodeChain = source;
  let nodes = [source];

  // Reverb effect using ConvolverNode (with generated impulse)
  if (options.reverb) {
    const convolver = context.createConvolver();
    const impulse = createImpulseResponse(context, 2, 2.5);
    convolver.buffer = impulse;
    nodeChain.connect(convolver);
    nodeChain = convolver;
    nodes.push(convolver);
  }

  // "Auto-Tune" placeholder: basic pitch shifter using detune if available (not real auto-tune)
  if (options.autotune) {
    // Attempt to use playbackRate, not truly auto-tune, but demo a change.
    const pitchShiftNode = context.createGain();
    // For offline context, can't really change playbackRate; for demo, boost gain slightly.
    pitchShiftNode.gain.value = 1.08; // (fake "shaping")
    nodeChain.connect(pitchShiftNode);
    nodeChain = pitchShiftNode;
    nodes.push(pitchShiftNode);
  }

  // Robot effect: Bitcrusher simulation
  if (options.robot) {
    const bitcrusherNode = createBitcrusherNode(context, 4);
    nodeChain.connect(bitcrusherNode);
    nodeChain = bitcrusherNode;
    nodes.push(bitcrusherNode);
  }

  // Connect to destination
  nodeChain.connect(context.destination);

  source.start();

  return context.startRendering();
}

// PUBLIC_INTERFACE
/**
 * Loads, decodes, applies the selected filters to audio data, and returns a playable object URL.
 * @param {Blob|ArrayBuffer} audioBlob
 * @param {Object} filterOptions
 * @returns {Promise<string>} Object URL of the filtered audio or original if fails
 */
export async function applyFiltersToBlob(audioBlob, filterOptions = {}) {
  if (!window.AudioContext && !window.webkitAudioContext) {
    // Web Audio API not supported
    return URL.createObjectURL(audioBlob);
  }
  try {
    const buffer = await audioBlob.arrayBuffer
      ? await audioBlob.arrayBuffer()
      : await new Response(audioBlob).arrayBuffer();
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await ctx.decodeAudioData(buffer);
    // Map UI filter array to flags
    const filterMap = {
      reverb: !!(filterOptions.reverb),
      autotune: !!(filterOptions.autotune),
      robot: !!(filterOptions.robot),
    };
    // Allow passing array (["reverb"]) or object
    if (Array.isArray(filterOptions)) {
      filterMap.reverb = filterOptions.includes("reverb");
      filterMap.autotune = filterOptions.includes("autotune");
      filterMap.robot = filterOptions.includes("robot");
    }
    const processedBuffer = await processAudioBuffer(decoded, filterMap);
    // Export the processed buffer to a Blob (WAV)
    const outBlob = audioBufferToWavBlob(processedBuffer);
    ctx.close();
    return URL.createObjectURL(outBlob);
  } catch (err) {
    // On failure, fallback to original
    return URL.createObjectURL(audioBlob);
  }
}

// ---- Helpers for effects ----

function createImpulseResponse(context, duration, decay) {
  const rate = context.sampleRate;
  const length = duration * rate;
  const impulse = context.createBuffer(2, length, rate);
  for (let c = 0; c < 2; c++) {
    const channel = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      // Exponential decay with random noise for "reverb"
      channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

function createBitcrusherNode(ctx, bits = 4, norm = 1.0) {
  // ScriptProcessorNode is deprecated but still works as a demo
  const node = ctx.createScriptProcessor(4096, 1, 1);
  const step = Math.pow(0.5, bits);
  node.onaudioprocess = function(e) {
    const input = e.inputBuffer.getChannelData(0);
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < input.length; i++) {
      output[i] = Math.floor(norm * input[i] / step) * step;
    }
  };
  return node;
}

// Export AudioBuffer to WAV Blob
function audioBufferToWavBlob(buffer) {
  // Encode PCM to WAV - 16 bit, single/multi-channel
  const numCh = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitsPerSample = 16;
  const samples = buffer.length;
  const blockAlign = numCh * bitsPerSample / 8;
  const byteRate = sampleRate * blockAlign;
  const wavSize = 44 + samples * blockAlign;

  const bufferWav = new ArrayBuffer(wavSize);
  const view = new DataView(bufferWav);

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
  let offset = 0;
  writeString(offset, 'RIFF'); offset += 4;
  view.setUint32(offset, wavSize - 8, true); offset += 4;
  writeString(offset, 'WAVE'); offset += 4;
  writeString(offset, 'fmt '); offset += 4;
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, format, true); offset += 2;
  view.setUint16(offset, numCh, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, byteRate, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bitsPerSample, true); offset += 2;
  writeString(offset, 'data'); offset += 4;
  view.setUint32(offset, samples * blockAlign, true); offset += 4;

  // Interleave and write PCM
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numCh; c++) {
      let sample = buffer.getChannelData(c)[i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([bufferWav], { type: "audio/wav" });
}
