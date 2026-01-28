export interface MakeOtoTempIni {
  /** 収録に使用したガイドBGMのテンポ */
  tempo: number;
  /** 収録に使用したガイドBGMの録音開始から1拍目までの長さ(ms) */
  offset: number;
  /** 同じエイリアスをいくつ生成するか */
  max: number;
  /** アンダーバーの扱い、falseだと無視、trueだと1拍休符 */
  underbar: boolean;
  /** wavの頭のエイリアスの扱い、falseだと[CV]、trueだと[- CV] */
  beginingCv: boolean;
  /** wavの頭のエイリアス生成有無、Falseの場合生成 */
  noHead: boolean;
  /** [V CV]の生成有無、Falseの場合生成 */
  noVCV: boolean;
  /** [C]の生成有無、Trueの場合生成 */
  onlyConsonant: boolean;
  /** 母音のバリエーション。後方一致で指定 */
  vowel: { [key: string]: string };
  /** 子音 */
  consonant: {
    [key: string]: {
      /** 子音 */
      consonant: string;
      /** 子音の標準長さ(ms) */
      length: number;
    };
  };
  /** ファイル名とエイリアスの置換規則 */
  replace: Array<[before: string, after: string]>;
}
