import { MakeOtoTempIni } from "./Interface";

/**
 * mkototemp.iniを読み込みます。
 * @param iniFile 読み込むファイル
 * @param encoding ファイル読み込み時の文字コード
 * @returns {@link MakeOtoTempIni}
 */
export const InputFile = async (
  iniFile: File,
  encoding: string = "UTF-8"
): Promise<MakeOtoTempIni> => {
  const reader: FileReader = new FileReader();
  reader.readAsText(iniFile, encoding);
  return new Promise((resolve, reject) => {
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(ParseIni(reader.result));
      } else {
        console.error("file can't read");
        reject("file can't read");
      }
    });
  });
};

/**
 * mkOtoTemp.iniファイルライクなテキストデータを受け取ってパースする。
 * @param data mkOtoTemp.iniファイルライクなテキストデータ
 * @returns {@link MakeOtoTempIni}
 */
export const ParseIni = (data: string): MakeOtoTempIni => {
  const ini: MakeOtoTempIni = {
    tempo: 100,
    offset: 800,
    max: 2,
    underbar: true,
    beginingCv: true,
    noHead: false,
    noVCV: false,
    onlyConsonant: false,
    vowel: {},
    consonant: {},
    replace: [],
  };
  const lines: string[] = data.replace(/\r\n/g, "\n").split("\n");
  let mode: string = "";
  lines.forEach((line) => {
    if (line === "") {
    } else if (line.startsWith("[") && line.endsWith("]")) {
      mode = line.replace("[", "").replace("]", "");
    } else if (mode === "TEMPO") {
      try {
        ini.tempo = parseFloat(line);
      } catch (error) {
        console.warn("tempoに数値以外が入力されているため初期値を採用します。");
      }
    } else if (mode === "OFFSET") {
      try {
        ini.offset = parseFloat(line);
      } catch (error) {
        console.warn(
          "offsetに数値以外が入力されているため初期値を採用します。"
        );
      }
    } else if (mode === "MAXNUM") {
      try {
        ini.max = parseInt(line);
      } catch (error) {
        console.warn(
          "maxnumに数値以外が入力されているため初期値を採用します。"
        );
      }
    } else if (mode === "UNDER") {
      try {
        ini.underbar = parseInt(line) === 1;
      } catch (error) {
        console.warn("underに数値以外が入力されているため初期値を採用します。");
      }
    } else if (mode === "NOHEAD") {
      try {
        const value = parseInt(line);
        if (value === 2) {
          ini.noHead = true;
          ini.beginingCv = false;
        } else {
          ini.noHead = false;
          ini.beginingCv = value === 0;
        }
      } catch (error) {
        console.warn(
          "NOHEADに数値以外が入力されているため初期値を採用します。"
        );
      }
    } else if (mode === "NOVCV") {
      try {
        ini.noVCV = parseInt(line) === 1;
      } catch (error) {
        console.warn("NOVCVに数値以外が入力されているため初期値を採用します。");
      }
    } else if (mode === "ONLYCONSONANT") {
      try {
        ini.onlyConsonant = parseInt(line) === 1;
      } catch (error) {
        console.warn(
          "ONLYCONSONANTに数値以外が入力されているため初期値を採用します。"
        );
      }
    } else if (mode === "VOWEL") {
      if (line.includes("=")) {
        const [v, keys] = line.split("=");
        keys.split(",").forEach((key) => {
          ini.vowel[key] = v;
        });
      } else {
        console.warn("VOWELに=が無い行があるため無視しました。");
      }
    } else if (mode === "CONSONANT") {
      try {
        if (line.includes("=")) {
          const [v, keys, l] = line.split("=");
          const l_ = parseFloat(l);
          keys.split(",").forEach((key) => {
            ini.consonant[key] = { consonant: v, length: l_ };
          });
        } else {
          console.warn("CONSONANTに=が無い行があるため無視しました。");
        }
      } catch (error) {
        console.warn("CONSONANTのフォーマットが正しくない行を無視しました。");
      }
    } else if (mode === "REPLACE") {
      if (line.includes("=")) {
        const [before, after] = line.split("=");
        ini.replace.push([before, after]);
      } else {
        console.warn("REPLACEに=が無い行があるため無視しました。");
      }
    }
  });
  return ini;
};