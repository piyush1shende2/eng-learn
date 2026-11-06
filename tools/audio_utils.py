"""Audio helpers shared by the build tools: decode almost anything, clean it up, write a small mono MP3.

Pure Python (soundfile + lameenc + soxr), so no ffmpeg install is needed on Windows.
ffmpeg is used only as a fallback when a file cannot be decoded by libsndfile.
"""
import io
import os
import shutil
import subprocess

import numpy as np

try:
    import soundfile as sf
except ImportError:  # pragma: no cover
    sf = None
try:
    import lameenc
except ImportError:  # pragma: no cover
    lameenc = None
try:
    import soxr
except ImportError:  # pragma: no cover
    soxr = None

TARGET_SR = 22050  # plenty for speech; keeps files small for low-end devices


def have_pure():
    return sf is not None and lameenc is not None


def decode(src, start=None, seconds=None):
    """src is a path or raw bytes. Returns (mono float32 samples, sample rate)."""
    handle = io.BytesIO(bytes(src)) if isinstance(src, (bytes, bytearray)) else src
    with sf.SoundFile(handle) as fh:
        sr = fh.samplerate
        if start:
            fh.seek(min(int(start * sr), fh.frames))
        frames = int(seconds * sr) if seconds else -1
        x = fh.read(frames, dtype="float32", always_2d=True)
    return x.mean(axis=1).astype("float32"), sr


def resample(x, sr, to=TARGET_SR):
    if sr == to or len(x) == 0:
        return x
    if soxr is not None:
        return soxr.resample(x, sr, to).astype("float32")
    n = int(len(x) * to / sr)
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype("float32")


def trim_silence(x, sr, db=-45.0, pad=0.15):
    """Cut silence at both ends (threshold is relative to the loudest sample), keeping a short pad."""
    if len(x) == 0:
        return x
    peak = float(np.abs(x).max())
    if peak < 1e-6:
        return x
    idx = np.where(np.abs(x) > peak * 10 ** (db / 20))[0]
    if len(idx) == 0:
        return x
    a = max(0, int(idx[0] - pad * sr))
    b = min(len(x), int(idx[-1] + pad * sr))
    return x[a:b]


def normalise(x, target_db=-20.0, max_gain_db=18.0):
    """Bring clips to a similar loudness so accents are not compared by volume. Never clips."""
    if len(x) == 0:
        return x
    rms = float(np.sqrt(np.mean(x ** 2)))
    peak = float(np.abs(x).max())
    if rms < 1e-6 or peak < 1e-6:
        return x
    gain = min(10 ** ((target_db - 20 * np.log10(rms)) / 20), 10 ** (max_gain_db / 20), 0.97 / peak)
    return (x * gain).astype("float32")


def encode_mp3(x, sr=TARGET_SR, kbps=32):
    pcm = (np.clip(x, -1.0, 1.0) * 32767).astype("<i2").tobytes()
    enc = lameenc.Encoder()
    enc.set_bit_rate(kbps)
    enc.set_in_sample_rate(sr)
    enc.set_channels(1)
    enc.set_quality(2)
    return bytes(enc.encode(pcm)) + bytes(enc.flush())


def _ffmpeg(src, dst, start, seconds, kbps):
    exe = shutil.which("ffmpeg")
    if not exe:
        raise RuntimeError("could not decode this file and ffmpeg is not installed")
    cmd = [exe, "-y", "-loglevel", "error"]
    if start:
        cmd += ["-ss", f"{start:.3f}"]
    raw = isinstance(src, (bytes, bytearray))
    cmd += ["-i", "pipe:0" if raw else src]
    if seconds:
        cmd += ["-t", f"{seconds:.3f}"]
    cmd += ["-ac", "1", "-ar", str(TARGET_SR), "-c:a", "libmp3lame", "-b:a", f"{kbps}k", dst]
    subprocess.run(cmd, input=bytes(src) if raw else None, check=True)


def convert(src, dst, start=None, seconds=None, kbps=32, trim=True, normalise_level=True):
    """Write src (path or bytes) to dst as a small mono MP3. Returns the clip length in seconds."""
    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    try:
        if not have_pure():
            raise RuntimeError("soundfile/lameenc not installed")
        x, sr = decode(src, start, (seconds + 1.0) if seconds else None)  # read a little extra, trim below
        x = resample(x, sr)
        if trim:
            x = trim_silence(x, TARGET_SR)
        if seconds:
            x = x[: int(seconds * TARGET_SR)]
        if normalise_level:
            x = normalise(x)
        if len(x) < TARGET_SR * 0.2:
            raise ValueError("clip is empty or too short")
        with open(dst, "wb") as f:
            f.write(encode_mp3(x, TARGET_SR, kbps))
        return len(x) / TARGET_SR
    except (ValueError, RuntimeError, OSError, Exception) as err:  # noqa: BLE001
        if str(err).startswith("clip is empty"):
            raise
        _ffmpeg(src, dst, start, seconds, kbps)
        return duration(dst)


def duration(path):
    """Length in seconds of an audio file (0.0 if unknown)."""
    try:
        if sf is not None:
            return float(sf.info(path).duration)
    except Exception:  # noqa: BLE001
        pass
    exe = shutil.which("ffprobe")
    if exe:
        r = subprocess.run([exe, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True)
        try:
            return float(r.stdout.strip())
        except ValueError:
            return 0.0
    return 0.0
