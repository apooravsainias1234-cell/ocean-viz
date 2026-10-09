// Web Audio API Procedural Deep-Sea Hydrophone & Sonar Soundscape.
// Completely self-contained, lightweight, zero assets to download.

class AudioEngine {
  constructor() {
    this.ctx = null
    this.isPlaying = false
    this.masterGain = null
    this.noiseNode = null
    this.pingInterval = null
  }

  init() {
    if (this.ctx) return
    const AudioContext = window.AudioContext || window.webkitAudioContext
    this.ctx = new AudioContext()

    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.setValueAtTime(0.18, this.ctx.currentTime)
    this.masterGain.connect(this.ctx.destination)
  }

  start() {
    this.init()
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    if (this.isPlaying) return

    // 1. Generate Deep Ocean Pink/Brown Noise Rumble (mimics abyssal hydrophone)
    const bufferSize = this.ctx.sampleRate * 2
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const output = buffer.getChannelData(0)
    let b0 = 0, b1 = 0, b2 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99 * b0 + white * 0.05
      b1 = 0.95 * b1 + white * 0.1
      b2 = 0.85 * b2 + white * 0.2
      output[i] = (b0 + b1 + b2) * 0.12
    }

    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true

    // Low-pass filter to sound like underwater depth
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(140, this.ctx.currentTime)

    // Gentle LFO swell
    const lfo = this.ctx.createOscillator()
    const lfoGain = this.ctx.createGain()
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime) // 6-second wave cycle
    lfoGain.gain.setValueAtTime(40, this.ctx.currentTime)
    lfo.connect(filter.frequency)
    lfo.start()

    noise.connect(filter)
    filter.connect(this.masterGain)
    noise.start()
    this.noiseNode = noise

    // 2. Periodic subtle sonar telemetry ping (every 14 seconds)
    this.pingInterval = setInterval(() => {
      this.playSonarPing()
    }, 14000)

    this.isPlaying = true
  }

  playSonarPing() {
    if (!this.ctx || !this.isPlaying) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1240, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1180, this.ctx.currentTime + 0.8)

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2)

      osc.connect(gain)
      gain.connect(this.masterGain)
      osc.start()
      osc.stop(this.ctx.currentTime + 1.2)
    } catch {
      // AudioContext could be in transitional state
    }
  }

  stop() {
    if (!this.isPlaying) return
    if (this.noiseNode) {
      try {
        this.noiseNode.stop()
      } catch {}
      this.noiseNode = null
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    this.isPlaying = false
  }

  toggle() {
    if (this.isPlaying) {
      this.stop()
      return false
    } else {
      this.start()
      return true
    }
  }
}

export const audioEngine = new AudioEngine()
