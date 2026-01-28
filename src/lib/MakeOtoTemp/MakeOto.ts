import { Oto } from "utauoto";
import JSZip from "jszip";
import { MakeOtoTempIni } from "./Interface";
import { Wave } from "utauwav";
import { AnalyzeParamByPower } from "./AnalyzeWav";

export const MakeOtoSingle = (
  readZip: { [key: string]: JSZip.JSZipObject },
  targetDir: string,
  skipBiginingNumber: boolean = true,
  analyze: boolean
): Oto => {
  /** 返す原音設定値 */
  const oto = new Oto();
  const files = Object.keys(readZip).slice();
  const targetPrePath = targetDir === "" ? "" : targetDir + "/";
  files.sort();
  files.forEach(async (f) => {
    if (f.startsWith(targetPrePath) && f.endsWith(".wav")) {
      /** ファイル名。 \
       * zipファイル名から、フォルダ名、冒頭連番、.wavを削除したもの
       */
      const filename: string = GetFilename(f, targetDir, skipBiginingNumber);
      /**  エイリアス名 \
       * `filename`から冒頭の_を取り除いたもの
       */
      const alias: string = filename[0] === "_" ? filename.slice(1) : filename;
      if (analyze) {
        const buf: ArrayBuffer = await readZip[f].async("arraybuffer");
        const wav = new Wave(buf);
        const [offsetPoint, preutterPoint, blankPoint] =
          AnalyzeParamByPower(wav);
        const preutter = preutterPoint - offsetPoint;
        oto.SetParams(
          targetDir,
          f.replace(targetPrePath, ""),
          alias,
          offsetPoint,
          preutter / 3,
          preutter,
          preutter * 1.5,
          offsetPoint - blankPoint
        );
      } else {
        /** 解析がオフの場合、全パラメータ0で生成する。 */
        oto.SetParams(
          targetDir,
          f.replace(targetPrePath, ""),
          alias,
          0,
          0,
          0,
          0,
          0
        );
      }
    }
  });
  return oto;
};

export const MakeOto = (
  ini: MakeOtoTempIni,
  filenames: string[],
  targetDir: string,
  skipBiginingNumber: boolean = true
): Oto => {
  /** 返す原音設定値 */
  const oto = new Oto();
  /** 四分音符1拍の長さms */
  const beatsLength: number = (60 / ini.tempo) * 1000;
  /** 先行発声 */
  const preutter: number = beatsLength / 2;
  /** オーバーラップ */
  const overlap: number = preutter / 3;
  /** 固定範囲 */
  const consonant: number = preutter * 1.5;
  /** 右ブランク */
  const blank: number = -1 * (beatsLength + overlap);
  /** エイリアスカウンタ */
  const aliasCounter: { [key: string]: number } = {};
  const targetPrePath = targetDir === "" ? "" : targetDir + "/";
  filenames.forEach((f) => {
    if (f.startsWith(targetPrePath) && f.endsWith(".wav")) {
      /** ファイル名。skipBeginingNumberがtrueの場合ファイル名頭の連番を無視する。 */
      const filename: string = GetFilename(f, targetDir, skipBiginingNumber);
      /** エイリアスの開始文字のインデックス。冒頭のアンダーバーは無視する。 */
      let begin: number = filename[0] === "_" ? 1 : 0;
      /** 接頭辞 */
      let prev_vowel = "-";
      /** 拍子 */
      let beats = 1;
      let end: number;
      while (begin < filename.length) {
        [begin, beats, prev_vowel] = CheckUnderbar(
          ini,
          begin,
          filename,
          beats,
          prev_vowel
        );
        [begin, end, beats, prev_vowel] = GetRange(
          ini,
          begin,
          filename,
          beats,
          prev_vowel
        );
        if (begin >= filename.length) {
          break;
        }
        const cv = filename.slice(begin, end);
        MakeRecord(
          ini,
          oto,
          targetDir,
          f.replace(targetPrePath, ""),
          cv,
          beatsLength,
          beats,
          preutter,
          overlap,
          consonant,
          blank,
          prev_vowel,
          aliasCounter
        );
        prev_vowel = SetVowel(ini, cv);
        beats++;
        begin = end;
      }
    }
  });
  return oto;
};

/**
 * エイリアスを生成する。
 * @param ini 設定
 * @param oto 原音設定
 * @param targetDir 原音ルートからの相対パス
 * @param f ファイル名
 * @param cv エイリアスの元の値
 * @param beatsLength 1拍の長さ
 * @param beats 拍数
 * @param preutter 先行発声
 * @param overlap オーバーラップ
 * @param consonant 固定範囲
 * @param blank 右ブランク
 * @param prev_vowel 前置母音
 * @param aliasCounter エイリアスの重複カウンタ
 */
export const MakeRecord = (
  ini: MakeOtoTempIni,
  oto: Oto,
  targetDir: string,
  f: string,
  cv: string,
  beatsLength: number,
  beats: number,
  preutter: number,
  overlap: number,
  consonant: number,
  blank: number,
  prev_vowel: string,
  aliasCounter: { [key: string]: number }
) => {
  if (ini.consonant[cv].consonant === "") {
    MakeVCV(
      ini,
      oto,
      targetDir,
      f,
      cv,
      beatsLength,
      beats,
      preutter,
      overlap,
      consonant,
      blank,
      prev_vowel,
      aliasCounter
    );
  } else if (ini.consonant[cv].consonant === "-") {
    /** onset consonant cluster */
    MakeOnsetConsonantCluster(
      ini,
      oto,
      targetDir,
      f,
      cv,
      beatsLength,
      beats,
      preutter,
      overlap,
      consonant,
      blank,
      prev_vowel,
      aliasCounter
    );
  } else if (ini.consonant[cv].consonant === "*") {
    /** coda consonant cluster */
    MakeCodaConsonantCluster(
      ini,
      oto,
      targetDir,
      f,
      cv,
      beatsLength,
      beats,
      preutter,
      overlap,
      consonant,
      blank,
      aliasCounter
    );
  } else if (prev_vowel == "-") {
    MakeCV(ini, oto, targetDir, f, cv, beatsLength, beats, aliasCounter);
  } else {
    /** CVVC。prev_vowelには必ず-以外が入っている。 */
    MakeCVVC(
      ini,
      oto,
      targetDir,
      f,
      cv,
      beatsLength,
      beats,
      preutter,
      overlap,
      prev_vowel,
      aliasCounter
    );
  }
};

/**
 * エイリアスカウンタを更新する。
 * @param alias エイリアス
 * @param aliasCounter 更新するエイリアスカウンタ
 */
const UpdateAliasCounter = (
  alias: string,
  aliasCounter: { [key: string]: number }
) => {
  if (Object.keys(aliasCounter).includes(alias)) {
    aliasCounter[alias]++;
  } else {
    aliasCounter[alias] = 1;
  }
};

/**
 * 連続音[V CV]のエイリアスを生成する。
 * @param ini 設定
 * @param oto 原音設定
 * @param targetDir 原音ルートからの相対パス
 * @param f ファイル名
 * @param cv エイリアスの元の値
 * @param beatsLength 1拍の長さ
 * @param beats 拍数
 * @param preutter 先行発声
 * @param overlap オーバーラップ
 * @param prev_vowel 前置母音
 * @param aliasCounter エイリアスの重複カウンタ
 */
export const MakeCVVC = (
  ini: MakeOtoTempIni,
  oto: Oto,
  targetDir: string,
  f: string,
  cv: string,
  beatsLength: number,
  beats: number,
  preutter: number,
  overlap: number,
  prev_vowel: string,
  aliasCounter: { [key: string]: number }
) => {
  const VCalias = ReplaceAlias(
    ini,
    ReplaceAlias(ini, prev_vowel + " " + ini.consonant[cv].consonant)
  );
  UpdateAliasCounter(VCalias, aliasCounter);
  if (ini.max === 0 || aliasCounter[VCalias] <= ini.max) {
    /** VCの追加 */
    oto.SetParams(
      targetDir,
      f,
      VCalias + (aliasCounter[VCalias] !== 1 ? aliasCounter[VCalias] : ""),
      ini.offset -
        preutter +
        (beats - 1) * beatsLength -
        ini.consonant[cv].length,
      overlap,
      preutter,
      preutter + ini.consonant[cv].length / 2,
      -preutter - (ini.consonant[cv].length * 3) / 4
    );
  }
  //CV
  const CValias = ReplaceAlias(ini, ReplaceAlias(ini, cv));
  UpdateAliasCounter(CValias, aliasCounter);
  if (ini.max === 0 || aliasCounter[CValias] <= ini.max) {
    oto.SetParams(
      targetDir,
      f,
      CValias + (aliasCounter[CValias] !== 1 ? aliasCounter[CValias] : ""),
      ini.offset - ini.consonant[cv].length + (beats - 1) * beatsLength,
      ini.consonant[cv].length / 3,
      ini.consonant[cv].length,
      ini.consonant[cv].length * 1.5,
      -1 * (beatsLength + ini.consonant[cv].length / 3)
    );
  }
  //only consonant
  if (ini.onlyConsonant) {
    const Calias = ReplaceAlias(
      ini,
      ReplaceAlias(ini, ini.consonant[cv].consonant)
    );
    UpdateAliasCounter(Calias, aliasCounter);
    if (ini.max === 0 || aliasCounter[Calias] <= ini.max) {
      oto.SetParams(
        targetDir,
        f,
        Calias + (aliasCounter[Calias] !== 1 ? aliasCounter[Calias] : ""),
        ini.offset - ini.consonant[cv].length + (beats - 1) * beatsLength,
        ini.consonant[cv].length * 0.3,
        ini.consonant[cv].length * 0.1,
        ini.consonant[cv].length / 2,
        -1 * ini.consonant[cv].length
      );
    }
  }
};

/**
 * 連続音[V CV]のエイリアスを生成する。
 * @param ini 設定
 * @param oto 原音設定
 * @param targetDir 原音ルートからの相対パス
 * @param f ファイル名
 * @param cv エイリアスの元の値
 * @param beatsLength 1拍の長さ
 * @param beats 拍数
 * @param preutter 先行発声
 * @param overlap オーバーラップ
 * @param consonant 固定範囲
 * @param blank 右ブランク
 * @param prev_vowel 前置母音
 * @param aliasCounter エイリアスの重複カウンタ
 */
export const MakeVCV = (
  ini: MakeOtoTempIni,
  oto: Oto,
  targetDir: string,
  f: string,
  cv: string,
  beatsLength: number,
  beats: number,
  preutter: number,
  overlap: number,
  consonant: number,
  blank: number,
  prev_vowel: string,
  aliasCounter: { [key: string]: number }
) => {
  if (prev_vowel === "-" && ini.noHead) {
  } else if (prev_vowel === "-" && !ini.beginingCv) {
    /** 接頭単独音かつハイフン無し */
    const alias = ReplaceAlias(ini, cv);
    UpdateAliasCounter(alias, aliasCounter);
    if (ini.max === 0 || aliasCounter[alias] <= ini.max) {
      oto.SetParams(
        targetDir,
        f,
        alias + (aliasCounter[alias] !== 1 ? aliasCounter[alias] : ""),
        ini.offset - preutter + (beats - 1) * beatsLength,
        overlap,
        preutter,
        consonant,
        blank
      );
    }
  } else if (ini.noVCV) {
  } else {
    /** VCV */
    const alias = prev_vowel + " " + ReplaceAlias(ini, cv);
    UpdateAliasCounter(alias, aliasCounter);
    if (ini.max === 0 || aliasCounter[alias] <= ini.max) {
      oto.SetParams(
        targetDir,
        f,
        alias + (aliasCounter[alias] !== 1 ? aliasCounter[alias] : ""),
        ini.offset - preutter + (beats - 1) * beatsLength,
        overlap,
        preutter,
        consonant,
        blank
      );
    }
  }
};

/**
 * [- CV]のエイリアスを生成する。
 * @param ini 設定
 * @param oto 原音設定
 * @param targetDir 原音ルートからの相対パス
 * @param f ファイル名
 * @param cv エイリアスの元の値
 * @param beatsLength 1拍の長さ
 * @param beats 拍数
 * @param aliasCounter エイリアスの重複カウンタ
 */
export const MakeCV = (
  ini: MakeOtoTempIni,
  oto: Oto,
  targetDir: string,
  f: string,
  cv: string,
  beatsLength: number,
  beats: number,
  aliasCounter: { [key: string]: number }
) => {
  if (!ini.noHead) {
    const alias = (ini.beginingCv ? "- " : "") + ReplaceAlias(ini, cv);
    UpdateAliasCounter(alias, aliasCounter);
    if (ini.max === 0 || aliasCounter[alias] <= ini.max) {
      oto.SetParams(
        targetDir,
        f,
        alias + (aliasCounter[alias] !== 1 ? aliasCounter[alias] : ""),
        ini.offset - ini.consonant[cv].length + (beats - 1) * beatsLength,
        ini.consonant[cv].length / 3,
        ini.consonant[cv].length,
        ini.consonant[cv].length * 1.5,
        -1 * (beatsLength + ini.consonant[cv].length / 3)
      );
    }
  }
};

/**
 * 語頭子音群[- CC]のエイリアスを生成する。
 * @param ini 設定
 * @param oto 原音設定
 * @param targetDir 原音ルートからの相対パス
 * @param f ファイル名
 * @param cv エイリアスの元の値
 * @param beatsLength 1拍の長さ
 * @param beats 拍数
 * @param preutter 先行発声
 * @param overlap オーバーラップ
 * @param consonant 固定範囲
 * @param blank 右ブランク
 * @param prev_vowel 前置母音
 * @param aliasCounter エイリアスの重複カウンタ
 */
export const MakeOnsetConsonantCluster = (
  ini: MakeOtoTempIni,
  oto: Oto,
  targetDir: string,
  f: string,
  cv: string,
  beatsLength: number,
  beats: number,
  preutter: number,
  overlap: number,
  consonant: number,
  blank: number,
  prev_vowel: string,
  aliasCounter: { [key: string]: number }
) => {
  const alias = (prev_vowel === "-" ? "- " : "") + ReplaceAlias(ini, cv);
  UpdateAliasCounter(alias, aliasCounter);
  if (ini.max === 0 || aliasCounter[alias] <= ini.max) {
    oto.SetParams(
      targetDir,
      f,
      alias + (aliasCounter[alias] !== 1 ? aliasCounter[alias] : ""),
      ini.offset - preutter + (beats - 1) * beatsLength,
      overlap,
      preutter,
      consonant,
      blank
    );
  }
};

/**
 * 語尾子音群[C C]のエイリアスを生成する。
 * @param ini 設定
 * @param oto 原音設定
 * @param targetDir 原音ルートからの相対パス
 * @param f ファイル名
 * @param cv エイリアスの元の値
 * @param beatsLength 1拍の長さ
 * @param beats 拍数
 * @param preutter 先行発声
 * @param overlap オーバーラップ
 * @param consonant 固定範囲
 * @param blank 右ブランク
 * @param aliasCounter エイリアスの重複カウンタ
 */
export const MakeCodaConsonantCluster = (
  ini: MakeOtoTempIni,
  oto: Oto,
  targetDir: string,
  f: string,
  cv: string,
  beatsLength: number,
  beats: number,
  preutter: number,
  overlap: number,
  consonant: number,
  blank: number,
  aliasCounter: { [key: string]: number }
) => {
  let parse = 1;
  const begin = 0;
  const end = cv.length;
  while (begin < end - parse) {
    if (!Object.keys(ini.consonant).includes(cv.slice(begin, end - parse))) {
      parse++;
    } else if (
      ["-", "*"].includes(ini.consonant[cv.slice(begin, end - parse)].consonant)
    ) {
      parse++;
    } else {
      break;
    }
  }
  const alias = ReplaceAlias(
    ini,
    cv.slice(begin, end - parse) + " " + cv.slice(end - parse, end)
  );
  UpdateAliasCounter(alias, aliasCounter);
  if (ini.max === 0 || aliasCounter[alias] <= ini.max) {
    oto.SetParams(
      targetDir,
      f,
      alias + (aliasCounter[alias] !== 1 ? aliasCounter[alias] : ""),
      ini.offset - preutter + (beats - 1) * beatsLength,
      overlap,
      preutter,
      consonant,
      blank
    );
  }
};

/**
 * ファイル名からエイリアス判定に必要な部分を抽出する。
 * @param filename 元のファイル名
 * @param targetDir 音源ルートからの相対パス
 * @param skipBiginingNumber 冒頭の数字を無視するか否か
 * @returns 抽出後のファイル名
 */
export const GetFilename = (
  filename: string,
  targetDir: string,
  skipBiginingNumber: boolean
): string => {
  const targetPrePath = targetDir === "" ? "" : targetDir + "/";
  const f = filename.replace(targetPrePath, "");
  return (skipBiginingNumber ? f.replace(/^[0-9]+/, "") : f).replace(
    ".wav",
    ""
  );
};

/**
 * エイリアスを後方一致で検索し、その結果を返す。
 * @param ini 設定ファイル
 * @param alias エイリアス
 * @returns 指定したエイリアスに該当する`ini.vowel`の値
 */
export const SetVowel = (ini: MakeOtoTempIni, alias: string): string => {
  for (let i = 0; i < alias.length; i++) {
    if (Object.keys(ini.vowel).includes(alias.slice(i))) {
      return ini.vowel[alias.slice(i)];
    }
  }
  return "-";
};

/**
 * エイリアスの開始位置が"_"か否かをチェックし、各パラメータを補正して返す。
 * @param ini 設定ファイル
 * @param begin エイリアスの開始インデックス
 * @param filename ファイル名
 * @param beats 拍数
 * @param prev_vowel 前置母音
 * @returns begin エイリアスの開始インデックス
 * @returns beats 拍数
 * @returns prev_vowel 前置母音
 */
export const CheckUnderbar = (
  ini: MakeOtoTempIni,
  begin: number,
  filename: string,
  beats: number,
  prev_vowel: string
): [begin: number, beats: number, prev_vowel: string] => {
  if (filename[begin] === "_") {
    begin++;
    if (ini.underbar) {
      beats++;
      prev_vowel = "-";
    }
  }
  return [begin, beats, prev_vowel];
};

/**
 * 最長一致探索でエイリアスを特定する。
 * @param ini 設定ファイル
 * @param begin エイリアスの開始インデックス
 * @param filename ファイル名
 * @param beats 拍数
 * @param prev_vowel 前置母音
 * @returns begin エイリアスの開始インデックス
 * @returns end エイリアスの終了インデックス
 * @returns beats 拍数
 * @returns prev_vowel 前置母音
 */
export const GetRange = (
  ini: MakeOtoTempIni,
  begin: number,
  filename: string,
  beats: number,
  prev_vowel: string
): [begin: number, end: number, beats: number, prev_vowel: string] => {
  let end = filename.length;
  while (!Object.keys(ini.consonant).includes(filename.slice(begin, end))) {
    end--;
    if (end <= begin) {
      end = filename.length;
      begin++;
      if (begin >= filename.length) {
        break;
      }
      while (filename[begin] === "_") {
        [begin, beats, prev_vowel] = CheckUnderbar(
          ini,
          begin,
          filename,
          beats,
          prev_vowel
        );
      }
    }
  }
  return [begin, end, beats, prev_vowel];
};

/**
 * 設定に従ってcvを置換する。
 * @param ini 設定ファイル
 * @param cv エイリアス
 * @returns 置換されたエイリアス。
 */
export const ReplaceAlias = (ini: MakeOtoTempIni, cv: string): string => {
  ini.replace.forEach((r) => {
    cv = cv.replace(r[0], r[1]);
  });
  return cv;
};
