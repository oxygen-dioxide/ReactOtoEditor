import { Wave, WaveAnalyse } from "utauwav";
import { fftSetting } from "../../config/setting";

const aryMin = (a, b) => {
  return Math.min(a, b);
};

export const AnalyzeParamByPower = (
  wav: Wave,
  startMs: number = 0,
  rangeMs: number = 0
): [offset: number, preutter: number, blank: number] => {
  const wa = new WaveAnalyse();
  wav.channels = fftSetting.channels;
  wav.bitDepth = fftSetting.bitDepth;
  wav.sampleRate = fftSetting.sampleRate;
  wav.RemoveDCOffset();
  wav.VolumeNormalize();
  const startFrame = (startMs * wav.sampleRate) / 1000;
  const endFrame =
    rangeMs === 0
      ? wav.data.length
      : ((startMs + rangeMs) * wav.sampleRate) / 1000;
  const rangeSec = 0.01;
  const power = wa.Power(
    wav.data.slice(startFrame, endFrame),
    fftSetting.sampleRate,
    rangeSec * 2,
    "hanning",
    rangeSec
  );
  const difPower = new Array<number>();
  /** 最後のフレームは除く */
  for (let i = 0; i < power.length - 2; i++) {
    difPower.push(power[i + 1] - power[i]);
  }
  const averange = 2;
  const difAvePower = new Array<number>();
  for (let i = averange; i < difPower.length - averange; i++) {
    let total = 0;
    for (let j = -averange; j <= averange; j++) {
      total += difPower[i - +j];
    }
    difAvePower.push(total / (averange * 2 + 1));
  }
  const min = difAvePower.reduce(aryMin);
  const minIndex = difAvePower.indexOf(min);
  const blankMs = (minIndex + averange + 1) * rangeSec * 1000;
  let max = -Infinity;
  let max2nd = -Infinity;
  let maxIndex = 0;
  let max2ndIndex = 0;
  difPower.slice(0, minIndex + averange).forEach((v, i) => {
    if (v > max) {
      max2nd = max;
      max2ndIndex = maxIndex;
      max = v;
      maxIndex = i;
    } else if (v >= max2nd) {
      max2nd = v;
      max2ndIndex = i;
    }
  });
  const offsetIndex = Math.min(maxIndex, max2ndIndex);
  const preutterIndex = Math.max(maxIndex, max2ndIndex);
  const offsetMs = (offsetIndex + 1) * rangeSec * 1000;
  const preutterMs = (preutterIndex + 1) * rangeSec * 1000;
  const blankRange = Math.min((blankMs - preutterMs) / 2, 50);

  return [startMs + offsetMs, preutterMs, blankMs - blankRange];
};
